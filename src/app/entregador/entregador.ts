import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { app } from '../firebase.config';

const auth = getAuth(app);
const db = getFirestore(app);

@Component({
    selector: 'app-entregador',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './entregador.html',
    styleUrls: ['./entregador.css']
})
export class EntregadorComponent implements OnInit, OnDestroy {

    pedidosProntos = signal<any[]>([]);
    pedidosEmEntrega = signal<any[]>([]);
    pedidosEntregues = signal<any[]>([]);

    contadorProntos = signal(0);
    contadorEmEntrega = signal(0);
    contadorEntregues = signal(0);

    modalAberto = false;
    pedidoSelecionado: any = null;
    codigoDigitado = '';
    codigoIncorreto = false;

    toastVisivel = signal(false);
    toastMensagem = signal('');
    toastTipo = signal<'sucesso' | 'erro' | 'info'>('sucesso');
    private toastTimeout: any;

    private unsubProntos: any;
    private unsubEmEntrega: any;
    private unsubEntregues: any;

    constructor(private router: Router) { }

    ngOnInit(): void {
        this.carregarPedidos();
    }

    ngOnDestroy(): void {
        if (this.unsubProntos) this.unsubProntos();
        if (this.unsubEmEntrega) this.unsubEmEntrega();
        if (this.unsubEntregues) this.unsubEntregues();
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
    }

    carregarPedidos(): void {
        const queryProntos = query(collection(db, 'pedidos'), where('status', '==', 'pronto'));
        this.unsubProntos = onSnapshot(queryProntos, (snap) => {
            this.pedidosProntos.set(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            this.contadorProntos.set(snap.docs.length);
        }, (erro) => {
            console.error('ERRO PRONTOS:', erro);
        });

        const queryEmEntrega = query(collection(db, 'pedidos'), where('status', '==', 'em_entrega'));
        this.unsubEmEntrega = onSnapshot(queryEmEntrega, (snap) => {
            this.pedidosEmEntrega.set(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            this.contadorEmEntrega.set(snap.docs.length);
        }, (erro) => {
            console.error('ERRO EM ENTREGA:', erro);
        });

        const queryEntregues = query(collection(db, 'pedidos'), where('status', '==', 'entregue'));
        this.unsubEntregues = onSnapshot(queryEntregues, (snap) => {
            this.pedidosEntregues.set(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            this.contadorEntregues.set(snap.docs.length);
        }, (erro) => {
            console.error('ERRO ENTREGUES:', erro);
        });
    }

    get temPedidos(): boolean {
        return this.pedidosProntos().length > 0 || this.pedidosEmEntrega().length > 0;
    }

    gerarCodigo(): string {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    async iniciarEntrega(pedido: any): Promise<void> {
        try {
            const codigo = this.gerarCodigo();
            await updateDoc(doc(db, 'pedidos', pedido.id), {
                status: 'em_entrega',
                codigoEntrega: codigo
            });
            this.exibirToast('Pedido marcado como saiu para entrega!', 'info');
        } catch (error) {
            this.exibirToast('Erro ao atualizar pedido.', 'erro');
        }
    }

    abrirModalConfirmar(pedido: any): void {
        this.pedidoSelecionado = pedido;
        this.codigoDigitado = '';
        this.codigoIncorreto = false;
        this.modalAberto = true;
    }

    fecharModal(): void {
        this.modalAberto = false;
        this.pedidoSelecionado = null;
        this.codigoDigitado = '';
        this.codigoIncorreto = false;
    }

    onCodigoInput(): void {
        if (this.codigoIncorreto) this.codigoIncorreto = false;
    }

    async confirmarEntrega(): Promise<void> {
        if (!this.pedidoSelecionado) return;
        const codigoCorreto = this.pedidoSelecionado.codigoEntrega?.toString();
        if (this.codigoDigitado.trim() !== codigoCorreto) {
            this.codigoIncorreto = true;
            this.exibirToast('Código de entrega incorreto!', 'erro');
            return;
        }
        try {
            await updateDoc(doc(db, 'pedidos', this.pedidoSelecionado.id), { status: 'entregue' });
            this.fecharModal();
            this.exibirToast('Entrega confirmada com sucesso!', 'sucesso');
        } catch (error) {
            this.exibirToast('Erro ao confirmar entrega.', 'erro');
        }
    }

    exibirToast(mensagem: string, tipo: 'sucesso' | 'erro' | 'info'): void {
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastMensagem.set(mensagem);
        this.toastTipo.set(tipo);
        this.toastVisivel.set(true);
        this.toastTimeout = setTimeout(() => { this.toastVisivel.set(false); }, 3500);
    }

    formatarEndereco(pedido: any): string {
        if (!pedido.endereco) return '';
        const { rua, numero, bairro, cidade, estado } = pedido.endereco;
        return `${rua}, ${numero} - ${bairro}, ${cidade}/${estado}`;
    }

    formatarCep(pedido: any): string {
        return pedido.endereco?.cep ? `CEP: ${pedido.endereco.cep}` : '';
    }

    async sair(): Promise<void> {
        await signOut(auth);
        this.router.navigate(['/']);
    }
}