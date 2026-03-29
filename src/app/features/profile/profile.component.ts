import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';

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
  isLoading: boolean = false;
  defaultAvatar: string = 'https://ui-avatars.com/api/?name=User&background=random'; 

  constructor() {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      phone: [''],
      cccd: [''],
      avatar: [''],
      // Các trường chỉ đọc (readonly)
      email: [{ value: '', disabled: true }],
      role: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res.errorCode === 200) {
          this.profileForm.patchValue(res.result);
          // Cập nhật lại tên cho avatar mặc định nếu chưa có ảnh
          if (!res.result.avatar) {
             this.defaultAvatar = `https://ui-avatars.com/api/?name=${res.result.full_name}&background=random`;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        alert('Lỗi tải thông tin: ' + (err.error?.errorMessage || err.message));
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
    // Dùng getRawValue để lấy cả những trường bị disabled nếu cần, nhưng update ta chỉ cần các trường mở
    const payload = {
      full_name: this.profileForm.get('full_name')?.value,
      phone: this.profileForm.get('phone')?.value,
      cccd: this.profileForm.get('cccd')?.value,
      avatar: this.profileForm.get('avatar')?.value
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        alert('Cập nhật thông tin cá nhân thành công!');
        this.isLoading = false;
        this.loadProfile(); // Load lại để đồng bộ UI
      },
      error: (err) => {
        alert('Lỗi cập nhật: ' + (err.error?.errorMessage || err.message));
        this.isLoading = false;
      }
    });
  }
}