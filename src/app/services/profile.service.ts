import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);

  getProfile() {
    return this.http.get<any>(`${environment.apiUrl}/general/profile/me`);
  }

  updateProfile(data: any) {
    return this.http.put<any>(`${environment.apiUrl}/general/profile/me`, data);
  }
}