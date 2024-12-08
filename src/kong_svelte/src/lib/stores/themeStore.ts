import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Get theme and mode from localStorage or default values
const storedTheme = browser ? localStorage.getItem('theme') : 'modern';
const storedMode = browser ? localStorage.getItem('themeMode') : 'dark';

export const themeStore = writable(storedTheme || 'modern');
export const themeModeStore = writable(storedMode || 'dark');

// Subscribe to changes and update localStorage
if (browser) {
  themeStore.subscribe((value) => {
    localStorage.setItem('theme', value);
    document.documentElement.setAttribute('data-theme', value);
  });

  themeModeStore.subscribe((value) => {
    localStorage.setItem('themeMode', value);
    if (value === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
}
