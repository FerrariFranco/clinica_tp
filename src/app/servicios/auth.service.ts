import { Injectable } from '@angular/core';
import { Auth,sendEmailVerification, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged, User, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, getDocs, collection, query, where } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user$: Observable<User | null>;

  constructor(private auth: Auth, private firestore: Firestore) {
    this.user$ = new Observable<User | null>(observer => {
      onAuthStateChanged(this.auth, user => observer.next(user));
    });
  }

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  getCurrentUser(): Observable<User | null> {
    return this.user$;
  }

  register(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  getUserRole(): Observable<string | null> {
    return this.user$.pipe(
      switchMap(user => {
        if (!user) {
          return new Observable<string | null>(observer => observer.next(null));
        }

        // Consulta a la colección 'usuarios' buscando por el email
        const usersRef = collection(this.firestore, 'usuarios');
        const q = query(usersRef, where('email', '==', user.email)); // Usar el email del usuario
        return from(getDocs(q)).pipe(
          map(querySnapshot => {
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data(); // Obtener el primer documento que coincida
              return userData['rol'] as string || null; // Retornar el rol
            }
            return null; // Si no se encuentra ningún documento
          })
        );
      })
    );
  }
  sendVerificationEmail(user: User) {
    return sendEmailVerification(user);
  }
  async isEspecialistaAutorizado(email: string): Promise<boolean> {
    const especialistasRef = collection(this.firestore, 'especialistas');
    const q = query(especialistasRef, where('mail', '==', email));
    const especialistasSnapshot = await getDocs(q);
    if (!especialistasSnapshot.empty) {
      const especialistaData = especialistasSnapshot.docs[0].data();
      return especialistaData['autorizado'] === true;
    }
    return false;
  }
}
