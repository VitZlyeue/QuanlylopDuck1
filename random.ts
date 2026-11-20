import type { RandomMode, Student } from './db'

export function secureIndex(max: number): number {
  if (max <= 1) return 0
  const values = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / max) * max
  let value = 0
  do { crypto.getRandomValues(values); value = values[0] } while (value >= limit)
  return value % max
}
export function chooseStudents(
  all: Student[], count: number, mode: RandomMode, excludedIds: string[] = []
): Student[] {
  const eligible = all.filter(s => s.active && !excludedIds.includes(s.id))
  if (!eligible.length || count <= 0) return []
  const pool = [...eligible]
  const winners: Student[] = []
  const total = Math.min(Math.floor(count), pool.length)
  for (let i = 0; i < total; i++) {
    let candidates = pool
    if (mode === 'fairness') {
      const min = Math.min(...pool.map(s => s.selectedCount))
      candidates = pool.filter(s => s.selectedCount === min)
    }
    const index = secureIndex(candidates.length)
    const winner = candidates[index]
    winners.push(winner)
    pool.splice(pool.findIndex(s => s.id === winner.id), 1)
  }
  return winners
}
export function randomInteger(min: number, max: number) {
  const low = Math.ceil(Math.min(min, max)), high = Math.floor(Math.max(min, max))
  return low + secureIndex(high - low + 1)
}