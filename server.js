import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import {fileURLToPath} from "node:url";

dotenv.config();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
app.use(express.json({limit:"5mb"}));
app.use(express.static(path.join(__dirname,"public")));

let ebayToken={value:null,expires:0};

async function ebayAccessToken(){
  if(!process.env.EBAY_CLIENT_ID||!process.env.EBAY_CLIENT_SECRET) throw new Error("eBay API non configurée");
  if(ebayToken.value && Date.now()<ebayToken.expires) return ebayToken.value;
  const auth=Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString("base64");
  const r=await fetch("https://api.sandbox.ebay.com/identity/v1/oauth2/token",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Authorization":`Basic ${auth}`},
    body:"grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope"
  });
  if(!r.ok) throw new Error(`eBay OAuth ${r.status}: ${await r.text()}`);
  const d=await r.json(); ebayToken={value:d.access_token,expires:Date.now()+(d.expires_in-60)*1000}; return ebayToken.value;
}

async function ebaySearch(q){
  const token=await ebayAccessToken();
  const url=new URL("https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("q",q); url.searchParams.set("limit","20");
  url.searchParams.set("filter","buyingOptions:{FIXED_PRICE},deliveryCountry:FR");
  const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json","X-EBAY-C-MARKETPLACE-ID":"EBAY_FR"}});
  if(!r.ok) throw new Error(`eBay ${r.status}: ${await r.text()}`);
  const d=await r.json();
  return (d.itemSummaries||[]).map(x=>({
    source:"eBay",title:x.title,price:Number(x.price?.value)||null,currency:x.price?.currency||"EUR",
    image:x.image?.imageUrl||null,url:x.itemWebUrl||null,condition:x.condition||"Non précisé"
  }));
}

async function webSearch(q){
  if(!process.env.BRAVE_SEARCH_API_KEY) return [];
  const r=await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=20&country=fr&search_lang=fr`,{
    headers:{"Accept":"application/json","X-Subscription-Token":process.env.BRAVE_SEARCH_API_KEY}
  });
  if(!r.ok) throw new Error(`Recherche web ${r.status}: ${await r.text()}`);
  const d=await r.json();
  return (d.web?.results||[]).map(x=>({
    source: sourceFromUrl(x.url),title:x.title,price:extractPrice(`${x.title} ${x.description||""}`),
    currency:"EUR",image:null,url:x.url,condition:"À vérifier"
  })).filter(x=>x.source);
}
function sourceFromUrl(u){
  if(/leboncoin\.fr/i.test(u)) return "Leboncoin";
  if(/vinted\.fr/i.test(u)) return "Vinted";
  if(/ebay\./i.test(u)) return "eBay";
  return null;
}
function extractPrice(s){const m=s.match(/(\d{1,5}(?:[ .]\d{3})?(?:[,.]\d{1,2})?)\s*€/);return m?Number(m[1].replace(/ /g,"").replace(",", ".")):null}

app.get("/api/health",(req,res)=>res.json({
  ok:true,ebay:!!(process.env.EBAY_CLIENT_ID&&process.env.EBAY_CLIENT_SECRET),
  web:!!process.env.BRAVE_SEARCH_API_KEY
}));

app.post("/api/search",async(req,res)=>{
  const q=String(req.body?.q||"").trim();
  if(!q) return res.status(400).json({error:"Recherche vide"});
  const out=[]; const errors=[];
  try{out.push(...await ebaySearch(q));}catch(e){errors.push(e.message)}
  try{out.push(...await webSearch(`site:leboncoin.fr ${q}`));}catch(e){errors.push(e.message)}
  try{out.push(...await webSearch(`site:vinted.fr ${q}`));}catch(e){errors.push(e.message)}
  const priced=out.filter(x=>Number.isFinite(x.price)&&x.price>0);
  const sorted=[...priced].sort((a,b)=>a.price-b.price);
  const median=sorted.length?sorted[Math.floor((sorted.length-1)/2)].price:null;
  res.json({query:q,items:out,median,count:out.length,errors});
});

app.listen(process.env.PORT||3000,()=>console.log(`BonAffaire: http://localhost:${process.env.PORT||3000}`));