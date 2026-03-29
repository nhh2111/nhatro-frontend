import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive], 
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit{
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private router = inject(Router);
  fullName: string = 'Đang tải...';
  avatarUrl: string = '';
  userRole: string = '';

  ngOnInit(): void {
    this.loadUserInfo();
    this.userRole = this.authService.getUserRole();
  }

  loadUserInfo(): void {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res.errorCode === 200 && res.result) {
          this.fullName = res.result.full_name;
          this.avatarUrl = res.result.avatar;
        } else {
          this.fullName = 'Người dùng';
        }
      },
      error: () => {
        this.fullName = 'Người dùng';
      }
    });
  }

  logout(): void {
    this.authService.clearTokens();
    this.router.navigate(['/login']);
  }
}