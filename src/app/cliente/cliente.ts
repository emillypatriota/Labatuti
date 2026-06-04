import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
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

export interface ItemCarrinho {
    prato: Prato;
    quantidade: number;
}

@Component({
    selector: 'app-cliente',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cliente.html',
    styleUrl: './cliente.css'
})
export class ClienteComponent implements OnInit, OnDestroy {
    usuario: any = null;
    pratos = signal<Prato[]>([]);
    carrinho = signal<ItemCarrinho[]>([]);
    pedidos = signal<any[]>([]);

    abaAtiva = signal<'cardapio' | 'pedidos'>('cardapio');
    categoriaAtiva = signal<string>('Todos');
    showCarrinho = signal(false);
    showFinalizarPedido = signal(false);
    stepPagamento = signal(1);
    toastMsg = signal('');

    // Cupom
    cupomDigitado = signal('');
    cupomAplicado = signal<any>(null);
    cupomErro = signal('');
    cupons: any[] = [];

    // Avaliação
    showAvaliacao = signal(false);
    pedidoParaAvaliar = signal<any>(null);
    notaPedido = signal(5);
    notaEntrega = signal(5);
    comentarioAvaliacao = signal('');
    avaliacaoEnviada = signal(false);

    // Pagamento
    formaPagamento = signal('');

    // Endereço
    cep = signal('');
    estado = signal('SP');
    cidade = signal('São Paulo');
    bairro = signal('');
    rua = signal('');
    numero = signal('');
    complemento = signal('');
    referencia = signal('');

    // Dados pessoais
    nomeCliente = signal('');
    telefoneCliente = signal('');
    emailCliente = signal('');
    observacoes = signal('');

    errosStep = signal<any>({});

    categorias = ['Todos', 'Antipasti', 'Primi Piatti', 'Secondi Piatti', 'Dolci', 'Bevande'];

    pratoDoDia = computed(() => this.pratos().find(p => p.pratoDoDia && p.disponivel));

    pratosFiltrados = computed(() => {
        const cat = this.categoriaAtiva();
        return cat === 'Todos'
            ? this.pratos().filter(p => p.disponivel && !p.pratoDoDia)
            : this.pratos().filter(p => p.categoria === cat && p.disponivel);
    });

    pratosPorCategoria = computed(() => {
        const cats = ['Antipasti', 'Primi Piatti', 'Secondi Piatti', 'Dolci', 'Bevande'];
        const cat = this.categoriaAtiva();
        if (cat !== 'Todos') return [cat];
        return cats.filter(c => this.pratos().some(p => p.categoria === c && p.disponivel));
    });

    pratosDeCategoria(cat: string) {
        return this.pratos().filter(p => p.categoria === cat && p.disponivel);
    }

    totalCarrinho = computed(() => {
        const subtotal = this.carrinho().reduce((acc, item) => acc + item.prato.preco * item.quantidade, 0);
        const cupom = this.cupomAplicado();
        if (!cupom) return subtotal;
        return subtotal * (1 - cupom.desconto / 100);
    });

    totalItensCarrinho = computed(() =>
        this.carrinho().reduce((acc, item) => acc + item.quantidade, 0)
    );

    get descontoCupom(): number {
        const subtotal = this.carrinho().reduce((acc, item) => acc + item.prato.preco * item.quantidade, 0);
        const cupom = this.cupomAplicado();
        if (!cupom) return 0;
        return subtotal * (cupom.desconto / 100);
    }

    private unsubPedidos: any;

    constructor(private router: Router) { }

    async ngOnInit() {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                this.router.navigate(['/cadastro']);
                return;
            }
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (snap.exists()) {
                this.usuario = { uid: user.uid, ...snap.data() };
                this.nomeCliente.set(this.usuario.nome);
                this.telefoneCliente.set(this.usuario.telefone);
                this.emailCliente.set(this.usuario.email);
            }
            await this.carregarPratos();
            await this.carregarCupons();
            this.escutarPedidos();
        });
    }

    ngOnDestroy() {
        if (this.unsubPedidos) this.unsubPedidos();
    }

    async carregarPratos() {
        const snap = await getDocs(collection(db, 'pratos'));
        this.pratos.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prato)));
    }

    async carregarCupons() {
        const snap = await getDocs(collection(db, 'cupons'));
        this.cupons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    escutarPedidos() {
        if (!this.usuario) return;
        const q = query(collection(db, 'pedidos'), where('clienteId', '==', this.usuario.uid));
        this.unsubPedidos = onSnapshot(q, (snap) => {
            const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            lista.sort((a: any, b: any) => b.criadoEm?.seconds - a.criadoEm?.seconds);
            const anterior = this.pedidos();
            lista.forEach((pedido: any) => {
                const ant = anterior.find((p: any) => p.id === pedido.id);
                if (ant && ant.status !== 'entregue' && pedido.status === 'entregue' && !pedido.avaliado) {
                    this.abrirAvaliacao(pedido);
                }
            });
            this.pedidos.set(lista);
        });
    }

    async aplicarCupom() {
        this.cupomErro.set('');
        const codigo = this.cupomDigitado().trim().toUpperCase();
        if (!codigo) { this.cupomErro.set('Digite um cupom.'); return; }

        const cupom = this.cupons.find(c => c.codigo?.toUpperCase() === codigo && c.ativo !== false);
        if (!cupom) { this.cupomErro.set('Cupom inválido ou expirado.'); return; }

        const subtotal = this.carrinho().reduce((acc, item) => acc + item.prato.preco * item.quantidade, 0);
        if (cupom.valorMinimo && subtotal < cupom.valorMinimo) {
            this.cupomErro.set(`Pedido mínimo de R$ ${Number(cupom.valorMinimo).toFixed(2).replace('.', ',')} para este cupom.`);
            return;
        }

        // Verifica data de expiração
        if (cupom.dataExpiracao) {
            const hoje = new Date().toISOString().split('T')[0];
            if (cupom.dataExpiracao < hoje) {
                this.cupomErro.set('Este cupom está expirado.');
                return;
            }
        }

        this.cupomAplicado.set(cupom);
        this.mostrarToast(`Cupom "${cupom.codigo}" aplicado! Desconto de ${cupom.desconto}%`);
    }

    removerCupom() {
        this.cupomAplicado.set(null);
        this.cupomDigitado.set('');
        this.cupomErro.set('');
    }

    abrirAvaliacao(pedido: any) {
        this.pedidoParaAvaliar.set(pedido);
        this.notaPedido.set(5);
        this.notaEntrega.set(5);
        this.comentarioAvaliacao.set('');
        this.avaliacaoEnviada.set(false);
        this.showAvaliacao.set(true);
    }

    async enviarAvaliacao() {
        const pedido = this.pedidoParaAvaliar();
        if (!pedido) return;
        try {
            await addDoc(collection(db, 'avaliacoes'), {
                pedidoId: pedido.id,
                clienteId: this.usuario.uid,
                cliente: this.nomeCliente(),
                notaPedido: this.notaPedido(),
                notaEntrega: this.notaEntrega(),
                comentario: this.comentarioAvaliacao(),
                criadoEm: Timestamp.now()
            });
            await updateDoc(doc(db, 'pedidos', pedido.id), { avaliado: true });
            this.avaliacaoEnviada.set(true);
            setTimeout(() => this.showAvaliacao.set(false), 2000);
        } catch (e) {
            console.error('Erro avaliação:', e);
            this.mostrarToast('Erro ao enviar avaliação.');
        }
    }

    setNotaPedido(n: number) { this.notaPedido.set(n); }
    setNotaEntrega(n: number) { this.notaEntrega.set(n); }

    quantidadeNoCarrinho(pratoId: string) {
        return this.carrinho().find(i => i.prato.id === pratoId)?.quantidade ?? 0;
    }

    adicionar(prato: Prato) {
        const atual = this.carrinho();
        const idx = atual.findIndex(i => i.prato.id === prato.id);
        if (idx >= 0) {
            const nova = [...atual];
            nova[idx] = { ...nova[idx], quantidade: nova[idx].quantidade + 1 };
            this.carrinho.set(nova);
        } else {
            this.carrinho.set([...atual, { prato, quantidade: 1 }]);
        }
        this.mostrarToast(`${prato.nome} adicionado ao carrinho!`);
    }

    diminuir(pratoId: string) {
        const atual = this.carrinho();
        const idx = atual.findIndex(i => i.prato.id === pratoId);
        if (idx < 0) return;
        if (atual[idx].quantidade === 1) {
            this.carrinho.set(atual.filter(i => i.prato.id !== pratoId));
        } else {
            const nova = [...atual];
            nova[idx] = { ...nova[idx], quantidade: nova[idx].quantidade - 1 };
            this.carrinho.set(nova);
        }
    }

    mostrarToast(msg: string) {
        this.toastMsg.set(msg);
        setTimeout(() => this.toastMsg.set(''), 3000);
    }

    abrirCarrinho() { this.showCarrinho.set(true); }
    fecharCarrinho() { this.showCarrinho.set(false); }

    continuarPagamento() {
        this.showCarrinho.set(false);
        this.stepPagamento.set(1);
        this.showFinalizarPedido.set(true);
    }

    fecharFinalizar() {
        this.showFinalizarPedido.set(false);
        this.errosStep.set({});
    }

    proximoStep() {
        const erros: any = {};
        if (this.stepPagamento() === 1 && !this.formaPagamento()) erros.pagamento = 'Selecione uma forma de pagamento.';
        if (this.stepPagamento() === 2) {
            if (!this.cep()) erros.cep = 'Informe o CEP.';
            if (!this.cidade()) erros.cidade = 'Informe a cidade.';
            if (!this.bairro()) erros.bairro = 'Informe o bairro.';
            if (!this.rua()) erros.rua = 'Informe a rua.';
            if (!this.numero()) erros.numero = 'Informe o número.';
        }
        if (this.stepPagamento() === 3) {
            if (!this.nomeCliente()) erros.nome = 'Informe o nome.';
            if (!this.telefoneCliente()) erros.telefone = 'Informe o telefone.';
        }
        this.errosStep.set(erros);
        if (Object.keys(erros).length > 0) return;
        this.stepPagamento.set(this.stepPagamento() + 1);
    }

    voltarStep() {
        this.stepPagamento.set(this.stepPagamento() - 1);
        this.errosStep.set({});
    }

    async confirmarPedido() {
        try {
            const subtotal = this.carrinho().reduce((acc, item) => acc + item.prato.preco * item.quantidade, 0);
            const pedido = {
                clienteId: this.usuario.uid,
                cliente: this.nomeCliente(),
                telefone: this.telefoneCliente(),
                email: this.emailCliente(),
                itens: this.carrinho().map(i => ({
                    pratoId: i.prato.id,
                    nome: i.prato.nome,
                    quantidade: i.quantidade,
                    preco: i.prato.preco
                })),
                subtotal,
                desconto: this.descontoCupom,
                cupom: this.cupomAplicado()?.codigo ?? null,
                total: this.totalCarrinho(),
                formaPagamento: this.formaPagamento(),
                endereco: {
                    cep: this.cep(),
                    estado: this.estado(),
                    cidade: this.cidade(),
                    bairro: this.bairro(),
                    rua: this.rua(),
                    numero: this.numero(),
                    complemento: this.complemento(),
                    referencia: this.referencia()
                },
                observacoes: this.observacoes(),
                status: 'pendente',
                avaliado: false,
                criadoEm: Timestamp.now()
            };
            await addDoc(collection(db, 'pedidos'), pedido);
            this.carrinho.set([]);
            this.cupomAplicado.set(null);
            this.cupomDigitado.set('');
            this.showFinalizarPedido.set(false);
            this.abaAtiva.set('pedidos');
            this.mostrarToast('Pedido confirmado!');
        } catch (e) {
            this.mostrarToast('Erro ao confirmar pedido. Tente novamente.');
        }
    }

    statusLabel(s: string) {
        const map: any = {
            pendente: 'Pedido Recebido',
            em_preparo: 'Em Preparação',
            pronto: 'Pedido Pronto',
            em_entrega: 'Saiu para Entrega',
            entregue: 'Entregue'
        };
        return map[s] ?? s;
    }

    statusProgresso(s: string) {
        const map: any = { pendente: 10, em_preparo: 35, pronto: 60, em_entrega: 80, entregue: 100 };
        return map[s] ?? 0;
    }

    precoComDesconto(prato: Prato) {
        if (!prato.desconto) return prato.preco;
        return prato.preco * (1 - prato.desconto / 100);
    }

    async sair() {
        await signOut(auth);
        this.router.navigate(['/cadastro']);
    }
}