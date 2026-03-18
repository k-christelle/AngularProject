import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router'; // Ajouter RouterModule
import { AuthService } from './services/auth.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule, // Ajoute de RouterModule pour routerLink et routerLinkActive
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    CommonModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <!-- Sidebar -->
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <mat-nav-list>
          <a mat-list-item [routerLink]="['/assignments']" routerLinkActive="active" (click)="sidenav.close()">
            <mat-icon matListIcon>assignment</mat-icon>
            Assignments
          </a>
          <a mat-list-item [routerLink]="['/signup']" routerLinkActive="active" (click)="sidenav.close()" *ngIf="!isLoggedIn()">
            <mat-icon matListIcon>person_add</mat-icon>
            Créer un compte
          </a>
          <a mat-list-item [routerLink]="['/login']" routerLinkActive="active" (click)="sidenav.close()" *ngIf="!isLoggedIn()">
            <mat-icon matListIcon>login</mat-icon>
            Connexion
          </a>
          <a mat-list-item (click)="logout(); sidenav.close()" *ngIf="isLoggedIn()">
            <mat-icon matListIcon>logout</mat-icon>
            Déconnexion
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <!-- Contenu principal -->
      <mat-sidenav-content>
        <div class="content">
          <button mat-icon-button (click)="sidenav.toggle()" class="toggle-button">
            <mat-icon>menu</mat-icon>
          </button>
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }

    .sidenav {
      width: 200px;
      background-color: #f4f4f4;
    }

    .sidenav mat-nav-list a {
      display: flex;
      align-items: center;
    }

    .sidenav mat-nav-list a mat-icon {
      margin-right: 10px;
    }

    .sidenav mat-nav-list a.active {
      background-color: #e0e0e0;
      font-weight: bold;
    }

    .content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #fff;
    }

    .toggle-button {
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 1000;
    }
  `]
})
export class AppComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  isLoggedIn(): boolean {
    return !!this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
