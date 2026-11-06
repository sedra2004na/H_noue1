import React from 'react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

type ComponentClass = new (props: Props) => {
  state: State;
  props: Props;
  setState(state: Partial<State>): void;
  render(): React.ReactNode;
};

export class ErrorBoundary extends (React.Component as unknown as ComponentClass) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught Error in Clinical UI:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
              <span className="text-2xl font-bold">⚠</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-lg sm:text-xl font-black text-white">
                تنبيه حماية النظام السريري (Global Error Boundary)
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                حدث استثناء غير متوقع بالواجهة. تم تفعيل جدار الحماية لمنع توقف التطبيق والحفاظ على سلامة بيانات الجلسة الطبية.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-right font-mono text-[11px] text-rose-300/90 overflow-x-auto max-h-28">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>إعادة تحميل المنظومة وتنشيط الجلسة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
