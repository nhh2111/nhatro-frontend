import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../../services/invoice.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  invoices: any[] = [];
  selectedMonth: string = new Date().toISOString().substring(0, 7); 
  isLoading: boolean = false;
  isExporting: boolean = false; // Biến trạng thái khi đang xuất PDF

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;

  showDetailModal: boolean = false;
  selectedInvoice: any = null;

  ngOnInit(): void {
    this.loadInvoices();
  }

  onMonthChange(): void {
    this.currentPage = 1;
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getAllInvoices(this.currentPage, this.pageSize, this.selectedMonth).subscribe({
      next: (res) => { 
        if (res.errorCode === 200) {
          this.invoices = res.result.records; 
          this.totalRecords = res.result.recordCount;
          this.totalPages = res.result.pageCount;
          this.currentPage = res.result.currentPage;
        }
        this.isLoading = false; 
      },
      error: () => this.isLoading = false
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadInvoices();
    }
  }

  viewDetail(invoice: any): void {
    this.selectedInvoice = invoice;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedInvoice = null;
  }

  triggerGenerate(): void {
    if (confirm(`Bạn có chắc chắn muốn chốt sổ hóa đơn cho tháng ${this.selectedMonth}?`)) {
      this.isLoading = true;
      this.invoiceService.generateInvoices(this.selectedMonth).subscribe({
        next: (res) => {
          alert(res.message || 'Chốt sổ thành công!');
          this.loadInvoices();
        },
        error: (err) => {
          alert(err.error?.error || 'Lỗi khi chốt sổ');
          this.isLoading = false;
        }
      });
    }
  }

  handlePay(invoice: any): void {
    const amountStr = prompt(`Nhập số tiền thu của phòng ${invoice.Contract?.Room?.room_number}:`,
      (invoice.total_amount - invoice.paid_amount).toString());

    if (amountStr && !isNaN(Number(amountStr))) {
      this.invoiceService.payInvoice(invoice.id, Number(amountStr)).subscribe({
        next: (res) => {
          alert(res.message || 'Thu tiền thành công!');
          this.loadInvoices();
        },
        error: (err) => alert(err.error?.error || 'Lỗi thu tiền')
      });
    }
  }

  deleteInvoice(invoice: any): void {
    if (confirm(`Bạn có chắc chắn muốn xóa hóa đơn của Phòng ${invoice.Contract?.Room?.room_number} không? Thao tác này không thể hoàn tác.`)) {
      this.isLoading = true;
      this.invoiceService.deleteInvoice(invoice.id).subscribe({
        next: (res) => {
          alert(res.message || 'Đã xóa hóa đơn thành công!');
          this.loadInvoices(); 
        },
        error: (err) => {
          alert(err.error?.error || 'Lỗi khi xóa hóa đơn');
          this.isLoading = false;
        }
      });
    }
  }

  getQrCodeUrl(): string {
    if (!this.selectedInvoice) return '';
    const amountToPay = this.selectedInvoice.total_amount - this.selectedInvoice.paid_amount;
    
    if (amountToPay <= 0) return '';

    const content = `HD${this.selectedInvoice.id}`;
    
    return `https://img.vietqr.io/image/SHB-1111200488-compact2.png?amount=${amountToPay}&addInfo=${content}&accountName=QUAN LY NHA TRO`;
  }

  exportPDF(): void {
    const element = document.getElementById('invoice-print-area');
    if (element) {
      this.isExporting = true;
      html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; 
        const imgHeight = canvas.height * imgWidth / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        const fileName = `Hoa_Don_P${this.selectedInvoice?.Contract?.Room?.room_number}_${this.selectedInvoice?.month_year}.pdf`;
        pdf.save(fileName);
        
        this.isExporting = false;
      }).catch(err => {
        alert("Lỗi khi tạo PDF!");
        this.isExporting = false;
      });
    }
  }
}