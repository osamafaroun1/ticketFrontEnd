import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) setPassword('');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{ background: 'linear-gradient(160deg, #0b1f45 0%, #12336e 50%, #0e2858 100%)' }}
    >
      {/* Top Government Bar */}
      <div className="bg-black/20 border-b border-white/10 py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-white/60 text-xs">الجمهورية العربية السورية</span>
          <span className="text-white/60 text-xs">
            {new Date().toLocaleDateString('ar-SY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Institutional Header */}
          <div className="text-center mb-8">
            {/* Emblem */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #c9a227 0%, #e8c84a 50%, #c9a227 100%)', border: '3px solid rgba(255,255,255,0.3)' }}>
              <ShieldCheck className="w-12 h-12 text-white drop-shadow-lg" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide mb-1">
              نظام إدارة التذاكر التقنية
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="h-px w-12 bg-white/30" />
              <p className="text-blue-200/80 text-sm">البوابة الرسمية للدعم الفني</p>
              <div className="h-px w-12 bg-white/30" />
            </div>
          </div>

          {/* Login Card */}
          <div
            className="rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            {/* Card Header */}
            <div className="px-8 pt-7 pb-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">تسجيل الدخول</h2>
              <p className="text-sm text-gray-500 mt-0.5">أدخل بياناتك للوصول إلى النظام</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="أدخل اسم المستخدم"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="أدخل كلمة المرور"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  'دخول إلى النظام'
                )}
              </button>
            </form>

            {/* Security Note */}
            <div className="px-8 pb-6">
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  هذا النظام مخصص للاستخدام الرسمي فقط. يُمنع الدخول غير المصرح به.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-white/30 text-xs mt-6">
            © {new Date().getFullYear()} — نظام إدارة التذاكر التقنية · جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
