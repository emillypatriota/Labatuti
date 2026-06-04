import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../firebase.config';

const auth = getAuth(app);
const db = getFirestore(app);

@Component({
    selector: 'app-cadastro',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './cadastro.html',
    styleUrl: './cadastro.css'
})
export class CadastroComponent {
    aba: 'entrar' | 'cadastrar' = 'entrar';
    mostrarRecuperar = false;
    toastSucesso = '';

    loginEmail = '';
    loginSenha = '';
    erros: any = {};

    nome = '';
    email = '';
    telefone = '';
    cpf = '';
    dataNascimento = '';
    senha = '';
    confirmarSenha = '';

    constructor(private router: Router) { }

    voltar() {
        this.router.navigate(['/']);
    }

    mostrarToast(msg: string) {
        this.toastSucesso = msg;
        setTimeout(() => this.toastSucesso = '', 3000);
    }

    async entrar() {
        this.erros = {};
        if (!this.loginEmail) this.erros.loginEmail = 'Informe o email.';
        if (!this.loginSenha) this.erros.loginSenha = 'Informe a senha.';
        if (Object.keys(this.erros).length > 0) return;

        try {
            const cred = await signInWithEmailAndPassword(auth, this.loginEmail, this.loginSenha);
            if (cred.user.email === 'admin@labatuti.com') {
                this.router.navigate(['/admin']);
            } else if (cred.user.email === 'cozinha@labatuti.com') {
                this.router.navigate(['/cozinha']);
            } else if (cred.user.email === 'entregador@labatuti.com') {
                this.router.navigate(['/entregador']);
            } else {
                this.router.navigate(['/cliente']);
            }
        } catch (e: any) {
            this.erros.loginGeral = 'Email ou senha incorretos.';
        }
    }

    async cadastrar() {
        this.erros = {};

        if (!this.nome) this.erros.nome = 'Informe o nome completo.';
        if (!this.email) this.erros.email = 'Informe o email.';
        if (!this.telefone) this.erros.telefone = 'Informe o telefone.';
        if (!this.cpf) {
            this.erros.cpf = 'Informe o CPF.';
        } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(this.cpf)) {
            this.erros.cpf = 'CPF inválido. Use 000.000.000-00.';
        }
        if (!this.dataNascimento) this.erros.dataNascimento = 'Informe a data de nascimento.';
        if (!this.senha) {
            this.erros.senha = 'Informe a senha.';
        } else if (this.senha.length < 6) {
            this.erros.senha = 'A senha deve ter no mínimo 6 caracteres.';
        }
        if (!this.confirmarSenha) {
            this.erros.confirmarSenha = 'Confirme a senha.';
        } else if (this.senha !== this.confirmarSenha) {
            this.erros.confirmarSenha = 'As senhas não coincidem.';
        }

        if (Object.keys(this.erros).length > 0) return;

        try {
            const cred = await createUserWithEmailAndPassword(auth, this.email, this.senha);
            await setDoc(doc(db, 'usuarios', cred.user.uid), {
                nome: this.nome,
                email: this.email,
                telefone: this.telefone,
                cpf: this.cpf,
                dataNascimento: this.dataNascimento,
                criadoEm: new Date()
            });
            this.mostrarToast('✔ Cadastro realizado com sucesso!');
            setTimeout(() => this.router.navigate(['/cliente']), 2000);
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                this.erros.email = 'Este email já está cadastrado.';
            } else {
                this.erros.geral = 'Erro ao criar conta. Tente novamente.';
            }
        }
    }

    async recuperarSenha() {
        this.erros = {};
        if (!this.recuperarEmail) {
            this.erros.recuperar = 'Digite seu email.';
            return;
        }
        try {
            await sendPasswordResetEmail(auth, this.recuperarEmail);
            this.mostrarToast('Instruções enviadas para seu email!');
            this.fecharRecuperar();
        } catch (e) {
            this.erros.recuperar = 'Email não encontrado.';
        }
    }

    recuperarEmail = '';

    fecharRecuperar() {
        this.mostrarRecuperar = false;
        this.recuperarEmail = '';
        this.erros = {};
    }
}