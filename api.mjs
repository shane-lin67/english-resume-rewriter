function json(data,status=200) {
 return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
async function readJson(request) {
 const reader=request.body?.getReader(); if(!reader) throw new Error('empty');
 const chunks=[]; let size=0;
 try { for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;
  if(size>65536)throw new Error('large');chunks.push(value);
 } } catch(e){await reader.cancel();throw e;} finally {reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handleApi(request,env,upstream=fetch) {
 if(request.method!=='POST')return json({error:{message:'Method not allowed'}},405);
 if(!env.ACCESS_TOKEN || env.ACCESS_TOKEN.length<32 || !env.DASHSCOPE_API_KEY || !env.MODEL || env.MODEL==='YOUR_MODEL_NAME') {
  return json({error:{message:'Service is not configured'}},503);
 }
 if(request.headers.get('X-Access-Token')!==env.ACCESS_TOKEN)return json({error:{message:'Unauthorized'}},401);
 const origin=request.headers.get('Origin');
 if(origin && origin!==new URL(request.url).origin)return json({error:{message:'Origin not allowed'}},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:{message:'JSON required'}},415);
 let body;try{body=await readJson(request);}catch{return json({error:{message:'Invalid or oversized JSON'}},400);}
 if(!Array.isArray(body?.messages)||body.messages.length<1||body.messages.length>4||
   body.messages.some(m=>!m||!['system','user','assistant'].includes(m.role)||typeof m.content!=='string')||
   body.messages.reduce((n,m)=>n+m.content.length,0)>40000) return json({error:{message:'Invalid messages'}},400);
 const tokens=Number(body.max_tokens);
 const maxTokens=Number.isFinite(tokens)?Math.max(1,Math.min(6000,Math.floor(tokens))):6000;
 try {
  const response=await upstream('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',{
   method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.DASHSCOPE_API_KEY},
   body:JSON.stringify({model:env.MODEL,messages:body.messages,max_tokens:maxTokens,temperature:0.3}),
   signal:AbortSignal.timeout(90000),
  });
  if(!response.ok)return json({error:{message:'Model service failed; check server configuration'}},502);
  const data=await response.json();
  if(!data?.choices?.[0]?.message?.content)return json({error:{message:'Empty model response'}},502);
  return json({choices:[{message:{role:'assistant',content:data.choices[0].message.content}}]});
 }catch{return json({error:{message:'Model service unavailable'}},502);}
}
