import os
here=os.path.dirname(os.path.abspath(__file__))
t=open(os.path.join(here,'template.html'),encoding='utf-8').read()
heat=open(os.path.join(here,'heat.html'),encoding='utf-8').read()
line,area=open(os.path.join(here,'plot.txt')).read().split('\n')[:2]
ind='            '
# y axis + gridlines (engagement)
ys=[('13.2%',124.39,130.25),('12.8%',150.17,156.03),('11.4%',175.95,181.81),('10.1%',201.73,207.59),('9.5%',227.52,233.38),('8.2%',253.3,259.16)]
yax='\n'.join(f'{ind}<span class="ylab" style="top:{a}px">{l}</span><i class="gridline" style="top:{g}px"></i>' for l,a,g in ys)
xs=[('March',105.5),('April',186.5),('May',267.5),('June',348.5),('July',429.5),('August',510.5),('September',591.5),('October',672.5),('November',753.5)]
xax='\n'.join(f'{ind}<span class="xlab" style="left:{c-40.5}px">{l}</span>' for l,c in xs)
bars=[(80,60),(161,92),(242,70),(323,75),(404,101),(485,145),(566,87),(647,122),(728,136)]
bh='\n'.join(f'{ind}<div class="bar{" is-peak" if x==485 else ""}" style="left:{x}px;height:{h}px;transition-delay:{i*0.06:.2f}s"><i></i><b></b></div>' for i,(x,h) in enumerate(bars))
cs=[('01','Indonesia','91%',301.21,82,81,105),('02','USA','78%',258.18,126,125,149),('03','Russia','70%',231.7,170,169,193),('04','Germany','46%',152.26,214,213,237),('05','UAE','30%',99.3,258,257,281)]
cc=[]
for i,(n,name,p,w,tn,tt,tr) in enumerate(cs):
  f=' first' if i==0 else ''
  cc.append(f'{ind}<span class="crow-num" style="top:{tn}px">{n}</span><span class="crow-name{f}" style="top:{tt}px">{name}</span><span class="crow-pct{f}" style="top:{tt}px">{p}</span>')
  cc.append(f'{ind}<div class="track" style="top:{tr}px"><i class="progress-fill" style="width:{w}px;transition-delay:{i*0.08:.2f}s"></i></div>')
spark=('<defs><linearGradient id="sp-area" x1="0" y1="0" x2="0" y2="96" gradientUnits="userSpaceOnUse"><stop stop-color="#19C9A3" stop-opacity=".28"/><stop offset="1" stop-color="#19C9A3" stop-opacity="0"/></linearGradient></defs>'
 '<path class="chart-area" d="M0 78C48.48 76 72.72 60 116.352 62C164.832 64 181.8 44 230.28 46C281.184 48 298.152 70 349.056 58C399.96 46 416.928 22 470.256 26C521.16 30 547.824 12 606 6V96H0V78Z" fill="url(#sp-area)"/>'
 '<path class="chart-line" pathLength="1" d="M0 78C48.48 76 72.72 60 116.352 62C164.832 64 181.8 44 230.28 46C281.184 48 298.152 70 349.056 58C399.96 46 416.928 22 470.256 26C521.16 30 547.824 12 606 6" fill="none" stroke-width="2" stroke-linecap="round" stroke="#19C9A3"/>'
 '<circle class="chart-pop" cx="470.256" cy="26" r="4" fill="#040808" stroke-width="2" stroke="#00FFD0"/>')
revs=[('“The free analysis showed real issues on&nbsp;our site before we paid anything. That’s why we decided to&nbsp;join”','r-clement','Clement Nicholls','Founder, online store'),
('“Reports arrive in&nbsp;Telegram on&nbsp;their own. I&nbsp;no longer chase anyone for updates or&nbsp;decode technical terms”','r-tanadi','Tanadi Xiaolian','Head of Marketing'),
('“I’m not an&nbsp;SEO expert, and I&nbsp;don’t need to&nbsp;be. Short labels tell me what grew and what needs attention”','r-stanislava','Stanislava Kochenkova','Owner, dental clinic'),
('“We liked that the service is private and invite only. Our site data stays with a&nbsp;small team we trust”','r-elah','Elah Lambosa','Co-founder, travel agency'),
('“Within a&nbsp;few months organic traffic started growing, and the dashboard shows which pages brought new clients”','r-wanda','Wanda Hayward','Owner, furniture studio')]
rv='\n'.join(f'      <article class="card hoverable review reveal d{min(i,5)}"><p class="text-md">{q}</p><div class="a"><img src="assets/{img}.png" alt=""><div><span>{n}</span><span>{r}</span></div></div></article>' for i,(q,img,n,r) in enumerate(revs))
for k,v in {'@@HEAT@@':heat,'@@YAXIS@@':yax,'@@XAXIS@@':xax,'@@BARS@@':bh,'@@AREA@@':area,'@@LINE@@':line,'@@COUNTRIES@@':'\n'.join(cc),'@@SPARK@@':spark,'@@REVIEWS@@':rv}.items():
  assert k in t,k
  t=t.replace(k,v)
assert '@@' not in t
open(os.path.join(here,'..','index.html'),'w',encoding='utf-8').write(t)
print(len(t))
