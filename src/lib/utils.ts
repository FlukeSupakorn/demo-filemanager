import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return fileName.substring(lastDot + 1).toLowerCase();
}

export function getFileName(path: string): string {
  const separator = path.includes('\\') ? '\\' : '/';
  const parts = path.split(separator);
  return parts[parts.length - 1];
}

export function getParentPath(path: string): string {
  const separator = path.includes('\\') ? '\\' : '/';
  const parts = path.split(separator);
  parts.pop();
  return parts.join(separator) || separator;
}

export function normalizePath(path: string): string {
  // Normalize path separators to forward slashes
  return path.replace(/\\/g, '/');
}

export function isValidFileName(name: string): boolean {
  // Check for invalid characters in file names
  const invalidChars = /[<>:"|?*\x00-\x1F]/;
  return !invalidChars.test(name) && name.trim().length > 0;
}

export function sortFiles(files: any[], sortBy: 'name' | 'size' | 'modified' | 'type', order: 'asc' | 'desc' = 'asc'): any[] {
  const sorted = [...files].sort((a, b) => {
    // Directories always come first
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;

    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'modified':
        comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
        break;
      case 'type':
        const extA = getFileExtension(a.name);
        const extB = getFileExtension(b.name);
        comparison = extA.localeCompare(extB);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}