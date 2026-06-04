import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { SobreComponent } from './sobre/sobre';
import { CadastroComponent } from './cadastro/cadastro';
import { CozinhaComponent } from './cozinha/cozinha';
import { EntregadorComponent } from './entregador/entregador';
import { ClienteComponent } from './cliente/cliente';
import { AdminComponent } from './admin/admin';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'sobre', component: SobreComponent },
    { path: 'cadastro', component: CadastroComponent },
    { path: 'cozinha', component: CozinhaComponent },
    { path: 'entregador', component: EntregadorComponent },
    { path: 'cliente', component: ClienteComponent },
    { path: 'admin', component: AdminComponent }
];