import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useApp();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(username, password);
    if (success) {
      setPassword('');
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">تسجيل الدخول للنظام</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: osama أو dam_admin أو owner"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-bold transition-colors ${
              loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>

          <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded">
            <p className="font-semibold mb-2">حسابات للتجربة:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>موظف دمشق: <code className="bg-gray-200 px-1">osama</code></li>
              <li>موظفة دمشق: <code className="bg-gray-200 px-1">sara</code></li>
              <li>مدير دمشق: <code className="bg-gray-200 px-1">dam_admin</code></li>
              <li>مدير حلب: <code className="bg-gray-200 px-1">aleppo_admin</code></li>
              <li>السوبر أدمن: <code className="bg-gray-200 px-1">owner</code></li>
            </ul>
            <p className="mt-2">كلمة المرور الافتراضية: <code className="bg-gray-200 px-1">123456</code></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
