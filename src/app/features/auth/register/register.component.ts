import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: [] 
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage: string = '';
  isLoading: boolean = false;

  registerForm: FormGroup = this.fb.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirm_password')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      full_name: this.registerForm.value.full_name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    this.authService.registerOwner(payload).subscribe({
      next: () => {
        localStorage.setItem('register_email', payload.email);
        alert('Đăng ký thành công! Mã OTP đã được gửi về email của bạn.');
        this.router.navigate(['/verify-otp']); 
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Lỗi hệ thống khi đăng ký';
      }
    });
  }
}