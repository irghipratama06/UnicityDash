'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {autoConnect} from '@unicitylabs/sphere-sdk/connect/browser';
import {SPHERE_NETWORKS} from '@unicitylabs/sphere-sdk/connect';

const SPHERE_URL='https://sphere.unicity.network';
const UCT_COIN_ID='f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0';
const DEPOSIT_UCT=5;
const ATTEMPTS_PER_DEPOSIT=20;
const POOL_SHARE=0.5;
const LS='uct-dash-simple-v1';

type Client=Awaited<ReturnType<typeof autoConnect>>['client'];
type Score={address:string;distance:number;time:number};
type Store={wallets:Record<string,{attempts:number;deposited:number}>;scores:Score[];pool:number};
const empty:Store={wallets:{},scores:[],pool:0};
function short(s:string){return s.length>18?`${s.slice(0,9)}…${s.slice(-7)}`:s}
function load():Store{try{return JSON.parse(localStorage.getItem(LS)||'null')||empty}catch{return empty}}
function save(s:Store){localStorage.setItem(LS,JSON.stringify(s))}
function baseUnits(n:number){return BigInt(n)*10n**18n}
function week(){const d=new Date();const day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day);return d.toISOString().slice(0,10)}

export default function Home(){
 const canvasRef=useRef<HTMLCanvasElement|null>(null);const clientRef=useRef<Client|null>(null);const disconnectRef=useRef<(()=>Promise<void>)|null>(null);
 const [address,setAddress]=useState('');const [connecting,setConnecting]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const [attempts,setAttempts]=useState(0);const [distance,setDistance]=useState(0);const [playing,setPlaying]=useState(false);const [gameOver,setGameOver]=useState(false);const [leader,setLeader]=useState<Score[]>([]);const [pool,setPool]=useState(0);
 const gameRef=useRef({running:false,dead:false,start:0,distance:0,vy:0,y:0,last:0});
 const refresh=useCallback((a=address)=>{const s=load();setAttempts(a?s.wallets[a]?.attempts||0:0);setPool(s.pool);setLeader([...s.scores].sort((x,y)=>y.distance-x.distance).slice(0,50))},[address]);
 useEffect(()=>{refresh()},[refresh]);
 const connect=useCallback(async()=>{setError('');setConnecting(true);try{const r=await autoConnect({dapp:{name:'UCT Dash',url:location.origin},network:SPHERE_NETWORKS.testnet2,walletUrl:SPHERE_URL,permissions:['identity:read','transfer:request'],silent:false});clientRef.current=r.client;disconnectRef.current=r.disconnect;const a=r.connection.identity.chainPubkey;setAddress(a);const s=load();if(!s.wallets[a]){s.wallets[a]={attempts:0,deposited:0};save(s)}setAttempts(s.wallets[a].attempts);refresh(a)}catch(e){setError(e instanceof Error?e.message:'Wallet connection failed')}finally{setConnecting(false)}},[refresh]);
 const disconnect=useCallback(async()=>{try{await disconnectRef.current?.()}catch{}clientRef.current=null;disconnectRef.current=null;setAddress('');setAttempts(0);setPlaying(false)},[]);
 const deposit=useCallback(async()=>{setError('');if(!clientRef.current||!address)return setError('Connect Sphere first.');const treasury=process.env.NEXT_PUBLIC_SPHERE_TREASURY_ADDRESS;if(!treasury)return setError('Treasury belum diisi di Vercel.');setBusy(true);try{await clientRef.current.intent('send',{to:treasury,amount:baseUnits(DEPOSIT_UCT).toString(),coinId:UCT_COIN_ID});const s=load();const w=s.wallets[address]||{attempts:0,deposited:0};w.attempts+=ATTEMPTS_PER_DEPOSIT;w.deposited+=DEPOSIT_UCT;s.wallets[address]=w;s.pool+=DEPOSIT_UCT*POOL_SHARE;save(s);setAttempts(w.attempts);setPool(s.pool);setError('');}catch(e){setError(e instanceof Error?e.message:'Deposit gagal')}finally{setBusy(false)}},[address]);
 const finish=useCallback((d:number)=>{if(!address)return;const s=load();const w=s.wallets[address]||{attempts:0,deposited:0};w.attempts=Math.max(0,w.attempts-1);s.wallets[address]=w;s.scores.push({address,distance:Math.floor(d),time:Date.now()});save(s);setAttempts(w.attempts);setLeader([...s.scores].sort((a,b)=>b.distance-a.distance).slice(0,50));setPlaying(false);setGameOver(true)},[address]);
 const start=()=>{if(!address)return setError('Connect Sphere dulu.');if(attempts<=0)return setError('Percobaan habis. Deposit 5 UCT untuk 20 percobaan.');const g=gameRef.current;g.running=true;g.dead=false;g.start=performance.now();g.distance=0;g.vy=0;g.y=372;g.last=performance.now();setDistance(0);setGameOver(false);setPlaying(true)};
 const jump=useCallback(()=>{if(gameRef.current.running&&!gameRef.current.dead)gameRef.current.vy=-760},[]);
const ctx=c.getContext('2d')!;let raf=0;const W=960,H=540,ground=430;
 const h=(e:KeyboardEvent)=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();jump()}};window.addEventListener('keydown',h);c.addEventListener('pointerdown',jump);raf=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',h);c.removeEventListener('pointerdown',jump)}},[finish,jump]);
 return <main className="shell"><div className="topbar"><div className="brand"><span className="dot"/>UCT DASH</div><div className="wallet">{address?<><span className="small">{short(address)}</span><button className="btn" onClick={disconnect}>Disconnect</button></>:<button className="btn primary" onClick={connect} disabled={connecting}>{connecting?'Connecting…':'Connect Sphere'}</button>}</div></div><div className="stats"><div className="card"><div className="label">ATTEMPTS</div><div className="value">{attempts}</div></div><div className="card"><div className="label">DISTANCE</div><div className="value">{distance} m</div></div><div className="card"><div className="label">WEEKLY POOL</div><div className="value">{pool.toFixed(2)} UCT</div></div><div className="card"><div className="label">WEEK</div><div className="value">{week()}</div></div></div>{error&&<div className="notice error">{error}</div>}<div className="gameWrap"><canvas ref={canvasRef} width={960} height={540}/>{(!playing||gameOver)&&<div className="overlay"><div className="modal"><h1>{gameOver?'GAME OVER':'READY?'}</h1><p className="muted">{gameOver?`Jarak ${distance} m. Sisa percobaan: ${attempts}.`:'Tap layar untuk lompat. Satu game over = satu percobaan.'}</p><div className="actions"><button className="btn primary" onClick={start} disabled={!address||attempts<=0}>{attempts>0?'PLAY':'NO ATTEMPTS'}</button><button className="btn" onClick={deposit} disabled={!address||busy}>{busy?'Waiting wallet…':'Deposit 5 UCT → 20 tries'}</button></div></div></div>}</div><section className="leader card"><div className="leaderHead"><div><h2>Leaderboard</h2><div className="small">Jarak tertinggi tersimpan di browser ini</div></div><div className="small">50% deposit → pool</div></div><div className="rows">{leader.length?leader.map((r,i)=><div className="row" key={`${r.address}-${r.time}`}><div className="rank">#{i+1}</div><div className="name">{short(r.address)}</div><div><b>{r.distance}</b> m</div></div>):<div className="notice">Belum ada run.</div>}</div></section><div className="footer">Versi sederhana tanpa database. Data attempts, leaderboard, dan pool disimpan di browser perangkat ini. Testnet only.</div></main>}
