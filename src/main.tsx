import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { Moon, PawPrint, Trees, BookOpen, MapPin, Settings2, Plus, Sparkles, Trash2, ChevronRight, CalendarDays, Compass, Check, X, PencilRuler } from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './style.css';

type Place = { id: number; name: string; kind: string; note: string };
type Entry = { id: number; date: string; mood: string; text: string };
type MapClaim = { id: number; name: string; kind: string; note: string; lat: number; lng: number };
type Boundary = { id: number; name: string; points: [number, number][] };
type MapMode = 'view' | 'pin' | 'boundary';

function getMoonInfo(date: Date) {
 const cycle = 29.530588853;
 const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
 const days = (date.getTime() - knownNewMoon) / 86400000;
 const age = ((days % cycle) + cycle) % cycle;
 const fraction = age / cycle;
 const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2;
 const phase = age < 1.845 ? 'New Moon' : age < 5.536 ? 'Waxing Crescent' : age < 9.228 ? 'First Quarter' : age < 12.919 ? 'Waxing Gibbous' : age < 16.610 ? 'Full Moon' : age < 20.302 ? 'Waning Gibbous' : age < 23.993 ? 'Last Quarter' : age < 27.684 ? 'Waning Crescent' : 'New Moon';
 const daysToFull = (14.765 - age + cycle) % cycle;
 const daysToNew = (cycle - age) % cycle;
 const fullDate = new Date(date.getTime() + daysToFull * 86400000);
 const newDate = new Date(date.getTime() + daysToNew * 86400000);
 return { age, phase, illumination: Math.round(illumination * 100), daysToFull, daysToNew, fullDate, newDate };
}

function TerritoryMap({ claims, boundaries, draftBoundary, flyTo, mode, onMapClick }: {
 claims: MapClaim[];
 boundaries: Boundary[];
 draftBoundary: [number, number][];
 flyTo: [number, number] | null;
 mode: MapMode;
 onMapClick: (point: [number, number]) => void;
}) {
 const containerRef = useRef<HTMLDivElement>(null);
 const mapRef = useRef<L.Map | null>(null);
 const layersRef = useRef<L.LayerGroup | null>(null);
 const clickRef = useRef(onMapClick);
 useEffect(() => { clickRef.current = onMapClick; }, [onMapClick]);
 useEffect(() => {
  if (!containerRef.current || mapRef.current) return;
  const map = L.map(containerRef.current).setView([39.5, -98.35], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
   maxZoom: 19,
   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  const layers = L.layerGroup().addTo(map);
  map.on('click', (event: L.LeafletMouseEvent) => clickRef.current([event.latlng.lat, event.latlng.lng]));
  mapRef.current = map;
  layersRef.current = layers;
  return () => { map.remove(); mapRef.current = null; layersRef.current = null; };
 }, []);
 useEffect(() => {
  const layers = layersRef.current;
  if (!layers) return;
  layers.clearLayers();
  const pinIcon = L.divIcon({ className: 'moonbay-pin-wrap', html: '<span>☾</span>', iconSize: [30, 30], iconAnchor: [15, 15] });
  claims.forEach(claim => {
   L.marker([claim.lat, claim.lng], { icon: pinIcon }).bindTooltip(claim.name).addTo(layers);
  });
  boundaries.forEach(boundary => {
   L.polygon(boundary.points, { color: '#a9bd9d', fillColor: '#536d4f', fillOpacity: 0.24, weight: 3 }).bindTooltip(boundary.name).addTo(layers);
  });
  if (draftBoundary.length) {
   if (draftBoundary.length > 1) L.polyline(draftBoundary, { color: '#d5b17e', dashArray: '6 6', weight: 3 }).addTo(layers);
   draftBoundary.forEach(point => L.circleMarker(point, { radius: 5, color: '#d5b17e', fillColor: '#d5b17e', fillOpacity: 1 }).addTo(layers));
  }
 }, [claims, boundaries, draftBoundary]);
 useEffect(() => { if (flyTo && mapRef.current) mapRef.current.flyTo(flyTo, 13, { duration: 1 }); }, [flyTo]);
 return <div className={'territory-map ' + (mode === 'view' ? '' : 'map-active')} ref={containerRef} aria-label="Interactive territory map" />;
}
const defaultPlaces: Place[] = [
 { id: 1, name: 'Moonlit Clearing', kind: 'Sanctuary', note: 'A quiet place to breathe and reset.' },
 { id: 2, name: 'Old Pine Trail', kind: 'Trail', note: 'A familiar path beneath the trees.' },
 { id: 3, name: 'Stillwater', kind: 'Water', note: 'A calm lake under the moon.' }
];
function load<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function App() {
 const [page, setPage] = useState('The Den');
 const [den, setDen] = useState(() => load('moonbay-den', 'The Hollow'));
 const [pack, setPack] = useState(() => load('moonbay-pack', 'Moonbay Pack'));
 const [places, setPlaces] = useState<Place[]>(() => load('moonbay-places', defaultPlaces));
 const [claims, setClaims] = useState<MapClaim[]>(() => load('moonbay-claims', []));
 const [boundaries, setBoundaries] = useState<Boundary[]>(() => load('moonbay-boundaries', []));
 const [mapMode, setMapMode] = useState<MapMode>('view');
 const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(null);
 const [mapSearch, setMapSearch] = useState('');
 const [searchStatus, setSearchStatus] = useState('');
 const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
 const [draftBoundary, setDraftBoundary] = useState<[number, number][]>([]);
 const [claimName, setClaimName] = useState('');
 const [claimNote, setClaimNote] = useState('');
 const [boundaryName, setBoundaryName] = useState('My territory');
 const [mapMessage, setMapMessage] = useState('Choose a tool, then click the map to mark your world.');
 const moonInfo = getMoonInfo(new Date());
 const [entries, setEntries] = useState<Entry[]>(() => load('moonbay-entries', []));
 const [newPlace, setNewPlace] = useState('');
 const [newNote, setNewNote] = useState('');
 const [journal, setJournal] = useState('');
 const [mood, setMood] = useState('Calm');
 const [accent, setAccent] = useState(() => load('moonbay-accent', 'sage'));
 useEffect(() => { localStorage.setItem('moonbay-den', JSON.stringify(den)); }, [den]);
 useEffect(() => { localStorage.setItem('moonbay-pack', JSON.stringify(pack)); }, [pack]);
 useEffect(() => { localStorage.setItem('moonbay-places', JSON.stringify(places)); }, [places]);
 useEffect(() => { localStorage.setItem('moonbay-claims', JSON.stringify(claims)); }, [claims]);
 useEffect(() => { localStorage.setItem('moonbay-boundaries', JSON.stringify(boundaries)); }, [boundaries]);
 useEffect(() => { localStorage.setItem('moonbay-entries', JSON.stringify(entries)); }, [entries]);
 useEffect(() => { localStorage.setItem('moonbay-accent', JSON.stringify(accent)); }, [accent]);
 const saveEntry = (e: FormEvent) => { e.preventDefault(); if (!journal.trim()) return; setEntries([{ id: Date.now(), date: new Date().toLocaleDateString(), mood, text: journal.trim() }, ...entries]); setJournal(''); };
 const addPlace = (e: FormEvent) => { e.preventDefault(); if (!newPlace.trim()) return; setPlaces([...places, { id: Date.now(), name: newPlace.trim(), kind: 'Sanctuary', note: newNote.trim() || 'A special place in your territory.' }]); setNewPlace(''); setNewNote(''); };
 const nav = [{ label: 'The Den', icon: Moon }, { label: 'Territory', icon: MapPin }, { label: 'Moon Calendar', icon: CalendarDays }, { label: 'Moon Journal', icon: BookOpen }, { label: 'Settings', icon: Settings2 }];
 return <div className={'app accent-' + accent}>
  <aside className="sidebar"><div className="brand"><div className="brand-mark"><Moon size={23}/><Sparkles size={12}/></div><div><strong>moonbay</strong><span>your quiet corner of the wild</span></div></div>
   <div className="pack-card"><div className="pack-emblem"><PawPrint size={21}/></div><div><small>YOUR PACK</small><strong>{pack}</strong><span>One den. Your own world.</span></div></div>
   <p className="eyebrow nav-label">YOUR SPACE</p>{nav.map(n => { const Icon=n.icon; return <button key={n.label} className={'nav-item ' + (page===n.label?'active':'')} onClick={()=>setPage(n.label)}><Icon size={18}/>{n.label}<ChevronRight size={14}/></button>; })}
   <div className="sidebar-bottom"><div className="moon-mini"><span>🌙</span><div><small>YOUR LUNAR REMINDER</small><strong>Make room to grow</strong></div></div><p className="sidebar-foot">● Your space, your pace</p></div>
  </aside>
  <main className="main"><header className="topbar"><div className="crumb">MOONBAY <span>/</span> {page.toUpperCase()}</div><span>{new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</span></header>
  {page==='The Den' && <section className="page"><div className="kicker">✦ &nbsp; A LITTLE SPACE TO BE YOURSELF</div><div className="welcome"><div><h1>Welcome home,<br/><em>{den}.</em></h1><p>The world can wait a little. You're here now.</p></div><div className="sigil">☾<small>WILD AT HEART</small></div></div>
   <div className="hero"><div className="hero-copy"><span className="tag">✧ YOUR SANCTUARY</span><h2>Find your quiet<br/>in the wild.</h2><p>A den to dream in, a territory to explore, a little moonlight whenever you need it.</p><button className="light-button" onClick={()=>setPage('Territory')}>Explore your territory <ChevronRight size={15}/></button><button className="light-button moon-hero-button" onClick={()=>setPage('Moon Calendar')}><CalendarDays size={14}/> Moon calendar</button></div><div className="hero-moon">☾</div><span className="hero-caption"><Trees size={14}/> BENEATH THE SAME MOON</span></div>
   <div className="section-title"><div><small>YOUR WORLD</small><h2>Around your den</h2></div><span>{places.length} places saved</span></div><div className="stats"><button className="stat" onClick={()=>setPage('Moon Calendar')}><span>🌔 &nbsp; TONIGHT'S MOON</span><strong>{moonInfo.phase}</strong><p>{moonInfo.illumination}% illuminated · next full moon {moonInfo.fullDate.toLocaleDateString(undefined,{month:'short',day:'numeric'})}.</p><small>OPEN MOON CALENDAR ↗</small></button><button className="stat" onClick={()=>setPage('Territory')}><span><MapPin size={17}/> &nbsp; YOUR TERRITORY</span><strong>{places.length} places</strong><p>Your paths, hideaways, and special places.</p><small>VIEW TERRITORY ↗</small></button><button className="stat" onClick={()=>setPage('Moon Journal')}><span><BookOpen size={17}/> &nbsp; MOON JOURNAL</span><strong>{entries.length} entries</strong><p>A place for thoughts, feelings, and discoveries.</p><small>OPEN JOURNAL ↗</small></button></div>
   <div className="bottom-grid"><section className="panel"><div className="panel-heading"><div><small>A PLACE TO RETURN TO</small><h3>Your favorite places</h3></div><button className="link" onClick={()=>setPage('Territory')}>See all →</button></div>{places.slice(0,3).map(p=><div className="place-row" key={p.id}><span className="place-icon"><Trees size={18}/></span><div><strong>{p.name}</strong><p>{p.kind} · {p.note}</p></div></div>)}</section><section className="panel reflection"><Sparkles size={21}/><small>A MOMENT FOR YOU</small><h3>There is no rush<br/>to become.</h3><p>You can grow at your own pace. Rest, explore, change your mind. This space belongs to you.</p><button className="link" onClick={()=>setPage('Moon Journal')}>Leave yourself a note →</button></section></div>
  </section>}
  {page==='Territory' && <section className="page"><div className="kicker">✦ &nbsp; YOUR PERSONAL WILDERNESS</div><h1>Claim your <em>territory.</em></h1><p className="intro">Explore the map, pin meaningful places, and draw the boundaries of your own world.</p>
   <form className="map-search" onSubmit={async e=>{e.preventDefault();if(!mapSearch.trim())return;setSearchStatus('Searching the map…');try{const response=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q='+encodeURIComponent(mapSearch.trim()));if(!response.ok)throw new Error('Search unavailable');const results=await response.json();if(!results.length){setSearchStatus('No matching place found. Try a nearby town or landmark.');return;}const point:[number,number]=[Number(results[0].lat),Number(results[0].lon)];setFlyTo(point);setSelectedPoint(point);setMapMode('pin');setMapMessage('Search result selected. Give this place a name to save it.');setSearchStatus(results[0].display_name);}catch{setSearchStatus('Map search is unavailable right now. You can still zoom and click the map manually.');}}}><input value={mapSearch} onChange={e=>setMapSearch(e.target.value)} placeholder="Search a city, park, landmark, or address" aria-label="Search map"/><button className="primary" type="submit"><Compass size={15}/> Search map</button></form><p className="privacy map-search-help">Place search uses OpenStreetMap's public search service. Your saved map markers and boundaries stay in this browser.</p>{searchStatus&&<p className="map-search-status">{searchStatus}</p>}
   <div className="map-toolbar"><div className="map-tool-group"><button className={'map-tool '+(mapMode==='view'?'selected':'')} onClick={()=>{setMapMode('view');setMapMessage('Explore the map. Your saved places and boundaries stay private in this browser.');}}><Compass size={15}/> Explore</button><button className={'map-tool '+(mapMode==='pin'?'selected':'')} onClick={()=>{setMapMode('pin');setSelectedPoint(null);setMapMessage('Click the map where you want to place a marker.');}}><MapPin size={15}/> Claim a place</button><button className={'map-tool '+(mapMode==='boundary'?'selected':'')} onClick={()=>{setMapMode('boundary');setDraftBoundary([]);setMapMessage('Click at least three points around an area, then save the boundary.');}}><PencilRuler size={15}/> Draw territory</button></div><span className="map-status">{mapMessage}</span></div>
   <TerritoryMap claims={claims} boundaries={boundaries} draftBoundary={draftBoundary} flyTo={flyTo} mode={mapMode} onMapClick={point=>{if(mapMode==='pin'){setSelectedPoint(point);setMapMessage('Location selected. Give this place a name below.');}else if(mapMode==='boundary'){setDraftBoundary(points=>[...points,point]);setMapMessage('Boundary point added · '+(draftBoundary.length+1)+' point(s). Add at least three.');}}}/>
   {mapMode==='pin' && <form className="panel map-editor" onSubmit={e=>{e.preventDefault();if(!selectedPoint||!claimName.trim())return;setClaims(items=>[...items,{id:Date.now(),name:claimName.trim(),kind:'Claimed place',note:claimNote.trim(),lat:selectedPoint[0],lng:selectedPoint[1]}]);setClaimName('');setClaimNote('');setSelectedPoint(null);setMapMode('view');setMapMessage('Your place has been saved to this browser.');}}><div><small>NEW MAP MARKER</small><h3>{selectedPoint?'Name this place':'Click the map to choose a spot'}</h3>{selectedPoint&&<p className="coordinates">{selectedPoint[0].toFixed(5)}, {selectedPoint[1].toFixed(5)}</p>}</div><input value={claimName} onChange={e=>setClaimName(e.target.value)} placeholder="Place name, e.g. Fern Hollow" required/><input value={claimNote} onChange={e=>setClaimNote(e.target.value)} placeholder="Optional note"/><button className="primary" type="submit" disabled={!selectedPoint||!claimName.trim()}><Check size={15}/> Save place</button></form>}
   {mapMode==='boundary' && <div className="panel map-editor"><div><small>BOUNDARY BUILDER</small><h3>Outline your territory</h3><p className="privacy">Click at least three points on the map to outline an area. The last point connects back to the first.</p></div><input value={boundaryName} onChange={e=>setBoundaryName(e.target.value)} placeholder="Name this territory"/><div className="map-editor-actions"><button className="primary" disabled={draftBoundary.length<3||!boundaryName.trim()} onClick={()=>{setBoundaries(items=>[...items,{id:Date.now(),name:boundaryName.trim(),points:draftBoundary}]);setDraftBoundary([]);setMapMode('view');setMapMessage('Territory boundary saved in this browser.');}}><Check size={15}/> Save boundary ({draftBoundary.length} points)</button><button className="map-tool" onClick={()=>setDraftBoundary(points=>points.slice(0,-1))} disabled={!draftBoundary.length}>Undo point</button><button className="map-tool" onClick={()=>{setDraftBoundary([]);setMapMode('view');setMapMessage('Boundary drawing cancelled.');}}><X size={15}/> Cancel</button></div></div>}
   <div className="territory-summary"><section className="panel"><div className="panel-heading"><div><small>YOUR MARKERS</small><h3>Claimed places</h3></div><span>{claims.length} saved</span></div>{claims.length===0?<p className="privacy">No markers yet. Choose “Claim a place” and click anywhere on the map.</p>:claims.map(claim=><div className="claim-row" key={claim.id}><span className="place-icon"><MapPin size={17}/></span><div><strong>{claim.name}</strong><p>{claim.note||claim.kind} · {claim.lat.toFixed(3)}, {claim.lng.toFixed(3)}</p></div><button className="link" onClick={()=>setClaims(items=>items.filter(item=>item.id!==claim.id))}>Remove</button></div>)}</section><section className="panel"><div className="panel-heading"><div><small>YOUR BORDERS</small><h3>Territory areas</h3></div><span>{boundaries.length} saved</span></div>{boundaries.length===0?<p className="privacy">Draw an outline on the map to create your first territory area.</p>:boundaries.map(boundary=><div className="claim-row" key={boundary.id}><span className="place-icon"><Trees size={17}/></span><div><strong>{boundary.name}</strong><p>{boundary.points.length} boundary points</p></div><button className="link" onClick={()=>setBoundaries(items=>items.filter(item=>item.id!==boundary.id))}>Remove</button></div>)}</section></div>
   <p className="privacy map-privacy">Map tiles © OpenStreetMap contributors. Your markers and drawn boundaries are saved locally in this browser; they are not published to a shared map.</p>
  </section>}
  {page==='Moon Journal' && <section className="page"><div className="kicker">✦ &nbsp; THOUGHTS UNDER MOONLIGHT</div><h1>Moon <em>journal.</em></h1><p className="intro">No perfect words needed. Just start wherever you are.</p><div className="journal-layout"><form className="panel journal-form" onSubmit={saveEntry}><small>A MOMENT OF YOUR OWN</small><h3>What's on your mind?</h3><label>How are you feeling?<select value={mood} onChange={e=>setMood(e.target.value)}>{['Calm','Hopeful','Curious','Restless','Overwhelmed','Happy','Reflective'].map(m=><option key={m}>{m}</option>)}</select></label><label>Your thoughts<textarea rows={7} value={journal} onChange={e=>setJournal(e.target.value)} placeholder="Let your thoughts settle here..."/></label><button className="primary" type="submit"><BookOpen size={16}/> Save journal entry</button><small className="privacy">♡ Entries stay in this browser on this device.</small></form><section><div className="section-title"><div><small>YOUR INNER WORLD</small><h2>Past entries</h2></div><span>{entries.length} saved</span></div>{entries.map(e=><article className="panel entry" key={e.id}><div className="entry-meta">{e.date} <span>{e.mood}</span></div><p>{e.text}</p><button className="link" onClick={()=>setEntries(entries.filter(x=>x.id!==e.id))}>Delete entry</button></article>)}</section></div></section>}
  {page==='Moon Calendar' && <section className="page"><div className="kicker">✦ &nbsp; FOLLOW THE LUNAR RHYTHM</div><h1>Moon <em>calendar.</em></h1><p className="intro">A little celestial context for your days, from the current phase to the next full moon.</p>
   <div className="moon-overview"><div className="moon-disc">{moonInfo.phase==='New Moon'?'●':moonInfo.phase==='Full Moon'?'○':moonInfo.phase==='First Quarter'?'◐':moonInfo.phase==='Last Quarter'?'◑':moonInfo.phase.includes('Waxing')?'🌒':'🌘'}</div><div className="moon-current"><small>TONIGHT'S MOON</small><h2>{moonInfo.phase}</h2><p>{moonInfo.illumination}% illuminated · lunar age {moonInfo.age.toFixed(1)} days</p><div className="illumination-track"><span style={{width:moonInfo.illumination+'%'}}/></div><p className="privacy">Phase and illumination are approximate astronomical estimates.</p></div></div>
   <div className="moon-date-cards"><div className="panel"><small>NEXT FULL MOON</small><h3>{moonInfo.fullDate.toLocaleDateString(undefined,{month:'long',day:'numeric'})}</h3><p>About {Math.max(0,Math.ceil(moonInfo.daysToFull))} days away</p></div><div className="panel"><small>NEXT NEW MOON</small><h3>{moonInfo.newDate.toLocaleDateString(undefined,{month:'long',day:'numeric'})}</h3><p>About {Math.max(0,Math.ceil(moonInfo.daysToNew))} days away</p></div><div className="panel"><small>ONE LUNAR CYCLE</small><h3>29.5 days</h3><p>The average time between new moons.</p></div></div>
   <div className="panel phase-guide"><div className="panel-heading"><div><small>THE LUNAR CYCLE</small><h3>Eight moon phases</h3></div></div><div className="phase-grid">{[{symbol:'🌑',name:'New Moon',detail:'The Moon is between Earth and the Sun.'},{symbol:'🌒',name:'Waxing Crescent',detail:'The lit portion is growing.'},{symbol:'🌓',name:'First Quarter',detail:'About half appears illuminated.'},{symbol:'🌔',name:'Waxing Gibbous',detail:'More than half is lit, growing toward full.'},{symbol:'🌕',name:'Full Moon',detail:'The near side appears fully illuminated.'},{symbol:'🌖',name:'Waning Gibbous',detail:'The lit portion begins shrinking.'},{symbol:'🌗',name:'Last Quarter',detail:'About half appears illuminated again.'},{symbol:'🌘',name:'Waning Crescent',detail:'The lit portion shrinks toward new moon.'}].map(item=><div className="phase-item" key={item.name}><span>{item.symbol}</span><div><strong>{item.name}</strong><p>{item.detail}</p></div></div>)}</div></div>
  </section>}
  {page==='Settings' && <section className="page"><div className="kicker">✦ &nbsp; MAKE IT YOURS</div><h1>Your <em>sanctuary.</em></h1><p className="intro">Shape Moonbay to feel a little more like home.</p><div className="settings-grid"><section className="panel settings"><PawPrint/><small>YOUR IDENTITY</small><h3>Name your space</h3><label>Den name<input value={den} onChange={e=>setDen(e.target.value)} maxLength={36}/></label><label>Pack name<input value={pack} onChange={e=>setPack(e.target.value)} maxLength={36}/></label><p className="privacy">Changes save automatically in this browser.</p></section><section className="panel settings"><Sparkles/><small>THE ATMOSPHERE</small><h3>Choose your accent</h3><div className="accents">{[{id:'sage',label:'Forest sage'},{id:'moon',label:'Moon silver'},{id:'mauve',label:'Dusky mauve'},{id:'amber',label:'Ember glow'}].map(a=><button key={a.id} className={'accent-choice '+(accent===a.id?'chosen':'')} onClick={()=>setAccent(a.id)}>{a.label}{accent===a.id?' ✓':''}</button>)}</div><p className="privacy">Your preferences are saved locally on this device.</p></section></div><section className="panel about"><Moon/><small>A LITTLE NOTE</small><h3>Moonbay is your space.</h3><p>Your settings, territory landmarks, and journal entries save in this browser. Cross-device syncing can be added later.</p></section></section>}
  <footer className="footer">☾ &nbsp; Made for the wild parts of you <span>· MOONBAY</span></footer>
  </main>
 </div>;
}
createRoot(document.getElementById('root')!).render(<App />);
