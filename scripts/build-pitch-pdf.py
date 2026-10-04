from playwright.sync_api import sync_playwright
SECTIONS={"cover":"Vision","vision":"Vision","problem":"Problem statement","solution":"Solution","stack":"Tech stack","pricing":"Pricing","next":"What's next"}
JS="""(secs)=>{const s=[...document.querySelectorAll('.slide')];s.forEach((el,i)=>{
 const f=document.createElement('div');f.className='deck-foot';
 f.innerHTML=`<span class="brand"><svg class="ico" style="width:16px;height:16px;color:#7b5cc4"><use href="#i-spark"/></svg>omni<i>.</i></span><span class="conf">Confidential · October 2026</span><span class="sec">${secs[el.id]||''}</span><span class="num">${String(i+1).padStart(2,'0')} / ${String(s.length).padStart(2,'0')}</span>`;
 el.appendChild(f);});}"""
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={'width':1920,'height':1080}, device_scale_factor=2)
  pg.goto('http://localhost:3000/pitch.html'); pg.wait_for_load_state('networkidle')
  pg.evaluate("document.fonts.ready")
  pg.add_style_tag(path="scripts/deck.css"); pg.evaluate(JS, SECTIONS); pg.wait_for_timeout(600)
  pg.emulate_media(media='print')
  pg.pdf(path='public/pitch.pdf', width='1920px', height='1080px', print_background=True, prefer_css_page_size=True,
         outline=True, tagged=True)
  b.close()
