import { readFileSync,mkdirSync,writeFileSync,rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
const dir='.page-check';mkdirSync(dir,{recursive:true});
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
writeFileSync(dir+'/catalog.mjs',compile(readFileSync('lib/catalog.ts','utf8')));
writeFileSync(dir+'/store.mjs',compile(readFileSync('app/store.tsx','utf8')).replace(/['"]\.\.\/lib\/catalog['"]/,"'./catalog.mjs'"));
try{const {default:Store}=await import(pathToFileURL(process.cwd()+'/'+dir+'/store.mjs'));
const pages=[['/','Style'],['/shop','Shop'],['/collections','The everyday collection'],['/collections/men','Men'],['/collections/denim','Denim'],['/new-arrivals','New arrivals'],['/sale','Sale &amp; offers'],['/product/classic-shirt','Classic Fit Shirt'],['/search','Search results'],['/wishlist','Your wishlist'],['/cart','Shopping bag'],['/checkout','Your bag is empty'],['/login','Welcome back'],['/signup','Your style journey starts here'],['/forgot-password','Forgot your password?'],['/account','My account'],['/orders','My account'],['/order-confirmation/test','My account'],['/about','Good outfits. Brighter days.'],['/contact','Let’s talk.'],['/faq','Frequently asked questions'],['/shipping-returns','Shipping &amp; returns'],['/size-guide','Find your perfect fit'],['/privacy','Privacy policy'],['/terms','Terms &amp; conditions'],['/admin','Your store, securely managed.'],['/missing','A little off the beaten path']];
for(const [path,title] of pages){const html=renderToStaticMarkup(React.createElement(Store,{initialPath:path}));assert(html.includes(title),`${path} must display ${title}`);assert(!html.includes('Starter Project'));assert(!html.includes('undefined'));if(!['/login','/signup','/forgot-password','/admin'].includes(path)){assert(html.includes('Skip to content'));assert(html.includes('aria-label="Search"'))}}
const {catalog,matchesCollection,isMensClothing,isWomensClothing,isKidsClothing,isUnisexClothing,getDefaultSize,getProductSizes}=await import(pathToFileURL(process.cwd()+'/'+dir+'/catalog.mjs'));
const men=catalog.filter(p=>matchesCollection(p,'men'));assert.equal(men.length,5);assert(men.every(isMensClothing));for(const category of ['Women','Kids','Unisex'])assert(!matchesCollection({...catalog[0],category,name:'Men inspired shirt'},'men'));assert(!matchesCollection({...catalog[0],category:'Men',type:'Accessories'},'men'));assert(!matchesCollection({...catalog[0],category:'Men',type:'Shoes'},'men'));
for(const route of ['/collections/men','/men','/product/classic-shirt']){const html=renderToStaticMarkup(React.createElement(Store,{initialPath:route}));for(const p of catalog.filter(p=>!isMensClothing(p)))assert(!html.includes('<h3>'+p.name+'</h3>'),route+' should exclude '+p.name);}
assert(catalog.filter(p=>matchesCollection(p,'women')).every(isWomensClothing));
assert.equal(catalog.filter(isWomensClothing).length,6);
for(const category of ['Men','Kids','Unisex'])assert(!matchesCollection({...catalog[1],category,name:'Women inspired dress'},'women'));
for(const type of ['Accessories','Shoes'])assert(!matchesCollection({...catalog[1],type},'women'));
for(const route of ['/collections/women','/women','/product/summer-dress','/search?q=&category=Women','/search?q=&category=women']){const html=renderToStaticMarkup(React.createElement(Store,{initialPath:route}));for(const p of catalog.filter(p=>!isWomensClothing(p)))assert(!html.includes('<h3>'+p.name+'</h3>'),route+' should exclude '+p.name);}
for(const [category,predicate,routes] of [['Kids',isKidsClothing,['/kids','/collections/kids','/collections/kids/boys','/collections/kids/girls','/product/girls-dress']],['Unisex',isUnisexClothing,['/unisex','/collections/unisex','/product/unisex-tee']]]){const clothes=catalog.filter(predicate);assert(clothes.length>0);assert(clothes.every(p=>p.category===category&&!['Shoes','Accessories'].includes(p.type)));for(const route of routes){const html=renderToStaticMarkup(React.createElement(Store,{initialPath:route}));for(const p of catalog.filter(p=>!predicate(p)))assert(!html.includes('<h3>'+p.name+'</h3>'),route+' should exclude '+p.name);}}
const kidsHtml=renderToStaticMarkup(React.createElement(Store,{initialPath:'/collections/kids'}));assert(kidsHtml.includes('id="boys"'));assert(kidsHtml.includes('id="girls"'));
for(const [division,other] of [['boys','Girls'],['girls','Boys']]){const html=renderToStaticMarkup(React.createElement(Store,{initialPath:'/collections/kids/'+division}));for(const p of catalog.filter(p=>p.category==='Kids'&&p.audience===other))assert(!html.includes('<h3>'+p.name+'</h3>'));}
assert.equal(getDefaultSize(catalog.find(p=>p.id==='girls-dress')),'4–5Y');assert(getProductSizes(catalog.find(p=>p.id==='girls-dress')).includes('10–11Y'));
console.log('PASS: Kids and Unisex clothing isolation, Boys/Girls sections and age-based sizes.');
console.log('PASS: women-only clothing and product recommendations exclude Men, Kids, Unisex, shoes, and accessories.');
console.log('PASS: strict men’s clothing filtering excludes Women, Kids, Unisex, shoes, and accessories, including men’s product recommendations.');
console.log('PASS: 27 page layouts render, expected content appears, and shared search controls have accessible names.');}finally{rmSync(dir,{recursive:true,force:true})}
