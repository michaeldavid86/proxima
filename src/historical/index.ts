import type { HistoricalVignette } from './types'
import { h1_gemini } from './h1_gemini'
import { h2_orbital_express } from './h2_orbital_express'
import { h3_luch_olymp } from './h3_luch_olymp'
import { h4_sj21_beidou } from './h4_sj21_beidou'
import { h5_gssap_sj29 } from './h5_gssap_sj29'

export const historicalVignettes: HistoricalVignette[] = [
  h1_gemini,
  h2_orbital_express,
  h3_luch_olymp,
  h4_sj21_beidou,
  h5_gssap_sj29,
]

export const historicalById: Record<string, HistoricalVignette> = Object.fromEntries(
  historicalVignettes.map((v) => [v.id, v]),
)
