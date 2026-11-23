import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, type MotionStyle } from 'framer-motion'
import confetti from 'canvas-confetti'
import { TextAnimationCollection, LumenCta } from '@designcodeio/threeui'
import '@designcodeio/threeui/style.css'
import * as XLSX from 'xlsx'
import {
  Activity, ArrowDownToLine, ArrowUpFromLine, BarChart3, Check,
  ChevronDown, CircleHelp, ClipboardList, Dices, Download, Gamepad2, Gift,
  History, Home, Monitor, Moon, Plus, RotateCcw, Search, Settings, ShieldCheck,
  Sparkles, Trophy, Users, Volume2, VolumeX, WandSparkles, X, Trash2, Edit3,
  Play, Pause, Maximize2, LayoutDashboard
} from 'lucide-react'
import { db, defaultSettings, getSettings, makeId, saveSettings, type AppSettings, type GameResult, type Student } from './db'
import { chooseStudents, randomInteger } from './random'

type Page = 'overview'|'games'|'quiz'|'quiz-live'|'teams'|'students'|'analytics'|'history'|'settings'|'presentation'
type Game = 'box'|'wheel'|'number'|'card'
const gameNames: Record<Game,string> = { box:'Mystery Box', wheel:'Lucky Wheel', number:'Number Hunt', card:'Card Roulette' }
const demoNames = ['Nguyễn Minh Anh','Trần Gia Bảo','Lê Hoàng Nam','Phạm Ngọc Hà','Võ Tuấn Kiệt','Đặng Khánh Linh','Bùi Đức Anh','Hoàng Yến Nhi','Đỗ Quang Huy','Phan Thảo Vy','Ngô Nhật Minh','Dương Bảo Ngọc']
const iconFor: Record<Page,typeof Home> = { overview:Home,games:Gamepad2,quiz:ClipboardList,'quiz-live':ClipboardList,teams:Users,students:Users,analytics:BarChart3,history:History,settings:Settings,presentation:Monitor }
const shuffle = <T,>(items:T[]) => { const copy=[...items]; for(let i=copy.length-1;i>0;i--){const j=randomInteger(0,i);[copy[i],copy[j]]=[copy[j],copy[i]]} return copy }
function App() {
  const [page,setPage] = useState<Page>('overview')
  const [students,setStudents] = useState<Student[]>([])
  const [results,setResults] = useState<GameResult[]>([])
  const [settings,setSettings] = useState<AppSettings>(defaultSettings)
  const [ready,setReady] = useState(false)
  const [query,setQuery] = useState('')
  const [game,setGame] = useState<Game>('box')
  const [count,setCount] = useState(1)
  const [durationSeconds,setDurationSeconds] = useState(30)
  const [countdown,setCountdown] = useState(0)
  const [quizQuestions,setQuizQuestions] = useState<any[]>([])
  const [quizSubject,setQuizSubject] = useState('Toán')
  const [quizTopic,setQuizTopic] = useState('Bài 1')
  const [arenaSubject,setArenaSubject] = useState('Toán')
  const [arenaTopic,setArenaTopic] = useState('Bài 1')
  const [quizLibrary,setQuizLibrary] = useState<any[]>([])
  const [quizRoomId,setQuizRoomId] = useState('')
  const [selectedChoice,setSelectedChoice] = useState<any>(null)
  const [questionCorrect,setQuestionCorrect] = useState(false)
  const [activeTeamIndex,setActiveTeamIndex] = useState(0)
  const [quizCount,setQuizCount] = useState(10)
  const [quizDeck,setQuizDeck] = useState<any[]>([])
  const [quizIndex,setQuizIndex] = useState(0)
  const [quizAnswer,setQuizAnswer] = useState<any>(null)
  const [quizScores,setQuizScores] = useState<Record<string,number>>({})
  const [quizTeam,setQuizTeam] = useState('Tổ 1')
  const [quizFinished,setQuizFinished] = useState(false)
  const [quizReveal,setQuizReveal] = useState(false)
  const [quizAwarded,setQuizAwarded] = useState<string[]>([])
  const [quizScoreDrafts,setQuizScoreDrafts] = useState<Record<string,string>>({})
  const [quizTimeLimit,setQuizTimeLimit] = useState(30)
  const [quizTimeLeft,setQuizTimeLeft] = useState(30)
  const [quizTimerActive,setQuizTimerActive] = useState(false)
  const [quizSound,setQuizSound] = useState(true)
  const [randomOpen,setRandomOpen] = useState(false)
  const [randomVisible,setRandomVisible] = useState(true)
  const [teamName,setTeamName] = useState('')
  const [teamNames,setTeamNames] = useState<string[]>([])
  const [avatarChoices,setAvatarChoices] = useState<number[]>([])
  const [boxParticipants,setBoxParticipants] = useState<Student[]>([])
  const [eliminatedIds,setEliminatedIds] = useState<string[]>([])
  const [activeHitId,setActiveHitId] = useState<string|null>(null)
  const [manualNames,setManualNames] = useState('')
  const [mode,setMode] = useState<AppSettings['mode']>('no-repeat')
  const [winners,setWinners] = useState<Student[]>([])
  const [revealed,setRevealed] = useState(false)
  const [busy,setBusy] = useState(false)
  const [min,setMin] = useState(1)
  const [max,setMax] = useState(45)
  const [numberResult,setNumberResult] = useState<number|null>(null)
  const [cardParticipants,setCardParticipants] = useState<Student[]>([])
  const [cardRotation,setCardRotation] = useState(0)
  const [cardWinner,setCardWinner] = useState<Student|null>(null)
  const [editing,setEditing] = useState<Student|null>(null)
  const [nameInput,setNameInput] = useState('')
  const [groupInput,setGroupInput] = useState('')
  const [toast,setToast] = useState('')
  const [filterGame,setFilterGame] = useState('all')
  const [presentation,setPresentation] = useState(false)

  const refresh = async () => {
    const [s,r,conf] = await Promise.all([db.students.toArray(),db.results.orderBy('selectedAt').reverse().toArray(),getSettings()])
    setStudents(s.sort((a,b)=>a.number-b.number)); setTeamNames([...new Set([...s.map(x=>x.group), ...JSON.parse(localStorage.getItem('class-arena-teams')||'[]')].filter(Boolean))]); setResults(r); setSettings(conf); setMode(conf.mode); setDurationSeconds(conf.durationSeconds ?? 30); setCount(conf.selectionCount ?? 1)
  }
  useEffect(()=>{ (async()=>{
    const s = await db.students.count()
    if (!s) {
      await db.students.bulkAdd(demoNames.map((name,i)=>({id:makeId(),number:i+1,name,group:`Tổ ${i%4+1}`,active:true,selectedCount:0,createdAt:Date.now()})))
    }
    await refresh()
    try {
      const library=JSON.parse(localStorage.getItem('class-arena-question-library')||'[]')
      setQuizLibrary(Array.isArray(library)?library:[])
      const match=window.location.pathname.match(/^\/room\/([^/]+)/)
      if(match){
        const saved=JSON.parse(localStorage.getItem('class-arena-room-'+match[1])||'null')
        if(saved){
          setQuizRoomId(match[1]);setQuizDeck(saved.deck||[]);setQuizIndex(saved.index||0);setQuizScores(saved.scores||{});setQuizAwarded(saved.awarded||[]);setQuizFinished(!!saved.finished);setTeamNames(saved.teams||[])
          setQuizSubject(saved.subject||'');setQuizTopic(saved.topic||'');setSelectedChoice(saved.selectedChoice??null);setQuestionCorrect(!!saved.questionCorrect);setActiveTeamIndex(saved.activeTeamIndex||0);setQuizTimeLimit(saved.timeLimit??30);setQuizTimeLeft(saved.timeLeft??30);setPage('quiz-live')
        } else { /* Keep room URL and saved data; never auto-delete a room. */ }
      }
    } catch {}
    setReady(true)
  })() },[])
  useEffect(()=>{
    if(!quizRoomId||!quizDeck.length)return
    const key='class-arena-room-'+quizRoomId
    localStorage.setItem(key,JSON.stringify({deck:quizDeck,index:quizIndex,scores:quizScores,awarded:quizAwarded,finished:quizFinished,teams:teamNames,subject:quizSubject,topic:quizTopic,timeLimit:quizTimeLimit,timeLeft:quizTimeLeft,selectedChoice,questionCorrect,activeTeamIndex}))
  },[quizRoomId,quizDeck,quizIndex,quizScores,quizAwarded,quizFinished,teamNames,quizSubject,quizTopic,quizTimeLimit,quizTimeLeft,selectedChoice,questionCorrect,activeTeamIndex])
  const activeStudents = students.filter(s=>s.active)
  const completedResults = results.filter(r=>r.status==='completed')
  const uniqueSelected = new Set(completedResults.map(r=>r.studentId)).size
  const filteredStudents = students.filter(s=>`${s.name} ${s.number} ${s.group}`.toLowerCase().includes(query.toLowerCase()))
  const eligible = useMemo(()=>activeStudents.filter(s=>mode!=='no-repeat'||!settings.noRepeatCycle.includes(s.id)),[activeStudents,mode,settings.noRepeatCycle])
  const notify = (msg:string)=>{setToast(msg); window.setTimeout(()=>setToast(''),2600)}
  useEffect(()=>{if(quizFinished&&!settings.reducedMotion){confetti({particleCount:220,spread:150,startVelocity:58,gravity:.72,ticks:240,origin:{x:.5,y:.42}});window.setTimeout(()=>confetti({particleCount:130,spread:110,startVelocity:42,origin:{x:.2,y:.55}}),300);window.setTimeout(()=>confetti({particleCount:130,spread:110,startVelocity:42,origin:{x:.8,y:.55}}),520)}},[quizFinished,settings.reducedMotion])
  const playQuizTone = (frequency=660) => { if(!quizSound)return; try { const AudioContextClass=window.AudioContext||(window as any).webkitAudioContext; if(!AudioContextClass)return; const ctx=new AudioContextClass(); const oscillator=ctx.createOscillator(); const gain=ctx.createGain(); oscillator.type='sine'; oscillator.frequency.value=frequency; gain.gain.setValueAtTime(.08,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22); oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime+.22); oscillator.onended=()=>void ctx.close() } catch {} }
  useEffect(()=>{if(page!=='quiz-live'||!quizDeck.length||quizFinished)return;setQuizTimeLeft(quizTimeLimit);setQuizTimerActive(quizTimeLimit>0)},[page,quizIndex,quizDeck.length,quizFinished,quizTimeLimit])
  useEffect(()=>{if(!quizTimerActive||page!=='quiz-live')return;const timer=window.setInterval(()=>setQuizTimeLeft(v=>{if(v<=1){window.clearInterval(timer);setQuizTimerActive(false);playQuizTone(220);notify('Hết giờ câu hỏi!');return 0}if(v<=6&&v>1)playQuizTone(520);return v-1}),1000);return()=>window.clearInterval(timer)},[quizTimerActive,page,quizSound])
  const updateSettings = async (patch:Partial<AppSettings>) => {
    const next={...settings,...patch}; setSettings(next); await saveSettings(next)
  }
  const changeCount = (value:number) => {
    const next = Math.max(1, Math.min(Math.max(1, eligible.length), Math.floor(value) || 1))
    setCount(next)
    void updateSettings({ selectionCount: next })
  }
  const runGame = async (requestedCount?: number, forcedStudent?: Student) => {
    if (busy) return
    const seconds = Math.max(1, Math.min(300, durationSeconds))
    const delay = seconds * 1000
    setCountdown(seconds)
    setBusy(true)
    setRevealed(false)
    setWinners([])
    setNumberResult(null)
    setEliminatedIds([])
    setActiveHitId(null)
    setBoxParticipants([])
    let selected: Student[] = []
    let pickedNumber: number | null = null
    let participantPool: Student[] = []

    if (game === 'number') {
      pickedNumber = forcedStudent?.number ?? randomInteger(Math.min(min, max), Math.max(min, max))
      const student = forcedStudent ?? students.find(s => s.number === pickedNumber && s.active)
      if (student) selected = [student]
    } else {
      participantPool = mode === 'no-repeat'
        ? activeStudents.filter(s => !settings.noRepeatCycle.includes(s.id))
        : [...activeStudents]
      if (!participantPool.length && mode === 'no-repeat') {
        const ok = window.confirm('Đã chọn hết học sinh trong chu kỳ. Bắt đầu chu kỳ mới?')
        if (!ok) { setBusy(false); setCountdown(0); return }
        await updateSettings({ noRepeatCycle: [] })
        participantPool = [...activeStudents]
      }
      const wanted = Math.max(1, Math.min(requestedCount ?? count, participantPool.length))
      selected = forcedStudent ? [forcedStudent] : chooseStudents(participantPool, wanted, mode, [])
      if (!selected.length) {
        setBusy(false); setCountdown(0); notify('Không có học sinh đủ điều kiện.'); return
      }
      if (game === 'box') {
        setBoxParticipants(participantPool)
        const winnerIds = new Set(selected.map(s => s.id))
        const eliminationOrder = participantPool
          .filter(s => !winnerIds.has(s.id))
        const randomizedEliminationOrder = shuffle(eliminationOrder)
        randomizedEliminationOrder.forEach((student, index) => {
          // Red X rises from beneath the platform, strikes, then the gift is physically ejected.
          const firstHit = Math.min(700, delay * 0.06)
          const lastHit = Math.max(firstHit, delay - Math.min(1500, delay * 0.08))
          const hitAt = randomizedEliminationOrder.length <= 1
            ? firstHit
            : firstHit + (lastHit - firstHit) * index / (randomizedEliminationOrder.length - 1)
          window.setTimeout(() => {
            setActiveHitId(student.id)
            window.setTimeout(() => {
              setEliminatedIds(current => current.includes(student.id) ? current : [...current, student.id])
            }, 430)
            window.setTimeout(() => setActiveHitId(current => current === student.id ? null : current), 760)
          }, hitAt)
        })
      }
    }

    const startedAt = Date.now()
    const countdownTimer = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((delay - (Date.now() - startedAt)) / 1000)))
    }, 100)

    window.setTimeout(async () => {
      window.clearInterval(countdownTimer)
      setCountdown(0)
      setNumberResult(pickedNumber)
      setWinners(selected)
      const avatarPool = shuffle(Array.from({length:20},(_,i)=>i+1))
      setAvatarChoices(selected.map((_,i) => avatarPool[i % avatarPool.length]))
      setRevealed(true)
      setBusy(false)
      if (selected.length) await recordWinners(selected)
      if (!settings.reducedMotion) {
        const burst = (origin: { x: number; y: number }) => confetti({
          particleCount: 95, spread: 90, startVelocity: 48, gravity: 0.85,
          ticks: 190, scalar: 1.05, origin
        })
        burst({ x: 0.16, y: 0.5 })
        burst({ x: 0.84, y: 0.5 })
        window.setTimeout(() => confetti({
          particleCount: 180, spread: 125, startVelocity: 55,
          gravity: 0.8, ticks: 220, origin: { x: 0.5, y: 0.36 }
        }), 260)
        window.setTimeout(() => confetti({
          particleCount: 100, spread: 160, startVelocity: 38,
          gravity: 0.95, ticks: 180, origin: { x: 0.5, y: 0.2 }
        }), 750)
      }
    }, delay)
  }

  const runCardGame = async () => {
    if (busy) return
    let pool = mode === 'no-repeat' ? activeStudents.filter(s => !settings.noRepeatCycle.includes(s.id)) : [...activeStudents]
    if (!pool.length && mode === 'no-repeat') {
      const ok = window.confirm('Đã chọn hết học sinh trong chu kỳ. Bắt đầu chu kỳ mới?')
      if (!ok) return
      await updateSettings({ noRepeatCycle: [] })
      pool = [...activeStudents]
    }
    if (!pool.length) { notify('Không có học sinh đủ điều kiện.'); return }
    const cards = shuffle(pool).slice(0, Math.min(10, pool.length))
    const selected = chooseStudents(cards, 1, mode, [])
    const winner = selected[0]
    if (!winner) { notify('Không thể chọn thẻ.'); return }
    const winnerIndex = cards.findIndex(s => s.id === winner.id)
    const seconds = Math.max(1, Math.min(300, durationSeconds))
    const delay = seconds * 1000
    setCardParticipants(cards); setCardWinner(null); setCardRotation(0)
    setWinners([]); setRevealed(false); setBusy(true); setCountdown(seconds)
    const startedAt = Date.now()
    const timer = window.setInterval(() => setCountdown(Math.max(0, Math.ceil((delay - (Date.now()-startedAt))/1000))), 100)
    window.setTimeout(async () => {
      window.clearInterval(timer)
      setCardRotation(1800 - winnerIndex * (360 / cards.length))
      setCountdown(0); setCardWinner(winner); setWinners([winner]); setAvatarChoices([1])
      setRevealed(true); setBusy(false)
      await recordWinners([winner])
      if (!settings.reducedMotion) confetti({particleCount:150,spread:110,startVelocity:48,origin:{x:.5,y:.38}})
    }, delay)
  }

  const recordWinners = async (selected:Student[]) => {
    const currentSettings = await getSettings()
    const sessionId=makeId(), now=Date.now()
    const rows=selected.map(s=>({id:makeId(),sessionId,game:gameNames[game],studentId:s.id,studentName:s.name,studentNumber:s.number,selectedAt:now,status:'completed' as const,mode}))
    await db.transaction('rw',db.students,db.results,db.settings,async()=>{
      await db.results.bulkAdd(rows)
      for(const s of selected) await db.students.update(s.id,{selectedCount:s.selectedCount+1,lastSelectedAt:now})
      if(mode==='no-repeat') await db.settings.put({...currentSettings,noRepeatCycle:[...new Set([...currentSettings.noRepeatCycle,...selected.map(s=>s.id)])]})
    })
    await refresh()
  }
  const undoLast = async (id?:string) => {
    const row=id?results.find(r=>r.id===id):results.find(r=>r.status==='completed')
    if(!row)return
    await db.transaction('rw',db.results,db.students,async()=>{
      await db.results.update(row.id,{status:'undone'})
      const s=await db.students.get(row.studentId)
      if(s) await db.students.update(s.id,{selectedCount:Math.max(0,s.selectedCount-1)})
    })
    if(mode==='no-repeat') await updateSettings({noRepeatCycle:settings.noRepeatCycle.filter(x=>x!==row.studentId)})
    await refresh();notify('Đã hoàn tác lượt chọn.')
  }
  const addStudent = async () => {
    const name=nameInput.trim(); if(!name){notify('Vui lòng nhập tên học sinh.');return}
    if(students.some(s=>s.name.toLowerCase()===name.toLowerCase()&&s.id!==editing?.id)){notify('Tên học sinh đã tồn tại.');return}
    if(editing) await db.students.update(editing.id,{name,group:groupInput.trim()||'Chưa phân tổ'})
    else await db.students.add({id:makeId(),number:Math.max(0,...students.map(s=>s.number))+1,name,group:groupInput.trim()||'Chưa phân tổ',active:true,selectedCount:0,createdAt:Date.now()})
    setNameInput('');setGroupInput('');setEditing(null);await refresh();notify('Đã lưu học sinh.')
  }
  const deleteStudent = async (s:Student) => {
    if(!window.confirm(`Xóa ${s.name} khỏi danh sách hiện tại? Lịch sử vẫn được giữ.`))return
    await db.students.delete(s.id);await updateSettings({noRepeatCycle:settings.noRepeatCycle.filter(x=>x!==s.id)});await refresh()
  }
  const importFile = async (file?:File) => {
    if(!file)return
    const data=await file.arrayBuffer(), wb=XLSX.read(data), rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[wb.SheetNames[0]],{header:1}) as unknown as unknown[][]
    const names=rows.map(r=>String(r[0]??'').trim()).filter(Boolean).filter(n=>!students.some(s=>s.name.toLowerCase()===n.toLowerCase()))
    if(!names.length){notify('Không tìm thấy tên mới trong tệp.');return}
    await db.students.bulkAdd(names.map((name,i)=>({id:makeId(),number:Math.max(0,...students.map(s=>s.number))+i+1,name,group:'Chưa phân tổ',active:true,selectedCount:0,createdAt:Date.now()})))
    await refresh();notify(`Đã nhập ${names.length} học sinh.`)
  }
  const exportExcel = () => {
    const data=students.map(s=>({'STT':s.number,'Họ và tên':s.name,'Tổ':s.group,'Trạng thái':s.active?'Đang học':'Tạm nghỉ','Số lần được chọn':s.selectedCount}))
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),'Hoc sinh')
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(results.map(r=>({'Thời gian':new Date(r.selectedAt).toLocaleString('vi-VN'),'Trò chơi':r.game,'STT':r.studentNumber,'Học sinh':r.studentName,'Trạng thái':r.status==='completed'?'Hoàn thành':'Đã hoàn tác'}))),'Lich su')
    XLSX.writeFile(wb,'class-arena-data.xlsx')
  }
  const backup = async () => {
    const payload={version:1,exportedAt:new Date().toISOString(),students,results,settings}
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='class-arena-backup.json';a.click();URL.revokeObjectURL(a.href)
  }
  const restore = async (file?:File) => {
    if(!file)return
    try{
      const data=JSON.parse(await file.text())
      if(data.version!==1||!Array.isArray(data.students)||!Array.isArray(data.results))throw new Error('invalid')
      await db.transaction('rw',db.students,db.results,db.settings,async()=>{await db.students.clear();await db.results.clear();await db.students.bulkAdd(data.students);await db.results.bulkAdd(data.results);if(data.settings)await db.settings.put(data.settings)})
      await refresh();notify('Khôi phục dữ liệu thành công.')
    }catch{notify('Tệp sao lưu không hợp lệ.')}
  }
  const showPage=(p:Page)=>{setPage(p);setPresentation(p==='presentation')}
  const startPresentation=()=>{setPage('presentation');setPresentation(true)}
  const exitPresentation=()=>{setPresentation(false);setPage('games')}
  const navItems: {id:Page;label:string;group:string}[]=[
    {id:'overview',label:'Tổng quan',group:'WORKSPACE'},{id:'games',label:'Game Center',group:'WORKSPACE'},{id:'quiz',label:'Thiết lập Quiz',group:'WORKSPACE'},
    {id:'teams',label:'Quản lý tổ',group:'CLASSROOM'},{id:'students',label:'Học sinh',group:'CLASSROOM'},{id:'analytics',label:'Thống kê',group:'CLASSROOM'},
    {id:'history',label:'Lịch sử',group:'CLASSROOM'},{id:'settings',label:'Cài đặt',group:'SYSTEM'}
  ]
  if(!ready)return <div className="loading"><div className="loader"/>Đang khởi tạo CLASS ARENA...</div>
  if(presentation)return <main className="presentation">
    <div className="pres-top"><div className="brand-mark"><Sparkles/> CLASS ARENA</div><span>{settings.className}</span><button className="icon-btn" onClick={exitPresentation}><X/></button></div>
    <div className={`pres-stage ${revealed&&game==='box'?'winner-zoom':''}`}>
      <div className="stage-glow"/>{revealed&&game==='box'&&<motion.div className="winner-beam" initial={{opacity:0,scaleY:.5}} animate={{opacity:1,scaleY:1}} transition={{duration:1.1}}/>}<div className="pres-lights"><i/><i/><i/></div><div className="stage-kicker">THE CLASSROOM GAME SHOW</div>
      <h1>{gameNames[game]}</h1><p className="stage-sub">EVERY STUDENT. EVERY CHANCE.</p>
      {busy&&<div className="anticipation-label">{game==='box'?'HỘP QUÀ ĐANG MỞ...':game==='wheel'?'VÒNG QUAY ĐANG TĂNG TỐC...':game==='card'?'ĐANG XÁO VÀ CHỌN THẺ...':'ĐANG CHỌN CON SỐ...'} · {countdown}s</div>}{game==='card'?<div className={`card-roulette ${busy?'card-roulette-running':''} ${revealed?'card-roulette-revealed':''}`}><div className="card-pointer"><span>▼</span><small>CHỌN</small></div><div className="card-orbit" style={{'--card-rotation':`${cardRotation}deg`,'--card-count':cardParticipants.length||10} as React.CSSProperties}>{(cardParticipants.length?cardParticipants:activeStudents.slice(0,10)).map((student,i)=><div className={`roulette-card ${cardWinner?.id===student.id?'selected-card':''}`} key={student.id} style={{'--card-index':i,'--card-angle':`${i*360/(cardParticipants.length||10)}deg`} as React.CSSProperties}><div className="card-face"><span className="card-corner">✦</span><strong>{String(student.number).padStart(2,'0')}</strong><small>{revealed&&cardWinner?.id===student.id?student.name:'CLASS ARENA'}</small><span className="card-symbol">✧</span></div></div>)}</div>{revealed&&cardWinner&&<div className="card-winner-label"><Trophy size={17}/> {cardWinner.number}. {cardWinner.name}</div>}</div>:game==='number'?<div className={`number-display ${busy?'number-pulse':''}`}>{revealed?numberResult:'?'}</div>:game==='wheel'?<div className={`wheel ${busy?'spinning':''}`}><div className="wheel-inner">{revealed?winners.map(s=>s.name).join(' • '):busy?'ĐANG QUAY...':'SẴN SÀNG'}</div></div>:<div className={`box-grid ${busy?'box-grid-running':''} ${revealed?'box-grid-revealed':''}`}><AnimatePresence initial={false}>{(boxParticipants.length?boxParticipants:activeStudents).filter(student=>!eliminatedIds.includes(student.id)).map((student,i)=>{const isWinner=winners.some(w=>w.id===student.id);const hit=activeHitId===student.id;return <motion.div layout key={student.id} className={`gift-box ${revealed&&isWinner?'opened':''}`} style={{'--box-index':i} as MotionStyle} initial={{opacity:0,y:35,rotateX:-24,scale:.7}} animate={{opacity:1,y:0,rotateX:8,rotateY:-5,scale:hit?1.08:1}} exit={{opacity:0,y:-230,x:(i%2?1:-1)*75,z:180,rotateX:115,rotateY:55,rotateZ:i%2?38:-32,scale:.25,filter:'brightness(1.8) grayscale(1)'}} transition={{type:'spring',stiffness:170,damping:15,layout:{type:'spring',stiffness:170,damping:22}}}><div className="gift-lid"/><div className="gift-ribbon"/><Gift/><span>{revealed&&isWinner?student.name:'HỘP '+String(i+1).padStart(2,'0')}</span><AnimatePresence>{hit&&<motion.div className="elimination-x" initial={{opacity:0,y:92,scale:.35,rotate:-18}} animate={{opacity:1,y:-5,scale:1.2,rotate:0}} exit={{opacity:0,y:-55,scale:.7,rotate:20}} transition={{type:'spring',stiffness:260,damping:13}}><X size={31}/></motion.div>}</AnimatePresence></motion.div>})}</AnimatePresence></div>}
      {revealed&&winners.length>0&&<div className="winner-showcase">{winners.map((winner,i)=><div className="winner-person" key={winner.id}><div className="winner-chat">{winner.name}</div><div className="avatar-placeholder" aria-hidden="true">🧑‍🎓</div><img src={`/avatar/avatar-${avatarChoices[i] ?? (i+1)}.png`} alt={winner.name} onError={e=>{e.currentTarget.style.display='none'}}/><div className="winner-name">{winner.name}</div></div>)}<div className="winner-panel"><Trophy/><div><small>CHÚC MỪNG</small><strong>{winners.map(s=>s.name).join(' • ')}</strong></div></div></div>}
      <div className="pres-controls"><button className="btn btn-primary btn-xl" onClick={()=>{setRevealed(false);setNumberResult(null);void runGame()}} disabled={busy}><Play size={19}/> {busy?'ĐANG CHẠY...':'BẮT ĐẦU'}</button><button className="btn btn-ghost" onClick={exitPresentation}>Thoát trình chiếu</button></div>
    </div>
  </main>
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Sparkles/></div><div><b>CLASS <span>ARENA</span></b><small>CLASSROOM GAME SHOW</small></div></div>
      <div className="class-switch"><div className="class-avatar">9A</div><div><small>ĐANG QUẢN LÝ</small><strong>{settings.className}</strong></div><ChevronDown size={15}/></div>
      {['WORKSPACE','CLASSROOM','SYSTEM'].map(group=><div className="nav-group" key={group}><div className="nav-label">{group}</div>{navItems.filter(n=>n.group===group).map(item=>{const Icon=iconFor[item.id];return <button key={item.id} className={`nav-item ${page===item.id?'active':''}`} onClick={()=>showPage(item.id)}><Icon size={18}/>{item.label}{item.id==='games'&&<span className="nav-pill">3</span>}</button>})}</div>)}
      <div className="sidebar-bottom"><div className="status-dot"/> Dữ liệu được lưu trên thiết bị <small>CLASS ARENA · V1.0</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="topbar-heading"><div className="breadcrumb">CLASSROOM / <b>{navItems.find(n=>n.id===page)?.label??(page==='quiz-live'?'QUIZ ARENA':'TRÌNH CHIẾU')}</b></div><div className="topbar-title-row"><h2>{page==='overview'?'Tổng quan':page==='games'?'Game Center':page==='quiz'?'Thiết lập Quiz':page==='quiz-live'?'Quiz Arena':page==='teams'?'Quản lý tổ':page==='students'?'Quản lý học sinh':page==='analytics'?'Thống kê lớp học':page==='history'?'Lịch sử trò chơi':'Cài đặt hệ thống'}</h2><div className="header-threeui-scene shader-frame" aria-hidden="true"><TextAnimationCollection variant="threeui-intro" mode="dark" hue={0} saturation={1.00} brightness={1.00}/></div></div></div><div className="top-actions"><span className="live-status"><i/> LOCAL DATABASE</span><div className="threeui-cta-wrap"><LumenCta label="TRÌNH CHIẾU" mode="dark" variant="primary" hue={258} saturation={1.05} brightness={1.1} onClick={startPresentation} /></div><div className="profile">CA</div></div></header>
      <div className="content">
        {page==='overview'&&<section>
          <div className="welcome-banner"><div><span className="eyebrow"><Sparkles size={13}/> CLASSROOM CONTROL CENTER</span><h1>Chào mừng đến với <em>đấu trường!</em></h1><p>Quản lý lớp học và tạo những khoảnh khắc bất ngờ.</p><button className="btn btn-primary" onClick={()=>showPage('games')}><Gamepad2 size={17}/> Khám phá trò chơi</button></div><div className="banner-orb"><div className="orb-ring"/><Trophy size={74}/><Sparkles className="orb-spark"/></div></div>
          <div className="stats-grid"><Stat icon={<Users/>} label="Tổng học sinh" value={students.length} note={`${activeStudents.length} đang tham gia`} color="blue"/><Stat icon={<Dices/>} label="Tổng lượt chọn" value={completedResults.length} note="Tất cả phiên chơi" color="purple"/><Stat icon={<Trophy/>} label="Đã được gọi" value={uniqueSelected} note={`${students.length?Math.round(uniqueSelected/students.length*100):0}% sĩ số`} color="gold"/><Stat icon={<Activity/>} label="Chưa được gọi" value={Math.max(0,activeStudents.length-uniqueSelected)} note="Trong dữ liệu hiện tại" color="green"/></div>
          <div className="section-grid"><div className="panel"><div className="panel-head"><div><h3>Trò chơi nổi bật</h3><p>Chọn một game để bắt đầu</p></div><button className="text-btn" onClick={()=>showPage('games')}>Xem tất cả →</button></div><div className="quick-games"><GameCard icon={<Gift/>} title="Mystery Box" desc="Mở hộp quà bí ẩn" tone="pink" onClick={()=>{setGame('box');showPage('games')}}/><GameCard icon={<Dices/>} title="Lucky Wheel" desc="Vòng quay may mắn" tone="violet" onClick={()=>{setGame('wheel');showPage('games')}}/><GameCard icon={<Sparkles/>} title="Number Hunt" desc="Truy tìm số thứ tự" tone="cyan" onClick={()=>{setGame('number');showPage('games')}}/></div></div><div className="panel"><div className="panel-head"><div><h3>Hoạt động gần đây</h3><p>Các lượt chọn mới nhất</p></div><button className="text-btn" onClick={()=>showPage('history')}>Lịch sử →</button></div>{results.slice(0,5).length?results.slice(0,5).map(r=><div className="activity-row" key={r.id}><div className="activity-icon"><Trophy size={15}/></div><div><b>{r.studentName}</b><small>{r.game}</small></div><time>{new Date(r.selectedAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</time></div>):<Empty text="Chưa có lượt chơi nào"/>}</div></div>
        </section>}
        {page==='games'&&<section><div className="page-intro"><div><span className="eyebrow">CHOOSE YOUR CHALLENGE</span><h1>Game Center</h1><p>Bốn trò chơi, một hệ thống random công bằng.</p></div><div className="eligible-chip"><ShieldCheck size={16}/> {eligible.length} học sinh đủ điều kiện</div></div><div className="game-layout"><div className="game-catalog"><GameTile active={game==='box'} icon={<Gift/>} title="Mystery Box" subtitle="Hộp quà bí ẩn" number="01" onClick={()=>{setGame('box');setWinners([]);setRevealed(false);setBoxParticipants([]);setEliminatedIds([]);setActiveHitId(null)}} tone="pink"/><GameTile active={game==='wheel'} icon={<Dices/>} title="Lucky Wheel" subtitle="Vòng quay may mắn" number="02" onClick={()=>{setGame('wheel');setWinners([]);setRevealed(false)}} tone="violet"/><GameTile active={game==='number'} icon={<Sparkles/>} title="Number Hunt" subtitle="Truy tìm số thứ tự" number="03" onClick={()=>{setGame('number');setWinners([]);setRevealed(false)}} tone="cyan"/><GameTile active={game==='card'} icon={<ClipboardList/>} title="Random Thẻ Bài" subtitle="Mũi tên chọn một lá bài" number="04" onClick={()=>{setGame('card');setWinners([]);setRevealed(false);setCardWinner(null);setCardParticipants([]);setCardRotation(0)}} tone="pink"/></div><div className="game-workspace"><div className={`game-stage ${revealed && game==='box' ? 'winner-zoom' : ''}`}><div className="stage-grid"/><div className="stage-lights"><i/><i/><i/></div><div className="stage-floor"/>{revealed&&game==='box'&&<motion.div className="winner-beam" initial={{opacity:0,scaleY:.5}} animate={{opacity:1,scaleY:1}} transition={{duration:1.1}}/>}<div className="stage-top"><span>LIVE ARENA</span><span>{settings.className}</span></div><div className="stage-content"><span className="stage-kicker">NOW PLAYING</span><h2>{gameNames[game]}</h2><p>{game==='box'?'Chọn hộp quà và khám phá người may mắn.':game==='wheel'?'Để vòng quay quyết định ai sẽ lên bảng.':game==='card'?'Các lá bài xoay vòng, mũi tên sẽ chọn ra một học sinh.':'Chọn số ngẫu nhiên trong khoảng đã thiết lập.'}</p>{busy&&<div className="anticipation-label">{game==='box'?'HỘP QUÀ ĐANG MỞ...':game==='wheel'?'VÒNG QUAY ĐANG TĂNG TỐC...':game==='card'?'ĐANG XÁO VÀ CHỌN THẺ...':'ĐANG CHỌN CON SỐ...'} · {countdown}s</div>}{game==='card'?<div className={`card-roulette ${busy?'card-roulette-running':''} ${revealed?'card-roulette-revealed':''}`}><div className="card-pointer"><span>▼</span><small>CHỌN</small></div><div className="card-orbit" style={{'--card-rotation':`${cardRotation}deg`,'--card-count':cardParticipants.length||10} as React.CSSProperties}>{(cardParticipants.length?cardParticipants:activeStudents.slice(0,10)).map((student,i)=><div className={`roulette-card ${cardWinner?.id===student.id?'selected-card':''}`} key={student.id} style={{'--card-index':i,'--card-angle':`${i*360/(cardParticipants.length||10)}deg`} as React.CSSProperties}><div className="card-face"><span className="card-corner">✦</span><strong>{String(student.number).padStart(2,'0')}</strong><small>{revealed&&cardWinner?.id===student.id?student.name:'CLASS ARENA'}</small><span className="card-symbol">✧</span></div></div>)}</div>{revealed&&cardWinner&&<div className="card-winner-label"><Trophy size={17}/> {cardWinner.number}. {cardWinner.name}</div>}</div>:game==='number'?<div className={`number-display ${busy?'number-pulse':''}`}>{revealed?numberResult:'?'}</div>:game==='wheel'?<div className={`wheel ${busy?'spinning':''}`}><div className="wheel-inner">{revealed?winners.map(s=>s.name).join(' • '):busy?'ĐANG QUAY...':'SẴN SÀNG'}</div></div>:<div className={`box-grid ${busy?'box-grid-running':''} ${revealed?'box-grid-revealed':''}`}>
                <AnimatePresence initial={false}>
                  {(boxParticipants.length ? boxParticipants : activeStudents).filter(student=>!eliminatedIds.includes(student.id)).map((student,i)=>{
                    const isWinner=winners.some(w=>w.id===student.id)
                    const hit=activeHitId===student.id
                    return <motion.div layout key={student.id}
                      className={`gift-box ${revealed&&isWinner?'opened':''} ${hit?'box-hit-target':''}`}
                      style={{'--box-index':i} as MotionStyle}
                      initial={{opacity:0,y:35,rotateX:-24,scale:.7}}
                      animate={{opacity:1,y:0,rotateX:8,rotateY:-5,scale:hit?1.08:1}}
                      exit={{opacity:0,y:-230,x:(i%2?1:-1)*75,z:180,rotateX:115,rotateY:55,rotateZ:i%2?38:-32,scale:.25,filter:'brightness(1.8) grayscale(1)'}}
                      transition={{layout:{type:'spring',stiffness:180,damping:22},opacity:{duration:.22},y:{type:'spring',stiffness:190,damping:13,mass:.75},rotateX:{type:'spring',stiffness:150,damping:12},rotateY:{type:'spring',stiffness:140,damping:13},rotateZ:{type:'spring',stiffness:110,damping:12},scale:{type:'spring',stiffness:220,damping:12},filter:{duration:.3}}}>
                      <div className="gift-lid"/><div className="gift-ribbon"/><Gift/>
                      <span>{revealed&&isWinner?student.name:'HỘP '+String(i+1).padStart(2,'0')}</span>
                      <AnimatePresence>{hit&&<motion.div className="elimination-x" initial={{opacity:0,y:92,scale:.35,rotate:-18}} animate={{opacity:1,y:-5,scale:1.2,rotate:0}} exit={{opacity:0,y:-55,scale:.7,rotate:20}} transition={{type:'spring',stiffness:260,damping:13,mass:.65}}><X size={31}/></motion.div>}</AnimatePresence>
                    </motion.div>
                  })}
                </AnimatePresence>
              </div>}{revealed&&winners.length>0&&<div className="winner-showcase">{winners.map((winner,i)=><div className="winner-person" key={winner.id}><div className="winner-chat">{winner.name}</div><div className="avatar-placeholder" aria-hidden="true">🧑‍🎓</div><img src={`/avatar/avatar-${avatarChoices[i] ?? (i+1)}.png`} alt={winner.name} onError={e=>{e.currentTarget.style.display='none'}}/><div className="winner-name">{winner.name}</div></div>)}<div className="winner-panel"><Trophy/><div><small>NGƯỜI ĐƯỢC CHỌN</small><strong>{winners.map(s=>s.name).join(' · ')}</strong></div></div></div>}</div><div className="stage-bottom"><span><i/> SYSTEM READY</span><span>CLASS ARENA V1.0</span></div></div><div className="game-controls"><div className="control-heading"><div><h3>Điều khiển trò chơi</h3><p>Cấu hình lượt random</p></div><span className="control-badge">SETUP</span></div><label className="field-label">CHẾ ĐỘ RANDOM</label><select value={mode} onChange={e=>{setMode(e.target.value as AppSettings['mode']);void updateSettings({mode:e.target.value as AppSettings['mode']})}}><option value="pure">Pure Random – Ngẫu nhiên</option><option value="no-repeat">No Repeat – Không lặp</option><option value="fairness">Fairness – Ưu tiên công bằng</option></select>{game==='number'?<><label className="field-label">KHOẢNG SỐ</label><div className="number-range"><input type="number" value={min} onChange={e=>setMin(Number(e.target.value))}/><span>đến</span><input type="number" value={max} onChange={e=>setMax(Number(e.target.value))}/></div><p className="field-hint">Số được đối chiếu với STT học sinh đang hoạt động.</p></>:game==='card'?<><label className="field-label">BỘ THẺ RANDOM</label><p className="field-hint">Tối đa 10 học sinh được xếp thành 10 lá bài. Mũi tên cố định sẽ chỉ vào thẻ trúng thưởng.</p></>:<><label className="field-label">SỐ NGƯỜI ĐƯỢC CHỌN</label><div className="stepper"><button onClick={()=>changeCount(count-1)}>−</button><input aria-label="Số người được chọn" type="number" min="1" max={Math.max(1,eligible.length)} value={count} onChange={e=>changeCount(Number(e.target.value))}/><button onClick={()=>changeCount(count+1)}>+</button></div></>}<label className="field-label">THỜI GIAN RANDOM (GIÂY)</label><input type="number" min="1" max="300" value={durationSeconds} onChange={e=>{const v=Math.max(1,Math.min(300,Number(e.target.value)||1));setDurationSeconds(v);void updateSettings({durationSeconds:v})}}/><p className="field-hint">Ví dụ 30 giây: hiệu ứng random chạy đủ 30 giây trước khi công bố kết quả.</p><div className="control-summary"><div><span>Học sinh tham gia</span><b>{activeStudents.length}</b></div><div><span>Ứng viên hiện tại</span><b>{game==='number'?activeStudents.filter(s=>s.number>=Math.min(min,max)&&s.number<=Math.max(min,max)).length:eligible.length}</b></div></div><button className="btn btn-primary btn-start" onClick={()=>game==='card'?void runCardGame():void runGame()} disabled={busy||!activeStudents.length}><Play size={17}/>{busy?'ĐANG CHẠY...':'BẮT ĐẦU RANDOM'}</button><button className="btn btn-outline btn-full" onClick={()=>{setWinners([]);setRevealed(false);setNumberResult(null);setBoxParticipants([]);setEliminatedIds([]);setActiveHitId(null);setCardParticipants([]);setCardWinner(null);setCardRotation(0)}}><RotateCcw size={15}/> Đặt lại sân khấu</button><p className="field-hint">Kết quả được lưu tự động sau mỗi lượt chơi.</p></div></div></div></section>}
        {page==='quiz'&&<section>
          <div className="page-intro"><div><span className="eyebrow">CLASSROOM KNOWLEDGE BATTLE</span><h1>Thiết lập trận đấu</h1><p>Tạo đội, nạp ngân hàng câu hỏi và chọn số câu trước khi vào đấu trường.</p></div><button className="btn btn-outline" onClick={()=>setPage('settings')}><Settings size={16}/> Thư viện câu hỏi trong Cài đặt</button></div>
          <div className="quiz-grid"><div className="panel quiz-setup"><h3><Users/> Danh sách tổ</h3><div className="team-create"><input placeholder="Tên tổ mới" value={teamName} onChange={e=>setTeamName(e.target.value)}/><button className="btn btn-outline" onClick={()=>{const n=teamName.trim();if(!n||teamNames.includes(n))return;const next=[...teamNames,n];setTeamNames(next);localStorage.setItem('class-arena-teams',JSON.stringify(next));setTeamName('')}}><Plus size={15}/> Thêm tổ</button></div><div className="score-list">{teamNames.map(t=><div key={t}><b>{t}</b><span>Sẵn sàng</span></div>)}</div></div><div className="panel quiz-setup"><h3><ClipboardList/> Chọn ngân hàng</h3><label className="field-label">MÔN HỌC</label><select value={arenaSubject} onChange={e=>{setArenaSubject(e.target.value);const b=quizLibrary.find((x:any)=>x.subject===e.target.value);if(b)setArenaTopic(b.topic)}}>{[...new Set(quizLibrary.map((b:any)=>b.subject))].map((s:any)=><option key={s}>{s}</option>)}</select><label className="field-label">BÀI THUYẾT TRÌNH</label><select value={arenaTopic} onChange={e=>setArenaTopic(e.target.value)}>{quizLibrary.filter((b:any)=>b.subject===arenaSubject).map((b:any)=><option key={b.id} value={b.topic}>{b.topic}</option>)}</select><p className="field-hint">{quizLibrary.find((b:any)=>b.subject===arenaSubject&&b.topic===arenaTopic)?.questions.length||0} câu trong ngân hàng.</p><label className="field-label">SỐ LƯỢNG CÂU</label><input type="number" min="1" max="500" value={quizCount} onChange={e=>setQuizCount(Math.max(1,Number(e.target.value)||1))}/><label className="setting-toggle"><span><b>Random câu hỏi</b><small>Trộn thứ tự câu trong trận</small></span><input type="checkbox" defaultChecked id="random-quiz"/></label><label className="field-label">THỜI GIAN MỖI CÂU</label><select value={quizTimeLimit} onChange={e=>setQuizTimeLimit(Number(e.target.value))}><option value={15}>15 giây</option><option value={30}>30 giây</option><option value={45}>45 giây</option><option value={60}>60 giây</option><option value={90}>90 giây</option><option value={0}>Không giới hạn</option></select><button className="btn btn-primary btn-full" disabled={!quizLibrary.some((b:any)=>b.subject===arenaSubject&&b.topic===arenaTopic)||!teamNames.length} onClick={()=>{const bank=quizLibrary.find((b:any)=>b.subject===arenaSubject&&b.topic===arenaTopic);const random=(document.getElementById('random-quiz') as HTMLInputElement)?.checked!==false;const deck=(random?shuffle(bank.questions):bank.questions).slice(0,Math.min(quizCount,bank.questions.length));const room=makeId();setQuizRoomId(room);setQuizSubject(arenaSubject);setQuizTopic(arenaTopic);setQuizDeck(deck);setQuizIndex(0);setQuizFinished(false);setQuizAwarded([]);setQuizScores(Object.fromEntries(teamNames.map(t=>[t,0])));setSelectedChoice(null);setQuestionCorrect(false);setActiveTeamIndex(0);setQuizTimeLeft(quizTimeLimit);setQuizTimerActive(quizTimeLimit>0);window.history.pushState({},'',`/room/${room}`);setPage('quiz-live')}}><Play size={16}/> TẠO PHÒNG & VÀO ARENA</button></div></div>
        </section>}
        {page==='quiz-live'&&<section>
          <div className="page-intro"><div><span className="eyebrow">LIVE CLASSROOM BATTLE</span><h1>Quiz Arena</h1><p>Phòng /room/{quizRoomId} · Tự lưu · Link phòng không tự hết hạn<br/>{quizDeck.length?`Câu ${Math.min(quizIndex+1,quizDeck.length)} / ${quizDeck.length} · Tất cả ${teamNames.length} tổ cùng thi đấu`: 'Trận đấu chưa được thiết lập'}</p></div><button className="btn btn-outline" onClick={()=>{if(window.confirm('Thoát trận đấu và quay lại thiết lập?'))setPage('quiz')}}><Settings size={16}/> Thiết lập trận</button></div>
          {quizDeck.length&&!quizFinished?(()=>{const q=quizDeck[quizIndex]||{};const type=String(q.type||q.loai||'multiple').toLowerCase();const question=q.question||q.cauhoi||q.text||'Câu hỏi';const options=q.options||q.answers||q.dapAn||[];const correct=q.correctAnswer??q.answer??q.correct??q.dapandung;const rawPoints=Number(q.points??q.score??q.diem??1);const questionPoints=Number.isFinite(rawPoints)&&rawPoints>=0?rawPoints:1;const answerText=typeof correct==='boolean'?(correct?'Đúng':'Sai'):Array.isArray(correct)?correct.map((v:any)=>typeof v==='object'?(v.text??v.label??v.value??JSON.stringify(v)):v).join(', '):typeof correct==='object'&&correct!==null?String(correct.text??correct.label??correct.value??JSON.stringify(correct)):String(correct??'Chưa khai báo');return <>
            <div className="panel quiz-play"><div className="quiz-topline"><span>⚡ CÂU HỎI ĐANG THI ĐẤU</span><b>{quizIndex+1} / {quizDeck.length}</b></div><div className={`quiz-timer ${quizTimeLeft<=10&&quizTimeLimit>0?'urgent':''}`}><div><small>THỜI GIAN CÒN LẠI</small><strong>{quizTimeLimit===0?'∞':`${String(Math.floor(quizTimeLeft/60)).padStart(2,'0')}:${String(quizTimeLeft%60).padStart(2,'0')}`}</strong></div><div className="quiz-timer-actions"><button className="btn btn-outline" onClick={()=>setQuizTimerActive(v=>!v)} disabled={quizTimeLimit===0||quizTimeLeft===0}>{quizTimerActive?<Pause size={15}/>:<Play size={15}/>} {quizTimerActive?'TẠM DỪNG':'TIẾP TỤC'}</button><button className="btn btn-outline" onClick={()=>{setQuizTimeLeft(quizTimeLimit);setQuizTimerActive(quizTimeLimit>0)}}><RotateCcw size={15}/> ĐẶT LẠI</button><button className="btn btn-outline" onClick={()=>setQuizSound(v=>!v)}>{quizSound?<Volume2 size={15}/>:<VolumeX size={15}/>} {quizSound?'ÂM THANH':'TẮT TIẾNG'}</button></div></div><div className="quiz-question"><small>{String(q.type||'CÂU HỎI').toUpperCase()}</small><h2>{question}</h2></div>
              <div className="quiz-manual-answer"><div className="field-hint">Tổ đang trả lời: <b>{teamNames[activeTeamIndex]||'Chưa có tổ'}</b>. Chọn đáp án; nếu sai sẽ chuyển lượt.</div>{(type.includes('true')||type.includes('đúng')||type==='tf'?['Đúng','Sai']:(type.includes('fill')||type.includes('blank')||type.includes('kéo')?(q.words||options):(Array.isArray(options)?options:Object.entries(options).map(([k,v])=>({key:k,text:v}))))).map((o:any,i:number)=>{const value=typeof o==='string'?o:(o.text??o.label??o.value??o.key);return <button key={i} className={`quiz-choice ${selectedChoice===value?'selected':''}`} disabled={questionCorrect} onClick={()=>{if(questionCorrect)return;setSelectedChoice(value);const norm=(v:any)=>String(v??'').trim().toLowerCase();const correctNorm=norm(correct);const isRight=norm(value)===correctNorm||String.fromCharCode(65+i).toLowerCase()===correctNorm;if(isRight){setQuestionCorrect(true);const team=teamNames[activeTeamIndex];notify('Chính xác! Quản trò có thể cộng điểm thủ công.')}else{setActiveTeamIndex(v=>(v+1)%Math.max(1,teamNames.length));notify('Sai rồi! Chuyển lượt cho tổ tiếp theo.')}}}>{String.fromCharCode(65+i)}. {value}</button>})}{questionCorrect&&<div className="notice"><Check size={17}/> Đáp án đúng: <b>{answerText}</b></div>}</div>
            </div>
            <div className="panel quiz-scoreboard team-rail"><div className="panel-head"><div><h3><Trophy/> Bảng điểm & đội thi</h3><p>Đội đang có lượt trả lời được đánh dấu.</p></div></div><div className="score-list trophy-score-list">{teamNames.map(t=><div className="manual-score-row trophy-score-row" key={t}><div className="trophy-team-info"><b>{t}</b><small>Tổng điểm</small><strong>{quizScores[t]||0} <span>điểm</span></strong></div><button className="trophy-score-button" onClick={()=>setQuizScores(v=>({...v,[t]:(v[t]||0)+10}))}><Plus size={18}/><span>+10 ĐIỂM</span></button></div>)}</div></div>
            <div className="quiz-live-actions"><span className="field-hint">{questionCorrect?'Đã có đáp án đúng.':'Chỉ chuyển câu khi có đáp án đúng.'}</span><button className="btn btn-primary" disabled={!questionCorrect} onClick={()=>{if(quizIndex+1>=quizDeck.length){setQuizTimerActive(false);setQuizFinished(true)}else{setQuizTimerActive(false);setQuizIndex(i=>i+1);setQuizReveal(false);setQuizAwarded([]);setSelectedChoice(null);setQuestionCorrect(false);setActiveTeamIndex(0)}}}>{quizIndex+1>=quizDeck.length?'KẾT THÚC & VINH DANH':quizTimeLeft===0?'HẾT GIỜ – CÂU TIẾP THEO':'CÂU TIẾP THEO'} <Play size={16}/></button></div>
          </>})():quizFinished?<div className="panel quiz-finish"><div className="quiz-crown">👑</div><div className="winner-chibi">🏆🎉🧑‍🎓✨</div><Trophy size={64}/><small>THE CHAMPION OF CLASS ARENA</small><h2>CHÚC MỪNG NHÀ VÔ ĐỊCH!</h2><p className="quiz-champion">{teamNames.reduce((best,t)=>(quizScores[t]||0)>(quizScores[best]||0)?t:best,teamNames[0]||'Chưa có tổ')}</p><strong>{Math.max(0,...Object.values(quizScores))} ĐIỂM</strong><div className="score-list">{[...teamNames].sort((a,b)=>(quizScores[b]||0)-(quizScores[a]||0)).map(t=><div key={t}><b>{t}</b><strong>{quizScores[t]||0} điểm</strong></div>)}</div><button className="btn btn-primary" onClick={()=>{setQuizDeck([]);setQuizFinished(false);setPage('quiz')}}>TẠO TRẬN MỚI</button></div>:<div className="quiz-empty"><Gamepad2 size={54}/><h2>Chưa có trận đấu</h2><p>Quay lại thiết lập, nạp file JSON và tạo trận mới.</p><button className="btn btn-primary" onClick={()=>setPage('quiz')}>ĐI ĐẾN THIẾT LẬP</button></div>}
          <div className="panel quiz-scoreboard team-rail"><div className="panel-head"><div><h3><Trophy/> Bảng xếp hạng trực tiếp</h3><p>Điểm được quản trò nhập thủ công.</p></div></div><div className="score-list">{[...teamNames].sort((a,b)=>(quizScores[b]||0)-(quizScores[a]||0)).map(t=><div key={t}><b>{t}</b><strong>{quizScores[t]||0} điểm</strong></div>)}</div></div>
        </section>}
        {page==='teams'&&<section><div className="page-intro"><div><span className="eyebrow">TEAM MANAGEMENT</span><h1>Quản lý tổ</h1><p>Tạo không giới hạn tổ; phân tổ học sinh ngay trong danh sách.</p></div></div><div className="panel"><div className="team-create"><input placeholder="Tên tổ mới, ví dụ: Tổ 5" value={teamName} onChange={e=>setTeamName(e.target.value)}/><button className="btn btn-primary" onClick={async()=>{const n=teamName.trim();if(!n){notify('Nhập tên tổ.');return}if(teamNames.includes(n)){notify('Tên tổ đã tồn tại.');return}const next=[...teamNames,n];setTeamNames(next);localStorage.setItem('class-arena-teams',JSON.stringify(next));setTeamName('');notify('Đã tạo tổ. Chuyển học sinh vào tổ tại trang Học sinh.')}}><Plus size={16}/> Tạo tổ</button></div><div className="team-cards">{teamNames.map(t=><div className="team-card" key={t}><Users/><h3>{t}</h3><strong>{students.filter(x=>x.group===t).length} thành viên</strong><small>{students.filter(x=>x.group===t&&x.active).length} đang tham gia</small></div>)}</div><p className="field-hint">Tạo tổ sẽ thêm một mục tổ mới. Bạn có thể chuyển học sinh vào tổ đó tại trang Học sinh.</p></div></section>}
        {page==='students'&&<section><div className="page-intro"><div><span className="eyebrow">CLASSROOM DIRECTORY</span><h1>Quản lý học sinh</h1><p>Danh sách và trạng thái tham gia của lớp.</p></div><div className="action-row"><label className="btn btn-outline file-btn"><ArrowUpFromLine size={16}/> Nhập Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>void importFile(e.target.files?.[0])}/></label><button className="btn btn-primary" onClick={()=>{setEditing(null);setNameInput('');setGroupInput('');document.getElementById('student-modal')?.classList.add('show')}}><Plus size={16}/> Thêm học sinh</button></div></div><div className="panel"><div className="table-toolbar"><div className="search-box"><Search size={17}/><input placeholder="Tìm tên, số thứ tự hoặc tổ..." value={query} onChange={e=>setQuery(e.target.value)}/></div><button className="btn btn-outline" onClick={exportExcel}><Download size={15}/> Xuất Excel</button></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>HỌ VÀ TÊN</th><th>TỔ</th><th>SỐ LẦN ĐƯỢC GỌI</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{filteredStudents.map(s=><tr key={s.id}><td className="muted-cell">{s.number.toString().padStart(2,'0')}</td><td><div className="student-cell"><div className="student-avatar">{s.name.split(' ').slice(-1)[0]?.[0]}</div><b>{s.name}</b></div></td><td>{s.group}</td><td><span className="count-badge">{s.selectedCount}</span></td><td><button className={`status-toggle ${s.active?'on':'off'}`} onClick={async()=>{await db.students.update(s.id,{active:!s.active});await refresh()}}>{s.active?'Đang tham gia':'Tạm nghỉ'}</button></td><td><div className="table-actions"><button title="Sửa" onClick={()=>{setEditing(s);setNameInput(s.name);setGroupInput(s.group);document.getElementById('student-modal')?.classList.add('show')}}><Edit3 size={15}/></button><button title="Xóa" onClick={()=>void deleteStudent(s)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!filteredStudents.length&&<Empty text="Không tìm thấy học sinh"/>}</div><div className="table-foot">Hiển thị {filteredStudents.length} / {students.length} học sinh</div></div><div className="modal-backdrop" id="student-modal" onClick={e=>{if(e.target===e.currentTarget)e.currentTarget.classList.remove('show')}}><div className="modal"><div className="modal-head"><h3>{editing?'Chỉnh sửa học sinh':'Thêm học sinh mới'}</h3><button onClick={()=>document.getElementById('student-modal')?.classList.remove('show')}><X/></button></div><label className="field-label">HỌ VÀ TÊN</label><input className="modal-input" value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Nhập họ và tên"/><label className="field-label">TỔ / NHÓM</label><input className="modal-input" value={groupInput} onChange={e=>setGroupInput(e.target.value)} placeholder="Ví dụ: Tổ 1"/><div className="modal-actions"><button className="btn btn-outline" onClick={()=>document.getElementById('student-modal')?.classList.remove('show')}>Hủy</button><button className="btn btn-primary" onClick={()=>{void addStudent();document.getElementById('student-modal')?.classList.remove('show')}}><Check size={16}/> Lưu học sinh</button></div></div></div></section>}
        {page==='analytics'&&<section><div className="page-intro"><div><span className="eyebrow">CLASS INSIGHTS</span><h1>Thống kê lớp học</h1><p>Theo dõi mức độ tham gia và sự công bằng.</p></div><button className="btn btn-outline" onClick={exportExcel}><Download size={16}/> Xuất báo cáo</button></div><div className="stats-grid"><Stat icon={<Users/>} label="Học sinh hoạt động" value={activeStudents.length} note="Đang có trong danh sách" color="blue"/><Stat icon={<Trophy/>} label="Đã được gọi" value={uniqueSelected} note="Có ít nhất một lượt" color="gold"/><Stat icon={<Activity/>} label="Chưa được gọi" value={activeStudents.filter(s=>!s.selectedCount).length} note="Chưa có lượt hoàn thành" color="green"/><Stat icon={<Dices/>} label="Lượt hợp lệ" value={completedResults.length} note="Không tính lượt hoàn tác" color="purple"/></div><div className="panel"><div className="panel-head"><div><h3>Số lần được gọi theo học sinh</h3><p>Sắp xếp từ thấp đến cao để theo dõi công bằng</p></div></div><div className="bar-list">{[...activeStudents].sort((a,b)=>a.selectedCount-b.selectedCount).map(s=><div className="bar-row" key={s.id}><span>{s.name}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.max(2,completedResults.length?s.selectedCount/Math.max(1,...activeStudents.map(x=>x.selectedCount))*100:0)}%`}}/></div><b>{s.selectedCount}</b></div>)}</div></div></section>}
        {page==='history'&&<section><div className="page-intro"><div><span className="eyebrow">GAME ACTIVITY LOG</span><h1>Lịch sử trò chơi</h1><p>Tra cứu, lọc và hoàn tác kết quả.</p></div><button className="btn btn-outline" onClick={exportExcel}><Download size={16}/> Xuất Excel</button></div><div className="panel"><div className="table-toolbar"><div className="search-box"><Search size={17}/><input placeholder="Tìm học sinh hoặc trò chơi..." value={query} onChange={e=>setQuery(e.target.value)}/></div><select className="filter-select" value={filterGame} onChange={e=>setFilterGame(e.target.value)}><option value="all">Tất cả trò chơi</option>{Object.values(gameNames).map(n=><option key={n}>{n}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>THỜI GIAN</th><th>TRÒ CHƠI</th><th>HỌC SINH</th><th>CHẾ ĐỘ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{results.filter(r=>(filterGame==='all'||r.game===filterGame)&&`${r.studentName} ${r.game}`.toLowerCase().includes(query.toLowerCase())).map(r=><tr key={r.id}><td>{new Date(r.selectedAt).toLocaleString('vi-VN')}</td><td>{r.game}</td><td><b>{r.studentNumber}. {r.studentName}</b></td><td>{r.mode}</td><td><span className={`result-status ${r.status}`}>{r.status==='completed'?'Hoàn thành':'Đã hoàn tác'}</span></td><td>{r.status==='completed'&&<button className="undo-btn" onClick={()=>void undoLast(r.id)}><RotateCcw size={14}/> Hoàn tác</button>}</td></tr>)}</tbody></table>{!results.length&&<Empty text="Chưa có lịch sử trò chơi"/>}</div></div></section>}
        {page==='settings'&&<section><div className="page-intro"><div><span className="eyebrow">QUESTION LIBRARY</span><h1>Thư viện câu hỏi</h1><p>Lưu ngân hàng theo môn học và bài thuyết trình.</p></div></div><div className="panel quiz-setup"><label className="field-label">MÔN HỌC</label><input value={quizSubject} onChange={e=>setQuizSubject(e.target.value)} placeholder="Ví dụ: Lịch sử"/><label className="field-label">BÀI THUYẾT TRÌNH</label><input value={quizTopic} onChange={e=>setQuizTopic(e.target.value)} placeholder="Ví dụ: Văn minh Ai Cập"/><label className="btn btn-primary file-btn"><ArrowUpFromLine size={16}/> Tải ngân hàng JSON<input type="file" accept=".json,application/json" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const parsed=JSON.parse(await f.text());const arr=Array.isArray(parsed)?parsed:(parsed.questions||parsed.cauhoi||parsed.data||[]);if(!Array.isArray(arr)||!arr.length||arr.some((q:any)=>!q||typeof q!=='object'||!(q.question||q.cauhoi||q.text)))throw Error('shape');const entry={id:makeId(),subject:quizSubject.trim()||'Chưa phân môn',topic:quizTopic.trim()||'Chưa phân bài',questions:arr,createdAt:Date.now()};const next=[...quizLibrary,entry];setQuizLibrary(next);localStorage.setItem('class-arena-question-library',JSON.stringify(next));notify('Đã lưu '+arr.length+' câu hỏi.')}catch{notify('JSON không hợp lệ hoặc thiếu câu hỏi.')}}}/></label><div className="score-list">{quizLibrary.map((b:any)=><div key={b.id}><b>{b.subject} · {b.topic}</b><span>{b.questions.length} câu</span><button className="text-btn" onClick={()=>{const next=quizLibrary.filter((x:any)=>x.id!==b.id);setQuizLibrary(next);localStorage.setItem('class-arena-question-library',JSON.stringify(next))}}>Xóa</button></div>)}</div></div></section>}{page==='settings'&&<section><div className="page-intro"><div><span className="eyebrow">SYSTEM PREFERENCES</span><h1>Cài đặt</h1><p>Tùy chỉnh lớp học và trải nghiệm sân khấu.</p></div></div><div className="settings-grid"><div className="panel settings-panel"><h3>Thông tin lớp học</h3><label className="field-label">TÊN LỚP</label><input value={settings.className} onChange={e=>void updateSettings({className:e.target.value})}/><label className="field-label">GIÁO VIÊN</label><input value={settings.teacher} onChange={e=>void updateSettings({teacher:e.target.value})}/><h3>Nhập tên thủ công</h3><p className="muted">Mỗi dòng là một người chơi. Danh sách sẽ được thêm vào lớp hiện tại.</p><textarea className="manual-names" value={manualNames} onChange={e=>setManualNames(e.target.value)} placeholder={'Nguyễn Văn A\nTrần Thị B\nLê Văn C'}/><button className="btn btn-outline btn-full" onClick={async()=>{const names=manualNames.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const fresh=names.filter(n=>!students.some(s=>s.name.toLowerCase()===n.toLowerCase()));if(!fresh.length){notify('Không có tên mới để thêm.');return}await db.students.bulkAdd(fresh.map((name,i)=>({id:makeId(),number:Math.max(0,...students.map(s=>s.number))+i+1,name,group:'Nhập thủ công',active:true,selectedCount:0,createdAt:Date.now()})));setManualNames('');await refresh();notify(`Đã thêm ${fresh.length} người.`)}}><Plus size={15}/> Thêm danh sách tên</button><h3>Trải nghiệm</h3><SettingToggle title="Âm thanh trò chơi" desc="Cho phép hiệu ứng âm thanh và pháo giấy" value={settings.sound} onChange={v=>void updateSettings({sound:v})}/><SettingToggle title="Giảm chuyển động" desc="Giảm hiệu ứng để phù hợp thiết bị cấu hình thấp" value={settings.reducedMotion} onChange={v=>void updateSettings({reducedMotion:v})}/></div><div className="panel settings-panel"><h3>Dữ liệu & sao lưu</h3><p className="muted">Dữ liệu đang được lưu trên trình duyệt của thiết bị này.</p><button className="btn btn-outline btn-full" onClick={()=>void backup()}><ArrowDownToLine size={16}/> Sao lưu toàn bộ dữ liệu (.json)</button><label className="btn btn-outline btn-full file-btn"><ArrowUpFromLine size={16}/> Khôi phục bản sao lưu<input type="file" accept=".json" onChange={e=>void restore(e.target.files?.[0])}/></label><button className="btn btn-outline btn-full" onClick={exportExcel}><Download size={16}/> Xuất Excel</button><div className="notice"><ShieldCheck size={17}/> Dữ liệu không được gửi lên máy chủ. Hãy sao lưu định kỳ nếu sử dụng trên máy tính dùng chung.</div><button className="btn btn-danger btn-full" onClick={async()=>{if(window.confirm('Xóa toàn bộ học sinh, lịch sử và cài đặt? Hành động này không thể hoàn tác.')){await db.transaction('rw',db.students,db.results,db.settings,async()=>{await db.students.clear();await db.results.clear();await db.settings.put(defaultSettings)});await refresh();notify('Đã đặt lại dữ liệu.')}}}><Trash2 size={16}/> Xóa toàn bộ dữ liệu</button></div></div></section>}
      </div>
      <footer className="footer"><span>© 2026 CLASS ARENA</span><span><i/> LOCAL-FIRST CLASSROOM EXPERIENCE</span></footer>
    </main>
    {randomVisible&&<button className="random-bubble" onClick={()=>setRandomOpen(v=>!v)} title="Random nhanh">🎲</button>}{randomOpen&&<div className="random-popover"><button className="random-close" onClick={()=>setRandomOpen(false)}>×</button><b>RANDOM NHANH</b><p>{winners.length?winners.map(x=>x.name).join(', '):'Sẵn sàng chọn ngẫu nhiên'}</p><button className="btn btn-primary btn-full" onClick={()=>{setPage('games');setRandomOpen(false);if(game==='card')void runCardGame();else void runGame()}}>BẮT ĐẦU RANDOM</button><button className="text-btn" onClick={()=>setRandomVisible(false)}>Ẩn bong bóng</button></div>}{toast&&<div className="toast"><Check size={16}/>{toast}</div>}
  </div>
}
function Stat({icon,label,value,note,color}:{icon:React.ReactNode;label:string;value:number|string;note:string;color:string}){return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div><small>{label}</small><strong>{value}</strong><span>{note}</span></div></div>}
function GameCard({icon,title,desc,tone,onClick}:{icon:React.ReactNode;title:string;desc:string;tone:string;onClick:()=>void}){return <button className="quick-game" onClick={onClick}><div className={`game-icon ${tone}`}>{icon}</div><b>{title}</b><small>{desc}</small></button>}
function GameTile({active,icon,title,subtitle,number,onClick,tone}:{active:boolean;icon:React.ReactNode;title:string;subtitle:string;number:string;onClick:()=>void;tone:string}){return <button className={`game-tile ${active?'selected':''}`} onClick={onClick}><div className={`game-icon ${tone}`}>{icon}</div><div><small>GAME {number}</small><b>{title}</b><span>{subtitle}</span></div><ChevronDown className="tile-arrow"/></button>}
function Empty({text}:{text:string}){return <div className="empty"><CircleHelp size={25}/>{text}</div>}
function SettingToggle({title,desc,value,onChange}:{title:string;desc:string;value:boolean;onChange:(v:boolean)=>void}){return <div className="setting-toggle"><div><b>{title}</b><small>{desc}</small></div><button className={`switch ${value?'checked':''}`} onClick={()=>onChange(!value)}><i/></button></div>}
export default App
