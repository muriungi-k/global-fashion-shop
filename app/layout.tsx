import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Global Fashion — Wear a Better You',icons:{icon:'/favicon.svg'},description:'Timeless pieces for every day. Discover curated fashion, thoughtful essentials, and your next favourite outfit.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
