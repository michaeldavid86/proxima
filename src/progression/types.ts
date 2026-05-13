// Badge: a one-shot unlockable achievement. Once unlocked, persists in
// localStorage. v1.4 ships 18 badges grouped into four categories: mission
// completion, learning track, operational discipline, and discovery.
export type BadgeCategory = 'mission' | 'learning' | 'discipline' | 'discovery'

export interface Badge {
  id: string
  title: string
  category: BadgeCategory
  icon: string // emoji glyph
  // Shown on the locked card (hint at how to earn it).
  hint: string
  // Shown on the unlocked card and in the toast.
  blurb: string
}

export interface BadgeUnlock {
  id: string
  unlockedAt: number // epoch ms
}
