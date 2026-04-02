import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ProfileService } from '../../../services/profile.service';
import { environment } from '../../../../environments/environment'; 

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  isSidebarOpen = false;
  fullName: string = 'Đang tải...';
  avatarUrl: string = '';
  userRole: string = '';

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.loadUserInfo();
    this.profileService.currentAvatar$.subscribe(newAvatar => {
      if (newAvatar) {
        this.avatarUrl = this.formatAvatarUrl(newAvatar);
      }
    });
  }

  loadUserInfo(): void {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res.errorCode === 200 && res.result) {
          this.fullName = res.result.full_name;
          this.avatarUrl = this.formatAvatarUrl(res.result.avatar);
        } else {
          this.fullName = 'Người dùng';
        }
      },
      error: () => {
        this.fullName = 'Người dùng';
      }
    });
  }

  private formatAvatarUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('/')) {
      const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
      return baseUrl + url;
    }
    return url; 
  }

  logout(): void {
    this.authService.clearTokens();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }
}