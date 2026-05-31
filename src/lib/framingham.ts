/**
 * Framingham 1998 Wilson et al. Point Score system
 * Calculates 10-year CVD risk percentage.
 * Reference: Wilson PW et al. Circulation 1998;97:1837-1847
 */

type Sex = 'MASCULINO' | 'FEMENINO'

// ---- Male point tables ----
function getMaleAgePoints(age: number): number {
  if (age < 35) return -9
  if (age < 40) return -4
  if (age < 45) return 0
  if (age < 50) return 3
  if (age < 55) return 6
  if (age < 60) return 8
  if (age < 65) return 10
  if (age < 70) return 11
  if (age < 75) return 12
  return 13
}

function getMaleTotalCholesterolPoints(tc: number, age: number): number {
  if (age < 40) {
    if (tc < 160) return 0
    if (tc < 200) return 4
    if (tc < 240) return 7
    if (tc < 280) return 9
    return 11
  } else if (age < 50) {
    if (tc < 160) return 0
    if (tc < 200) return 3
    if (tc < 240) return 5
    if (tc < 280) return 6
    return 8
  } else if (age < 60) {
    if (tc < 160) return 0
    if (tc < 200) return 2
    if (tc < 240) return 3
    if (tc < 280) return 4
    return 5
  } else if (age < 70) {
    if (tc < 160) return 0
    if (tc < 200) return 1
    if (tc < 240) return 1
    if (tc < 280) return 2
    return 3
  } else {
    if (tc < 160) return 0
    if (tc < 200) return 0
    if (tc < 240) return 0
    if (tc < 280) return 1
    return 1
  }
}

function getMaleHDLPoints(hdl: number): number {
  if (hdl >= 60) return -1
  if (hdl >= 50) return 0
  if (hdl >= 40) return 1
  return 2
}

function getMaleSBPPoints(sbp: number, onMeds: boolean): number {
  if (onMeds) {
    if (sbp < 120) return 0
    if (sbp < 130) return 1
    if (sbp < 140) return 2
    if (sbp < 160) return 2
    return 3
  } else {
    if (sbp < 120) return -2
    if (sbp < 130) return 0
    if (sbp < 140) return 1
    if (sbp < 160) return 1
    return 2
  }
}

function getMaleSmokingPoints(smoker: boolean, age: number): number {
  if (!smoker) return 0
  if (age < 40) return 9
  if (age < 50) return 7
  if (age < 60) return 4
  if (age < 70) return 2
  return 1
}

function getMaleDiabetesPoints(diabetes: boolean): number {
  return diabetes ? 2 : 0
}

function malePointsToRisk(points: number): number {
  const table: Record<number, number> = {
    [-3]: 1,
    [-2]: 1,
    [-1]: 1,
    0: 1,
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 2,
    6: 2,
    7: 3,
    8: 4,
    9: 5,
    10: 6,
    11: 8,
    12: 10,
    13: 12,
    14: 16,
    15: 20,
    16: 25,
    17: 30,
  }
  if (points <= -3) return 1
  if (points >= 17) return 30
  return table[points] ?? 1
}

// ---- Female point tables ----
function getFemaleAgePoints(age: number): number {
  if (age < 35) return -7
  if (age < 40) return -3
  if (age < 45) return 0
  if (age < 50) return 3
  if (age < 55) return 6
  if (age < 60) return 8
  if (age < 65) return 10
  if (age < 70) return 12
  if (age < 75) return 14
  return 16
}

function getFemaleTotalCholesterolPoints(tc: number, age: number): number {
  if (age < 40) {
    if (tc < 160) return 0
    if (tc < 200) return 4
    if (tc < 240) return 8
    if (tc < 280) return 11
    return 13
  } else if (age < 50) {
    if (tc < 160) return 0
    if (tc < 200) return 3
    if (tc < 240) return 6
    if (tc < 280) return 8
    return 10
  } else if (age < 60) {
    if (tc < 160) return 0
    if (tc < 200) return 2
    if (tc < 240) return 4
    if (tc < 280) return 5
    return 7
  } else if (age < 70) {
    if (tc < 160) return 0
    if (tc < 200) return 1
    if (tc < 240) return 2
    if (tc < 280) return 3
    return 4
  } else {
    if (tc < 160) return 0
    if (tc < 200) return 1
    if (tc < 240) return 1
    if (tc < 280) return 2
    return 2
  }
}

function getFemaleHDLPoints(hdl: number): number {
  if (hdl >= 60) return -1
  if (hdl >= 50) return 0
  if (hdl >= 40) return 1
  return 2
}

function getFemaleSBPPoints(sbp: number, onMeds: boolean): number {
  if (onMeds) {
    if (sbp < 120) return 0
    if (sbp < 130) return 3
    if (sbp < 140) return 4
    if (sbp < 160) return 5
    return 6
  } else {
    if (sbp < 120) return -3
    if (sbp < 130) return 0
    if (sbp < 140) return 1
    if (sbp < 160) return 2
    return 4
  }
}

function getFemaleSmokingPoints(smoker: boolean, age: number): number {
  if (!smoker) return 0
  if (age < 40) return 9
  if (age < 50) return 7
  if (age < 60) return 4
  if (age < 70) return 2
  return 1
}

function getFemaleDiabetesPoints(diabetes: boolean): number {
  return diabetes ? 4 : 0
}

function femalePointsToRisk(points: number): number {
  const table: Record<number, number> = {
    [-2]: 1,
    [-1]: 1,
    0: 1,
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    10: 1,
    11: 1,
    12: 1,
    13: 2,
    14: 2,
    15: 3,
    16: 4,
    17: 5,
    18: 6,
    19: 8,
    20: 11,
    21: 14,
    22: 17,
    23: 22,
    24: 27,
    25: 30,
  }
  if (points <= -2) return 1
  if (points >= 25) return 30
  return table[points] ?? 1
}

export interface FraminghamInput {
  age: number
  sex: Sex
  totalCholesterol: number // mg/dL
  hdl: number // mg/dL
  systolicBP: number // mmHg
  onBPMedication?: boolean
  smoker: boolean
  diabetes: boolean
}

export interface FraminghamResult {
  score: number
  riesgo: 'Bajo' | 'Moderado' | 'Alto'
  porcentaje: number
}

export function calculateFramingham(input: FraminghamInput): FraminghamResult {
  const { age, sex, totalCholesterol, hdl, systolicBP, smoker, diabetes, onBPMedication = false } = input

  let points: number
  let percentage: number

  if (sex === 'MASCULINO') {
    points =
      getMaleAgePoints(age) +
      getMaleTotalCholesterolPoints(totalCholesterol, age) +
      getMaleHDLPoints(hdl) +
      getMaleSBPPoints(systolicBP, onBPMedication) +
      getMaleSmokingPoints(smoker, age) +
      getMaleDiabetesPoints(diabetes)
    percentage = malePointsToRisk(points)
  } else {
    points =
      getFemaleAgePoints(age) +
      getFemaleTotalCholesterolPoints(totalCholesterol, age) +
      getFemaleHDLPoints(hdl) +
      getFemaleSBPPoints(systolicBP, onBPMedication) +
      getFemaleSmokingPoints(smoker, age) +
      getFemaleDiabetesPoints(diabetes)
    percentage = femalePointsToRisk(points)
  }

  let riesgo: 'Bajo' | 'Moderado' | 'Alto'
  if (percentage < 10) {
    riesgo = 'Bajo'
  } else if (percentage < 20) {
    riesgo = 'Moderado'
  } else {
    riesgo = 'Alto'
  }

  return { score: points, riesgo, porcentaje: percentage }
}
