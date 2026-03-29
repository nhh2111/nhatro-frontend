import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Khởi tạo Form với các điều kiện Validate
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessage: string = '';
  isLoading: boolean = false;

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        // Đăng nhập bình thường
        this.authService.saveTokens(res.access_token, res.refresh_token);
        this.router.navigate(['/admin/houses']); // Vào trang chủ
      },
      error: (err) => {
        this.isLoading = false;
        const errorMsg = err.error?.error || err.message;
        
        // NẾU LÀ TÀI KHOẢN MỚI -> CHUYỂN HƯỚNG SANG TRANG ĐỔI MẬT KHẨU
        if (errorMsg.includes('yêu cầu đổi mật khẩu') || errorMsg.includes('OTP')) {
          // Lưu tạm email vào localStorage để trang sau biết đang đổi pass cho ai
          localStorage.setItem('temp_email', this.loginForm.value.email);
          alert('Đây là lần đăng nhập đầu tiên. Hệ thống đã gửi mã OTP về email của bạn để cài đặt mật khẩu mới!');
          this.router.navigate(['/first-login-change-password']);
        } else {
          this.errorMessage = errorMsg;
        }
      }
    });
  }
}