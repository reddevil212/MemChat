import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyDuhwHO0R0QJ4CStv-fk2TgXCNDxKA5aiM",
  authDomain: "slidesavvy-6ab43.firebaseapp.com",
  databaseURL: "https://slidesavvy-6ab43-default-rtdb.firebaseio.com",
  projectId: "slidesavvy-6ab43",
  storageBucket: "slidesavvy-6ab43.appspot.com",
  messagingSenderId: "1033040450012",
  appId: "1:1033040450012:web:4d905cdf1840568b587f19",
  measurementId: "G-QQLEVL9RCW"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)