import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HouseService } from '../../../../services/house.service';
import { AuthService } from '../../../../services/auth.service';
import { UploadService } from '../../../../services/upload.service'; // BỔ SUNG

@Component({
  selector: 'app-house-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './house-list.component.html',
  styleUrls: ['./house-list.component.scss']
})
export class HouseListComponent implements OnInit {
  private houseService = inject(HouseService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  public uploadService = inject(UploadService); // BỔ SUNG
  
  houseList: any[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  userRole: string = '';

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  showModal: boolean = false;
  isEditMode: boolean = false;
  currentHouseId?: number;

  // BỔ SUNG: Biến chứa mảng link ảnh xem trước khi thêm/sửa
  previewImages: string[] = [];
  isUploading: boolean = false;

  houseForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    city: ['', Validators.required],
    district: ['', Validators.required],
    ward: ['', Validators.required],
    address: ['', Validators.required],
    images: [''] // BỔ SUNG
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadHouses();
      this.userRole = this.authService.getUserRole();
    }
  }

  loadHouses(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.houseService.getAllHouses(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (res) => { 
        if (res.errorCode === 200) {
          this.houseList = res.result.records; 
          this.totalRecords = res.result.recordCount;
          this.totalPages = res.result.pageCount;
          this.currentPage = res.result.currentPage;
        }
        this.isLoading = false; 
      },
      error: (err) => {
        this.errorMessage = 'Lỗi tải dữ liệu: ' + (err.error?.errorMessage || err.message);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1; 
    this.loadHouses();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadHouses();
    }
  }

  deleteHouse(id: number): void {
    if (confirm('BẠN CÓ CHẮC MUỐN XÓA NHÀ NÀY?\n\nCẢNH BÁO: Mọi phòng và dữ liệu liên quan đến nhà này sẽ bị XÓA VĨNH VIỄN!')) {
      this.houseService.deleteHouse(id).subscribe({
        next: () => { alert('Đã xóa thành công!'); this.loadHouses(); },
        error: (err) => alert('Lỗi khi xóa: ' + (err.error?.error || err.message))
      });
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentHouseId = undefined;
    this.previewImages = []; // BỔ SUNG
    this.houseForm.reset({
        name: '', city: '', district: '', ward: '', address: '', images: ''
    });
    this.showModal = true;
  }

  openEditModal(house: any): void {
    this.isEditMode = true;
    this.currentHouseId = house.id;
    this.houseForm.patchValue(house);

    // BỔ SUNG: Hiển thị ảnh cũ nếu có
    if (house.images) {
        this.previewImages = house.images.split(',');
    } else {
        this.previewImages = [];
    }

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  // ==========================================
  // KHU VỰC XỬ LÝ UPLOAD ẢNH
  // ==========================================
  onImagesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length === 0) return;

    const fileArray = Array.from(files);
    this.isUploading = true;

    // Phân loại vào thư mục 'houses'
    this.uploadService.uploadMultipleImages(fileArray, 'houses').subscribe({
      next: (res) => {
        if (res.result && res.result.urls) {
          this.previewImages = [...this.previewImages, ...res.result.urls];
          this.houseForm.patchValue({ images: this.previewImages.join(',') });
        }
        this.isUploading = false;
      },
      error: (err) => {
        alert('Lỗi tải ảnh: ' + (err.error?.errorMessage || err.message));
        this.isUploading = false;
      }
    });
  }

  removeImage(index: number, imgUrl: string): void {
    if (imgUrl.startsWith('/uploads')) {
        this.uploadService.deleteImage('houses', imgUrl).subscribe();
    }
    this.previewImages.splice(index, 1);
    this.houseForm.patchValue({ images: this.previewImages.join(',') });
  }

  // ==========================================
  // KHU VỰC QUẢN LÝ GALLERY (XEM ẢNH PHÓNG TO)
  // ==========================================
  showGalleryModal: boolean = false;
  galleryImages: string[] = [];
  currentGalleryIndex: number = 0;

  getImageCount(imageString: string): number {
    if (!imageString) return 0;
    return imageString.split(',').length;
  }

  openGallery(imageString: string): void {
    if (!imageString) return;
    this.galleryImages = imageString.split(',').map(img => this.uploadService.formatImageUrl(img));
    this.currentGalleryIndex = 0;
    this.showGalleryModal = true;
  }

  closeGallery(): void {
    this.showGalleryModal = false;
    this.galleryImages = [];
  }

  nextImage(): void {
    if (this.currentGalleryIndex < this.galleryImages.length - 1) {
      this.currentGalleryIndex++;
    } else {
      this.currentGalleryIndex = 0;
    }
  }

  prevImage(): void {
    if (this.currentGalleryIndex > 0) {
      this.currentGalleryIndex--;
    } else {
      this.currentGalleryIndex = this.galleryImages.length - 1;
    }
  }

  // ==========================================
  // KHU VỰC LƯU DỮ LIỆU
  // ==========================================
  saveHouse(): void {
    if (this.houseForm.invalid) {
      alert('Vui lòng điền đủ thông tin!');
      return;
    }

    this.isSaving = true; 
    const houseData = this.houseForm.value;

    if (this.isEditMode && this.currentHouseId) {
      this.handleUpdateHouse(houseData);
    } else {
      this.handleCreateHouse(houseData);
    }
  }

  private handleUpdateHouse(houseData: any): void {
    this.houseService.updateHouse(this.currentHouseId!, houseData).subscribe({
      next: () => { 
        this.isSaving = false;
        alert('Cập nhật thành công!'); 
        this.closeModal(); 
        this.loadHouses(); 
      },
      error: (err) => {
        this.isSaving = false;
        alert('Lỗi cập nhật: ' + err.error?.error);
      }
    });
  }

  private handleCreateHouse(houseData: any): void {
    this.houseService.createHouse(houseData).subscribe({
      next: () => { 
        this.isSaving = false;
        alert('Thêm nhà thành công!'); 
        this.closeModal(); 
        this.loadHouses(); 
      },
      error: (err) => {
        this.isSaving = false;
        alert('Lỗi thêm mới: ' + err.error?.error);
      }
    });
  }
}