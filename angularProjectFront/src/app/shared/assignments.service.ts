import { Injectable } from '@angular/core';
import { Assignment } from '../assignments/assignment.model';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { bdInitialAssignments } from './data';

@Injectable({
  providedIn: 'root'
})
export class AssignmentsService {
  //backendURL = 'http://localhost:8010/api/assignments';
  backendURL = 'https://angularproject-i9e3.onrender.com/api/assignments';


assignments:Assignment[] = [];

  constructor(private http:HttpClient) { }

  getAssignmentsPagines(page:number, limit:number):Observable<any> {
    console.log("Service:getAssignments appelée !");

    // On utilise la methode get du service HttpClient
    // pour récupérer les données depuis le backend
    const URI = this.backendURL + '?page=' + page + '&limit=' + limit;
    return this.http.get<Assignment[]>(URI);
  }

  getAssignment(_id:string):Observable<Assignment|undefined> {
    console.log("Service:getAssignment appelée avec id = " + _id);
    // route = /api/assignments/:id côté serveur !
    let URI = this.backendURL + '/' + _id;

    return this.http.get<Assignment>(URI);
  }

  addAssignment(assignment:Assignment):Observable<string> {
    // On ajoute l'assignment passé en paramètres
    // en l'envoyant par POST au backend
     return this.http.post<string>(this.backendURL, assignment);
  }

  updateAssignment(assignment:Assignment):Observable<string> {
    // On met à jour l'assignment passé en paramètres
    // en l'envoyant par PUT au backend
    return this.http.put<string>(this.backendURL, assignment);
  }

  deleteAssignment(assignment:Assignment):Observable<string> {
    // On supprime l'assignment passé en paramètres
    // en l'envoyant par DELETE au backend
    return this.http.delete<string>(this.backendURL + '/' + assignment._id);
  }

  // Pour la génération de données de test
  peuplerBD() {
    bdInitialAssignments.forEach(a => {
      // on va construire un nouvel assignment
      let nouvelAssignment = new Assignment();
      nouvelAssignment.nom = a.nom;
      nouvelAssignment.dateDeRendu = new Date(a.dateDeRendu);
      nouvelAssignment.rendu = a.rendu;

      // J'appelle le service d'insertion d'un assignment
      // et je l'insère dans la base de données via le
      // backend
      this.addAssignment(nouvelAssignment)
      .subscribe(message => {
        console.log(message);
      });
    });
  }

  // VERSION AMELIOREE QUI RENVOIE UN OBSERVABLE ! Et qui permet donc
  // de savoir quand toutes les insertions sont terminées
  peuplerBDavecForkJoin():Observable<any> {
    let appelsVersAddAssignment:Observable<any>[] = [];

    bdInitialAssignments.forEach(a => {
      const nouvelAssignment = new Assignment();
      nouvelAssignment.nom = a.nom;
      nouvelAssignment.dateDeRendu = new Date(a.dateDeRendu);
      nouvelAssignment.rendu = a.rendu;

      appelsVersAddAssignment.push(this.addAssignment(nouvelAssignment))
    });

    // On renvoie un observable qui va nous permettre de savoir
    // quand toutes les insertions sont terminées
    return forkJoin(appelsVersAddAssignment);
  }

}
