import { Injectable, computed, effect, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private apiUrl = 'http://localhost:8010/api';
  private apiUrl = 'https://angularproject-1-p3wp.onrender.com/api' ;
  private currentUserSignal: WritableSignal<any | null> = signal(this.loadUserFromStorage());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isLoggedInSignal = computed(() => !!this.currentUserSignal());
  readonly isAdminSignal = computed(() => this.currentUserSignal()?.nom === 'LineoL');

  constructor(private http: HttpClient) {
    effect(() => {
      const user = this.currentUserSignal();
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentUser');
      }
    });
  }

  private loadUserFromStorage(): any | null {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      return Object.keys(parsed).length ? parsed : null;
    } catch {
      return null;
    }
  }

  // Méthode pour la connexion
  login(nom: string, password: string): Observable<boolean> {
    return this.http.post<{ success: boolean; user: any; message?: string }>(`${this.apiUrl}/login`, { nom, password })
      .pipe(
        map(response => {
          if (response.success) {
            this.currentUserSignal.set(response.user);
            return true;
          }
          throw new Error(response.message || 'Échec de la connexion');
        })
      );
  }

  // Méthode pour la création de compte
  signup(nom: string, password: string): Observable<boolean> {
    return this.http.post<{ success: boolean; user: any; message?: string }>(`${this.apiUrl}/signup`, { nom, password })
      .pipe(
        map(response => {
          if (response.success) {
            this.currentUserSignal.set(response.user);
            return true;
          }
          throw new Error(response.message || 'Échec de la création de compte');
        })
      );
  }

  // Méthode pour déconnexion
  logout(): void {
    this.currentUserSignal.set(null);
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.isLoggedInSignal();
  }

  // Récupérer l'utilisateur connecté
  getCurrentUser(): any {
    return this.currentUser();
  }

  // Vérifier si l'utilisateur est admin
  isAdmin(): boolean {
    return this.isAdminSignal();
  }
}
