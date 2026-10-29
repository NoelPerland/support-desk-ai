import { cookies } from "next/headers";
import { COOKIE_PREFIX } from "./product";
import { AppError } from "./server";
type Session = {access_token:string;refresh_token:string;expires_in:number;user:{id:string;email:string}};
const options={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/"};
export async function authFetch(path:string,init:RequestInit={}){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new AppError("Account service is not configured. The guest workspace is still available.");
 return fetch(`${url}/auth/v1/${path}`,{...init,cache:"no-store",signal:AbortSignal.timeout(10000),headers:{apikey:key,"Content-Type":"application/json",...init.headers}});
}
export async function setSession(s:Session){const jar=await cookies();jar.set(`${COOKIE_PREFIX}_access`,s.access_token,{...options,maxAge:60*60*24*30});jar.set(`${COOKIE_PREFIX}_refresh`,s.refresh_token,{...options,maxAge:60*60*24*30});}
export async function clearSession(){const jar=await cookies();jar.set(`${COOKIE_PREFIX}_access`,"",{...options,maxAge:0});jar.set(`${COOKIE_PREFIX}_refresh`,"",{...options,maxAge:0});}
export async function actor():Promise<{id:string;email:string;token:string}|null>{
 const jar=await cookies();let token=jar.get(`${COOKIE_PREFIX}_access`)?.value;const refresh=jar.get(`${COOKIE_PREFIX}_refresh`)?.value;
 if(!token&&!refresh)return null;
 let response=token?await authFetch("user",{headers:{Authorization:`Bearer ${token}`}}):null;
 if(!response?.ok&&refresh){const renewed=await authFetch("token?grant_type=refresh_token",{method:"POST",body:JSON.stringify({refresh_token:refresh})});if(renewed.ok){const session=await renewed.json() as Session;await setSession(session);token=session.access_token;response=await authFetch("user",{headers:{Authorization:`Bearer ${token}`}});}}
 if(!response?.ok){await clearSession();throw new AppError("Your session has expired. Please sign in again.",401);}
 const user=await response.json();if(!user.id||!user.email)throw new AppError("Could not verify this account.",401);
 return {id:user.id,email:user.email,token:token!};
}
