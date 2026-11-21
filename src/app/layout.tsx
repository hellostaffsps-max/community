import type {Metadata,Viewport} from 'next';
import './brand-fonts.css';
import './globals.css';
import './brand.css';
import './interiors.css';
import './workspace.css';
import './onboarding.css';
import './starter-recipes.css';
import './community-feed.css';
import './member-profile.css';
import './people.css';
import './journey-shell.css';
import './gronda-discovery.css';
import './gronda-auth.css';
import './gronda-profile.css';
import './gronda-recipe.css';
export const metadata:Metadata={title:{default:'Goat Journey Community | قهوتك، خبرتك، ومجتمع يشبهك',template:'%s | Goat Journey'},description:'مجتمع Goat Journey لأهل القهوة. استكشف وصفات التحضير، وتعلّم من تجارب الباريستا. من فلسطين، لكل من يحب القهوة.',icons:{icon:'/brand/mark.svg'}};
export const viewport:Viewport={themeColor:'#F5DB30'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl" data-scroll-behavior="smooth"><body>{children}</body></html>;}
