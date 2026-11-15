import type {Metadata} from 'next';
import '@fontsource/noto-sans-arabic/arabic-400.css';
import '@fontsource/noto-sans-arabic/arabic-600.css';
import '@fontsource/noto-sans-arabic/arabic-700.css';
import './globals.css';
export const metadata:Metadata={title:{default:'مجتمع القهوة | Goat Journey',template:'%s | Goat Journey'},description:'مساحة للباريستا لمشاركة وصفات القهوة والتجارب. نبدأ من فلسطين، ونكبر معًا.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>;}
