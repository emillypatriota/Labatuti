import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent {
    constructor(private router: Router) { }

    irParaCadastro(): void {
        this.router.navigate(['/cadastro']);
    }

    irParaSobre(): void {
        this.router.navigate(['/sobre']);
    }
}