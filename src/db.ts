import Dexie, { type Table } from 'dexie'

export type Student = {
  id: string; number: number; name: string; group: string; active: boolean;
  selectedCount: number; lastSelectedAt?: number; createdAt: number
}
export type GameResult = {
  id: string; sessionId: string; game: string; studentId: string; studentName: string;
  studentNumber: number; selectedAt: number; status: 'completed' | 'undone'; mode: RandomMode
}
export type RandomMode = 'pure' | 'no-repeat' | 'fairness'
export type AppSettings = {
  id: 'main'; className: string; teacher: string; mode: RandomMode; sound: boolean;
  reducedMotion: boolean; durationSeconds?: number; selectionCount?: number; theme: string; noRepeatCycle: string[]
}
class ArenaDB extends Dexie {
  students!: Table<Student, string>
  results!: Table<GameResult, string>
  settings!: Table<AppSettings, string>
  constructor() {
    super('class-arena-db')
    this.version(1).stores({
      students: 'id, number, name, group, active, selectedCount',
      results: 'id, sessionId, game, studentId, selectedAt, status',
      settings: 'id'
    })
  }
}
export const db = new ArenaDB()
export const defaultSettings: AppSettings = {
  id: 'main', className: 'LỚP CỦA TÔI', teacher: '', mode: 'no-repeat',
  sound: true, reducedMotion: false, durationSeconds: 30, selectionCount: 1, theme: 'violet', noRepeatCycle: []
}
export async function getSettings() {
  return (await db.settings.get('main')) ?? defaultSettings
}
export async function saveSettings(settings: AppSettings) {
  await db.settings.put(settings)
}
export function makeId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}