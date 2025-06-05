import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import Cookies from 'js-cookie';

export const authService = {
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // Store token in cookie
      Cookies.set('token', token, { 
        path: '/',
        sameSite: 'lax',
        expires: 7 // 7 days
      });

      console.log('Token stored in cookie:', !!Cookies.get('token'));

      return userCredential;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  async register(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // Store token in cookie
      Cookies.set('token', token, { 
        path: '/',
        sameSite: 'lax',
        expires: 7 // 7 days
      });

      return userCredential;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  async logout() {
    try {
      await signOut(auth);
      // Remove token from cookie
      Cookies.remove('token', { path: '/' });
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  },

  getToken() {
    const token = Cookies.get('token');
    console.log('Getting token from cookie:', !!token);
    return token;
  },

  isAuthenticated() {
    return !!this.getToken();
  }
}; 