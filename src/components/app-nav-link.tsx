'use client';
import Link,{useLinkStatus} from 'next/link';
import type {ReactNode} from 'react';
function NavigationState(){const {pending}=useLinkStatus();return <span className={`nav-pending ${pending?'is-pending':''}`} aria-hidden="true"/>;}
export function AppNavLink({href,active=false,children,className=''}:{href:string;active?:boolean;children:ReactNode;className?:string}){
  return <Link href={href} aria-current={active?'page':undefined} className={className}>{children}<NavigationState/></Link>;
}
