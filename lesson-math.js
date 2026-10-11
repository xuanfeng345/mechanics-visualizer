/* Dynamic lesson math; plain prose is never guessed to be TeX. */
(() => {
  const roots=['challengeBody','hintContent'];
  function render(){
    const mj=window.MathJax;if(!mj?.tex2svg)return;
    document.querySelectorAll('.formula-display').forEach(el=>{
      if(el.dataset.mathRendered)return;
      const tex=el.textContent.replace(/^公式：/,'');
      if(tex==='见题目解析')return;
      try{const svg=mj.tex2svg(tex,{display:true});el.replaceChildren(svg);el.dataset.mathRendered='true';el.setAttribute('aria-label','本关公式：'+tex);}catch{el.textContent='公式排版失败，请参考本题文字解析。';}
    });
    // Explicit math delimiters in hints/solutions are typeset without interpreting prose.
    for(const id of roots){const root=document.getElementById(id);if(!root)continue;
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const texts=[];
      while(walker.nextNode())if(!walker.currentNode.parentElement.closest('mjx-container,.formula-display'))texts.push(walker.currentNode);
      for(const text of texts){const pattern=/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;let match,start=0;const frag=document.createDocumentFragment();while((match=pattern.exec(text.data))){frag.append(text.data.slice(start,match.index));try{frag.append(mj.tex2svg(match[1]??match[2],{display:match[2]!==undefined}));}catch{frag.append('（公式排版失败）');}start=pattern.lastIndex;}if(start){frag.append(text.data.slice(start));text.replaceWith(frag);}}
    }
  }
  let queued=false;
  function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;render();});}
  for(const id of roots){const root=document.getElementById(id);if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});}
  window.MathJax?.startup?.promise?.then(schedule);
})();
