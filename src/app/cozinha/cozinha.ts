import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { app } from '../firebase.config';

const auth = getAuth(app);
const db = getFirestore(app);

@Component({
    selector: 'app-cozinha',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cozinha.html',
    styleUrl: './cozinha.css'
})
export class CozinhaComponent implements OnInit, OnDestroy {

    abaAtiva: 'pedidos' | 'inventario' = 'pedidos';
    filtro: 'pendentes' | 'preparo' | 'todos' = 'pendentes';
    pedidos: any[] = [];
    private unsubPedidos: any;

    hoje = new Date().toISOString().split('T')[0];

    get totalPendentes() { return this.pedidos.filter(p => p.status === 'pendente').length; }
    get totalPreparo() { return this.pedidos.filter(p => p.status === 'em_preparo').length; }
    get totalProntos() { return this.pedidos.filter(p => p.status === 'pronto').length; }

    get pedidosFiltrados() {
        if (this.filtro === 'pendentes') return this.pedidos.filter(p => p.status === 'pendente');
        if (this.filtro === 'preparo') return this.pedidos.filter(p => p.status === 'em_preparo');
        return this.pedidos;
    }

    abaInventario: 'estoque' | 'fornecedores' | 'precos' = 'estoque';
    estoque: any[] = [];
    fornecedores: any[] = [];
    private unsubEstoque: any;
    private unsubFornecedores: any;

    modalEstoque = false;
    editandoEstoque: any = null;
    novoItem: any = { nome: '', categoria: 'Outros', unidade: 'kg', quantidade: 0, minimo: 0, validade: '', fornecedores: [] };
    categorias = ['Vegetais e Verduras', 'Laticínios', 'Grãos e Massas', 'Carnes', 'Outros'];
    unidades = ['kg', 'g', 'l', 'ml', 'unidade'];

    novoFornecedorItem = { nome: '', preco: 0, atualizadoEm: '' };

    modalFornecedor = false;
    editandoFornecedor: any = null;
    novoFornecedor = { nome: '', contato: '', telefone: '', email: '', endereco: '', avaliacao: 5, observacoes: '' };

    constructor(private router: Router) { }

    ngOnInit() {
        onAuthStateChanged(auth, (user) => {
            if (!user || user.email !== 'cozinha@labatuti.com') {
                this.router.navigate(['/cadastro']);
                return;
            }
            this.carregarPedidos();
            this.carregarEstoque();
            this.carregarFornecedores();
        });
    }

    ngOnDestroy() {
        if (this.unsubPedidos) this.unsubPedidos();
        if (this.unsubEstoque) this.unsubEstoque();
        if (this.unsubFornecedores) this.unsubFornecedores();
    }

    carregarPedidos() {
        const q = query(collection(db, 'pedidos'), orderBy('criadoEm', 'desc'));
        this.unsubPedidos = onSnapshot(q, (snap) => {
            this.pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        });
    }

    carregarEstoque() {
        this.unsubEstoque = onSnapshot(collection(db, 'estoque'), (snap) => {
            this.estoque = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        });
    }

    carregarFornecedores() {
        this.unsubFornecedores = onSnapshot(collection(db, 'fornecedores'), (snap) => {
            this.fornecedores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        });
    }

    async iniciarPreparo(pedido: any) {
        await updateDoc(doc(db, 'pedidos', pedido.id), { status: 'em_preparo' });
    }

    async marcarPronto(pedido: any) {
        await updateDoc(doc(db, 'pedidos', pedido.id), { status: 'pronto' });
    }

    tempoAtras(ts: any): string {
        if (!ts) return '';
        const agora = new Date().getTime();
        const criado = ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
        const diff = Math.floor((agora - criado) / 60000);
        if (diff < 1) return 'agora mesmo';
        if (diff === 1) return '1 min atrás';
        return `${diff} min atrás`;
    }

    getClasseValidade(validade: string): string {
        if (!validade) return 'validade-neutra';
        if (validade < this.hoje) return 'validade-vencida';
        return 'validade-ok';
    }

    abrirModalEstoque(item?: any) {
        if (item) {
            this.editandoEstoque = item;
            this.novoItem = { ...item, fornecedores: item.fornecedores ? [...item.fornecedores] : [] };
        } else {
            this.editandoEstoque = null;
            this.novoItem = { nome: '', categoria: 'Outros', unidade: 'kg', quantidade: 0, minimo: 0, validade: '', fornecedores: [] };
        }
        this.novoFornecedorItem = { nome: '', preco: 0, atualizadoEm: this.hoje };
        this.modalEstoque = true;
    }

    adicionarFornecedorAoItem() {
        if (!this.novoFornecedorItem.nome || !this.novoFornecedorItem.preco) return;
        if (!this.novoItem.fornecedores) this.novoItem.fornecedores = [];
        this.novoItem.fornecedores.push({ ...this.novoFornecedorItem });
        this.novoFornecedorItem = { nome: '', preco: 0, atualizadoEm: this.hoje };
    }

    removerFornecedorDoItem(index: number) {
        this.novoItem.fornecedores.splice(index, 1);
    }

    async salvarEstoque() {
        if (!this.novoItem.nome) return;
        if (this.editandoEstoque) {
            await updateDoc(doc(db, 'estoque', this.editandoEstoque.id), { ...this.novoItem });
        } else {
            await addDoc(collection(db, 'estoque'), { ...this.novoItem, criadoEm: new Date() });
        }
        this.modalEstoque = false;
    }

    async excluirEstoque(id: string) {
        if (confirm('Deseja excluir este item?')) {
            await deleteDoc(doc(db, 'estoque', id));
        }
    }

    abrirModalFornecedor(f?: any) {
        if (f) {
            this.editandoFornecedor = f;
            this.novoFornecedor = { ...f };
        } else {
            this.editandoFornecedor = null;
            this.novoFornecedor = { nome: '', contato: '', telefone: '', email: '', endereco: '', avaliacao: 5, observacoes: '' };
        }
        this.modalFornecedor = true;
    }

    async salvarFornecedor() {
        if (!this.novoFornecedor.nome) return;
        const dados = { ...this.novoFornecedor, avaliacao: Number(this.novoFornecedor.avaliacao) };
        if (this.editandoFornecedor) {
            await updateDoc(doc(db, 'fornecedores', this.editandoFornecedor.id), { ...dados });
        } else {
            await addDoc(collection(db, 'fornecedores'), { ...dados, criadoEm: new Date() });
        }
        this.modalFornecedor = false;
    }

    async excluirFornecedor(id: string) {
        if (confirm('Deseja excluir este fornecedor?')) {
            await deleteDoc(doc(db, 'fornecedores', id));
        }
    }

    stars(n: number) { return Array(n).fill(0); }

    async sair() {
        await signOut(auth);
        this.router.navigate(['/cadastro']);
    }

    getStatusClass(status: string) {
        if (status === 'pendente') return 'badge-pendente';
        if (status === 'em_preparo') return 'badge-preparo';
        if (status === 'pronto') return 'badge-pronto';
        return '';
    }

    getStatusLabel(status: string) {
        if (status === 'pendente') return 'Novo';
        if (status === 'em_preparo') return 'Preparando';
        if (status === 'pronto') return 'Pronto';
        return status;
    }

    get comparacaoPrecos() {
        return this.estoque
            .filter(item => item.fornecedores && item.fornecedores.length > 1)
            .map(item => {
                const fornecedoresOrdenados = [...item.fornecedores].sort((a: any, b: any) => a.preco - b.preco);
                const melhorPreco = fornecedoresOrdenados[0].preco;
                const piorPreco = fornecedoresOrdenados[fornecedoresOrdenados.length - 1].preco;
                const economia = piorPreco - melhorPreco;
                const percentual = ((economia / piorPreco) * 100).toFixed(1);
                return { item, fornecedores: fornecedoresOrdenados, economia, percentual };
            });
    }
}