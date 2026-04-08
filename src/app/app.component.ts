import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend-app';

  isDarkMode: boolean = false;

  ngOnInit(): void {
    this.applyInitialTheme();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme(this.isDarkMode ? 'dark' : 'light');
  }

  private applyInitialTheme(): void {
    const saved = this.safeGetLocalStorage('theme');
    if (saved === 'dark' || saved === 'light') {
      this.isDarkMode = saved === 'dark';
      this.applyTheme(saved);
      return;
    }

    const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    this.isDarkMode = Boolean(prefersDark);
    this.applyTheme(this.isDarkMode ? 'dark' : 'light');
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    this.safeSetLocalStorage('theme', theme);
  }

  private safeGetLocalStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeSetLocalStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
}
