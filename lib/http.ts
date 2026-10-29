import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "./server";
export function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});}
export function failure(error:unknown){
 if(error instanceof z.ZodError)return reply({error:"Please check your input. Text must be 30–6,000 characters and all fields must be valid."},400);
 if(error instanceof AppError)return reply({error:error.message},error.status);
 return reply({error:"The request could not be completed. Please retry."},503);
}
export async function body(request:NextRequest){
 let originHost="";try{originHost=new URL(request.headers.get("origin")||"").host;}catch{}
 if(!originHost||originHost!==request.headers.get("host"))throw new AppError("Please submit from this website.",403);
 if(!request.headers.get("content-type")?.includes("application/json"))throw new AppError("Expected JSON.",415);
 if(Number(request.headers.get("content-length")||0)>24000)throw new AppError("This request is too large.",413);
 const text=await request.text();if(Buffer.byteLength(text)>24000)throw new AppError("This request is too large.",413);
 try{return JSON.parse(text);}catch{throw new AppError("Invalid JSON.",400);}
}
