import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { Moon, PawPrint, Trees, BookOpen, MapPin, Settings2, Plus, Sparkles, Trash2, ChevronRight } from 'lucide-react';
import './style.css';

type Place = { id: number; name: string; kind: string; note: string };
type Entry = { id: number; date: string; mood: string; text: string };
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
 const [entries, setEntries] = useState<Entry[]>(() => load('moonbay-entries', []));
 const [newPlace, setNewPlace] = useState('');
 const [newNote, setNewNote] = useState('');
 const [journal, setJournal] = useState('');
 const [mood, setMood] = useState('Calm');
 const [accent, setAccent] = useState(() => load('moonbay-accent', 'sage'));
 useEffect(() => { localStorage.setItem('moonbay-den', JSON.stringify(den)); }, [den]);
 useEffect(() => { localStorage.setItem('moonbay-pack', JSON.stringify(pack)); }, [pack]);
 useEffect(() => { localStorage.setItem('moonbay-places', JSON.stringify(places)); }, [places]);
 useEffect(() => { localStorage.setItem('moonbay-entries', JSON.stringify(entries)); }, [entries]);
 useEffect(() => { localStorage.setItem('moonbay-accent', JSON.stringify(accent)); }, [accent]);
 const saveEntry = (e: FormEvent) => { e.preventDefault(); if (!journal.trim()) return; setEntries([{ id: Date.now(), date: new Date().toLocaleDateString(), mood, text: journal.trim() }, ...entries]); setJournal(''); };
 const addPlace = (e: FormEvent) => { e.preventDefault(); if (!newPlace.trim()) return; setPlaces([...places, { id: Date.now(), name: newPlace.trim(), kind: 'Sanctuary', note: newNote.trim() || 'A special place in your territory.' }]); setNewPlace(''); setNewNote(''); };
 const nav = [{ label: 'The Den', icon: Moon }, { label: 'Territory', icon: MapPin }, { label: 'Moon Journal', icon: BookOpen }, { label: 'Settings', icon: Settings2 }];
 return <div className={'app accent-' + accent}>
  <aside className="sidebar"><div className="brand"><div className="brand-mark"><Moon size={23}/><Sparkles size={12}/></div><div><strong>moonbay</strong><span>your quiet corner of the wild</span></div></div>
   <div className="pack-card"><div className="pack-emblem"><PawPrint size={21}/></div><div><small>YOUR PACK</small><strong>{pack}</strong><span>One den. Your own world.</span></div></div>
   <p className="eyebrow nav-label">YOUR SPACE</p>{nav.map(n => { const Icon=n.icon; return <button key={n.label} className={'nav-item ' + (page===n.label?'active':'')} onClick={()=>setPage(n.label)}><Icon size={18}/>{n.label}<ChevronRight size={14}/></button>; })}
   <div className="sidebar-bottom"><div className="moon-mini"><span>🌙</span><div><small>YOUR LUNAR REMINDER</small><strong>Make room to grow</strong></div></div><p className="sidebar-foot">● Your space, your pace</p></div>
  </aside>
  <main className="main"><header className="topbar"><div className="crumb">MOONBAY <span>/</span> {page.toUpperCase()}</div><span>{new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</span></header>
  {page==='The Den' && <section className="page"><div className="kicker">✦ &nbsp; A LITTLE SPACE TO BE YOURSELF</div><div className="welcome"><div><h1>Welcome home,<br/><em>{den}.</em></h1><p>The world can wait a little. You're here now.</p></div><div className="sigil">☾<small>WILD AT HEART</small></div></div>
   <div className="hero"><div className="hero-copy"><span className="tag">✧ YOUR SANCTUARY</span><h2>Find your quiet<br/>in the wild.</h2><p>A den to dream in, a territory to explore, a little moonlight whenever you need it.</p><button className="light-button" onClick={()=>setPage('Territory')}>Explore your territory <ChevronRight size={15}/></button></div><div className="hero-moon">☾</div><span className="hero-caption"><Trees size={14}/> BENEATH THE SAME MOON</span></div>
   <div className="section-title"><div><small>YOUR WORLD</small><h2>Around your den</h2></div><span>{places.length} places saved</span></div><div className="stats"><button className="stat" onClick={()=>setPage('Moon Journal')}><span>🌔 &nbsp; LUNAR CYCLE</span><strong>Follow your own rhythm</strong><p>Rest, reflect, and begin again when you're ready.</p><small>OPEN MOON JOURNAL ↗</small></button><button className="stat" onClick={()=>setPage('Territory')}><span><MapPin size={17}/> &nbsp; YOUR TERRITORY</span><strong>{places.length} places</strong><p>Your paths, hideaways, and special places.</p><small>VIEW TERRITORY ↗</small></button><button className="stat" onClick={()=>setPage('Moon Journal')}><span><BookOpen size={17}/> &nbsp; MOON JOURNAL</span><strong>{entries.length} entries</strong><p>A place for thoughts, feelings, and discoveries.</p><small>OPEN JOURNAL ↗</small></button></div>
   <div className="bottom-grid"><section className="panel"><div className="panel-heading"><div><small>A PLACE TO RETURN TO</small><h3>Your favorite places</h3></div><button className="link" onClick={()=>setPage('Territory')}>See all →</button></div>{places.slice(0,3).map(p=><div className="place-row" key={p.id}><span className="place-icon"><Trees size={18}/></span><div><strong>{p.name}</strong><p>{p.kind} · {p.note}</p></div></div>)}</section><section className="panel reflection"><Sparkles size={21}/><small>A MOMENT FOR YOU</small><h3>There is no rush<br/>to become.</h3><p>You can grow at your own pace. Rest, explore, change your mind. This space belongs to you.</p><button className="link" onClick={()=>setPage('Moon Journal')}>Leave yourself a note →</button></section></div>
  </section>}
  {page==='Territory' && <section className="page"><div className="kicker">✦ &nbsp; YOUR PERSONAL WILDERNESS</div><h1>Your <em>territory.</em></h1><p className="intro">Keep track of the places that mean something to you.</p><form className="panel add-form" onSubmit={addPlace}><h3>Mark a new place</h3><input value={newPlace} onChange={e=>setNewPlace(e.target.value)} placeholder="Place name, e.g. Fern Hollow" required/><input value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="A little note about this place"/><button className="primary" type="submit"><Plus size={16}/> Add to territory</button></form><div className="section-title"><div><small>YOUR LANDMARKS</small><h2>Places in your territory</h2></div><span>{places.length} saved</span></div><div className="place-grid">{places.map(p=><article className="place-card" key={p.id}><div className="place-art">☾ <Trees size={40}/></div><div className="place-card-body"><small>{p.kind.toUpperCase()}</small><h3>{p.name}</h3><p>{p.note}</p><button className="link" onClick={()=>setPlaces(places.filter(x=>x.id!==p.id))}><Trash2 size={13}/> Remove place</button></div></article>)}</div></section>}
  {page==='Moon Journal' && <section className="page"><div className="kicker">✦ &nbsp; THOUGHTS UNDER MOONLIGHT</div><h1>Moon <em>journal.</em></h1><p className="intro">No perfect words needed. Just start wherever you are.</p><div className="journal-layout"><form className="panel journal-form" onSubmit={saveEntry}><small>A MOMENT OF YOUR OWN</small><h3>What's on your mind?</h3><label>How are you feeling?<select value={mood} onChange={e=>setMood(e.target.value)}>{['Calm','Hopeful','Curious','Restless','Overwhelmed','Happy','Reflective'].map(m=><option key={m}>{m}</option>)}</select></label><label>Your thoughts<textarea rows={7} value={journal} onChange={e=>setJournal(e.target.value)} placeholder="Let your thoughts settle here..."/></label><button className="primary" type="submit"><BookOpen size={16}/> Save journal entry</button><small className="privacy">♡ Entries stay in this browser on this device.</small></form><section><div className="section-title"><div><small>YOUR INNER WORLD</small><h2>Past entries</h2></div><span>{entries.length} saved</span></div>{entries.map(e=><article className="panel entry" key={e.id}><div className="entry-meta">{e.date} <span>{e.mood}</span></div><p>{e.text}</p><button className="link" onClick={()=>setEntries(entries.filter(x=>x.id!==e.id))}>Delete entry</button></article>)}</section></div></section>}
  {page==='Settings' && <section className="page"><div className="kicker">✦ &nbsp; MAKE IT YOURS</div><h1>Your <em>sanctuary.</em></h1><p className="intro">Shape Moonbay to feel a little more like home.</p><div className="settings-grid"><section className="panel settings"><PawPrint/><small>YOUR IDENTITY</small><h3>Name your space</h3><label>Den name<input value={den} onChange={e=>setDen(e.target.value)} maxLength={36}/></label><label>Pack name<input value={pack} onChange={e=>setPack(e.target.value)} maxLength={36}/></label><p className="privacy">Changes save automatically in this browser.</p></section><section className="panel settings"><Sparkles/><small>THE ATMOSPHERE</small><h3>Choose your accent</h3><div className="accents">{[{id:'sage',label:'Forest sage'},{id:'moon',label:'Moon silver'},{id:'mauve',label:'Dusky mauve'},{id:'amber',label:'Ember glow'}].map(a=><button key={a.id} className={'accent-choice '+(accent===a.id?'chosen':'')} onClick={()=>setAccent(a.id)}>{a.label}{accent===a.id?' ✓':''}</button>)}</div><p className="privacy">Your preferences are saved locally on this device.</p></section></div><section className="panel about"><Moon/><small>A LITTLE NOTE</small><h3>Moonbay is your space.</h3><p>Your settings, territory landmarks, and journal entries save in this browser. Cross-device syncing can be added later.</p></section></section>}
  <footer className="footer">☾ &nbsp; Made for the wild parts of you <span>· MOONBAY</span></footer>
  </main>
 </div>;
}
createRoot(document.getElementById('root')!).render(<App />);
