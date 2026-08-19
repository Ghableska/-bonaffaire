const db={
"nintendo game boy color atomic purple":{name:"Nintendo Game Boy Color — Atomic Purple",value:72,score:91,markets:[
["Leboncoin","Game Boy Color violette","40 €","Pour pièces","https://www.leboncoin.fr/ck/consoles/game-boy-color-violet"],
["Leboncoin","Game Boy Color Atomic Purple","68 €","Très bon état","https://www.leboncoin.fr/ck/consoles/game-boy-color-violet"],
["Leboncoin","Atomic Purple + 2 jeux","84 €","Très bon état","https://www.leboncoin.fr/ck/consoles/game-boy-color-violet"],
["Leboncoin","Atomic Purple + accessoires + jeu","95 €","Très bon état","https://www.leboncoin.fr/ck/consoles/game-boy-color-violet"],
["eBay","Atomic Purple — bon état","65 €","Vente terminée","https://www.ebay.fr/itm/358231395355"],
["eBay","Atomic Purple + boîte + manuel","113,81 €","Occasion","https://www.ebay.fr/itm/366341232110"]
]},
"ps2 slim":{name:"Sony PlayStation 2 Slim",value:78,score:88,markets:[
["DÉMO","Exemple PS2 Slim","60 €","À remplacer par données réelles","#"],
["DÉMO","PS2 Slim + manette","80 €","À remplacer par données réelles","#"]
]},
"iphone 15 128 go":{name:"Apple iPhone 15 — 128 Go",value:430,score:94,markets:[
["DÉMO","Exemple iPhone 15","420 €","À remplacer par données réelles","#"]
]}};
function find(q){q=q.toLowerCase().trim();if(db[q])return db[q];let k=Object.keys(db).find(x=>q.includes(x)||x.includes(q));return db[k]||{name:q||"Objet recherché",value:100,score:65,markets:[]}}
function run(){let q=document.getElementById("query").value,d=find(q),buy=+document.getElementById("buy").value||0,fee=Math.max(3,Math.round(d.value*.1)),profit=Math.max(0,d.value-fee-buy),max=Math.round((d.value-fee)*.7);document.getElementById("name").textContent=d.name;document.getElementById("score").textContent=d.score;document.getElementById("value").textContent=`~${d.value} €`;document.getElementById("profit").textContent=`~${profit} €`;document.getElementById("max").textContent=`${max} €`;document.getElementById("verdict").textContent=d.score>=90?"EXCELLENTE AFFAIRE":d.score>=80?"TRÈS BONNE AFFAIRE":"AFFAIRE À ANALYSER";document.getElementById("summary").textContent=`À ${buy} €, le potentiel de marge est estimé à ${profit} € après frais.`;document.getElementById("n").textContent=`${d.markets.length} exemples`;document.getElementById("list").innerHTML=d.markets.length?d.markets.map((m,i)=>`<article class="listing"><div class="thumb">${m[0]==="eBay"?"eBay":"LBC"}<br><span>PHOTO</span></div><div class="listingmain"><div class="source"><i class="dot"></i>${m[0]}</div><h4>${m[1]}</h4><p>${m[3]}</p></div><div class="listingprice"><b>${m[2]}</b><span><a href="${m[4]}" target="_blank">Voir →</a></span></div></article>`).join(""):`<article class="listing"><div class="thumb">—</div><div class="listingmain"><h4>Aucune annonce de démonstration</h4><p>Les sources réelles seront branchées dans la V1.</p></div></article>`}
document.getElementById("go").onclick=run;document.getElementById("query").onkeydown=e=>e.key==="Enter"&&run;document.querySelectorAll(".suggest button").forEach(b=>b.onclick=()=>{query.value=b.dataset.q;run()});document.getElementById("photo").onclick=()=>alert("Le mode photo sera ajouté après le moteur de recherche.");run();