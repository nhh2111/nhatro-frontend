import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/general`;

  // 1. Upload nhiều ảnh (cho Phòng, Nhà)
  uploadMultipleImages(files: File[], folder: string): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('folder', folder);
    
    return this.http.post<any>(`${this.apiUrl}/upload-multiple`, formData);
  }

  // 2. Xóa 1 file rác trên máy chủ
  deleteImage(folder: string, fileUrl: string): Observable<any> {
    const payload = { folder: folder, file_url: fileUrl };
    return this.http.post<any>(`${this.apiUrl}/delete-file`, payload);
  }

  // 3. Hàm tiện ích để nối link ảnh
  formatImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('/')) {
      return environment.apiUrl.replace(/\/api\/?$/, '') + url;
    }
    return url;
  }
}