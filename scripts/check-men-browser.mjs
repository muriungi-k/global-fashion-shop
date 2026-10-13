import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
const browser=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--disable-background-networking','--disable-extensions','--disable-sync','--use-mock-keychain','--password-store=basic','--no-first-run','--no-default-browser-check','--user-data-dir=/private/tmp/global-fashion-cdp','--remote-debugging-port=9222','about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{const wsUrl=await new Promise((resolve,reject)=>{let text='';const timeout=setTimeout(()=>reject(new Error('Browser startup timeout')),20000);browser.stderr.on('data',chunk=>{text+=chunk;const match=text.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timeout);resolve(match[1])}});browser.once('exit',()=>reject(new Error('Browser stopped')))});socket=new WebSocket(wsUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});let next=0;const pending=new Map();const errors=[];socket.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(new Error(msg.error.message)):p.resolve(msg.result)}}if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text+' '+JSON.stringify(msg.params.exceptionDetails.exception?.description));};
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,sessionId}))});
const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});const call=(m,p)=>send(m,p,sessionId);await call('Page.enable');await call('Runtime.enable');
for(const [name,width,height,url] of [['men-mobile',390,844,'/collections/men'],['men-desktop',1440,1000,'/collections/men']]){await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});await call('Page.navigate',{url:'http://127.0.0.1:5173'+url});await delay(3500);const result=await call('Runtime.evaluate',{expression:`JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.clientWidth,images:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.alt),overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+3&&getComputedStyle(e).position!=='absolute'&&getComputedStyle(e).position!=='fixed').slice(0,15).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))})`,returnByValue:true});console.log(name,result.result.value);const png=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync('outputs/'+name+'.png',Buffer.from(png.data,'base64'));}
const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
await call('Page.navigate',{url:'http://127.0.0.1:5173/collections/men'});await delay(1200);
let categories=await evaluate("Array.from(document.querySelectorAll('.product-card')).map(c=>c.dataset.category)");assert(categories.length>0);assert(categories.every(c=>c==='Men'));
await evaluate("Array.from(document.querySelectorAll('.men-collection')).find(b=>b.textContent.includes('Business essentials')).click()");await delay(400);
const shirts=await evaluate("Array.from(document.querySelectorAll('#men-clothing .product-card')).map(c=>({category:c.dataset.category,type:c.dataset.type}))");assert(shirts.length>0);assert(shirts.every(c=>c.category==='Men'&&c.type==='Shirts'));
await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Clear filters').click()");await delay(300);
await evaluate("document.querySelector('#men-clothing .add-small').click()");await delay(300);
assert((await evaluate('document.body.innerText')).includes('Added to your bag'));
await evaluate("document.querySelector('header a[href=\"/cart\"]').click()");await delay(300);
assert((await evaluate('document.body.innerText')).includes('Classic Fit Shirt'));
console.log('PASS: men-only products, collection filtering, clearing filters, and adding men’s clothing to the shopping bag.');
assert.equal(errors.length,0);console.log('Browser errors:',JSON.stringify(errors));
await evaluate('localStorage.removeItem(\"gf-cart\")');await send('Browser.close');}finally{socket?.close();browser.kill('SIGTERM')}
