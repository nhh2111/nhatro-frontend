import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accessToken = localStorage.getItem('access_token'); // Lấy đúng tên access_token
  const http = inject(HttpClient);
  const router = inject(Router);

  let clonedReq = req;
  if (accessToken) {
    clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          return http.post<any>(`${environment.apiUrl}/auth/refresh`, { refresh_token: refreshToken }).pipe(
            switchMap((res) => {
              localStorage.setItem('access_token', res.access_token);
              localStorage.setItem('refresh_token', res.refresh_token);

              const retriedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.access_token}` }
              });
              return next(retriedReq);
            }),
            catchError((refreshErr) => {
              localStorage.clear();
              router.navigate(['/login']);
              return throwError(() => refreshErr);
            })
          );
        } else {
          localStorage.clear();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};