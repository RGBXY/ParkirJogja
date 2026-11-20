import {useState,useEffect,useMemo,useRef,createContext,useContext} from 'react'
import {HashRouter,Routes,Route,Navigate,NavLink,useNavigate,useParams} from 'react-router-dom'
import {MapContainer,TileLayer,Marker,CircleMarker,useMap,useMapEvents} from 'react-leaflet'
import L from 'leaflet';import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine';import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import {QRCodeSVG} from 'qrcode.react'
import {Home,Map as MapI,CreditCard,Clock,User,ParkingCircle,LayoutDashboard,Receipt,Flag,Users,Volume2,VolumeX,Repeat,Navigation,LocateFixed,List,X,Plus,Minus,Camera,CheckCircle2} from 'lucide-react'

const VEH=[['motor','Sepeda Motor'],['mobil','Mobil'],['lain','Kendaraan Lain']]
const RP=n=>'Rp'+Number(n).toLocaleString('id-ID')
const CTR=[-7.7956,110.3695],COL={Tersedia:'#16A36A','Hampir Penuh':'#F0A329',Penuh:'#D94343'}
const mk=(id,name,addr,lat,lng,cap,free,fee,verified=true)=>({id,name:name+' (Demo)',addr,lat,lng,cap,free,fee,verified,open:true,hours:'06.00–22.00',pay:['QRIS','Tunai','Langganan']})
const PARKS=[
mk(1,'Parkir Malioboro','Jl. Malioboro, Sosromenduran',-7.7926,110.3658,{motor:100,mobil:40,lain:10},{motor:35,mobil:8,lain:3},{motor:2000,mobil:5000,lain:10000}),
mk(2,'Parkir Tugu','Jl. Mangkubumi, Gowongan',-7.7829,110.3671,{motor:80,mobil:30,lain:5},{motor:0,mobil:0,lain:0},{motor:2000,mobil:5000,lain:10000}),
mk(3,'Parkir Stasiun','Jl. Pasar Kembang, Sosromenduran',-7.7894,110.3631,{motor:120,mobil:50,lain:10},{motor:10,mobil:15,lain:4},{motor:2000,mobil:5000,lain:10000}),
mk(4,'Parkir UGM','Bulaksumur, Caturtunggal',-7.7713,110.3776,{motor:200,mobil:60,lain:8},{motor:90,mobil:25,lain:5},{motor:2000,mobil:5000,lain:10000}),
mk(5,'Parkir Titik Nol Km','Jl. Panembahan Senopati',-7.8014,110.3664,{motor:60,mobil:20,lain:4},{motor:20,mobil:6,lain:2},{motor:2000,mobil:5000,lain:10000}),
mk(6,'Parkir Keraton','Jl. Rotowijayan, Panembahan',-7.8052,110.3642,{motor:90,mobil:35,lain:6},{motor:15,mobil:20,lain:1},{motor:2000,mobil:5000,lain:10000}),
mk(7,'Parkir Kotabaru (Menunggu Verifikasi)','Jl. Abu Bakar Ali, Kotabaru',-7.7835,110.3730,{motor:50,mobil:15,lain:2},{motor:50,mobil:15,lain:2},{motor:2000,mobil:5000,lain:10000},false)]
const PLANS=[{id:'bln',n:'Bulanan',price:50000,days:30,b:['Parkir motor tanpa tarif per kunjungan','Prioritas antrean','Kartu digital']},{id:'thn',n:'Tahunan',price:500000,days:365,b:['Hemat 2 bulan','Parkir motor & mobil','Kartu digital']}]
const RSTAT=['Menunggu Verifikasi','Sedang Ditinjau','Ditindaklanjuti','Selesai'],KSTAT=['Diajukan','Sedang Ditinjau','Disetujui','Ditolak']
const stat=(p,v)=>!p.open||p.free[v]===0?'Penuh':p.free[v]/p.cap[v]<.2?'Hampir Penuh':'Tersedia'
const xy=a=>Array.isArray(a)?a:[a.lat,a.lng]
const D=(a,b)=>{a=xy(a);b=xy(b);const r=x=>x*Math.PI/180,h=Math.sin(r(b[0]-a[0])/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(r(b[1]-a[1])/2)**2;return 12742*Math.asin(Math.sqrt(h))}
const card='bg-white rounded-2xl p-4 shadow-sm border border-[#DCE4ED]',btn='bg-[#1253A0] text-white rounded-xl py-3 px-4 font-semibold w-full active:scale-95 transition disabled:opacity-50',btn2='bg-[#E5EFF8] text-[#1253A0] rounded-xl py-3 px-4 font-semibold w-full active:scale-95 transition',inp='w-full border border-[#DCE4ED] rounded-xl px-3 py-3 bg-white text-sm outline-none focus:border-[#1253A0]'
const now=()=>new Date().toLocaleString('id-ID')
const cap=t=>t[0].toUpperCase()+t.slice(1)

const Ctx=createContext();const useC=()=>useContext(Ctx)
const seed={user:null,veh:'motor',parks:PARKS,sub:null,subHist:[],reports:[],recs:[],tx:[{id:'TX-0001',park:1,veh:'motor',amt:2000,m:'QRIS',t:'18/11/2026 09.12'}],users:[{n:'Budi Santoso',e:'budi@mail.id',on:true},{n:'Sari Lestari',e:'sari@mail.id',on:true},{n:'Andi Pratama',e:'andi@mail.id',on:false}]}
function Provider({children}){
 const [s,setS]=useState(()=>{try{return {...seed,...JSON.parse(localStorage.getItem('jp'))}}catch{return seed}})
 const [toast,setT]=useState(''),[loc,setLoc]=useState({p:CTR,real:false})
 useEffect(()=>localStorage.setItem('jp',JSON.stringify(s)),[s])
 useEffect(()=>{if(!navigator.geolocation)return;const w=navigator.geolocation.watchPosition(g=>setLoc({p:[g.coords.latitude,g.coords.longitude],real:true}),()=>setLoc({p:CTR,real:false}),{enableHighAccuracy:true,maximumAge:3000});return()=>navigator.geolocation.clearWatch(w)},[])
 const up=p=>setS(x=>({...x,...(typeof p==='function'?p(x):p)}))
 const say=m=>{setT(m);setTimeout(()=>setT(''),2400)}
 return <Ctx.Provider value={{s,up,say,loc}}>{children}{toast&&<div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#172B4D] text-white text-sm px-4 py-2 rounded-xl z-[9999] shadow-lg">{toast}</div>}</Ctx.Provider>}

const Badge=({st})=><span className="text-[11px] font-semibold px-2 py-1 rounded-full text-white" style={{background:COL[st]}}>{st}</span>
const Demo=()=><p className="text-[11px] text-[#667085] text-center my-2">Seluruh lokasi & tarif adalah data demonstrasi, bukan tarif resmi terverifikasi.</p>
function VehSel(){const {s,up}=useC();return <div className="flex gap-2">{VEH.map(([k,l])=><button key={k} onClick={()=>up({veh:k})} className={'flex-1 text-xs py-2 rounded-xl font-semibold border '+(s.veh===k?'bg-[#1253A0] text-white border-[#1253A0]':'bg-white text-[#667085] border-[#DCE4ED]')}>{l}</button>)}</div>}
function ParkCard({p}){const {s,loc}=useC();const nav=useNavigate(),v=s.veh,st=stat(p,v)
 return <div onClick={()=>nav('/park/'+p.id)} className={card+' cursor-pointer active:scale-[.98] transition'}>
 <div className="flex justify-between items-start gap-2"><div><b className="text-sm">{p.name}</b><p className="text-xs text-[#667085]">{p.addr} · {D(loc.p,p).toFixed(1)} km</p></div><Badge st={st}/></div>
 <div className="flex justify-between mt-3 text-xs"><span>Slot: <b>{p.free[v]}/{p.cap[v]}</b></span><span>Tarif: <b>{RP(p.fee[v])}</b></span><span className="text-[#1253A0] font-semibold">✓ Resmi Terafiliasi</span></div></div>}

function Login(){const {up,say}=useC();const [m,setM]=useState('login'),[f,setF]=useState({n:'',e:'',p:''})
 const go=(role,name,email)=>up({user:{role,name,email,phone:'0812-0000-0000'}})
 const sub=()=>{if(!/\S+@\S+\.\S+/.test(f.e)||f.p.length<6||(m==='reg'&&!f.n))return say('Isi email valid, password min. 6 karakter'+(m==='reg'?' & nama':''));go('user',f.n||f.e.split('@')[0],f.e)}
 return <div className="min-h-screen max-w-[480px] mx-auto bg-[#F2F5F9] p-6 flex flex-col justify-center">
 <div className="text-center mb-6"><div className="w-16 h-16 rounded-2xl bg-[#1253A0] text-white mx-auto flex items-center justify-center"><ParkingCircle size={36}/></div><h1 className="text-2xl font-extrabold mt-3 text-[#1253A0]">JogjaParkir</h1><p className="text-sm text-[#667085]">Parkir Resmi, Aman, dan Transparan.</p></div>
 <div className={card+' space-y-3'}>{m==='reg'&&<input className={inp} placeholder="Nama lengkap" value={f.n} onChange={e=>setF({...f,n:e.target.value})}/>}
 <input className={inp} placeholder="Email" value={f.e} onChange={e=>setF({...f,e:e.target.value})}/><input type="password" className={inp} placeholder="Password" value={f.p} onChange={e=>setF({...f,p:e.target.value})}/>
 <button className={btn} onClick={sub}>{m==='login'?'Masuk':'Daftar'}</button><button className={btn2} onClick={()=>setM(m==='login'?'reg':'login')}>{m==='login'?'Registrasi Akun':'Sudah punya akun'}</button></div>
 <p className="text-xs text-center text-[#667085] mt-5 mb-2">Quick login demo</p>
 <div className="grid grid-cols-3 gap-2">{[['user','Pengguna','Budi Santoso'],['mgr','Pengelola','Pengelola Malioboro'],['admin','Admin','Admin Dishub']].map(([r,l,n])=><button key={r} className={btn2+' !px-1 text-sm'} onClick={()=>go(r,n,r+'@jogjaparkir.id')}>{l}</button>)}</div></div>}

const NAV={user:[['/','Beranda',Home],['/map','Peta',MapI],['/sub','Langganan',CreditCard],['/history','Riwayat',Clock],['/profile','Profil',User]],
mgr:[['/','Dashboard',LayoutDashboard],['/slots','Slot Parkir',ParkingCircle],['/tx','Transaksi',Receipt],['/profile','Profil',User]],
admin:[['/','Dashboard',LayoutDashboard],['/parks','Parkir',ParkingCircle],['/reports','Laporan',Flag],['/users','Pengguna',Users],['/profile','Profil',User]]}
const ROLE={user:'Pengguna',mgr:'Pengelola',admin:'Admin'}
function Shell(){const {s}=useC();const r=s.user.role,items=NAV[r]
 const R={user:<Routes><Route path="/" element={<HomeU/>}/><Route path="/map" element={<MapPage/>}/><Route path="/sub" element={<Sub/>}/><Route path="/history" element={<Hist/>}/><Route path="/park/:id" element={<Detail/>}/><Route path="/pay/:id" element={<Pay/>}/><Route path="/report" element={<ReportPage/>}/><Route path="/profile" element={<Profile/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes>,
 mgr:<Routes><Route path="/" element={<MgrDash/>}/><Route path="/slots" element={<MgrSlots/>}/><Route path="/tx" element={<TxList/>}/><Route path="/profile" element={<Profile/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes>,
 admin:<Routes><Route path="/" element={<AdminDash/>}/><Route path="/parks" element={<AdminParks/>}/><Route path="/reports" element={<AdminReports/>}/><Route path="/users" element={<AdminUsers/>}/><Route path="/profile" element={<Profile/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes>}
 return <div className="h-screen max-w-[480px] mx-auto bg-[#F2F5F9] flex flex-col shadow-xl">
 <header className="bg-[#1253A0] text-white px-4 py-3 flex items-center gap-2 font-bold"><ParkingCircle size={22}/>JogjaParkir<span className="ml-auto text-xs bg-white/20 rounded-full px-3 py-1 font-medium">{ROLE[r]}</span></header>
 <main className="flex-1 overflow-y-auto">{R[r]}</main>
 <nav className="grid border-t bg-white" style={{gridTemplateColumns:`repeat(${items.length},1fr)`}}>{items.map(([to,l,I])=><NavLink key={to} to={to} end className={({isActive})=>'flex flex-col items-center py-2 text-[11px] '+(isActive?'text-[#1253A0] font-bold':'text-[#667085]')}><I size={22}/>{l}</NavLink>)}</nav></div>}

/* ---------- PENGGUNA ---------- */
function HomeU(){const {s,loc}=useC();const nav=useNavigate();const [q,setQ]=useState(''),[st,setSt]=useState(''),[km,setKm]=useState(99)
 const list=useMemo(()=>s.parks.filter(p=>p.verified&&p.name.toLowerCase().includes(q.toLowerCase())&&(!st||stat(p,s.veh)===st)&&D(loc.p,p)<=km).sort((a,b)=>D(loc.p,a)-D(loc.p,b)),[s.parks,s.veh,q,st,km,loc.p])
 const near=list[0],last=s.tx[0]
 return <div className="p-4 space-y-3"><div><h2 className="text-lg font-extrabold">Halo, {s.user.name.split(' ')[0]} 👋</h2><p className="text-xs text-[#667085]">{loc.real?'Lokasi Anda terdeteksi (GPS)':'Lokasi simulasi: pusat Yogyakarta (izin lokasi belum aktif)'}</p></div>
 <input className={inp} placeholder="Cari tempat parkir di sekitar Anda" value={q} onChange={e=>setQ(e.target.value)}/><VehSel/>
 <div className="flex gap-2"><select className={inp+' !py-2'} value={st} onChange={e=>setSt(e.target.value)}><option value="">Semua status</option>{Object.keys(COL).map(k=><option key={k}>{k}</option>)}</select>
 <select className={inp+' !py-2'} value={km} onChange={e=>setKm(+e.target.value)}><option value={99}>Semua jarak</option><option value={1}>≤ 1 km</option><option value={2}>≤ 2 km</option><option value={3}>≤ 3 km</option></select></div>
 {near&&<div className="bg-[#1253A0] text-white rounded-2xl p-4"><p className="text-xs opacity-80">Terdekat</p><b>{near.name}</b><p className="text-sm mt-1">{near.free[s.veh]} slot tersedia dari {near.cap[s.veh]} · terisi {near.cap[s.veh]-near.free[s.veh]}</p></div>}
 <div className="grid grid-cols-3 gap-2 text-xs font-semibold">{[['Peta','/map',MapI],['Langganan','/sub',CreditCard],['Lapor/Usul','/report',Flag]].map(([l,t,I])=><button key={t} onClick={()=>nav(t)} className={card+' !p-3 flex flex-col items-center gap-1 text-[#1253A0]'}><I size={22}/>{l}</button>)}</div>
 {last&&<div className={card+' text-xs'}>Status parkir terakhir: <b>{last.t}</b> · {RP(last.amt)} ({last.m})</div>}
 <h3 className="font-bold text-sm">Lokasi Parkir Resmi ({list.length})</h3>{list.map(p=><ParkCard key={p.id} p={p}/>)}{!list.length&&<p className="text-center text-sm text-[#667085]">Tidak ada lokasi sesuai filter.</p>}<Demo/></div>}

const ic=c=>L.divIcon({className:'',html:`<div style="background:${c};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px #0005"></div>`,iconSize:[26,26],iconAnchor:[13,26]})
const Fly=({t})=>{const m=useMap();useEffect(()=>{t&&m.flyTo(t,16)},[t]);return null}
function Rt({from,to,done}){const map=useMap();useEffect(()=>{const c=L.Routing.control({waypoints:[L.latLng(from),L.latLng(to)],addWaypoints:false,show:false,fitSelectedRoutes:true,createMarker:()=>null,lineOptions:{styles:[{color:'#1253A0',weight:6}]}}).addTo(map)
 c.on('routesfound',e=>done(e.routes[0]));c.on('routingerror',()=>done(false));return()=>{try{map.removeControl(c)}catch{}}},[to[0],to[1]]);return null}
const idn=i=>{const r={Left:'belok kiri',SlightLeft:'belok sedikit ke kiri',SharpLeft:'belok tajam ke kiri',Right:'belok kanan',SlightRight:'belok sedikit ke kanan',SharpRight:'belok tajam ke kanan',TurnAround:'putar balik',Roundabout:'masuk bundaran'}[i.type];return i.type==='DestinationReached'?'Anda telah tiba di lokasi parkir':i.type==='Head'?'Mulai berjalan menuju tujuan':r?r+(i.road?` ke ${i.road}`:''):'terus lurus'+(i.road?` di ${i.road}`:'')}

function NavPanel({route,park,loc,close}){const [on,setOn]=useState(true),[last,setLast]=useState(''),[go,setGo]=useState(false);const done=useRef({}),step=useRef(0)
 const ok=typeof speechSynthesis!=='undefined',ins=route?.instructions||[],co=route?.coordinates||[]
 const speak=t=>{setLast(t);if(!on||!ok)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='id-ID';speechSynthesis.speak(u)}
 useEffect(()=>()=>{ok&&speechSynthesis.cancel()},[])
 useEffect(()=>{if(!go||!loc.real||!ins.length)return;let i=step.current;const pt=k=>co[ins[k].index]
  while(i<ins.length-1&&D(loc.p,pt(i))<.03)i++;step.current=i
  const m=D(loc.p,pt(i))*1000,once=(k,t)=>{if(!done.current[k]){done.current[k]=1;speak(t)}}
  if(i===ins.length-1){m<30?once('end',`Anda telah tiba di ${park.name}`):m<150&&once('near',`Tujuan Anda sekitar ${Math.round(m)} meter lagi`)}
  else if(m<40)once(i+'n',cap(idn(ins[i])));else if(m<200)once(i+'f',`Dalam ${Math.round(m/10)*10} meter, ${idn(ins[i])}`)},[loc.p[0],loc.p[1],go])
 const start=()=>{setGo(true);speak(`Navigasi dimulai. Jarak ${(route.summary.totalDistance/1000).toFixed(1)} kilometer. ${cap(idn(ins[1]||ins[0]))}`)}
 return <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-white rounded-2xl shadow-xl p-3 text-sm max-h-[55%] overflow-y-auto">
 <div className="flex justify-between items-center"><b>Ke {park.name}</b><button onClick={close}><X size={18}/></button></div>
 {route===null?<p className="text-xs my-2">Menghitung rute…</p>:route===false?<p className="text-xs my-2 text-[#D94343]">Rute OSRM tidak tersedia (cek internet). Gunakan Google Maps di bawah.</p>:<>
 <p className="text-xs text-[#667085]">{(route.summary.totalDistance/1000).toFixed(1)} km · {Math.round(route.summary.totalTime/60)} menit</p>
 {!loc.real&&<p className="text-[11px] bg-[#FFF6E5] text-[#8a5a00] rounded-lg p-2 my-2">GPS tidak aktif: rute dihitung dari lokasi simulasi dan suara tidak mengikuti posisi real-time. Gunakan daftar instruksi visual.</p>}
 <div className="flex gap-2 my-2"><button className={btn+' !py-2 text-xs'} onClick={start}>{go?'Mulai Ulang':'Mulai Navigasi Suara'}</button>
 <button className={btn2+' !w-12 !px-0 flex justify-center items-center'} onClick={()=>{setOn(!on);ok&&speechSynthesis.cancel()}} aria-label="Suara">{on&&ok?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>
 <button className={btn2+' !w-12 !px-0 flex justify-center items-center'} disabled={!last} onClick={()=>speak(last)} aria-label="Ulangi"><Repeat size={18}/></button></div>
 <p className="text-[11px] text-[#667085]">{!ok?'Browser tidak mendukung suara — gunakan instruksi visual':on?'🔊 Suara aktif':'🔇 Suara nonaktif'}{last&&` · Terakhir: “${last}”`}</p>
 <ol className="mt-2 space-y-1 text-xs">{ins.map((x,k)=><li key={k} className={'flex justify-between gap-2 '+(go&&k===step.current?'font-bold text-[#1253A0]':'')}><span>{k+1}. {cap(idn(x))}</span><span className="text-[#667085]">{Math.round(x.distance)} m</span></li>)}</ol></>}
 <a className={btn2+' block text-center text-xs mt-2'} target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&origin=${loc.p[0]},${loc.p[1]}&destination=${park.lat},${park.lng}`}>Buka di Google Maps</a></div>}

function MapPage(){const {s,loc,say}=useC();const nav=useNavigate();const [view,setView]=useState('map'),[st,setSt]=useState(''),[sel,setSel]=useState(null),[route,setRoute]=useState(null),[nv,setNv]=useState(null),[fly,setFly]=useState(null)
 const list=s.parks.filter(p=>p.verified&&(!st||stat(p,s.veh)===st)),v=s.veh
 return <div className="h-full flex flex-col"><div className="p-3 space-y-2 bg-white border-b"><VehSel/><div className="flex gap-2"><select className={inp+' !py-2'} value={st} onChange={e=>setSt(e.target.value)}><option value="">Semua status</option>{Object.keys(COL).map(k=><option key={k}>{k}</option>)}</select>
 <button className={btn2+' !w-auto !py-2 flex items-center gap-1 text-sm'} onClick={()=>setView(view==='map'?'list':'map')}>{view==='map'?<><List size={16}/>Daftar</>:<><MapI size={16}/>Peta</>}</button></div></div>
 {view==='list'?<div className="p-3 space-y-3 overflow-y-auto">{list.map(p=><ParkCard key={p.id} p={p}/>)}</div>:
 <div className="flex-1 relative min-h-[300px]"><MapContainer center={loc.p} zoom={15} className="h-full w-full" style={{minHeight:300}}>
 <TileLayer attribution="&copy; OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/><Fly t={fly}/>
 <CircleMarker center={loc.p} radius={9} pathOptions={{color:'#fff',fillColor:'#1253A0',fillOpacity:1,weight:3}}/>
 {list.map(p=><Marker key={p.id} position={[p.lat,p.lng]} icon={ic(COL[stat(p,v)])} eventHandlers={{click:()=>{setSel(p);setNv(null)}}}/>)}
 {nv&&<Rt from={loc.p} to={[nv.lat,nv.lng]} done={setRoute}/>}</MapContainer>
 <button className="absolute top-3 right-3 z-[1000] bg-white rounded-full p-3 shadow-lg" onClick={()=>{setFly([...loc.p]);say(loc.real?'Kembali ke posisi Anda':'Lokasi masih simulasi (pusat Yogyakarta)')}}><LocateFixed size={20} color="#1253A0"/></button>
 <div className="absolute top-3 left-3 z-[1000] bg-white rounded-xl shadow p-2 text-[10px] space-y-1">{Object.entries(COL).map(([k,c])=><div key={k} className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>{k}</div>)}</div>
 {sel&&!nv&&<div className="absolute bottom-2 left-2 right-2 z-[1000] bg-white rounded-2xl shadow-xl p-4"><div className="flex justify-between"><b className="text-sm">{sel.name}</b><button onClick={()=>setSel(null)}><X size={18}/></button></div>
 <p className="text-xs text-[#667085]">{sel.addr} · {D(loc.p,sel).toFixed(1)} km</p><div className="flex justify-between my-2 text-xs"><span>Slot <b>{sel.free[v]}/{sel.cap[v]}</b></span><span>{RP(sel.fee[v])}</span><Badge st={stat(sel,v)}/></div>
 <div className="flex gap-2"><button className={btn2+' !py-2 text-sm'} onClick={()=>nav('/park/'+sel.id)}>Lihat Detail</button><button className={btn+' !py-2 text-sm flex items-center justify-center gap-1'} onClick={()=>{setRoute(null);setNv(sel)}}><Navigation size={16}/>Petunjuk Arah</button></div></div>}
 {nv&&<NavPanel route={route} park={nv} loc={loc} close={()=>{setNv(null);setRoute(null)}}/>}</div>}</div>}

function Detail(){const {s,loc}=useC();const {id}=useParams();const nav=useNavigate();const p=s.parks.find(x=>x.id==id);if(!p)return null;const v=s.veh
 return <div className="p-4 space-y-3"><div className="h-28 rounded-2xl bg-gradient-to-br from-[#1253A0] to-[#5b8fd0] flex items-center justify-center text-white"><ParkingCircle size={56}/></div>
 <div className="flex justify-between"><div><h2 className="font-extrabold">{p.name}</h2><p className="text-xs text-[#667085]">{p.addr} · {D(loc.p,p).toFixed(1)} km</p></div><Badge st={stat(p,v)}/></div>
 <p className="text-xs text-[#16A36A] font-semibold">{p.verified?'✓ Resmi Terafiliasi':'Belum terverifikasi'} · Buka {p.hours} · {p.open?'Beroperasi':'Tutup'}</p>
 <div className="h-36 rounded-2xl overflow-hidden"><MapContainer center={[p.lat,p.lng]} zoom={16} className="h-full w-full" dragging={false} zoomControl={false} scrollWheelZoom={false}><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/><Marker position={[p.lat,p.lng]} icon={ic(COL[stat(p,v)])}/></MapContainer></div>
 <VehSel/><div className={card+' text-sm space-y-2'}>{VEH.map(([k,l])=><div key={k} className="flex justify-between"><span>{l}</span><span><b>{p.free[k]}</b>/{p.cap[k]} slot · {RP(p.fee[k])}</span></div>)}<p className="text-xs text-[#667085]">Pembayaran: {p.pay.join(', ')}</p></div><Demo/>
 <button className={btn} disabled={stat(p,v)==='Penuh'} onClick={()=>nav('/pay/'+p.id)}>{stat(p,v)==='Penuh'?'Parkir Penuh':'Parkir di Sini'}</button></div>}

function Pay(){const {s,up,say}=useC();const {id}=useParams();const nav=useNavigate();const p=s.parks.find(x=>x.id==id),v=s.veh;const [m,setM]=useState('QRIS'),[ld,setLd]=useState(false),[ok,setOk]=useState(null)
 const active=s.sub&&new Date(s.sub.end)>new Date()
 const pay=()=>{if(m==='Langganan'&&!active)return say('Langganan belum aktif');setLd(true);setTimeout(()=>{const t={id:'TX-'+Date.now().toString().slice(-6),park:p.id,veh:v,amt:m==='Langganan'?0:p.fee[v],m,t:now()}
 up(x=>({tx:[t,...x.tx],parks:x.parks.map(q=>q.id===p.id?{...q,free:{...q.free,[v]:Math.max(0,q.free[v]-1)}}:q)}));setLd(false);setOk(t)},1000)}
 if(ok)return <div className="p-8 text-center space-y-3"><CheckCircle2 size={64} className="mx-auto text-[#16A36A]"/><h2 className="font-extrabold">Pembayaran Berhasil</h2><p className="text-sm text-[#667085]">{ok.id} · {p.name} · {RP(ok.amt)} via {ok.m}</p><button className={btn} onClick={()=>nav('/')}>Kembali ke Beranda</button></div>
 return <div className="p-4 space-y-3"><h2 className="font-extrabold">Pembayaran Parkir</h2><div className={card+' text-sm space-y-1'}><p>{p.name}</p><p>{VEH.find(x=>x[0]===v)[1]}</p><p className="font-bold text-lg">{m==='Langganan'?'Rp0 (membership)':RP(p.fee[v])}</p></div>
 <div className="flex gap-2">{['QRIS','Tunai','Langganan'].map(k=><button key={k} onClick={()=>setM(k)} className={'flex-1 py-2 rounded-xl text-sm font-semibold border '+(m===k?'bg-[#1253A0] text-white':'bg-white')}>{k}</button>)}</div>
 <div className={card+' text-center text-sm'}>{m==='QRIS'&&<><QRCodeSVG value={`JOGJAPARKIR-DEMO|${p.id}|${p.fee[v]}`} size={150} className="mx-auto"/><p className="mt-2 text-xs text-[#667085]">QR demo · {RP(p.fee[v])}</p></>}
 {m==='Tunai'&&<p>Bayar {RP(p.fee[v])} langsung kepada petugas resmi, lalu konfirmasi (simulasi).</p>}{m==='Langganan'&&<p>{active?`Membership aktif hingga ${new Date(s.sub.end).toLocaleDateString('id-ID')}`:'Anda belum memiliki langganan aktif.'}</p>}</div>
 <button className={btn} disabled={ld} onClick={pay}>{ld?'Memproses…':m==='QRIS'?'Simulasikan Pembayaran':m==='Tunai'?'Konfirmasi Simulasi':'Gunakan Membership'}</button>
 {m==='Langganan'&&!active&&<button className={btn2} onClick={()=>nav('/sub')}>Berlangganan</button>}</div>}

function Sub(){const {s,up,say}=useC();const active=s.sub&&new Date(s.sub.end)>new Date()
 const buy=pl=>{const end=new Date(Date.now()+pl.days*864e5).toISOString(),sub={id:'JP-'+Date.now().toString().slice(-8),plan:pl.n,end};up(x=>({sub,subHist:[{...sub,price:pl.price,t:now()},...x.subHist]}));say('Langganan '+pl.n+' aktif!')}
 return <div className="p-4 space-y-3"><h2 className="font-extrabold">Langganan</h2>
 {active&&<div className="rounded-2xl p-5 text-white bg-gradient-to-br from-[#1253A0] to-[#0b2f66] space-y-3"><div className="flex justify-between items-center"><b className="flex items-center gap-1"><ParkingCircle size={20}/>JogjaParkir</b><span className="text-[11px] bg-white/20 rounded-full px-2 py-1">AKTIF · {s.sub.plan}</span></div>
 <div className="flex justify-between items-end"><div><p className="text-xs opacity-70">Nama</p><b>{s.user.name}</b><p className="text-xs opacity-70 mt-2">ID {s.sub.id}</p><p className="text-xs">Berlaku s.d. {new Date(s.sub.end).toLocaleDateString('id-ID')}</p></div><div className="bg-white p-1 rounded-lg"><QRCodeSVG value={s.sub.id} size={72}/></div></div></div>}
 {PLANS.map(pl=><div key={pl.id} className={card}><div className="flex justify-between"><b>{pl.n}</b><b className="text-[#1253A0]">{RP(pl.price)}</b></div><p className="text-xs text-[#667085]">Masa berlaku {pl.days} hari</p><ul className="text-xs list-disc ml-4 my-2">{pl.b.map(b=><li key={b}>{b}</li>)}</ul><button className={btn} onClick={()=>buy(pl)}>Berlangganan Sekarang</button></div>)}
 <p className="text-[11px] text-center text-[#667085]">Simulasi, tanpa transaksi sungguhan.</p></div>}

function Pick({pt,set}){useMapEvents({click:e=>set([e.latlng.lat,e.latlng.lng])});return pt?<Marker position={pt} icon={ic('#1253A0')}/>:null}
function Form({kind}){const {s,up,say,loc}=useC();const R=kind==='r',cats=R?['Parkir liar','Tarif tidak wajar','Tempat parkir tidak resmi','Pelanggaran lainnya']:['Parkir resmi belum terafiliasi','Lokasi potensial parkir resmi']
 const [f,setF]=useState({cat:cats[0],name:'',addr:'',desc:'',when:new Date().toISOString().slice(0,16),pt:null,img:''}),[ld,setLd]=useState(false);const S=k=>e=>setF({...f,[k]:e.target.value})
 const file=e=>{const r=new FileReader();r.onload=()=>setF(x=>({...x,img:r.result}));e.target.files[0]&&r.readAsDataURL(e.target.files[0])}
 const send=()=>{if(f.desc.length<10||!f.pt||(!R&&(!f.name||!f.addr)))return say('Lengkapi: deskripsi (min 10 karakter), titik peta'+(R?'':', nama & alamat'));setLd(true)
 setTimeout(()=>{const id=(R?'LP-':'RK-')+Date.now().toString().slice(-6),k=R?'reports':'recs';up(x=>({[k]:[{...f,id,img:f.img.length<2e5?f.img:'',status:R?RSTAT[0]:KSTAT[0],by:x.user.name,t:now()},...x[k]]}));setLd(false);say('Terkirim! ID '+id);setF({...f,desc:'',name:'',addr:'',pt:null,img:''})},800)}
 return <div className="space-y-3"><select className={inp} value={f.cat} onChange={S('cat')}>{cats.map(c=><option key={c}>{c}</option>)}</select>
 {!R&&<><input className={inp} placeholder="Nama lokasi" value={f.name} onChange={S('name')}/><input className={inp} placeholder="Alamat" value={f.addr} onChange={S('addr')}/></>}
 <textarea className={inp} rows={3} placeholder={R?'Deskripsi kejadian':'Deskripsi lokasi'} value={f.desc} onChange={S('desc')}/>{R&&<input type="datetime-local" className={inp} value={f.when} onChange={S('when')}/>}
 <p className="text-xs text-[#667085]">Ketuk peta untuk memilih lokasi {f.pt&&'✓'}</p><div className="h-44 rounded-xl overflow-hidden"><MapContainer center={loc.p} zoom={14} className="h-full w-full"><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/><Pick pt={f.pt} set={pt=>setF(x=>({...x,pt}))}/></MapContainer></div>
 <label className={btn2+' flex items-center justify-center gap-2 cursor-pointer'}><Camera size={18}/>Pilih Foto<input type="file" accept="image/*" hidden onChange={file}/></label>{f.img&&<img src={f.img} className="h-32 rounded-xl object-cover w-full"/>}
 <button className={btn} disabled={ld} onClick={send}>{ld?'Mengirim…':R?'Kirim Laporan':'Kirim Rekomendasi'}</button></div>}
function ReportPage(){const [t,setT]=useState('r');return <div className="p-4 space-y-3"><div className="flex gap-2">{[['r','Laporan'],['k','Rekomendasi Lokasi']].map(([k,l])=><button key={k} onClick={()=>setT(k)} className={'flex-1 py-2 rounded-xl text-sm font-semibold '+(t===k?'bg-[#1253A0] text-white':'bg-white')}>{l}</button>)}</div><Form key={t} kind={t}/></div>}

function Hist(){const {s}=useC();const [t,setT]=useState('tx');const nm=id=>s.parks.find(p=>p.id===id)?.name
 const rows={tx:s.tx.map(x=>[x.id,`${nm(x.park)} · ${x.veh} · ${RP(x.amt)} (${x.m})`,x.t]),sub:s.subHist.map(x=>[x.id,`${x.plan} · ${RP(x.price)}`,x.t]),rp:s.reports.map(x=>[x.id,`${x.cat}: ${x.desc}`,x.status]),rk:s.recs.map(x=>[x.id,`${x.name} — ${x.addr}`,x.status])}[t]
 return <div className="p-4 space-y-3"><div className="flex gap-1 overflow-x-auto">{[['tx','Parkir & Bayar'],['sub','Langganan'],['rp','Laporan'],['rk','Rekomendasi']].map(([k,l])=><button key={k} onClick={()=>setT(k)} className={'px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap '+(t===k?'bg-[#1253A0] text-white':'bg-white')}>{l}</button>)}</div>
 {rows.map(r=><div key={r[0]} className={card+' text-xs'}><b>{r[0]}</b><p>{r[1]}</p><p className="text-[#1253A0] font-semibold">{r[2]}</p></div>)}{!rows.length&&<p className="text-center text-sm text-[#667085]">Belum ada data.</p>}</div>}

function Profile(){const {s,up,say}=useC();const [f,setF]=useState(s.user)
 return <div className="p-4 space-y-3"><div className="text-center"><div className="w-20 h-20 rounded-full bg-[#E5EFF8] mx-auto flex items-center justify-center text-[#1253A0]"><User size={40}/></div><p className="text-xs text-[#667085] mt-2">{ROLE[s.user.role]}</p></div>
 {[['name','Nama'],['email','Email'],['phone','Nomor telepon']].map(([k,l])=><label key={k} className="block text-xs font-semibold">{l}<input className={inp+' mt-1 font-normal'} value={f[k]||''} onChange={e=>setF({...f,[k]:e.target.value})}/></label>)}
 <button className={btn} onClick={()=>{if(!f.name)return say('Nama wajib diisi');up({user:f});say('Profil disimpan')}}>Simpan Profil</button>
 <button className={btn2} onClick={()=>{up({user:null});say('Berhasil keluar')}}>Logout</button></div>}

/* ---------- PENGELOLA ---------- */
const MP=1
function MgrDash(){const {s,say}=useC();const p=s.parks.find(x=>x.id===MP);const [id,setId]=useState('')
 return <div className="p-4 space-y-3"><h2 className="font-extrabold">{p.name}</h2><span className={'text-xs font-semibold '+(p.open?'text-[#16A36A]':'text-[#D94343]')}>{p.open?'● Beroperasi':'● Tutup'}</span>
 {VEH.map(([k,l])=><div key={k} className={card}><div className="flex justify-between text-sm"><b>{l}</b><Badge st={stat(p,k)}/></div><p className="text-xs mt-1">Kapasitas {p.cap[k]} · Tersedia <b>{p.free[k]}</b> · Terisi <b>{p.cap[k]-p.free[k]}</b></p></div>)}
 <div className={card+' space-y-2'}><b className="text-sm">Verifikasi Membership</b><input className={inp} placeholder="ID membership (mis. JP-12345678)" value={id} onChange={e=>setId(e.target.value)}/><button className={btn} onClick={()=>say(s.sub&&s.sub.id===id.trim()&&new Date(s.sub.end)>new Date()?'✓ Membership valid':'✗ Membership tidak valid / kedaluwarsa')}>Verifikasi</button></div></div>}
function MgrSlots(){const {s,up}=useC();const p=s.parks.find(x=>x.id===MP)
 const set=fn=>up(x=>({parks:x.parks.map(q=>q.id===MP?fn(q):q)}))
 return <div className="p-4 space-y-3"><h2 className="font-extrabold">Update Slot</h2>{VEH.map(([k,l])=><div key={k} className={card+' flex items-center justify-between'}><div><b className="text-sm">{l}</b><p className="text-xs text-[#667085]">Kapasitas {p.cap[k]}</p></div>
 <div className="flex items-center gap-3"><button className={btn2+' !w-10 !p-2'} onClick={()=>set(q=>({...q,free:{...q.free,[k]:Math.max(0,q.free[k]-1)}}))}><Minus size={16} className="mx-auto"/></button><b className="text-lg w-8 text-center">{p.free[k]}</b><button className={btn2+' !w-10 !p-2'} onClick={()=>set(q=>({...q,free:{...q.free,[k]:Math.min(q.cap[k],q.free[k]+1)}}))}><Plus size={16} className="mx-auto"/></button></div></div>)}
 <button className={p.open?btn2:btn} onClick={()=>set(q=>({...q,open:!q.open}))}>{p.open?'Tandai Tutup':'Tandai Beroperasi'}</button></div>}
function TxList(){const {s}=useC();return <div className="p-4 space-y-3"><h2 className="font-extrabold">Riwayat Transaksi</h2>{s.tx.map(x=><div key={x.id} className={card+' text-xs'}><b>{x.id}</b> · {x.t}<p>{s.parks.find(p=>p.id===x.park)?.name} · {x.veh} · {RP(x.amt)} ({x.m})</p></div>)}</div>}

/* ---------- ADMIN ---------- */
function AdminDash(){const {s}=useC();const cap=s.parks.reduce((a,p)=>a+p.cap.motor+p.cap.mobil+p.cap.lain,0)
 return <div className="p-4 grid grid-cols-2 gap-3 text-center">{[['Pengguna',s.users.length+1],['Tempat Parkir',s.parks.length],['Terverifikasi',s.parks.filter(p=>p.verified).length],['Total Kapasitas',cap],['Laporan',s.reports.length],['Rekomendasi',s.recs.length]].map(([l,n])=><div key={l} className={card}><p className="text-2xl font-extrabold text-[#1253A0]">{n}</p><p className="text-xs text-[#667085]">{l}</p></div>)}</div>}
function AdminParks(){const {s,up}=useC();const set=(id,fn)=>up(x=>({parks:x.parks.map(p=>p.id===id?fn(p):p)}))
 return <div className="p-4 space-y-3"><h2 className="font-extrabold">Pengelolaan Parkir & Tarif</h2>{s.parks.map(p=><div key={p.id} className={card+' text-sm space-y-2'}><div className="flex justify-between"><b>{p.name}</b><span className={'text-xs font-semibold '+(p.verified?'text-[#16A36A]':'text-[#F0A329]')}>{p.verified?'Terverifikasi':'Menunggu'}</span></div>
 <div className="grid grid-cols-3 gap-2">{VEH.map(([k,l])=><label key={k} className="text-[10px]">Tarif {l}<input type="number" className={inp+' !py-1'} value={p.fee[k]} onChange={e=>set(p.id,q=>({...q,fee:{...q.fee,[k]:+e.target.value||0}}))}/></label>)}</div>
 <button className={p.verified?btn2:btn} onClick={()=>set(p.id,q=>({...q,verified:!q.verified}))}>{p.verified?'Cabut Verifikasi':'Verifikasi Tempat Parkir'}</button></div>)}</div>}
function AdminReports(){const {s,up}=useC();const U=(k,id,st)=>up(x=>({[k]:x[k].map(r=>r.id===id?{...r,status:st}:r)}))
 const L=(k,arr,O)=>arr.map(r=><div key={r.id} className={card+' text-xs space-y-1'}><b>{r.id}</b> · {r.by}<p>{r.cat}: {r.desc}</p>{r.img&&<img src={r.img} className="h-20 rounded-lg"/>}<select className={inp+' !py-2'} value={r.status} onChange={e=>U(k,r.id,e.target.value)}>{O.map(o=><option key={o}>{o}</option>)}</select></div>)
 return <div className="p-4 space-y-3"><h2 className="font-extrabold">Laporan</h2>{L('reports',s.reports,RSTAT)}{!s.reports.length&&<p className="text-xs text-[#667085]">Belum ada laporan.</p>}<h2 className="font-extrabold">Rekomendasi Lokasi</h2>{L('recs',s.recs,KSTAT)}{!s.recs.length&&<p className="text-xs text-[#667085]">Belum ada rekomendasi.</p>}</div>}
function AdminUsers(){const {s,up}=useC();return <div className="p-4 space-y-3"><h2 className="font-extrabold">Pengguna</h2>{s.users.map((u,i)=><div key={u.e} className={card+' flex justify-between items-center text-sm'}><div><b>{u.n}</b><p className="text-xs text-[#667085]">{u.e}</p></div><button className={(u.on?btn2:btn)+' !w-auto !py-2 text-xs'} onClick={()=>up(x=>({users:x.users.map((q,j)=>j===i?{...q,on:!q.on}:q)}))}>{u.on?'Nonaktifkan':'Aktifkan'}</button></div>)}</div>}

function Gate(){const {s}=useC();return s.user?<Shell/>:<Login/>}
export default function App(){return <Provider><HashRouter><Gate/></HashRouter></Provider>}
