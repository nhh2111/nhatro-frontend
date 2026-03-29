import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss'] // Bạn nhớ copy CSS từ login sang nhé
})
export class VerifyOtpComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  userEmail: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  otpForm: FormGroup = this.fb.group({
    otp_code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedEmail = localStorage.getItem('register_email');
      if (savedEmail) {
        this.userEmail = savedEmail;
      } else {
        alert('Không tìm thấy phiên đăng ký. Vui lòng đăng ký lại.');
        this.router.navigate(['/register']);
      }
    }
  }

  onSubmit(): void {
    if (this.otpForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      email: this.userEmail,
      otp_code: this.otpForm.value.otp_code
    };

    this.authService.verifyOtp(payload).subscribe({
      next: () => {
        alert('Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công.');
        localStorage.removeItem('register_email'); // Dọn dẹp rác
        this.router.navigate(['/login']); // Chuyển về trang đăng nhập
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Mã OTP không hợp lệ hoặc đã hết hạn!';
      }
    });
  }
}