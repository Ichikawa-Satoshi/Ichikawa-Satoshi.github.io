"use strict";

const styles = ["plates", "margins", "folio"];
const projects = [...document.querySelectorAll(".project")].map(article => ({
  id: article.id,
  article,
  titleLink: article.querySelector(".paper-name"),
  title: article.querySelector(".paper-name").textContent,
  author: article.querySelector(".byline")?.textContent || "",
  status: article.querySelector(".status").textContent,
  abstract: article.querySelector(".quick p")?.textContent || "",
  pdf: article.querySelector(".pdf")?.href || ""
}));

// Each anchor is an exact excerpt from the author's abstract.
const notes = {
  "service-trade": [
    {anchor: "2008–2018", label: "Research design", value: "2008–2018", text: "The paper compares Japanese prefectures and uses foreign export growth as an instrument for exposure to service imports."},
    {anchor: "0.14 percentage-point", label: "Estimated difference", value: "−0.14 pp", text: "Moving from the 25th to the 75th percentile of import exposure corresponds to a smaller annual rise in the service employment share. This is a difference in the rate of change."},
    {anchor: "concentrated in local services", label: "Where it appears", value: "Local services", text: "The smaller increase in the service employment share is concentrated in services supplied locally."},
    {anchor: "household spending", label: "Model mechanism", value: "Household demand", text: "In the calibrated model, cheaper remote imports draw household spending away from local services."}
  ],
  "org-networks": [
    {anchor: "3,450 publicly listed firms", label: "Sample", value: "3,450 firms", text: "Published organization charts cover Japanese listed firms across four survey years between 2002 and 2010."},
    {anchor: "reporting closeness", label: "Measurement", value: "Reporting distance", text: "Reporting closeness measures how near front-line units are to the rest of the firm along reporting paths."},
    {anchor: "4.9% higher", label: "Conditional association", value: "4.9% higher", text: "A one-standard-deviation difference in reporting closeness is associated with higher revenue-based productivity after accounting for firm characteristics and hierarchy."},
    {anchor: "fewer managers", label: "Model mechanism", value: "Managerial time", text: "In the model, shorter reporting paths use less managerial time per request. The firm can handle more requests with the same amount of time."}
  ]
};

const dialog = document.getElementById("reader");
const body = document.getElementById("reader-body");
const selectors = [...document.querySelectorAll('select[name="style"]')];
let activePaper = null;
let style = "plates";
let closeToStyle = null;

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function button(text, callback, className) {
  const b = element("button", className, text);
  b.type = "button";
  b.addEventListener("click", callback);
  return b;
}

function paperPdf(paper) {
  const a = element("a", "reader-pdf", "View paper (PDF)");
  a.href = paper.pdf;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

function heading(paper) {
  const header = element("header");
  header.append(element("p", "kicker", paper.status));
  const title = element("h2", "reader-title", paper.title);
  title.id = "reader-title";
  header.append(title);
  if (paper.author && paper.abstract) header.append(element("p", "reader-byline", paper.author));
  return header;
}

function paperAbstract(paper) {
  const details = element("details", "reader-abstract");
  details.append(element("summary", "", "Abstract"), element("p", "", paper.abstract));
  return details;
}

function renderNotes(paper, container) {
  const annotations = notes[paper.id];
  const paragraph = element("p", "annotated");
  const aside = element("aside", "margin-note");
  aside.setAttribute("aria-label", "Margin note");
  const noteContent = element("div");
  noteContent.setAttribute("aria-live", "polite");
  const nav = element("div", "note-index");
  const markers = [], navButtons = [];
  const pocket = element("span", "pocket-note");
  const pocketLabel = element("strong");
  const pocketText = element("span");
  const dismiss = button("Close note", () => {
    const trigger = pocket.previousElementSibling;
    pocket.remove();
    trigger?.focus();
  }, "dismiss-note");
  pocket.append(pocketLabel, pocketText, dismiss);
  const showNote = (i, byMarker = false) => {
    const item = annotations[i];
    noteContent.replaceChildren(element("p","kicker",item.label),element("p","note-value",item.value),element("p","note-copy",item.text));
    markers.forEach((marker, n) => marker.setAttribute("aria-pressed", String(i === n)));
    navButtons.forEach((b, n) => b.setAttribute("aria-pressed", String(i === n)));
    if (byMarker && matchMedia("(max-width:600px)").matches) {
      pocketLabel.textContent = item.label;
      pocketText.textContent = item.text;
      markers[i].after(pocket);
    }
  };
  let offset = 0;
  annotations.forEach((item, i) => {
    const index = paper.abstract.indexOf(item.anchor, offset);
    if (index < 0) return;
    paragraph.append(document.createTextNode(paper.abstract.slice(offset,index)));
    const marker = button(item.anchor, () => showNote(i, true), "ink-note");
    const sup = element("sup", "", String(i+1));
    sup.setAttribute("aria-hidden","true");
    marker.append(sup);
    marker.setAttribute("aria-label", item.anchor + " — " + item.label);
    markers.push(marker);
    paragraph.append(marker);
    offset = index + item.anchor.length;
    const tab = button(String(i+1), () => showNote(i));
    tab.setAttribute("aria-label", "Note " + (i+1) + ": " + item.label);
    navButtons.push(tab);
    nav.append(tab);
  });
  paragraph.append(document.createTextNode(paper.abstract.slice(offset)));
  aside.append(noteContent,nav);
  container.append(paragraph,aside);
  showNote(0);
}

function inlineReader(paper) {
  const panel = paper.article.querySelector(".inline-reader");
  panel.hidden = false;
  const bar = element("div","inline-bar");
  const title = element("h4","",paper.abstract ? "Annotated abstract" : "Project");
  title.tabIndex = -1;
  bar.append(title,button(paper.abstract ? "Close notes ×" : "Close project ×", closeReader, "back"));
  panel.replaceChildren(bar);
  if (paper.abstract) {
    const layout = element("div","margins-layout");
    panel.append(layout);
    renderNotes(paper, layout);
  } else {
    panel.append(projectRecord(paper));
  }
  title.focus({preventScroll:true});
}

function plateContainer(title, type) {
  const figure = element("figure", "plate");
  const head = element("div", "plate-top");
  head.append(element("h3", "", title), element("span", "kicker", type));
  const controls = element("div", "figure-controls");
  const caption = element("figcaption", "plate-caption");
  caption.setAttribute("aria-live","polite");
  const visual = element("div");
  figure.append(head, visual, controls, caption);
  return {figure, visual, controls, caption};
}

function segment(canvas, from, to, lit, lag) {
  const [x1,y1]=from, [x2,y2]=to;
  if (x1===x2 && y1===y2) return;
  const horizontal = y1 === y2;
  const s = element("span", "segment " + (horizontal ? "horizontal" : "vertical") + (lit ? " lit" : ""));
  s.style.left = Math.min(x1,x2) + "%";
  s.style.top = Math.min(y1,y2) + "%";
  s.style.width = horizontal ? Math.abs(x2-x1)+"%" : (lit ? "2px" : "1px");
  s.style.height = horizontal ? (lit ? "2px" : "1px") : Math.abs(y2-y1)+"%";
  s.style.setProperty("--origin", horizontal ? (x2>x1 ? "left" : "right") : (y2>y1 ? "top" : "bottom"));
  s.style.setProperty("--lag",lag+"ms");
  s.setAttribute("aria-hidden","true");
  canvas.append(s);
}

const hierarchy = [
  {name:"Head office", x:50, y:13, parent:null},
  {name:"Operations", x:25, y:47, parent:0},
  {name:"Sales", x:75, y:47, parent:0},
  {name:"Plant A", x:12.5, y:82, parent:1},
  {name:"Plant B", x:37.5, y:82, parent:1},
  {name:"Domestic", x:62.5, y:82, parent:2},
  {name:"Export", x:87.5, y:82, parent:2}
];

function reportingRoute(start, end) {
  function chain(i) {
    const result=[];
    while (i !== null) {
      result.push(i);
      i=hierarchy[i].parent;
    }
    return result;
  }
  const a=chain(start), b=chain(end);
  const common=a.find(i=>b.includes(i));
  return a.slice(0,a.indexOf(common)+1).concat(b.slice(0,b.indexOf(common)).reverse());
}

function drawConnection(layer, a, b, active, delay=0) {
  const middle=(a.y+b.y)/2;
  const points=[[a.x,a.y],[a.x,middle],[b.x,middle],[b.x,b.y]];
  for (let i=1;i<points.length;i++) segment(layer,points[i-1],points[i],active,delay+(i-1)*38);
}

function organizationPlate() {
  const {figure,visual,controls,caption}=plateContainer("Reporting paths","Illustrative hierarchy");
  let layout = "hierarchy";
  let target = 4;
  visual.className="diagram";
  const base=element("div"), trace=element("div"), steps=element("div","step-labels");
  steps.setAttribute("aria-hidden","true");
  visual.append(steps,base,trace);
  const xAtDistance = [[48],[48],[71,33],[71],[55,87]];
  const occupied = [0,0,0,0,0];
  const distanceLayout = hierarchy.map((node, i) => {
    const distance = reportingRoute(3,i).length - 1;
    return {...node, x:xAtDistance[distance][occupied[distance]++], y:9+distance*20};
  });
  for (let i=0; i<5; i++) {
    const tick=element("span","step-label",String(i));
    tick.style.top=(9+i*20)+"%";
    steps.append(tick);
  }
  const nodes=hierarchy.map((node,i)=>{
    const dest=i>=4;
    const el=dest ? button(node.name,()=>{target=i; draw();},"node endpoint") : element("span","node",node.name);
    if(dest) el.setAttribute("aria-label","Trace a request from Plant A to "+node.name);
    visual.append(el);
    return el;
  });
  const hint=element("p","note-copy","From Plant A, choose a destination.");
  const switches=element("div","layout-choices");
  const change=(mode)=>{layout=mode; draw();};
  const chart=button("Organization chart",()=>change("hierarchy"));
  const distance=button("Distance from Plant A",()=>change("distance"));
  switches.append(chart,distance);
  controls.append(hint,switches);
  function draw() {
    const byDistance=layout==="distance";
    const positions=byDistance ? distanceLayout : hierarchy;
    base.replaceChildren();
    positions.forEach(n=>{ if(n.parent!==null) drawConnection(base,n,positions[n.parent],false); });
    steps.hidden=!byDistance;
    chart.setAttribute("aria-pressed",String(!byDistance));
    distance.setAttribute("aria-pressed",String(byDistance));
    hint.textContent = byDistance ? "Rows count reporting links from Plant A. Choose a destination." : "From Plant A, choose a destination.";
    const route=reportingRoute(3,target);
    trace.replaceChildren();
    route.slice(1).forEach((id,i)=>drawConnection(trace,positions[route[i]],positions[id],true,i*112));
    nodes.forEach((el,i)=>{
      el.style.left=positions[i].x+"%";
      el.style.top=positions[i].y+"%";
      el.classList.toggle("active",route.includes(i));
      if(i>=4) el.setAttribute("aria-pressed",String(i===target));
    });
    const links=route.length-1, units=route.length-2;
    caption.replaceChildren(element("strong","",links+" reporting links · "+units+" intermediate "+(units===1?"unit":"units")),
      document.createElement("br"),document.createTextNode(route.map(i=>hierarchy[i].name).join(" → ")));
  }
  draw();
  return figure;
}

const tradeViews = [
  {name:"Estimate", caption:"From the 25th to the 75th percentile of import exposure, the annual rise in the service employment share is 0.14 percentage points smaller."},
  {name:"Household demand", flow:["Cheaper remote imports","Household spending shifts toward remote services","Local service employment share falls"],caption:"In the calibrated model, households substitute remote services for local services."},
  {name:"Export demand", caption:"In the calibrated model, gains in remote-service jobs serving households are largely offset by losses in jobs serving exports."}
];

function tradePlate() {
  const {figure,visual,controls,caption}=plateContainer("Imports and employment","Evidence & model");
  const buttons=tradeViews.map((view,i)=>button(view.name,()=>draw(i)));
  let relative=false;
  controls.append(...buttons);
  function draw(i) {
    const view=tradeViews[i];
    if (i===0) {
      const group=element("div","estimate");
      const range=element("div","percentile");
      range.append(element("span","","25th percentile"),element("span","interval"),element("span","","75th percentile"));
      const size=element("p","value"), units=element("p","units");
      const changeUnits=button("",()=>{
        relative=!relative;
        setUnits();
      },"change-units");
      const setUnits=()=>{
        size.textContent=relative ? "≈37%" : "−0.14";
        units.textContent=relative ? "of the sample’s average annual increase" : "percentage points per year";
        changeUnits.textContent=relative ? "Show in percentage points" : "Compare with the sample average";
        caption.textContent=relative ? "The estimated 0.14 percentage-point difference is about 37 percent of the average annual increase in the sample." : view.caption;
      };
      group.append(size,units,range,changeUnits);
      setUnits();
      visual.replaceChildren(group);
    } else if (view.flow) {
      const flow=element("div","model-flow");
      view.flow.forEach((term,j)=>{
        if (j) {
          const mark=element("span","arrow","↓");
          mark.setAttribute("aria-hidden","true");
          flow.append(mark);
        }
        flow.append(element("p","term"+(j===2?" finish":""),term));
      });
      visual.replaceChildren(flow);
    } else {
      const split = element("div","employment-split");
      const terms = element("div","demand-terms");
      for (const [sign, source] of [["More jobs","Serving households"],["Fewer jobs","Serving exports"]]) {
        const part = element("p");
        part.append(element("span","",source),element("strong","",sign));
        terms.append(part);
      }
      split.append(element("p","split-title","Employment in remote services"), terms);
      visual.replaceChildren(split);
    }
    if(i!==0) caption.textContent=view.caption;
    buttons.forEach((b,j)=>b.setAttribute("aria-pressed",String(i===j)));
  }
  draw(0);
  return figure;
}

function projectRecord(paper) {
  const div=element("div","record-line");
  div.append(element("h3","","Coauthors"));
  const list=element("ul","author-list");
  paper.author.replace(/^with\s+/i,"").split(/,\s*(?:and\s+)?/).forEach(name=>list.append(element("li","",name)));
  div.append(list);
  return div;
}

function showPlates(paper) {
  const layout=element("div","plates-layout");
  const intro=element("div");
  intro.append(heading(paper));
  if (paper.abstract) {
    intro.append(paperPdf(paper),paperAbstract(paper));
    layout.append(intro,paper.id==="org-networks" ? organizationPlate() : tradePlate());
  } else {
    layout.append(intro,projectRecord(paper));
  }
  return layout;
}

function showFolio(paper) {
  const folio=element("div","folio"), spread=element("div","spread");
  const cover=element("div","flyleaf"), leaf=element("section","leaf");
  cover.append(heading(paper));
  if(paper.pdf) cover.append(paperPdf(paper));
  folio.append(spread);
  spread.append(cover,leaf);
  if (!paper.abstract) {
    leaf.append(projectRecord(paper));
    return folio;
  }
  const evidence=notes[paper.id][paper.id==="org-networks"?2:1];
  const mechanism=notes[paper.id][3];
  const pages=[
    {label:"Abstract", text:paper.abstract},
    {label:"Evidence", text:evidence.text, value:evidence.value},
    {label:"Mechanism", text:mechanism.text, value:mechanism.value}
  ];
  let page=0;
  const face=element("div","leaf-face"), nav=element("div","folio-nav");
  const prev=button("← Previous",()=>turn(page-1));
  const next=button("Next →",()=>turn(page+1));
  const number=element("span");
  number.setAttribute("aria-live","polite");
  nav.append(prev,number,next);
  leaf.append(face,nav);
  function turn(to) {
    if (to<0 || to>=pages.length) return;
    const p=pages[to], dir=to===page?"":to>page?"turn-next":"turn-prev";
    page=to;
    const text=element("div","leaf-copy");
    if(p.value) text.append(element("span","note-value",p.value));
    text.append(element("p","",p.text));
    const nextFace=element("div","leaf-face "+dir);
    nextFace.append(element("h3","",p.label),text);
    leaf.firstElementChild.replaceWith(nextFace);
    number.textContent=(page+1)+" / "+pages.length;
    const prevFocused=document.activeElement===prev, nextFocused=document.activeElement===next;
    prev.disabled=page===0;
    next.disabled=page===pages.length-1;
    if(prevFocused && prev.disabled) next.focus();
    if(nextFocused && next.disabled) prev.focus();
  }
  turn(0);
  return folio;
}

// Only hashes change, so the prototypes can be opened directly from disk.
function readRoute() {
  const [first,id]=location.hash.slice(1).split("/");
  if (styles.includes(first)) return {style:first, id};
  return {style:"plates", id: first==="research" ? "" : first};
}

function routeTo(nextStyle,id,push) {
  const hash="#"+nextStyle+(id?"/"+id:"");
  const state={fromList: push || Boolean(history.state?.fromList)};
  if (!id) state.fromList=false;
  if (location.hash!==hash) history[push?"pushState":"replaceState"](state,"",hash);
  render();
}

function render() {
  const previous=activePaper;
  const route=readRoute();
  style=route.style;
  activePaper=projects.find(p=>p.id===route.id) || null;
  selectors.forEach(select=>{select.value=style;});
  for(const paper of projects) {
    const inline=paper.article.querySelector(".inline-reader");
    inline.hidden=true;
    inline.replaceChildren();
    paper.article.classList.toggle("selected",paper===activePaper);
    paper.titleLink.setAttribute("aria-expanded",String(paper===activePaper));
    paper.titleLink.href="#"+style+"/"+paper.id;
    if (paper===activePaper) {
      const quick=paper.article.querySelector(".quick");
      if (quick) quick.open=false;
    }
  }
  if (dialog.open && (!activePaper || style==="margins")) dialog.close();
  if (!activePaper) {
    if(previous) previous.titleLink.focus({preventScroll:true});
    return;
  }
  if(style==="margins") {
    inlineReader(activePaper);
    if (previous===activePaper || !previous) {
      const article=activePaper.article;
      const rect=article.getBoundingClientRect();
      if(rect.top<0 || rect.top>innerHeight*.65) article.scrollIntoView({block:"start"});
    }
    return;
  }
  body.replaceChildren(style==="folio" ? showFolio(activePaper) : showPlates(activePaper));
  if(!dialog.open) dialog.showModal();
  dialog.scrollTop=0;
}

function closeReader() {
  if (!activePaper) return;
  if(history.state?.fromList) {
    closeToStyle=style;
    history.back();
  }
  else routeTo(style,"",false);
}

if (typeof dialog.showModal==="function") {
  document.documentElement.classList.add("enhanced");
  projects.forEach(paper=>paper.titleLink.addEventListener("click",event=>{
    if(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if(activePaper===paper && style==="margins") closeReader();
    else routeTo(style,paper.id,!activePaper);
  }));
  selectors.forEach(select=>select.addEventListener("change",()=>routeTo(select.value,activePaper?.id,false)));
  dialog.querySelector("[data-close]").addEventListener("click",closeReader);
  dialog.addEventListener("cancel",event=>{event.preventDefault();closeReader();});
  dialog.addEventListener("click",event=>{
    if(event.target!==dialog) return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) closeReader();
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape" && activePaper && style==="margins") {event.preventDefault();closeReader();}
  });
  window.addEventListener("hashchange",()=>{
    const preferred=closeToStyle;
    closeToStyle=null;
    if (preferred && !readRoute().id) routeTo(preferred,"",false);
    else render();
  });
  render();
}
