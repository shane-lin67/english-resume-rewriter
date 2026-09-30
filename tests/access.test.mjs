import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi} from '../api.mjs';
const env={ACCESS_TOKEN:'x'.repeat(40),DASHSCOPE_API_KEY:'test-only-value',MODEL:'test-model'};
const request=(payload={},headers={})=>new Request('https://demo.example/api/chat',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({messages:[{role:'user',content:'fictional resume'}],...payload})});
test('unconfigured and unauthorized requests never call model',async()=>{
 let calls=0;const upstream=()=>{calls++;throw Error('unexpected');};
 assert.equal((await handleApi(request(),{},upstream)).status,503);
 assert.equal((await handleApi(request(),env,upstream)).status,401);
 assert.equal(calls,0);
});
test('cross-origin and oversized messages never call model',async()=>{
 const headers={'X-Access-Token':env.ACCESS_TOKEN};
 const upstream=()=>{throw Error('unexpected');};
 assert.equal((await handleApi(request({}, {...headers,Origin:'https://other.example'}),env,upstream)).status,403);
 assert.equal((await handleApi(request({messages:[{role:'user',content:'a'.repeat(70000)}]},headers),env,upstream)).status,400);
});
test('model and budget controlled on server; raw provider errors hidden',async()=>{
 let payload;
 const response=await handleApi(request({model:'attacker-model',max_tokens:999999},{'X-Access-Token':env.ACCESS_TOKEN}),env,async(url,init)=>{
  payload=JSON.parse(init.body);return Response.json({choices:[{message:{content:'demo'}}]});
 });
 assert.equal(response.status,200);assert.equal(payload.model,env.MODEL);assert.equal(payload.max_tokens,6000);
 const failure=await handleApi(request({}, {'X-Access-Token':env.ACCESS_TOKEN}),env,async()=>Response.json({error:{message:'secret echoed here'}},{status:400}));
 assert.equal(failure.status,502);assert.ok(!(await failure.text()).includes('secret echoed here'));
});
