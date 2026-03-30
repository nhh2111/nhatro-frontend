import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: [] 
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email: string = '';
  isLoading = false;
  errorMessage = '';

  resetForm: FormGroup = this.fb.group({
    otp_code: ['', [Validators.required, Validators.minLength(6)]],
    new_password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('new_password')?.value === g.get('confirm_password')?.value ? null : { mismatch: true };
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      } else {
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  onSubmit() {
    if (this.resetForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      email: this.email,
      otp_code: this.resetForm.value.otp_code,
      new_password: this.resetForm.value.new_password
    };

    this.authService.confirmNewPassword(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.errorCode === 200) {
          alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = res.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Lỗi kết nối đến máy chủ.';
      }
    });
  }
}