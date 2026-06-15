"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('hamemayu_token', token);
      document.cookie = `hamemayu_token=${token}; path=/; max-age=2592000; SameSite=Lax;`;
      window.dispatchEvent(new Event('authChange'));
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F0EA] dark:bg-[#0B1426]">
      <div className="font-mono text-golden-heritage font-bold tracking-widest animate-pulse border-2 border-slate-900 px-6 py-3 bg-white dark:bg-slate-900 brutal-shadow">
        [ MENGOTENTIKASI_SISTEM ]
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F0EA] dark:bg-[#0B1426]" />
    }>
      <CallbackLogic />
    </Suspense>
  );
}