import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private profileUrl = `${environment.apiUrl}/general/profile`;

  private avatarSource = new BehaviorSubject<string | null>(null);
  currentAvatar$ = this.avatarSource.asObservable();

  updateAvatarInLayout(newUrl: string) {
    this.avatarSource.next(newUrl);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.profileUrl}/me`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.profileUrl}/me`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.put<any>(`${this.profileUrl}/password`, data);
  }

  uploadAvatar(file: File, oldUrl: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'avatars'); 
    formData.append('old_url', oldUrl); 

    return this.http.post<any>(`${environment.apiUrl}/general/upload`, formData);
  }
}