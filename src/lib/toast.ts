import toast, { Toaster } from 'react-hot-toast';

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      borderRadius: '12px',
      background: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
    style: {
      borderRadius: '12px',
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    },
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-center',
    icon: 'ℹ️',
    style: {
      borderRadius: '12px',
      background: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
    },
  });
};

export { Toaster };
