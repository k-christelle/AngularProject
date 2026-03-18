import { Component, OnInit, Inject, signal, WritableSignal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MATIERES, MatiereKey, getMatiereConfig } from '../shared/matieres';
import { bdInitialAssignments } from '../shared/data';
import { firstValueFrom } from 'rxjs';

const API_BASE_URL = 'http://localhost:8010/api';

// Assignment interface for type safety
interface Assignment {
  _id: string;
  titre: string;
  description: string;
  dateDeCreation: string;
  dateDeRendu: string;
  createdBy: string;
  assignedTo: string;

  auteurNom: string;
  auteurPhotoUrl: string;

  matiereKey: MatiereKey;
  matiereLabel: string;
  matiereImageUrl: string;
  profNom: string;
  profPhotoUrl: string;

  note: number | null;
  rendu: boolean;
  remarques: string;
}

@Component({
  selector: 'app-assignment-details-dialog',
  template: `
    <h2 mat-dialog-title>Détails de l'assignment</h2>
    <mat-dialog-content class="details">
      <div class="top">
        <div class="matiere">
          <img class="matiere-img" [src]="assignment.matiereImageUrl" [alt]="assignment.matiereLabel">
          <div>
            <div class="title">{{ assignment.titre }}</div>
            <div class="subtitle">{{ assignment.matiereLabel }}</div>
          </div>
        </div>
        <div class="status" [class.ok]="assignment.rendu" [class.ko]="!assignment.rendu">
          <mat-icon>{{ assignment.rendu ? 'task_alt' : 'schedule' }}</mat-icon>
          <span>{{ assignment.rendu ? 'Rendu' : 'Non rendu' }}</span>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="label">Auteur (élève)</div>
          <div class="person">
            <img class="avatar" [src]="assignment.auteurPhotoUrl" [alt]="assignment.auteurNom">
            <div class="value">{{ assignment.auteurNom }}</div>
          </div>
        </div>

        <div class="card">
          <div class="label">Prof</div>
          <div class="person">
            <img class="avatar" [src]="assignment.profPhotoUrl" [alt]="assignment.profNom">
            <div class="value">{{ assignment.profNom }}</div>
          </div>
        </div>

        <div class="card">
          <div class="label">Note / 20</div>
          <div class="value">{{ assignment.note ?? '—' }}</div>
        </div>

        <div class="card">
          <div class="label">Date de création</div>
          <div class="value">{{ assignment.dateDeCreation }}</div>
        </div>

        <div class="card">
          <div class="label">Date de rendu</div>
          <div class="value">{{ assignment.dateDeRendu || '—' }}</div>
        </div>

        <div class="card full">
          <div class="label">Description</div>
          <div class="value">{{ assignment.description }}</div>
        </div>

        <div class="card full">
          <div class="label">Remarques</div>
          <div class="value">{{ assignment.remarques || '—' }}</div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .details { padding-top: 6px; }
    .top { display:flex; justify-content:space-between; gap:16px; align-items:center; margin-bottom: 16px; }
    .matiere { display:flex; gap:12px; align-items:center; }
    .matiere-img { width:14px; height:14px; border-radius:6px; border:1px solid rgba(0,0,0,.08); background:#fff; padding:3px; }
    .title { font-weight: 700; font-size: 18px; }
    .subtitle { color:#666; }
    .status { display:flex; gap:8px; align-items:center; padding:8px 12px; border-radius: 999px; border:1px solid rgba(0,0,0,.08); }
    .status.ok { background: rgba(76,175,80,.10); color:#2e7d32; }
    .status.ko { background: rgba(255,152,0,.10); color:#ef6c00; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .card { border:1px solid rgba(0,0,0,.08); border-radius:12px; padding:12px; background:#fff; }
    .card.full { grid-column: 1 / -1; }
    .label { color:#666; font-size: 12px; text-transform: uppercase; letter-spacing:.6px; margin-bottom: 8px; }
    .value { font-weight: 600; }
    .person { display:flex; gap:10px; align-items:center; }
    .avatar { width:14px; height:14px; border-radius:50%; border:1px solid rgba(0,0,0,.08); background:#fff; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule]
})
export class AssignmentDetailsDialog {
  assignment: Assignment;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { assignment: Assignment }) {
    this.assignment = data.assignment;
  }
}

// Dialog for confirming deletion
@Component({
  selector: 'app-confirm-delete-dialog',
  template: `
    <h2 mat-dialog-title>Confirmer la suppression</h2>
    <mat-dialog-content>
      <p>Êtes-vous sûr de vouloir supprimer l'assignment "{{ data.titre }}" ?</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Supprimer</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule]
})
export class ConfirmDeleteDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { titre: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

// Dialog for editing assignments
@Component({
  selector: 'app-edit-assignment-dialog',
  template: `
    <h2 mat-dialog-title>Modifier l'assignment</h2>
    <mat-dialog-content>
      <form>
        <div class="preview">
          <img class="matiere-img" [src]="assignment.matiereImageUrl" [alt]="assignment.matiereLabel">
          <div class="meta">
            <div class="matiere-label">{{ assignment.matiereLabel }}</div>
            <div class="prof">
              <img class="avatar" [src]="assignment.profPhotoUrl" [alt]="assignment.profNom">
              <span>{{ assignment.profNom }}</span>
            </div>
          </div>
        </div>
        <mat-form-field>
          <mat-label>Titre</mat-label>
          <input matInput [(ngModel)]="assignment.titre" name="titre" required>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Description</mat-label>
          <input matInput [(ngModel)]="assignment.description" name="description" required>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Date de création</mat-label>
          <input matInput type="date" [(ngModel)]="assignment.dateDeCreation" name="dateDeCreation" required>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Auteur (élève)</mat-label>
          <mat-select [(ngModel)]="assignment.assignedTo" name="assignedTo" required>
            <mat-option *ngFor="let user of users" [value]="user.nom">{{ user.nom }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Matière</mat-label>
          <mat-select [(ngModel)]="assignment.matiereKey" name="matiereKey" (selectionChange)="onMatiereSelected($event.value)" required>
            <mat-option *ngFor="let m of matieres" [value]="m.key">
              <span class="matiere-option">
                <img class="matiere-option-img" [src]="m.matiereImageUrl" [alt]="m.label">
                {{ m.label }}
              </span>
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Note (sur 20)</mat-label>
          <input matInput type="number" min="0" max="20" [(ngModel)]="assignment.note" name="note">
        </mat-form-field>
        <mat-checkbox [(ngModel)]="assignment.rendu" name="rendu" [disabled]="assignment.note === null || assignment.note === undefined">
          Marquer comme rendu (uniquement si noté)
        </mat-checkbox>
        <mat-form-field>
          <mat-label>Remarques</mat-label>
          <textarea matInput rows="3" [(ngModel)]="assignment.remarques" name="remarques"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSave()">Enregistrer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .preview { display:flex; gap:12px; align-items:center; padding: 10px 12px; border:1px solid rgba(0,0,0,.08); border-radius:12px; background:#fff; margin-bottom: 12px; }
    .matiere-img { width:14px; height:14px; border-radius:6px; border:1px solid rgba(0,0,0,.08); background:#fff; padding:3px; }
    .meta { display:flex; flex-direction:column; gap:4px; }
    .matiere-label { font-weight: 700; }
    .prof { display:flex; gap:8px; align-items:center; color:#555; }
    .avatar { width:14px; height:14px; border-radius:50%; border:1px solid rgba(0,0,0,.08); background:#fff; }
    .matiere-option { display:inline-flex; align-items:center; gap:6px; }
    .matiere-option-img { width:12px; height:12px; border-radius:6px; border:1px solid rgba(0,0,0,.08); background:#fff; padding:2px; }
  `],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    FormsModule,
    CommonModule
  ]
})
export class EditAssignmentDialog {
  assignment: Assignment;
  users: any[];
  matieres = MATIERES;

  constructor(
    public dialogRef: MatDialogRef<EditAssignmentDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { assignment: Assignment; users: any[] }
  ) {
    this.assignment = { ...data.assignment };
    this.users = data.users;
  }

  onMatiereSelected(key: MatiereKey): void {
    const cfg = getMatiereConfig(key);
    if (!cfg) return;
    this.assignment.matiereKey = cfg.key;
    this.assignment.matiereLabel = cfg.label;
    this.assignment.matiereImageUrl = cfg.matiereImageUrl;
    this.assignment.profNom = cfg.profNom;
    this.assignment.profPhotoUrl = cfg.profPhotoUrl;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.assignment.note === null || this.assignment.note === undefined) {
      this.assignment.rendu = false;
    }
    this.dialogRef.close(this.assignment);
  }
}

// Main Assignments Component
@Component({
  selector: 'app-assignments',
  template: `
    <div class="container">
      <!-- En-tête -->
      <div class="header">
        <h2>Tableau de Bord des Assignments</h2>
        <div class="user-info">
          <span>Connecté en tant que : <strong>{{ currentUser()?.nom }}</strong></span>
          <mat-icon class="admin-icon" *ngIf="authService.isAdmin()">admin_panel_settings</mat-icon>
        </div>
      </div>

      <!-- Formulaire de création d'assignment (visible uniquement pour l'admin) -->
      <div *ngIf="authService.isAdmin()" class="admin-section">
        <mat-card class="create-card">
          <mat-card-header>
            <mat-card-title>Nouvel Assignment</mat-card-title>
            <mat-card-subtitle>Remplissez les détails pour créer un nouvel assignment</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div style="display:flex; justify-content:flex-end; gap: 10px; margin-bottom: 10px;">
              <button mat-stroked-button type="button" (click)="resetDatabase()">
                Réinitialiser la base
              </button>
              <button mat-stroked-button type="button" (click)="seedDatabaseFromDataTs()">
                Peupler la base (data.ts)
              </button>
            </div>
            <form (ngSubmit)="createAssignment()" class="create-form">
              <div class="stepper">
                Étape {{ createStep() }} / 3
              </div>
              <div class="matiere-preview">
                <img class="matiere-img" [src]="newAssignment().matiereImageUrl" [alt]="newAssignment().matiereLabel">
                <div class="meta">
                  <div class="matiere-label">{{ newAssignment().matiereLabel }}</div>
                  <div class="prof">
                    <img class="avatar" [src]="newAssignment().profPhotoUrl" [alt]="newAssignment().profNom">
                    <span>{{ newAssignment().profNom }}</span>
                  </div>
                </div>
              </div>
              <ng-container *ngIf="createStep() === 1">
                <mat-form-field appearance="outline">
                  <mat-label>Titre</mat-label>
                  <input matInput [ngModel]="newAssignment().titre" (ngModelChange)="patchNewAssignment({ titre: $event })" name="titre" required>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Description</mat-label>
                  <input matInput [ngModel]="newAssignment().description" (ngModelChange)="patchNewAssignment({ description: $event })" name="description" required>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Date de création</mat-label>
                  <input
                    matInput
                    type="date"
                    [ngModel]="newAssignment().dateDeCreation"
                    (ngModelChange)="patchNewAssignment({ dateDeCreation: $event })"
                    name="dateDeCreation"
                    required
                  >
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Date de rendu</mat-label>
                  <input
                    matInput
                    type="date"
                    [ngModel]="newAssignment().dateDeRendu"
                    (ngModelChange)="patchNewAssignment({ dateDeRendu: $event })"
                    name="dateDeRendu"
                    required
                  >
                </mat-form-field>
              </ng-container>

              <ng-container *ngIf="createStep() === 2">
                <mat-form-field appearance="outline">
                  <mat-label>Assigné à (élève)</mat-label>
                  <mat-select [ngModel]="newAssignment().assignedTo" (ngModelChange)="onAuteurChange($event)" name="assignedTo" required>
                    <mat-option *ngFor="let user of users()" [value]="user.nom">{{ user.nom }}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Auteur</mat-label>
                  <input matInput [ngModel]="newAssignment().auteurNom" (ngModelChange)="patchNewAssignment({ auteurNom: $event })" name="auteurNom" required>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Matière</mat-label>
                  <mat-select [ngModel]="newAssignment().matiereKey" (ngModelChange)="onMatiereChange($event)" name="matiereKey" required>
                    <mat-option *ngFor="let m of matieres" [value]="m.key">
                      <span class="matiere-option">
                        <img class="matiere-option-img" [src]="m.matiereImageUrl" [alt]="m.label">
                        {{ m.label }}
                      </span>
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </ng-container>

              <ng-container *ngIf="createStep() === 3">
                <mat-form-field appearance="outline">
                  <mat-label>Note (sur 20)</mat-label>
                  <input matInput type="number" min="0" max="20" [ngModel]="newAssignment().note" (ngModelChange)="patchNewAssignment({ note: $event === '' ? null : $event })" name="note">
                </mat-form-field>
                <mat-checkbox [ngModel]="newAssignment().rendu" (ngModelChange)="patchNewAssignment({ rendu: $event })" name="rendu" [disabled]="newAssignment().note === null || newAssignment().note === undefined">
                  Marquer comme rendu (uniquement si noté)
                </mat-checkbox>
                <mat-form-field appearance="outline">
                  <mat-label>Remarques</mat-label>
                  <textarea matInput rows="3" [ngModel]="newAssignment().remarques" (ngModelChange)="patchNewAssignment({ remarques: $event })" name="remarques"></textarea>
                </mat-form-field>
              </ng-container>

              <div class="create-actions">
                <button mat-stroked-button color="primary" type="button" (click)="prevCreateStep()" [disabled]="createStep() === 1">
                  Précédent
                </button>
                <button mat-raised-button color="primary" type="button" *ngIf="createStep() < 3" (click)="nextCreateStep()">
                  Suivant
                </button>
                <button mat-raised-button color="accent" type="submit" class="create-button" *ngIf="createStep() === 3">
                  <mat-icon>add</mat-icon> Créer Assignment
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tableau des assignments -->
      <div class="table-section">
        <table mat-table [dataSource]="pagedAssignments()" class="mat-elevation-z8 assignments-table">
          <ng-container matColumnDef="matiere">
            <th mat-header-cell *matHeaderCellDef>Matière</th>
            <td mat-cell *matCellDef="let assignment">
              <span class="matiere-cell">
                <img class="matiere-option-img" [src]="assignment.matiereImageUrl" [alt]="assignment.matiereLabel">
                {{ getMatiereLabel(assignment.matiereKey, assignment.matiereLabel) }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="titre">
            <th mat-header-cell *matHeaderCellDef>Titre</th>
            <td mat-cell *matCellDef="let assignment">
              <button mat-button (click)="openDetails(assignment)">{{ assignment.titre }}</button>
            </td>
          </ng-container>
          <ng-container matColumnDef="auteur">
            <th mat-header-cell *matHeaderCellDef>Auteur</th>
            <td mat-cell *matCellDef="let assignment">
              <span class="person-cell">
                <img class="avatar" [src]="assignment.auteurPhotoUrl" [alt]="assignment.auteurNom">
                {{ assignment.auteurNom }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="assignedTo">
            <th mat-header-cell *matHeaderCellDef>Assigné à</th>
            <td mat-cell *matCellDef="let assignment">
              <span class="person-cell">
                <img class="avatar" [src]="assignment.auteurPhotoUrl" [alt]="assignment.auteurNom">
                {{ assignment.assignedTo }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="prof">
            <th mat-header-cell *matHeaderCellDef>Prof</th>
            <td mat-cell *matCellDef="let assignment">
              <span class="person-cell">
                <img class="avatar" [src]="assignment.profPhotoUrl" [alt]="assignment.profNom">
                {{ assignment.profNom }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="note">
            <th mat-header-cell *matHeaderCellDef>Note</th>
            <td mat-cell *matCellDef="let assignment">{{ assignment.note ?? '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="dateDeCreation">
            <th mat-header-cell *matHeaderCellDef>Date de création</th>
            <td mat-cell *matCellDef="let assignment">{{ assignment.dateDeCreation || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="dateDeRendu">
            <th mat-header-cell *matHeaderCellDef>Date de rendu</th>
            <td mat-cell *matCellDef="let assignment">{{ assignment.dateDeRendu || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="rendu">
            <th mat-header-cell *matHeaderCellDef>Rendu</th>
            <td mat-cell *matCellDef="let assignment">
              <mat-icon [style.color]="assignment.rendu ? '#2e7d32' : '#ef6c00'">
                {{ assignment.rendu ? 'task_alt' : 'schedule' }}
              </mat-icon>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let assignment">
              <button mat-icon-button class="action-btn view-btn" (click)="openDetails(assignment)">
                <mat-icon>info</mat-icon>
              </button>
              <button mat-icon-button class="action-btn edit-btn" (click)="editAssignment(assignment)" *ngIf="authService.isAdmin()">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button class="action-btn delete-btn" (click)="deleteAssignment(assignment)" *ngIf="authService.isAdmin()" [disabled]="isDeleting()">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        <mat-paginator
          [length]="assignments().length"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="pageSizeOptions"
          (page)="onPageChange($event)">
        </mat-paginator>

        <!-- Permet d’éviter l’avertissement NG8113 (composants de dialogue utilisés dynamiquement) -->
        <ng-container *ngIf="false">
          <app-confirm-delete-dialog></app-confirm-delete-dialog>
          <app-edit-assignment-dialog></app-edit-assignment-dialog>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Roboto', sans-serif;
}

/* Enhanced Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
  color: white;
  padding: 18px 25px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(63, 81, 181, 0.25);
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.1), transparent 80%);
  pointer-events: none;
}

.header h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 50px;
  backdrop-filter: blur(5px);
}

.admin-icon {
  color: #ffd740;
  filter: drop-shadow(0 0 3px rgba(255, 215, 64, 0.5));
  margin-right: 5px;
}

/* Admin Section */
.admin-section {
  margin-bottom: 40px;
  animation: fadeIn 0.6s ease-out;
}

/* Create Card */
.create-card {
  background: linear-gradient(145deg, #ffffff, #f5f5f5);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  padding: 30px;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid rgba(63, 81, 181, 0.1);
  overflow: hidden;
  position: relative;
}

.create-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.create-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(63, 81, 181, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
}

.create-card mat-card-title {
  color: #3f51b5;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.create-card mat-card-subtitle {
  color: #666;
  font-size: 15px;
  margin-bottom: 25px;
  line-height: 1.5;
  position: relative;
  z-index: 1;
}

.create-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  position: relative;
  z-index: 1;
}

.create-form mat-form-field {
  width: 100%;
}

.create-form mat-form-field:focus-within {
  transform: translateY(-2px);
  transition: transform 0.3s;
}

.create-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.create-button {
  padding: 12px 0;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
  color: white;
  transition: all 0.3s;
  border-radius: 8px;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(63, 81, 181, 0.3);
  border: none;
  min-width: 200px;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th, td {
  text-align: center;
  padding: 16px;
  transition: background-color 0.2s;
}

th {
  background-color: #f5f7ff;
  font-weight: 600;
  color: #3f51b5;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: 0.7px;
  border-bottom: 2px solid rgba(63, 81, 181, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

tr {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

tr:last-child {
  border-bottom: none;
}

tr:hover {
  background-color: #f8f9ff;
}

tr:hover td {
  color: #3f51b5;
}

button.mat-icon-button {
  width: 40px;
  height: 40px;
  line-height: 40px;
  transition: all 0.3s;
}

button.mat-icon-button:hover {
  background-color: rgba(63, 81, 181, 0.1);
  transform: scale(1.1);
}

button mat-icon {
  font-size: 20px;
  transition: color 0.3s;
}

button.edit-button mat-icon {
  color: #4caf50;
}

button.delete-button mat-icon {
  color: #f44336;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .create-form {
    grid-template-columns: 1fr;
  }

  .create-button {
    grid-column: span 1;
  }

  .header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Add some space between table rows for better readability */
td {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* Style for empty state */
.empty-state {
  padding: 40px;
  text-align: center;
  color: #757575;
}

/* Add pagination styling */
.mat-paginator {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background-color: #f5f7ff;
    }

    .assignments-table .action-btn {
      margin: 0 2px;
      border-radius: 50%;
    }
    .assignments-table .view-btn mat-icon {
      color: #1976d2;
    }
    .assignments-table .edit-btn mat-icon {
      color: #388e3c;
    }
    .assignments-table .delete-btn mat-icon {
      color: #d32f2f;
    }

    /* Reduce image size for matiere / prof photos */
    .matiere-option-img {
      width: 12px;
      height: 12px;
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: #fff;
      padding: 2px;
      object-fit: cover;
    }

    .avatar {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: #fff;
      object-fit: cover;
    }`],
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    CommonModule,
    ConfirmDeleteDialog,
    EditAssignmentDialog,
    MatPaginator
]
})
export class AssignmentsComponent implements OnInit {
  assignments: WritableSignal<Assignment[]> = signal<Assignment[]>([]);
  users: WritableSignal<any[]> = signal<any[]>([]);
  currentUser = signal<any | null>(null);
  isDeleting = signal(false);
  createStep = signal(1);
  pageIndex = signal(0);
  pageSize = signal(10);
  pageSizeOptions = [5, 10, 25];
  displayedColumns: string[] = ['matiere', 'titre', 'auteur', 'assignedTo', 'prof', 'note', 'dateDeCreation', 'dateDeRendu', 'rendu', 'actions'];
  matieres = MATIERES;

  pagedAssignments = computed(() => {
    const all = this.assignments();
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return all.slice(start, end);
  });

  newAssignment = signal({
    titre: '',
    description: '',
    dateDeCreation: '',
    dateDeRendu: '',
    createdBy: '',
    assignedTo: '',

    auteurNom: '',
    auteurPhotoUrl: 'assets/avatars/student.svg',

    matiereKey: 'WEB' as MatiereKey,
    matiereLabel: getMatiereConfig('WEB')!.label,
    matiereImageUrl: getMatiereConfig('WEB')!.matiereImageUrl,
    profNom: getMatiereConfig('WEB')!.profNom,
    profPhotoUrl: getMatiereConfig('WEB')!.profPhotoUrl,

    note: null as number | null,
    rendu: false,
    remarques: ''
  });

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
    this.newAssignment.update(value => ({ ...value, createdBy: user.nom }));
    this.loadAssignments();
    if (this.authService.isAdmin()) {
      this.loadUsers();
    }
  }

  onMatiereChange(key: MatiereKey): void {
    const cfg = getMatiereConfig(key);
    if (!cfg) return;
    this.newAssignment.update(value => ({
      ...value,
      matiereKey: cfg.key,
      matiereLabel: cfg.label,
      matiereImageUrl: cfg.matiereImageUrl,
      profNom: cfg.profNom,
      profPhotoUrl: cfg.profPhotoUrl
    }));
  }

  onAuteurChange(nom: string): void {
    this.newAssignment.update(value => ({
      ...value,
      assignedTo: nom
    }));
  }

  nextCreateStep(): void {
    const s = this.createStep();
    if (s < 3) this.createStep.set(s + 1);
  }

  prevCreateStep(): void {
    const s = this.createStep();
    if (s > 1) this.createStep.set(s - 1);
  }

  openDetails(assignment: Assignment): void {
    this.dialog.open(AssignmentDetailsDialog, {
      width: '720px',
      data: { assignment }
    });
  }

  patchNewAssignment(patch: any): void {
    this.newAssignment.update((value: any) => {
      const next = { ...value, ...patch };
      if (next.note === null || next.note === undefined) {
        next.rendu = false;
      }
      return next;
    });
  }

  getMatiereLabel(key: string | undefined, fallback: string): string {
    const cfg = getMatiereConfig(key);
    return cfg ? cfg.label : fallback;
  }

  async seedDatabaseFromDataTs(force = false): Promise<void> {
    if (!this.authService.isAdmin()) {
      this.snackBar.open('Action réservée à l’administrateur', 'OK', { duration: 2500, verticalPosition: 'top' });
      return;
    }

    if (!force) {
      // Empêche le peuplement automatique si des assignments existent déjà
      try {
        const existing = await firstValueFrom(this.http.get<any[]>(`${API_BASE_URL}/assignments`));
        if (existing && existing.length > 0) {
          this.snackBar.open('La base contient déjà des assignments, le peuplement est désactivé.', 'OK', {
            duration: 4000,
            verticalPosition: 'top'
          });
          return;
        }
      } catch (e) {
        console.warn('Impossible de vérifier les assignments existants avant semence', e);
      }
    }

    // S'assurer d'avoir au moins un élève (assignedTo doit exister côté backend)
    try {
      const users = await firstValueFrom(this.http.get<any[]>(`${API_BASE_URL}/users`));
      this.users.set(users);

      const hasStudent = users.some(u => u?.nom && u.nom !== 'LineoL');
      if (!hasStudent) {
        await firstValueFrom(this.http.post(`${API_BASE_URL}/signup`, { nom: 'eleve1', password: 'eleve1' }));
        const users2 = await firstValueFrom(this.http.get<any[]>(`${API_BASE_URL}/users`));
        this.users.set(users2);
      }
    } catch (e) {
      console.error('Seed: erreur chargement/création utilisateurs', e);
      this.snackBar.open('Impossible de charger/créer les utilisateurs (backend local ?)', 'OK', { duration: 4000, verticalPosition: 'top' });
      return;
    }

    const current = this.currentUser();
    const availableUsers = this.users().filter(u => u?.nom && u.nom !== 'LineoL');
    const fallbackUser = this.users().find(u => u?.nom)?.nom || current?.nom || 'LineoL';

    const assignedToCandidate = availableUsers.length ? availableUsers[0].nom : fallbackUser;

    // Empêche le peuplement automatique multiple : si des assignments existent déjà, on ne ré-essaye pas.
    try {
      const existing = await firstValueFrom(this.http.get<any[]>(`${API_BASE_URL}/assignments`));
      if (existing && existing.length > 0) {
        this.snackBar.open('La base contient déjà des assignments, le peuplement est désactivé.', 'OK', {
          duration: 4000,
          verticalPosition: 'top'
        });
        return;
      }
    } catch (e) {
      console.warn('Impossible de vérifier les assignments existants avant semence', e);
    }

    let ok = 0;
    let ko = 0;
    let firstErrorMessage: string | null = null;

    const today = new Date().toISOString().split('T')[0];
    const seedData = bdInitialAssignments as any[];

    const usersForAssignments = this.users().filter(u => u?.nom && u.nom !== 'LineoL');

    const assignmentEntries = seedData.map((entry, idx) => {
      const mat = MATIERES[idx % MATIERES.length];
      const user = usersForAssignments.length ? usersForAssignments[idx % usersForAssignments.length] : { nom: assignedToCandidate };
      const suffix = `#${idx + 1}`;
      return {
        titre: entry?.nom ? `${entry.nom} ${suffix}` : `Assignment ${idx + 1}`,
        description: 'Seed depuis data.ts',
        dateDeCreation: today,
        dateDeRendu: entry?.dateDeRendu || today,
        createdBy: 'LineoL',
        assignedTo: user.nom,

        auteurNom: user.nom,
        auteurPhotoUrl: 'assets/avatars/student.svg',

        matiereKey: mat.key,
        matiereLabel: mat.label,
        matiereImageUrl: mat.matiereImageUrl,
        profNom: mat.profNom,
        profPhotoUrl: mat.profPhotoUrl,

        note: entry?.rendu ? 10 : null,
        rendu: !!entry?.rendu,
        remarques: ''
      };
    });

    for (const payload of assignmentEntries) {
      try {
        await firstValueFrom(this.http.post<any>(`${API_BASE_URL}/assignments`, payload));
        ok++;
      } catch (e: any) {
        ko++;
        if (!firstErrorMessage) {
          firstErrorMessage = e?.error?.message || e?.message || 'Erreur inconnue';
        }
      }
    }

    const suffix = firstErrorMessage ? ` (ex: ${firstErrorMessage})` : '';
    this.snackBar.open(`Peuplement terminé: ${ok} OK, ${ko} erreurs${suffix}`, 'OK', { duration: 6000, verticalPosition: 'top' });
    this.loadAssignments();
  }

  loadAssignments(): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }
    const nom = user.nom;
    console.log(`Chargement des assignments pour: ${nom}`);
    const endpoint = `${API_BASE_URL}/assignments?nom=${nom}`;
    this.http.get<Assignment[]>(endpoint).subscribe({
      next: (data) => {
        console.log('Assignments reçus:', data);
        const validAssignments = data.filter(assignment => {
          if (!assignment._id) {
            console.warn('Assignment sans _id détecté:', assignment);
            this.snackBar.open('Certains assignments sont invalides (ID manquant)', 'OK', {
              duration: 3000,
              verticalPosition: 'top'
            });
            return false;
          }
          return true;
        });
        this.assignments.set(validAssignments);
        this.pageIndex.set(0);
        console.log('Assignments valides:', this.assignments());
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des assignments:', err);
        this.snackBar.open('Erreur lors du chargement des assignments', 'OK', {
          duration: 3000,
          verticalPosition: 'top'
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  loadUsers(): void {
    this.http.get<any[]>(`${API_BASE_URL}/users`).subscribe({
      next: (data) => {
        this.users.set(data);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        this.snackBar.open('Erreur lors du chargement des utilisateurs', 'OK', {
          duration: 3000,
          verticalPosition: 'top'
        });
      }
    });
  }

  async resetDatabase(): Promise<void> {
    if (!this.authService.isAdmin()) {
      this.snackBar.open('Action réservée à l’administrateur', 'OK', { duration: 2500, verticalPosition: 'top' });
      return;
    }

    try {
      const response = await firstValueFrom(this.http.delete<any>(`${API_BASE_URL}/assignments`, { body: { createdBy: 'LineoL' } }));
      this.snackBar.open(`Base réinitialisée (${response.deletedCount} supprimés).`, 'OK', { duration: 3000, verticalPosition: 'top' });
      await this.seedDatabaseFromDataTs(true);
    } catch (e) {
      console.error('Erreur lors de la réinitialisation de la base:', e);
      this.snackBar.open('Erreur lors de la réinitialisation de la base', 'OK', { duration: 3000, verticalPosition: 'top' });
    }
  }

  createAssignment(): void {
    const payload = this.newAssignment();

    if (!payload.auteurNom || !payload.auteurNom.toString().trim()) {
      this.snackBar.open('Le champ "Auteur" est requis', 'OK', { duration: 3000, verticalPosition: 'top' });
      return;
    }

    const note = payload.note;
    const noteOk = note === null || (typeof note === 'number' && note >= 0 && note <= 20);
    if (!noteOk) {
      this.snackBar.open('La note doit être entre 0 et 20 (ou vide)', 'OK', { duration: 3000, verticalPosition: 'top' });
      return;
    }
    if ((note === null || note === undefined) && payload.rendu) {
      this.snackBar.open('Impossible de marquer "rendu" sans note', 'OK', { duration: 3000, verticalPosition: 'top' });
      return;
    }

    console.log('Création d’un assignment:', payload);
    this.http.post(`${API_BASE_URL}/assignments`, payload).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open(`Assignment "${response.assignment.titre}" créé pour ${response.assignment.assignedTo}`, 'OK', {
            duration: 3000,
            verticalPosition: 'top'
          });

          if (this.authService.isAdmin()) {
            console.log('Ajout de l’assignment au tableau pour l’admin:', response.assignment);
            this.assignments.update(list => [...list, response.assignment]);
          }

          const user = this.currentUser();
          const defaultMatiere = getMatiereConfig('WEB')!;
          this.newAssignment.set({
            titre: '',
            description: '',
            dateDeCreation: '',
            dateDeRendu: '',
            createdBy: user?.nom ?? '',
            assignedTo: '',
            auteurNom: '',
            auteurPhotoUrl: 'assets/avatars/student.svg',
            matiereKey: defaultMatiere.key,
            matiereLabel: defaultMatiere.label,
            matiereImageUrl: defaultMatiere.matiereImageUrl,
            profNom: defaultMatiere.profNom,
            profPhotoUrl: defaultMatiere.profPhotoUrl,
            note: null,
            rendu: false,
            remarques: ''
          });
        }
      },
      error: (err) => {
        console.error('Erreur lors de la création de l\'assignment:', err);
        const message = err?.error?.message || err?.message || 'Erreur lors de la création de l\'assignment';
        console.error('Détails backend:', err?.error);
        this.snackBar.open(message, 'OK', {
          duration: 3000,
          verticalPosition: 'top'
        });
      }
    });
  }

  editAssignment(assignment: Assignment): void {
    if (!assignment._id) {
      this.snackBar.open('Erreur : ID de l\'assignment manquant', 'OK', { duration: 3000, verticalPosition: 'top' });
      return;
    }
    console.log('Modification de l\'assignment:', assignment);
    const dialogRef = this.dialog.open(EditAssignmentDialog, {
      width: '600px',
      data: { assignment, users: this.users() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Données mises à jour à envoyer:', result);
        this.http.put(`${API_BASE_URL}/assignments/${assignment._id}`, result).subscribe({
          next: (response: any) => {
            console.log('Réponse du serveur après modification:', response);
            this.snackBar.open('Assignment mis à jour avec succès', 'OK', { duration: 3000, verticalPosition: 'top' });
            this.assignments.update(list =>
              list.map(a => (a._id === assignment._id ? response : a))
            );
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour:', err);
            this.snackBar.open(err.error.message || 'Erreur lors de la mise à jour de l\'assignment', 'OK', {
              duration: 3000,
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }

  deleteAssignment(assignment: Assignment): void {
    if (!assignment._id || this.isDeleting()) {
      this.snackBar.open('Erreur : ID de l\'assignment manquant ou suppression en cours', 'OK', { duration: 3000, verticalPosition: 'top' });
      return;
    }
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '400px',
      data: { titre: assignment.titre }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isDeleting.set(true);
        this.http.delete(`${API_BASE_URL}/assignments/${assignment._id}`).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open(response.message || 'Assignment supprimé avec succès', 'OK', { duration: 3000, verticalPosition: 'top' });
              this.assignments.update(list => list.filter(a => a._id !== assignment._id));
            } else {
              this.snackBar.open(response.message || 'Erreur lors de la suppression', 'OK', { duration: 3000, verticalPosition: 'top' });
            }
          },
          error: (err) => {
            console.error('Erreur lors de la suppression:', err);
            this.snackBar.open(err.error.message || 'Erreur lors de la suppression de l\'assignment', 'OK', {
              duration: 3000,
              verticalPosition: 'top'
            });
          },
          complete: () => {
            this.isDeleting.set(false);
          }
        });
      }
    });
  }
}
