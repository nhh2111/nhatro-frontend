import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private authUrl = `${environment.apiUrl}/auth`;

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.authUrl}/login`, credentials);
  }
  registerOwner(data: any): Observable<any> {
    return this.http.post(`${this.authUrl}/register`, data);
  }

  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return token !== null;
  }
  verifyOtp(data: any): Observable<any> {
    return this.http.post(`${this.authUrl}/verify-otp`, data);
  }

  getUserRole(): string {
    const token = this.getAccessToken();
    if (!token) return '';
    try {
      const payload = token.split('.')[1]; 
      const decoded = JSON.parse(atob(payload)); 
      return decoded.role || ''; 
    } catch (e) {
      console.error('Lỗi giải mã token', e);
      return '';
    }
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.authUrl}/request-password-reset`, { email });
  }

  confirmNewPassword(data: any): Observable<any> {
    return this.http.post(`${this.authUrl}/confirm-password`, data);
  }
}