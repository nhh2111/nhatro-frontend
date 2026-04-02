import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);

  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  isLoading: boolean = false;
  isChangingPassword: boolean = false;
  showPasswordModal: boolean = false;
  
  defaultAvatar: string = 'https://ui-avatars.com/api/?name=User&background=random'; 
  previewAvatar: string | null = null; 

  constructor() {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      phone: [''],
      cccd: [''],
      avatar: [''],
      email: [{ value: '', disabled: true }],
      role: [{ value: '', disabled: true }]
    });

    this.passwordForm = this.fb.group({
      old_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  openPasswordModal(): void {
    this.passwordForm.reset(); 
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  private passwordMatchValidator(g: AbstractControl) {
    const newPass = g.get('new_password')?.value;
    const confirmPass = g.get('confirm_password')?.value;
    if (newPass !== confirmPass) {
      g.get('confirm_password')?.setErrors({ mismatch: true });
    } else {
      return null;
    }
    return null;
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res.errorCode === 200) {
          this.handleLoadProfileSuccess(res.result);
        }
        this.isLoading = false;
      },
      error: (err) => {
        alert('Lỗi tải thông tin: ' + (err.error?.errorMessage || err.message));
        this.isLoading = false;
      }
    });
  }

  private handleLoadProfileSuccess(profileData: any): void {
    if (profileData.avatar && profileData.avatar.startsWith('/')) {
        const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
        profileData.avatar = baseUrl + profileData.avatar;
    }
    
    this.profileForm.patchValue(profileData);
    if (!profileData.avatar) {
      this.defaultAvatar = `https://ui-avatars.com/api/?name=${profileData.full_name}&background=random`;
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    
    if (!file) return; 

    if (file.size > 2 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có dung lượng dưới 2MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewAvatar = e.target.result;
    };
    reader.readAsDataURL(file);

    this.handleUploadAvatar(file);
  }

  // SỬA LẠI HÀM NÀY: Truyền thêm link ảnh cũ để Backend xóa rác
  private handleUploadAvatar(file: File): void {
    this.isLoading = true;
    const oldAvatarUrl = this.profileForm.get('avatar')?.value || '';

    this.profileService.uploadAvatar(file, oldAvatarUrl).subscribe({
      next: (res) => {
        alert('Tải ảnh lên thành công! Nhớ bấm Cập nhật để lưu lại nhé.');
        this.profileForm.patchValue({ avatar: res.result.url });
        this.isLoading = false;
      },
      error: (err) => {
        alert('Lỗi tải ảnh: ' + (err.error?.errorMessage || err.message));
        this.isLoading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      alert('Vui lòng nhập đầy đủ họ tên!');
      return;
    }

    this.isLoading = true;
    const payload = {
      full_name: this.profileForm.get('full_name')?.value,
      phone: this.profileForm.get('phone')?.value,
      cccd: this.profileForm.get('cccd')?.value,
      avatar: this.profileForm.get('avatar')?.value
    };

    this.profileService.updateProfile(payload).subscribe({
      next: () => {
        alert('Cập nhật thông tin cá nhân thành công!');
        this.isLoading = false;
        if (payload.avatar) {
           this.profileService.updateAvatarInLayout(payload.avatar); 
           localStorage.setItem('avatar', payload.avatar);
        }
        this.loadProfile(); 
      },
      error: (err) => {
        alert('Lỗi cập nhật: ' + (err.error?.errorMessage || err.message));
        this.isLoading = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      if (this.passwordForm.hasError('mismatch', ['confirm_password'])) {
        alert('Mật khẩu xác nhận không khớp!');
      } else {
        alert('Vui lòng điền đúng định dạng mật khẩu (Tối thiểu 6 ký tự).');
      }
      return;
    }

    this.isChangingPassword = true;
    const payload = {
      old_password: this.passwordForm.get('old_password')?.value,
      new_password: this.passwordForm.get('new_password')?.value
    };

    this.profileService.changePassword(payload).subscribe({
      next: () => {
        alert('Đổi mật khẩu thành công!');
        this.isChangingPassword = false;
        this.closePasswordModal(); 
      },
      error: (err) => {
        alert('Lỗi đổi mật khẩu: ' + (err.error?.errorMessage || err.error?.error || err.message));
        this.isChangingPassword = false;
      }
    });
  }
}