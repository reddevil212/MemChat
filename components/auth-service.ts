import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile,
  UserCredential 
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase-config"
import type { UserData, AuthFormState } from "./auth-types"

export class AuthService {
  private static googleProvider = new GoogleAuthProvider()

  private static async createUserDocument(user: UserCredential["user"], displayName?: string): Promise<void> {
    const userData: UserData = {
      uid: user.uid,
      displayName: displayName || user.displayName || "Unknown",
      email: user.email || "",
      photoURL: user.photoURL,
      status: "Hey there! I'm using MemChat",
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    }
    console.log(userData)

    await setDoc(doc(db, "users", user.uid), userData)
  }

  private static setUserSession(): void {
    document.cookie = "user_session=true; path=/; max-age=86400; secure; samesite=strict"
  }

  static async emailSignIn({ email, password }: AuthFormState): Promise<string> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    this.setUserSession()
    return userCredential.user.uid
  }

  static async emailSignUp({ email, password, name }: Required<AuthFormState>): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName: name })
    await this.createUserDocument(userCredential.user, name)
    this.setUserSession()
  }

  static async googleSignIn(): Promise<void> {
    const result = await signInWithPopup(auth, this.googleProvider)
    const userDocRef = doc(db, "users", result.user.uid)
    const userSnapshot = await getDoc(userDocRef)

    if (!userSnapshot.exists()) {
      await this.createUserDocument(result.user)
    }
    
    this.setUserSession()
  }
}