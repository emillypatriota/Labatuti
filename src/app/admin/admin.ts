import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import {
    getFirestore, collection, getDocs, addDoc, updateDoc,
    deleteDoc, doc, query, orderBy, Timestamp
} from 'firebase/firestore';
import { app } from '../firebase.config';

const auth = getAuth(app);
const db = getFirestore(app);

export interface Prato {
    id: string;
    nome: string;
    descricao: string;
    preco: number;
    categoria: string;
    imagemUrl: string;
    disponivel: boolean;
    pratoDoDia?: boolean;
    desconto?: number;
}

export interface Pedido {
    id: string;
    cliente: string;
    itens: any[];
    total: number;
    status: string;
    formaPagamento: string;
    endereco: any;
    criadoEm: any;
}

export interface Cupom {
    id: string;
    codigo: string;
    desconto: number;
    valorMinimo: number;
    usosMaximos: number | null;
    dataExpiracao: string;
    ativo: boolean;
}

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin.html',
    styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
    abaAtiva = signal<'dashboard' | 'cardapio' | 'pedidos' | 'cupons'>('dashboard');

    pratos = signal<Prato[]>([]);
    pedidos = signal<Pedido[]>([]);
    cupons = signal<Cupom[]>([]);

    filtroPeriodo = signal('hoje');
    filtroStatus = signal('todos');

    showAdicionarModal = signal(false);
    showEditarModal = signal(false);
    showPratoDoDiaModal = signal(false);
    showConfirmExcluir = signal(false);
    pratoIdExcluir = signal<string | null>(null);

    showAdicionarCupom = signal(false);
    showEditarCupom = signal(false);
    cupomIdExcluir = signal<string | null>(null);
    showConfirmExcluirCupom = signal(false);

    novoPrato = signal({
        nome: '', descricao: '', preco: 0,
        categoria: 'Antipasti', imagemUrl: '', disponivel: true
    });

    pratoEditando = signal<Prato | null>(null);

    pratoDoDiaSelecionado = signal<string | null>(null);
    pratoDoDiaDesconto = signal(20);

    novoCupom = signal({
        codigo: '', desconto: 10, valorMinimo: 0,
        usosMaximos: null as number | null,
        dataExpiracao: '', ativo: true
    });

    cupomEditando = signal<Cupom | null>(null);

    categorias = ['Antipasti', 'Primi Piatti', 'Secondi Piatti', 'Dolci', 'Bevande'];

    categoriasDisplay: Record<string, string> = {
        'Antipasti': 'Antipasti (Entradas)',
        'Primi Piatti': 'Primi Piatti (Massas)',
        'Secondi Piatti': 'Secondi Piatti (Principais)',
        'Dolci': 'Dolci (Sobremesas)',
        'Bevande': 'Bevande (Bebidas)'
    };

    categoriasSelect = [
        { valor: 'Antipasti', label: 'Antipasti (Entradas)' },
        { valor: 'Primi Piatti', label: 'Primi Piatti (Massas)' },
        { valor: 'Secondi Piatti', label: 'Secondi Piatti (Principais)' },
        { valor: 'Dolci', label: 'Dolci (Sobremesas)' },
        { valor: 'Bevande', label: 'Bevande (Bebidas)' }
    ];

    periodosOpts = [
        { value: 'hoje', label: 'Pedidos de Hoje' },
        { value: 'todos', label: 'Todos os Pedidos' }
    ];

    statusOpts = [
        { value: 'todos', label: 'Todos os Status' },
        { value: 'pendente', label: 'Pendente' },
        { value: 'em_preparo', label: 'Preparando' },
        { value: 'pronto', label: 'Pronto' },
        { value: 'saiu', label: 'Saiu para Entrega' },
        { value: 'entregue', label: 'Entregue' },
        { value: 'cancelado', label: 'Cancelado' }
    ];

    pedidosHoje = computed(() => {
        const hoje = new Date();
        return this.pedidos().filter(p => {
            const data = p.criadoEm?.toDate?.() ?? new Date(p.criadoEm);
            return data.toDateString() === hoje.toDateString();
        });
    });

    faturamentoHoje = computed(() =>
        this.pedidosHoje()
            .filter(p => p.status === 'entregue')
            .reduce((acc, p) => acc + p.total, 0)
    );

    pedidosPendentes = computed(() =>
        this.pedidos().filter(p => p.status === 'pendente').length
    );

    ticketMedio = computed(() => {
        const entregues = this.pedidos().filter(p => p.status === 'entregue');
        if (entregues.length === 0) return 0;
        return entregues.reduce((acc, p) => acc + p.total, 0) / entregues.length;
    });

    pratosMaisPedidos = computed(() => {
        const contagem: Record<string, { nome: string; total: number }> = {};
        this.pedidos().forEach(p => {
            p.itens?.forEach((item: any) => {
                if (!contagem[item.nome]) contagem[item.nome] = { nome: item.nome, total: 0 };
                contagem[item.nome].total += item.quantidade;
            });
        });
        return Object.values(contagem).sort((a, b) => b.total - a.total).slice(0, 5);
    });

    pedidosFiltrados = computed(() => {
        let lista = this.pedidos();
        if (this.filtroPeriodo() === 'hoje') {
            const hoje = new Date();
            lista = lista.filter(p => {
                const data = p.criadoEm?.toDate?.() ?? new Date(p.criadoEm);
                return data.toDateString() === hoje.toDateString();
            });
        }
        if (this.filtroStatus() !== 'todos') {
            lista = lista.filter(p => p.status === this.filtroStatus());
        }
        return lista;
    });

    pratosPorCategoria(cat: string) {
        return this.pratos().filter(p => p.categoria === cat);
    }

    constructor(private router: Router) { }

    async ngOnInit() {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                this.router.navigate(['/cadastro']);
                return;
            }
            if (user.email !== 'admin@labatuti.com') {
                this.router.navigate(['/cliente']);
                return;
            }
            await this.carregarDados();
        });
    }

    async carregarDados() {
        await Promise.all([
            this.carregarPratos(),
            this.carregarPedidos(),
            this.carregarCupons()
        ]);
    }

    async carregarPratos() {
        const snap = await getDocs(collection(db, 'pratos'));
        this.pratos.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prato)));
    }

    async carregarPedidos() {
        const snap = await getDocs(query(collection(db, 'pedidos'), orderBy('criadoEm', 'desc')));
        this.pedidos.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Pedido)));
    }

    async carregarCupons() {
        const snap = await getDocs(collection(db, 'cupons'));
        this.cupons.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cupom)));
    }

    abrirAdicionar() {
        this.novoPrato.set({ nome: '', descricao: '', preco: 0, categoria: 'Antipasti', imagemUrl: '', disponivel: true });
        this.showAdicionarModal.set(true);
    }

    fecharAdicionar() { this.showAdicionarModal.set(false); }

    atualizarNovo(campo: string, valor: any) {
        this.novoPrato.set({ ...this.novoPrato(), [campo]: valor });
    }

    async confirmarAdicionar() {
        const p = this.novoPrato();
        if (!p.nome || !p.preco) return;
        await addDoc(collection(db, 'pratos'), {
            ...p, pratoDoDia: false, desconto: 0
        });
        await this.carregarPratos();
        this.fecharAdicionar();
    }

    abrirEditar(prato: Prato) {
        this.pratoEditando.set({ ...prato });
        this.showEditarModal.set(true);
    }

    fecharEditar() { this.showEditarModal.set(false); }

    atualizarEditando(campo: string, valor: any) {
        if (!this.pratoEditando()) return;
        this.pratoEditando.set({ ...this.pratoEditando()!, [campo]: valor });
    }

    async confirmarEditar() {
        const p = this.pratoEditando();
        if (!p) return;
        const { id, ...dados } = p;
        await updateDoc(doc(db, 'pratos', id), dados);
        await this.carregarPratos();
        this.fecharEditar();
    }

    confirmarExcluirAbrir(id: string) {
        this.pratoIdExcluir.set(id);
        this.showConfirmExcluir.set(true);
    }

    fecharConfirmExcluir() { this.showConfirmExcluir.set(false); }

    async confirmarExcluir() {
        const id = this.pratoIdExcluir();
        if (!id) return;
        await deleteDoc(doc(db, 'pratos', id));
        await this.carregarPratos();
        this.fecharConfirmExcluir();
    }

    abrirPratoDoDia() {
        this.pratoDoDiaSelecionado.set(null);
        this.pratoDoDiaDesconto.set(20);
        this.showPratoDoDiaModal.set(true);
    }

    fecharPratoDoDia() { this.showPratoDoDiaModal.set(false); }

    async confirmarPratoDoDia() {
        const id = this.pratoDoDiaSelecionado();
        if (!id) return;
        for (const p of this.pratos()) {
            if (p.pratoDoDia) {
                await updateDoc(doc(db, 'pratos', p.id), { pratoDoDia: false, desconto: 0 });
            }
        }
        const prato = this.pratos().find(p => p.id === id);
        if (!prato) return;
        const precoOriginal = prato.preco;
        const desconto = this.pratoDoDiaDesconto();
        const novoPreco = +(precoOriginal * (1 - desconto / 100)).toFixed(2);
        await updateDoc(doc(db, 'pratos', id), {
            pratoDoDia: true,
            desconto,
            preco: novoPreco
        });
        await this.carregarPratos();
        this.fecharPratoDoDia();
    }

    imagemErro(event: any) {
        event.target.src = 'https://via.placeholder.com/400x300?text=Sem+Imagem';
    }

    precoOriginal(prato: Prato) {
        if (!prato.desconto) return prato.preco;
        return +(prato.preco / (1 - prato.desconto / 100)).toFixed(2);
    }

    statusLabel(s: string) {
        const map: any = {
            pendente: 'Pedido Recebido', em_preparo: 'Em Preparo',
            pronto: 'Pronto', saiu: 'Saiu para Entrega',
            entregue: 'Entregue', cancelado: 'Cancelado'
        };
        return map[s] ?? s;
    }

    async atualizarStatus(pedido: Pedido, novoStatus: string) {
        await updateDoc(doc(db, 'pedidos', pedido.id), { status: novoStatus });
        await this.carregarPedidos();
    }

    abrirAdicionarCupom() {
        this.novoCupom.set({ codigo: '', desconto: 10, valorMinimo: 0, usosMaximos: null, dataExpiracao: '', ativo: true });
        this.showAdicionarCupom.set(true);
    }

    fecharAdicionarCupom() { this.showAdicionarCupom.set(false); }

    atualizarNovoCupom(campo: string, valor: any) {
        this.novoCupom.set({ ...this.novoCupom(), [campo]: valor });
    }

    async confirmarAdicionarCupom() {
        const c = this.novoCupom();
        if (!c.codigo || !c.desconto) return;
        await addDoc(collection(db, 'cupons'), { ...c, codigo: c.codigo.toUpperCase() });
        await this.carregarCupons();
        this.fecharAdicionarCupom();
    }

    abrirEditarCupom(cupom: Cupom) {
        this.cupomEditando.set({ ...cupom });
        this.showEditarCupom.set(true);
    }

    fecharEditarCupom() { this.showEditarCupom.set(false); }

    atualizarEditandoCupom(campo: string, valor: any) {
        if (!this.cupomEditando()) return;
        this.cupomEditando.set({ ...this.cupomEditando()!, [campo]: valor });
    }

    async confirmarEditarCupom() {
        const c = this.cupomEditando();
        if (!c) return;
        const { id, ...dados } = c;
        await updateDoc(doc(db, 'cupons', id), dados);
        await this.carregarCupons();
        this.fecharEditarCupom();
    }

    confirmarExcluirCupomAbrir(id: string) {
        this.cupomIdExcluir.set(id);
        this.showConfirmExcluirCupom.set(true);
    }

    fecharConfirmExcluirCupom() { this.showConfirmExcluirCupom.set(false); }

    async confirmarExcluirCupom() {
        const id = this.cupomIdExcluir();
        if (!id) return;
        await deleteDoc(doc(db, 'cupons', id));
        await this.carregarCupons();
        this.fecharConfirmExcluirCupom();
    }

    async sair() {
        await signOut(auth);
        this.router.navigate(['/cadastro']);
    }
}