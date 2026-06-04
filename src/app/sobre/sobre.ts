import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sobre.html',
  styleUrl: './sobre.css'
})
export class SobreComponent {
  constructor(private router: Router) { }

  irParaInicio(): void {
    this.router.navigate(['/']);
  }

  irParaCadastro(): void {
    this.router.navigate(['/cadastro']);
  }
}