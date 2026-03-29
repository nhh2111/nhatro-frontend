import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-first-login-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './first-login-change-password.component.html',
  styleUrls: ['./first-login-change-password.component.scss'] 
})
export class FirstLoginChangePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  userEmail: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  passwordForm: FormGroup = this.fb.group({
    otp_code: ['', [Validators.required, Validators.minLength(6)]],
    new_password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  // Kiểm tra mật khẩu nhập lại có khớp không
  passwordMatchValidator(g: FormGroup) {
    return g.get('new_password')?.value === g.get('confirm_password')?.value
      ? null : { 'mismatch': true };
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Móc cái email từ localStorage ra
      const savedEmail = localStorage.getItem('temp_email');
      if (savedEmail) {
        this.userEmail = savedEmail;
      } else {
        // Nếu không có email (ai đó cố tình vào thẳng trang này), đuổi về Login
        alert('Không tìm thấy thông tin xác thực. Vui lòng đăng nhập lại.');
        this.router.navigate(['/auth/login']);
      }
    }
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      email: this.userEmail,
      otp_code: this.passwordForm.value.otp_code,
      new_password: this.passwordForm.value.new_password
    };

    // Gọi cái API /confirm-password mà bạn đã cấu hình trong main.go hôm trước
    this.http.post(`${environment.apiUrl}/auth/confirm-password`, payload).subscribe({
      next: () => {
        alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.');
        localStorage.removeItem('temp_email'); // Dùng xong thì xóa đi cho sạch
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Lỗi hệ thống khi xác thực OTP';
      }
    });
  }
}