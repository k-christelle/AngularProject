import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    CommonModule,
    RouterLink
  ]
})
export class LoginComponent implements OnInit {
  nom: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/assignments']);
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.authService.login(this.nom, this.password).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/assignments']);
        }
      },
      error: (err) => {
        this.errorMessage = err.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }
}