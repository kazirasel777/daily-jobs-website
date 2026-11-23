'use client';
// পুরোনো লিংক "/notices#notice-42" (আগের হোমপেজ) → নোটিশের নিজস্ব পাতা /notices/42 (সেখান থেকে সঠিক slug-এ)।
import { useEffect } from 'react';

export default function NoticeHashRedirect() {
  useEffect(() => {
    const m = /^#notice-(\d{1,10})$/.exec(window.location.hash);
    if (m) window.location.replace(`/notices/${m[1]}`);
  }, []);
  return null;
}
