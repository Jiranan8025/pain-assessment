import { Component, type ReactNode, type ErrorInfo } from 'react';

// ============================================================
// App-level Error Boundary
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-red-600 mb-3">
                เกิดข้อผิดพลาด
              </h1>
              <p className="text-gray-600 mb-6 text-sm">
                ระบบพบข้อผิดพลาดที่ไม่คาดคิด กรุณารีเฟรชหน้าเว็บ
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light font-medium transition-all"
              >
                รีเฟรชหน้าเว็บ
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// ============================================================
// Form-level Error Boundary (less intrusive)
// ============================================================

interface FormErrorBoundaryProps {
  children: ReactNode;
}

interface FormErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class FormErrorBoundary extends Component<FormErrorBoundaryProps, FormErrorBoundaryState> {
  constructor(props: FormErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): FormErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FormErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <h3 className="font-bold text-red-700 mb-2">
            เกิดข้อผิดพลาดในฟอร์ม
          </h3>
          <p className="text-sm text-red-600 mb-4">
            {this.state.error?.message || 'ไม่ทราบสาเหตุ'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-all"
          >
            ลองอีกครั้ง
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
