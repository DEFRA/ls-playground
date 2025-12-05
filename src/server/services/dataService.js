import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'node:url'

const animalTypeData = loadData('animal-types.csv')
const countryData = loadData('country.csv')
const countyData = loadData('county.csv')
const parishData = loadData('parish.csv')
const holdingData = loadData('holdings.csv')
const movementData = loadData('movements.csv')

function loadData(filename) {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const content = fs.readFileSync(
    path.join(dirname, '..', '..', '..', 'data', filename),
    'utf8'
  )

  return parse(content, {
    columns: (header) => header.map((h) => h.trim().toLowerCase()),
    cast: true,
    skip_empty_lines: true
  })
}

function getCountryName(id) {
  return countryData.find((x) => x.code === Number(id)).name || null
}

function getCountyName(id) {
  return countyData.find((x) => x.code === Number(id)).name || null
}

function getParishName(id) {
  return parishData.find((x) => x.code === Number(id)).name || null
}

function getHoldingName(id) {
  return holdingData.find((x) => x.cph === id).name || null
}

function getAnimalTypeName(id) {
  return animalTypeData.find((x) => x.code === id).name || null
}

export {
  animalTypeData,
  countryData,
  countyData,
  parishData,
  holdingData,
  movementData,
  getCountryName,
  getCountyName,
  getParishName,
  getHoldingName,
  getAnimalTypeName
}
