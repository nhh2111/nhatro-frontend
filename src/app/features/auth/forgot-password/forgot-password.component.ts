import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: [] 
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const email = this.forgotForm.value.email;

    this.authService.requestPasswordReset(email).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.errorCode === 200) {
          this.router.navigate(['/reset-password'], { queryParams: { email: email } });
        } else {
          this.errorMessage = res.message || 'Có lỗi xảy ra, vui lòng thử lại.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Lỗi kết nối đến máy chủ.';
      }
    });
  }
}