(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const safeNumber = (raw) => /^-?\d{1,6}$/.test(String(raw).trim()) ? Number(raw) : null;
  const escapeText = (v) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setMessage = (id, text) => { const el=$(id); if (el) el.textContent=text; };
  const chips = (id, entries) => { const el=$(id); if(el) el.innerHTML=entries.map((s,i)=>`<span class="step-chip">${i+1}. ${escapeText(s)}</span>`).join(''); };

  // Compact navigation: the same topic buttons work on desktop and mobile.
  const views=[...document.querySelectorAll('.view')], nav=[...document.querySelectorAll('.nav-item')];
  function showView(name){ views.forEach(v=>v.classList.toggle('active',v.id===`view-${name}`)); nav.forEach(b=>b.classList.toggle('active',b.dataset.view===name)); $('sideNav').classList.remove('open'); $('menuToggle').setAttribute('aria-expanded','false'); window.scrollTo({top:0,behavior:'smooth'}); }
  nav.forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
  $('menuToggle').addEventListener('click',()=>{const open=$('sideNav').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open));});

  class Node { constructor(){this.keys=[];this.children=[];} }
  const cloneNode=n=>!n?null:{keys:[...n.keys],children:n.children.map(cloneNode)};
  const frame=(root,label)=>({root:cloneNode(root),label});
  class BTree {
    constructor(maxKeys=3){this.maxKeys=maxKeys;this.root=new Node();this.size=0;}
    insert(key){
      if(this.contains(key))return {ok:false,steps:[`Key ${key} already exists; duplicate ignored.`],timeline:[frame(this.root,'Tree unchanged')]};
      const steps=[],timeline=[frame(this.root,`Before inserting ${key}`)];
      const result=this._insert(this.root,key,steps,timeline);
      if(result){const old=this.root,n=new Node();n.keys=[result.key];n.children=[old,result.right];this.root=n;steps.push(`Root overflow: promote ${result.key} and create a new root.`);timeline.push(frame(this.root,steps.at(-1)));}
      this.size++;return {ok:true,steps,timeline};
    }
    _insert(node,key,steps,timeline){
      if(node.children.length===0){let i=0;while(i<node.keys.length&&node.keys[i]<key)i++;node.keys.splice(i,0,key);steps.push(`Place ${key} in its sorted leaf position.`);timeline.push(frame(this.root,steps.at(-1)));}
      else {let i=0;while(i<node.keys.length&&key>node.keys[i])i++;steps.push(`At [${node.keys.join(' | ')}], follow child ${i+1}.`);const split=this._insert(node.children[i],key,steps,timeline);if(split){node.keys.splice(i,0,split.key);node.children.splice(i+1,0,split.right);steps.push(`Promote ${split.key} into its parent.`);timeline.push(frame(this.root,steps.at(-1)));}}
      if(node.keys.length>this.maxKeys){const mid=Math.floor(node.keys.length/2),promoted=node.keys[mid],right=new Node();right.keys=node.keys.splice(mid+1);node.keys.pop();if(node.children.length)right.children=node.children.splice(mid+1);steps.push(`Node overflow: split it and move ${promoted} upward.`);return {key:promoted,right};}
      return null;
    }
    delete(key){
      const before=cloneNode(this.root),steps=[];
      if(!this.contains(key))return {ok:false,steps:[`Key ${key} was not found; tree unchanged.`],timeline:[frame(before,'Tree unchanged')]};
      const minDegree=Math.ceil((this.maxKeys+1)/2);
      this._delete(this.root,key,minDegree,steps);
      if(this.root.keys.length===0&&this.root.children.length)this.root=this.root.children[0];
      this.size--;steps.push(`Deletion complete; restore the root and occupancy rules.`);
      return {ok:true,steps,timeline:[frame(before,`Before deleting ${key}`),frame(this.root,steps.at(-1))]};
    }
    _delete(node,key,t,steps){
      let i=0;while(i<node.keys.length&&node.keys[i]<key)i++;
      if(i<node.keys.length&&node.keys[i]===key){
        if(node.children.length===0){node.keys.splice(i,1);steps.push(`Remove ${key} from its leaf.`);return;}
        if(node.children[i].keys.length>=t){let p=node.children[i];while(p.children.length)p=p.children.at(-1);const pred=p.keys.at(-1);node.keys[i]=pred;steps.push(`Replace internal key ${key} with predecessor ${pred}.`);this._delete(node.children[i],pred,t,steps);return;}
        if(node.children[i+1].keys.length>=t){let s=node.children[i+1];while(s.children.length)s=s.children[0];const succ=s.keys[0];node.keys[i]=succ;steps.push(`Replace internal key ${key} with successor ${succ}.`);this._delete(node.children[i+1],succ,t,steps);return;}
        steps.push(`Merge both children with separator ${key}.`);this._merge(node,i);this._delete(node.children[i],key,t,steps);return;
      }
      if(node.children.length===0){steps.push(`Key ${key} was not found in the leaf.`);return;}
      if(node.children[i].keys.length<t){
        if(i>0&&node.children[i-1].keys.length>=t){
          const child=node.children[i],sibling=node.children[i-1];
          child.keys.unshift(node.keys[i-1]);node.keys[i-1]=sibling.keys.pop();
          if(sibling.children.length)child.children.unshift(sibling.children.pop());
          steps.push(`Borrow a key from the left sibling before descending.`);
        }else if(i<node.keys.length&&node.children[i+1].keys.length>=t){
          const child=node.children[i],sibling=node.children[i+1];
          child.keys.push(node.keys[i]);node.keys[i]=sibling.keys.shift();
          if(sibling.children.length)child.children.push(sibling.children.shift());
          steps.push(`Borrow a key from the right sibling before descending.`);
        }else if(i<node.keys.length){
          steps.push(`Merge the target child with its right sibling.`);this._merge(node,i);
        }else{
          steps.push(`Merge the target child with its left sibling.`);this._merge(node,i-1);i--;
        }
      }
      this._delete(node.children[i],key,t,steps);
    }
    _merge(parent,i){const left=parent.children[i],right=parent.children[i+1];left.keys.push(parent.keys[i],...right.keys);left.children.push(...right.children);parent.keys.splice(i,1);parent.children.splice(i+1,1);}
    contains(key){let n=this.root;while(n){let i=0;while(i<n.keys.length&&key>n.keys[i])i++;if(n.keys[i]===key)return true;n=n.children[i];}return false;}
    all(){const out=[];const walk=n=>{if(!n)return;for(let i=0;i<n.keys.length;i++){if(n.children[i])walk(n.children[i]);out.push(n.keys[i]);}if(n.children[n.keys.length])walk(n.children[n.keys.length]);};walk(this.root);return out;}
  }

  function drawTree(hostId,root,{leafOnly=false,highlight=null}={}){
    const host=$(hostId);if(!host)return;
    if(!root||!root.keys?.length){host.innerHTML='<div class="muted">The tree is empty. Insert a key to start.</div>';return;}
    const nodes=[];let cursor=0,maxDepth=0,maxKeys=1;
    const countKeys=n=>{if(!n)return;maxKeys=Math.max(maxKeys,n.keys.length);n.children?.forEach(countKeys);};countKeys(root);
    const pitch=Math.max(170,maxKeys*42+38);
    function place(n,depth){if(!n)return 0;maxDepth=Math.max(maxDepth,depth);let x;if(!n.children||!n.children.length){x=cursor*pitch+pitch/2;cursor++;}else{const xs=n.children.map(c=>place(c,depth+1));x=(xs[0]+xs[xs.length-1])/2;}nodes.push({n,depth,x});return x;}
    place(root,0);const width=Math.max(440,cursor*pitch),height=(maxDepth+1)*88+22;
    const lines=[];for(const item of nodes){const n=item.n;if(n.children)for(const c of n.children){const ch=nodes.find(e=>e.n===c);if(ch)lines.push(`<line x1="${item.x}" y1="${item.depth*88+44}" x2="${ch.x}" y2="${ch.depth*88+10}" stroke="#8ea8c2" stroke-width="2"/>`);}}
    const boxes=nodes.map(({n,depth,x})=>{const y=depth*88+10,w=Math.max(48,n.keys.length*42+12),left=x-w/2;const texts=n.keys.map((k,i)=>`<text x="${left+12+i*42+15}" y="${y+23}" text-anchor="middle" font-size="12" font-family="DM Mono,monospace" fill="${k===highlight?'#c34646':'#204e89'}" font-weight="600">${escapeText(k)}</text>`).join('');return `<g><rect x="${left}" y="${y}" width="${w}" height="32" rx="6" fill="${n.children.length?'#eaf1ff':'#f4f8fc'}" stroke="${n.keys.includes(highlight)?'#e27963':'#9db6d3'}"/>${n.keys.slice(1).map((_,i)=>`<line x1="${left+42*(i+1)+6}" y1="${y}" x2="${left+42*(i+1)+6}" y2="${y+32}" stroke="#9db6d3"/>`).join('')}${texts}</g>`;}).join('');
    host.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Balanced search tree with ${nodes.length} visible nodes">${lines.join('')}${boxes}</svg>`;
  }

  let btree=new BTree(3),bHighlight=null,bTimeline=null,bFrame=0,bTimer=null;
  function stopBTimer(){if(bTimer){clearInterval(bTimer);bTimer=null;}const b=$('btreePlay');if(b)b.textContent='Play';}
  function drawB(){const root=bTimeline?bTimeline[bFrame].root:btree.root;drawTree('btreeCanvas',root,{highlight:bHighlight});}
  function drawBFrame(i){if(!bTimeline?.length)return;stopBTimer();bFrame=Math.max(0,Math.min(i,bTimeline.length-1));drawB();const f=bTimeline[bFrame];setMessage('btreeFrame',`Step ${bFrame+1} of ${bTimeline.length}: ${f.label}`);$('btreePrev').disabled=bFrame===0;$('btreeNext').disabled=bFrame===bTimeline.length-1;$('btreeSkip').disabled=bFrame===bTimeline.length-1;$('btreePlay').disabled=bFrame===bTimeline.length-1;}
  function startBTimeline(timeline,steps){stopBTimer();bTimeline=timeline;bFrame=0;chips('btreeSteps',steps);$('btreeFrame').textContent=`Step 1 of ${timeline.length}: ${timeline[0].label}`;drawB();$('btreePrev').disabled=true;$('btreeNext').disabled=timeline.length<2;$('btreeSkip').disabled=timeline.length<2;$('btreePlay').disabled=timeline.length<2;$('btreePlay').textContent='Play';}
  function bAction(kind){
    const x=safeNumber($('btreeInput').value);
    if(kind==='print'){stopBTimer();bTimeline=null;const keys=btree.all();drawB();chips('btreeSteps',[keys.length?`In-order keys: ${keys.join(', ')}.`:'The tree is empty.']);setMessage('btreeMessage',keys.length?`Sorted keys: ${keys.join(' → ')}`:'The tree is empty.');return;}
    if(x===null){setMessage('btreeMessage','Enter a whole-number key between −999999 and 999999.');return;}
    stopBTimer();bHighlight=null;
    if(kind==='insert'){
      const r=btree.insert(x);startBTimeline(r.timeline,r.steps);
      setMessage('btreeMessage',r.ok?`Inserted ${x}. Use Step Forward or Play to watch the leaf placement and any node splits.`:r.steps.join(' '));
    }else if(kind==='delete'){
      const r=btree.delete(x);startBTimeline(r.timeline,r.steps);
      setMessage('btreeMessage',r.ok?`Deleted ${x}. Step through the occupancy repair.`:r.steps.join(' '));
    }else{
      bTimeline=null;const found=btree.contains(x);bHighlight=found?x:null;drawB();
      chips('btreeSteps',[`Compare ${x} at each visited node.`,found?`Found ${x}.`:`${x} is not in the tree.`]);
      setMessage('btreeMessage',found?`Found ${x} by following one root-to-leaf search path.`:`${x} was not found. Search ended at the matching leaf interval.`);
    }
  }
  $('btreeInsert').onclick=()=>bAction('insert');$('btreeFind').onclick=()=>bAction('find');$('btreeDelete').onclick=()=>bAction('delete');$('btreePrint').onclick=()=>bAction('print');
  $('btreeInput').addEventListener('keydown',e=>{if(e.key==='Enter')bAction('insert');});
  $('btreePrev').onclick=()=>drawBFrame(bFrame-1);$('btreeNext').onclick=()=>drawBFrame(bFrame+1);$('btreeSkip').onclick=()=>drawBFrame(bTimeline.length-1);
  $('btreePlay').onclick=()=>{if(!bTimeline||bFrame>=bTimeline.length-1)return;if(bTimer){stopBTimer();return;}$('btreePlay').textContent='Pause';bTimer=setInterval(()=>{if(bFrame>=bTimeline.length-1){stopBTimer();return;}bFrame++;drawB();$('btreeFrame').textContent=`Step ${bFrame+1} of ${bTimeline.length}: ${bTimeline[bFrame].label}`;$('btreePrev').disabled=false;if(bFrame===bTimeline.length-1){$('btreeNext').disabled=true;$('btreeSkip').disabled=true;stopBTimer();}},Number($('btreeSpeed').value));};
  $('btreeReset').onclick=()=>{stopBTimer();bTimeline=null;btree=new BTree(Number($('btreeDegree').value)*2-1);bHighlight=null;drawB();chips('btreeSteps',[]);setMessage('btreeMessage','Tree cleared. Insert a key to begin.');$('btreeFrame').textContent='Ready for the next operation.';$('btreePrev').disabled=true;$('btreeNext').disabled=true;$('btreeSkip').disabled=true;$('btreePlay').disabled=true;};
  $('btreeDegree').onchange=()=>{$('btreeReset').click();};drawB();

  let tt=new BTree(2);
  function drawTT(){drawTree('ttCanvas',tt.root);}
  $('ttInsert').onclick=()=>{const x=safeNumber($('ttInput').value);if(x===null){setMessage('ttMessage','Enter a whole-number key.');return;}const r=tt.insert(x);chips('ttSteps',r.steps);setMessage('ttMessage',r.steps.join(' '));drawTT();};
  $('ttInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('ttInsert').click();});$('ttReset').onclick=()=>{tt=new BTree(2);drawTT();chips('ttSteps',[]);setMessage('ttMessage','Tree reset. Insert keys to begin.');};drawTT();

  const bstarSteps=[
    {nodes:[['Parent','[20]'],['Left child','[4 | 8 | 12]'],['Right sibling','[25 | 31]']],text:'A left child is full and needs one more key. The B* policy checks its adjacent sibling before splitting.'},
    {nodes:[['Parent','[20]'],['Left child','[4 | 8 | 12]'],['Right sibling','[25 | 31]']],text:'The right sibling has room. Redistribute keys and the parent separator across the two siblings; update the separator so both child ranges remain correct.'},
    {nodes:[['Parent','[20]'],['Left child','[4 | 8 | 12 | 16]'],['Right sibling','[25 | 31]']],text:'If the sibling is also full, combine both children, their separator, and the incoming key. Split the combined sequence into three nodes and promote two separators.'},
    {nodes:[['Parent','[12 | 25]'],['Child 1','[4 | 8]'],['Child 2','[16 | 20]'],['Child 3','[31 | 35]']],text:'After the 2-to-3 split, keys remain ordered and occupancy is better balanced. The parent may itself overflow, so the process can continue upward.'}
  ];let bstarAt=0;
  function paintBstar(){const s=bstarSteps[bstarAt];$('bstarDemo').innerHTML=s.nodes.map((n,i)=>`${i?'<span class="bstar-arrow" aria-hidden="true">→</span>':''}<div class="bstar-box"><small>${escapeText(n[0])}</small><div class="bstar-node">${escapeText(n[1])}</div></div>`).join('');setMessage('bstarText',`Step ${bstarAt+1} of ${bstarSteps.length}: ${s.text}`);$('bstarBack').disabled=bstarAt===0;$('bstarNext').disabled=bstarAt===bstarSteps.length-1;}
  $('bstarBack').onclick=()=>{bstarAt=Math.max(0,bstarAt-1);paintBstar();};$('bstarNext').onclick=()=>{bstarAt=Math.min(bstarSteps.length-1,bstarAt+1);paintBstar();};$('bstarReset').onclick=()=>{bstarAt=0;paintBstar();};paintBstar();

  class BPNode{constructor(leaf=true){this.leaf=leaf;this.keys=[];this.children=[];this.next=null;}}
  class BPlus{constructor(maxLeaf=3,maxChildren=4){this.maxLeaf=maxLeaf;this.maxChildren=maxChildren;this.root=new BPNode(true);this.size=0;}
    first(n){while(!n.leaf)n=n.children[0];return n.keys[0];}
    refresh(n){n.keys=n.children.slice(1).map(c=>this.first(c));}
    insert(k){if(this.has(k))return {steps:[`Key ${k} already exists; duplicate ignored.`]};let steps=[];const split=this._ins(this.root,k,steps);if(split){const r=new BPNode(false);r.children=[this.root,split];this.refresh(r);this.root=r;steps.push('Root split: create a new internal root.');}this.size++;return {steps};}
    _ins(n,k,steps){if(n.leaf){let i=0;while(i<n.keys.length&&n.keys[i]<k)i++;n.keys.splice(i,0,k);steps.push(`Insert ${k} in its sorted leaf.`);if(n.keys.length>this.maxLeaf){const r=new BPNode(true),cut=Math.ceil(n.keys.length/2);r.keys=n.keys.splice(cut);r.next=n.next;n.next=r;steps.push(`Leaf overflow: split keys into ${n.keys.join(', ')} and ${r.keys.join(', ')}; link the leaves.`);return r;}return null;}
      let i=0;while(i<n.keys.length&&k>=n.keys[i])i++;steps.push(`At internal separators [${n.keys.join(' | ')}], descend to child ${i+1}.`);const r=this._ins(n.children[i],k,steps);if(r)n.children.splice(i+1,0,r);this.refresh(n);if(n.children.length>this.maxChildren){const right=new BPNode(false),cut=Math.ceil(n.children.length/2);right.children=n.children.splice(cut);this.refresh(n);this.refresh(right);steps.push('Internal overflow: split child pointers and recompute separator keys.');return right;}return null;}
    has(k){let n=this.root;while(!n.leaf){let i=0;while(i<n.keys.length&&k>=n.keys[i])i++;n=n.children[i];}return n.keys.includes(k);}
    leaves(){let n=this.root;while(!n.leaf)n=n.children[0];const a=[];while(n){a.push(n);n=n.next;}return a;}
    range(a,b){return this.leaves().flatMap(l=>l.keys).filter(k=>k>=a&&k<=b);}
  }
  let bp=new BPlus();
  function bpDraw(){drawTree('bpCanvas',bp.root);$('bpLeaves').innerHTML=bp.leaves().map((l,i)=>`${i?'<span class="leaf-arrow">→</span>':''}<span class="leaf">[${l.keys.map(escapeText).join(' | ')}]</span>`).join('')||'<span class="muted">No leaves yet</span>';}
  $('bpInsert').onclick=()=>{const x=safeNumber($('bpInput').value);if(x===null){setMessage('bpMessage','Enter a whole-number key.');return;}const r=bp.insert(x);chips('bpSteps',r.steps);setMessage('bpMessage',r.steps.join(' '));bpDraw();};
  $('bpInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('bpInsert').click();});$('bpRange').onclick=()=>{const a=safeNumber($('bpFrom').value),b=safeNumber($('bpTo').value);if(a===null||b===null||a>b){setMessage('bpMessage','Enter valid bounds with From ≤ To.');return;}const got=bp.range(a,b);setMessage('bpMessage',`Inclusive range [${a}, ${b}]: ${got.length?got.join(', '):'no keys found'}. The search locates the first leaf, then follows leaf links.`);chips('bpSteps',[`Descend to the first leaf at or after ${a}.`,`Scan linked leaves until keys exceed ${b}.`,`Report ${got.length} result(s).`]);};
  $('bpReset').onclick=()=>{bp=new BPlus();bpDraw();chips('bpSteps',[]);setMessage('bpMessage','Tree reset. Insert keys to begin.');};bpDraw();

  function svgTree(roots,hostId,{forest=false}={}){
    const host=$(hostId);if(!host)return;if(!roots.length){host.innerHTML='<div class="muted">Heap is empty.</div>';return;}
    let cursor=0,maxDepth=0;const nodes=[];
    function visit(n,depth,group){maxDepth=Math.max(maxDepth,depth);let x;if(!n.children.length){x=cursor*64+34;cursor++;}else{const xs=n.children.map(c=>visit(c,depth+1,group));x=(xs[0]+xs[xs.length-1])/2;}nodes.push({n,depth,x,group});return x;}
    roots.forEach((r,i)=>{if(forest&&i)cursor+=1;visit(r,0,i);});const width=Math.max(400,cursor*64+35),height=Math.min(420,(maxDepth+1)*68+28),lines=[];for(const p of nodes)for(const c of p.n.children){const ch=nodes.find(x=>x.n===c);if(ch)lines.push(`<line x1="${p.x}" y1="${p.depth*68+45}" x2="${ch.x}" y2="${ch.depth*68+16}" stroke="#afc1d3" stroke-width="1.5"/>`);}
    const circles=nodes.map(({n,depth,x,group})=>`<g><circle cx="${x}" cy="${depth*68+29}" r="17" fill="${depth===0?'#eaf1ff':'#fff'}" stroke="${n.key===roots.reduce((m,r)=>Math.min(m,r.key),Infinity)?'#3983e8':'#9db6d3'}" stroke-width="1.5"/><text x="${x}" y="${depth*68+33}" text-anchor="middle" font-size="10" font-family="DM Mono,monospace" fill="#204e89">${escapeText(n.key)}</text>${forest&&depth===0?`<text x="${x}" y="${depth*68+7}" text-anchor="middle" font-size="9" font-family="DM Mono,monospace" fill="#71849a">${escapeText(n.label||'root')}</text>`:''}</g>`).join('');host.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Heap tree visualization">${lines.join('')}${circles}</svg>`;
  }

  let binary=[];
  function binaryDraw(){const make=i=>i>=binary.length?null:{key:binary[i],children:[make(i*2+1),make(i*2+2)].filter(Boolean)};svgTree(binary.length?[make(0)]:[],'heapCanvas');$('heapArray').innerHTML=binary.map((x,i)=>`<span class="array-cell ${i===0?'root':''}">${i}: ${x}</span>`).join('')||'<span class="muted">Array is empty</span>';}
  function heapAdd(x){if(binary.includes(x)){/* equal priorities are valid; keep them */}binary.push(x);let i=binary.length-1,steps=[`Append ${x} at array index ${i}.`];while(i>0){const p=Math.floor((i-1)/2);if(binary[p]<=binary[i])break;[binary[p],binary[i]]=[binary[i],binary[p]];steps.push(`Swap ${binary[p]} with parent ${binary[i]} to restore heap order.`);i=p;}chips('heapSteps',steps);setMessage('heapMessage',steps.join(' '));binaryDraw();}
  $('heapInsert').onclick=()=>{const x=safeNumber($('heapInput').value);if(x===null){setMessage('heapMessage','Enter a whole-number priority.');return;}heapAdd(x);};$('heapInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('heapInsert').click();});$('heapExtract').onclick=()=>{if(!binary.length){setMessage('heapMessage','The heap is empty.');return;}const min=binary[0],steps=[`Remove root minimum ${min}.`],last=binary.pop();if(binary.length){binary[0]=last;steps.push(`Move last key ${last} to root.`);let i=0;while(true){let c=2*i+1;if(c>=binary.length)break;if(c+1<binary.length&&binary[c+1]<binary[c])c++;if(binary[i]<=binary[c])break;[binary[i],binary[c]]=[binary[c],binary[i]];steps.push(`Swap ${binary[c]} with smaller child ${binary[i]}.`);i=c;}}chips('heapSteps',steps);setMessage('heapMessage',`Extracted minimum ${min}. ${steps.slice(1).join(' ')}`);binaryDraw();};$('heapReset').onclick=()=>{binary=[];binaryDraw();chips('heapSteps',[]);setMessage('heapMessage','Heap reset. Insert priorities to begin.');};$('heapDemo').onclick=()=>{binary=[];[18,9,12,4,7,15].forEach(heapAdd);setMessage('heapMessage','Example loaded. The array is a complete tree and satisfies parent ≤ child.');};binaryDraw();

  class HNode{constructor(key){this.key=key;this.degree=0;this.children=[];}}
  function linkBin(a,b){if(a.key>b.key)[a,b]=[b,a];a.children.push(b);a.degree++;return a;}
  function mergeBin(forest,extra=[]){const slots=new Map();for(const original of [...forest,...extra]){let carry=original;while(slots.has(carry.degree)){const prior=slots.get(carry.degree);slots.delete(carry.degree);carry=linkBin(prior,carry);}slots.set(carry.degree,carry);}return [...slots.values()].sort((a,b)=>a.degree-b.degree);}
  let bin=[];
  function binDraw(){svgTree(bin,'binCanvas',{forest:true});setMessage('binMessage',bin.length?`Roots by degree: ${bin.map(r=>`B${r.degree} (root ${r.key})`).join(', ')}. Total nodes: ${countNodes(bin)}.`:'Heap is empty. Insert a key.');}
  function countNodes(roots){return roots.reduce((s,n)=>s+1+countNodes(n.children),0);}
  $('binInsert').onclick=()=>{const x=safeNumber($('binInput').value);if(x===null){setMessage('binMessage','Enter a whole-number key.');return;}const before=bin.map(n=>n.degree),steps=[`Add a singleton B₀ containing ${x}.`];bin=mergeBin(bin,[new HNode(x)]);if(bin.some(r=>r.degree>0))steps.push(`Link equal-degree roots (binary carry). Before: [${before.join(', ')}]; after: [${bin.map(r=>r.degree).join(', ')}].`);chips('binSteps',steps);binDraw();};$('binInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('binInsert').click();});$('binExtract').onclick=()=>{if(!bin.length){setMessage('binMessage','The heap is empty.');return;}let idx=0;for(let i=1;i<bin.length;i++)if(bin[i].key<bin[idx].key)idx=i;const [min]=bin.splice(idx,1),steps=[`Remove the minimum root ${min.key} (B${min.degree}).`,`Reverse/merge its child trees into the remaining forest.`,`Link roots of equal degree until each degree is unique.`];bin=mergeBin(bin,min.children);chips('binSteps',steps);binDraw();};$('binReset').onclick=()=>{bin=[];binDraw();chips('binSteps',[]);};$('binDemo').onclick=()=>{bin=[];for(const x of [12,7,25,15,28,33,41,2,18,6,20,9,1])bin=mergeBin(bin,[new HNode(x)]);chips('binSteps',['13 nodes = 8 + 4 + 1 in binary.','The forest contains B₃, B₂, B₀.']);binDraw();};binDraw();

  // Fibonacci heap model: lazy roots, degree-based consolidation, and heap-order linking.
  class FNode{constructor(key){this.key=key;this.degree=0;this.children=[];this.parent=null;this.mark=false;this.label='root';}}
  function fibLink(a,b){if(a.key>b.key)[a,b]=[b,a];b.parent=a;b.mark=false;a.children.push(b);a.degree++;return a;}
  function consolidate(roots){const table=new Map(),steps=[];for(let w of roots){let x=w;while(table.has(x.degree)){const d=x.degree,y=table.get(d);table.delete(d);x=fibLink(x,y);steps.push(`Link roots ${x.key} and ${y.key}; degree ${d} becomes ${x.degree}.`);}table.set(x.degree,x);}return {roots:[...table.values()].sort((a,b)=>a.key-b.key),steps};}
  let fib=[];
  function fibDraw(){fib.forEach(n=>n.label=`degree ${n.degree}`);svgTree([...fib].sort((a,b)=>a.key-b.key),'fibCanvas',{forest:true});const m=fib.reduce((a,n)=>Math.min(a,n.key),Infinity);setMessage('fibMessage',fib.length?`Minimum: ${m}. Root count: ${fib.length}. Root degrees: [${fib.map(n=>n.degree).sort((a,b)=>a-b).join(', ')}].`:'Heap is empty. Insert a key.');}
  $('fibInsert').onclick=()=>{const x=safeNumber($('fibInput').value);if(x===null){setMessage('fibMessage','Enter a whole-number key.');return;}fib.push(new FNode(x));chips('fibSteps',[`Create singleton ${x}.`,`Add it to the root list in O(1) amortized time.`,`Update the minimum pointer if ${x} is smaller.`]);fibDraw();};$('fibInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('fibInsert').click();});$('fibExtract').onclick=()=>{if(!fib.length){setMessage('fibMessage','The heap is empty.');return;}let i=0;for(let j=1;j<fib.length;j++)if(fib[j].key<fib[i].key)i=j;const [z]=fib.splice(i,1);const promoted=z.children;promoted.forEach(n=>{n.parent=null;n.mark=false;});const c=consolidate([...fib,...promoted]);fib=c.roots;chips('fibSteps',[`Remove minimum root ${z.key}.`,`Promote its ${promoted.length} child(ren) to the root list.`,...c.steps.slice(0,5),`Recompute minimum from the ${fib.length} remaining root(s).`]);fibDraw();};$('fibReset').onclick=()=>{fib=[];fibDraw();chips('fibSteps',[]);};$('fibDemo').onclick=()=>{fib=[];for(const x of [16,5,24,8,21,11])fib.push(new FNode(x));chips('fibSteps',['Six inserts create six separate roots.','No consolidation is performed during insertion.','Extract the minimum to observe degree-based linking.']);fibDraw();};fibDraw();

  const quiz=[
    {q:'In a B+ tree, where are all data entries (or their record pointers) kept?',o:['Only in the root','In the linked leaves','In every internal node only','In a separate unsorted stack'],a:1,e:'B+ trees keep records or record pointers at the leaves; internal keys guide the search.'},
    {q:'What makes a binary heap a complete binary tree?',o:['Every node has exactly two children','All levels are full except possibly the last, filled left to right','Keys are globally sorted','Leaves always have different depths'],a:1,e:'Completeness gives the compact array representation; heap order is a separate property.'},
    {q:'What happens when two binomial-heap roots have the same degree?',o:['Discard the larger root','Link them; the larger key becomes a child of the smaller','Move both to a linked leaf page','Swap every key in the forest'],a:1,e:'Linking equal-degree binomial trees creates one tree of the next degree.'},
    {q:'Which operation is especially efficient in a Fibonacci heap (amortized)?',o:['Search arbitrary key O(1)','Decrease-key O(1)','Sorted traversal O(1)','Delete every node O(1)'],a:1,e:'Fibonacci heaps support O(1) amortized decrease-key using cuts and cascading cuts.'},
    {q:'What is the maximum number of keys in a 2–3 tree node?',o:['1','2','3','Unlimited'],a:1,e:'A 2-node contains one key; a 3-node contains two keys and has three children.'},
    {q:'Why does a B* tree redistribute with a sibling before splitting?',o:['To increase occupancy and defer a split','To make keys unsorted','To reduce the number of records','To turn it into a heap'],a:0,e:'Redistribution uses sibling capacity first; when both are full, a B* variant may split two nodes into three.'},
    {q:'After locating the lower bound in a B+ tree, how does a range scan continue?',o:['Restart at the root for each key','Follow the next-leaf links','Use heap extract-min','Hash each possible value'],a:1,e:'Linked leaves let the scan move sequentially through the ordered keys.'},
    {q:'What is the worst-case cost of searching for an arbitrary value in a binary heap?',o:['O(1)','O(log n)','O(n)','O(n log n)'],a:2,e:'Heap order only constrains each parent relative to its children, so an arbitrary key may require checking every node.'}
  ];let quizAnswers=new Map();function paintQuiz(){ $('quizList').innerHTML=quiz.map((q,i)=>`<article class="quiz-card"><h3>${i+1}. ${escapeText(q.q)}</h3><div class="quiz-options">${q.o.map((opt,j)=>`<button type="button" data-q="${i}" data-a="${j}" ${quizAnswers.has(i)?'disabled':''}>${escapeText(opt)}</button>`).join('')}</div><p class="quiz-explanation" id="quizExp${i}" hidden></p></article>`).join('');document.querySelectorAll('.quiz-options button').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.q),a=Number(b.dataset.a);if(quizAnswers.has(i))return;quizAnswers.set(i,a);document.querySelectorAll(`[data-q="${i}"]`).forEach((o,j)=>{o.disabled=true;if(j===quiz[i].a)o.classList.add('correct');if(j===a&&a!==quiz[i].a)o.classList.add('wrong');});const exp=$(`quizExp${i}`);exp.hidden=false;exp.textContent=quiz[i].e;const score=[...quizAnswers].filter(([k,v])=>quiz[k].a===v).length;$('quizScore').textContent=`Answered ${quizAnswers.size} of ${quiz.length} · Correct so far: ${score}`;});}
  paintQuiz();
})();

