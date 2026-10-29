import { NextRequest } from "next/server";
import { z } from "zod";
import { actor,authFetch,clearSession,setSession } from "../../../lib/auth";
import { body,failure,reply } from "../../../lib/http";
import { AppError } from "../../../lib/server";
export const runtime="nodejs";
export async function GET(){try{const user=await actor();return reply({email:user?.email||null,signupEnabled:process.env.ENABLE_SIGNUP==="true"});}catch(e){return failure(e);}}
export async function POST(req:NextRequest){try{
 const data=z.object({action:z.enum(["login","signup"]),email:z.email().max(254),password:z.string().min(6).max(128)}).parse(await body(req));
 if(data.action==="signup"&&(process.env.ENABLE_SIGNUP!=="true"||data.password.length<8))throw new AppError("Registration is not available. Please use the guest workspace.",403);
 const response=await authFetch(data.action==="signup"?"signup":"token?grant_type=password",{method:"POST",body:JSON.stringify({email:data.email,password:data.password})});
 if(!response.ok)throw new AppError(response.status===429?"Too many account requests. Please wait before retrying.":"Could not sign in. Check your email, password, and email verification.",response.status===429?429:400);
 const session=await response.json();if(session.access_token){await setSession(session);return reply({email:session.user.email});}return reply({confirm:true});
}catch(e){return failure(e);}}
export async function DELETE(req:NextRequest){try{
 await body(req);const user=await actor();if(user){const response=await authFetch("logout?scope=local",{method:"POST",headers:{Authorization:`Bearer ${user.token}`}});if(!response.ok)throw new AppError("Could not sign out. Please retry.");}await clearSession();return reply({signedOut:true});
}catch(e){return failure(e);}}
