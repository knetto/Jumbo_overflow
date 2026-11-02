import { handleApi } from './api.js';

// The build embeds public assets here to keep the Worker portable and self-contained.
const assetCache=new Map();
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/'))return handleApi(request,env);
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
    const file=ASSETS[url.pathname==='/'?'/index.html':url.pathname];
    if(!file)return new Response('Niet gevonden',{status:404});
    let bytes=assetCache.get(url.pathname);
    if(!bytes){const binary=atob(file[0]);bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));assetCache.set(url.pathname,bytes);}
    const cache=url.pathname.endsWith('.woff2')?'public,max-age=31536000,immutable':'no-store,no-cache,must-revalidate';
    return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':file[1],'X-Content-Type-Options':'nosniff','Cache-Control':cache,'CDN-Cache-Control':cache}});
  },
};
