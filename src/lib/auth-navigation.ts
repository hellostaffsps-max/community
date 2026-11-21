const fallback='/account';
const localOrigin='https://community.invalid';

/** Only application-relative destinations may be passed to the client router. */
export function safeAuthNext(value:unknown):string {
  if(typeof value!=='string'||value.length>2048||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u0020\u007f]/.test(value))return fallback;
  try {
    const url=new URL(value,localOrigin);
    if(url.origin!==localOrigin)return fallback;
    let path=url.pathname;
    // Encoded separators must never turn a relative path into a remote URL.
    for(let pass=0;pass<3;pass++){
      const decoded=decodeURIComponent(path);
      if(decoded===path)break;
      path=decoded;
    }
    if(!path.startsWith('/')||path.startsWith('//')||/[\\\u0000-\u0020\u007f]/.test(path))return fallback;
    path=new URL(path,localOrigin).pathname;
    if(/^\/(?:auth|api|_next)(?:\/|$)/i.test(path))return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  }catch{return fallback;}
}

export function authHref(mode:string,next?:unknown):string {
  const action=['login','signup','verify','resend','forgot','reset'].includes(mode)?mode:'login';
  const destination=safeAuthNext(next);
  return `/auth/${action}${destination===fallback?'':`?${new URLSearchParams({next:destination})}`}`;
}
