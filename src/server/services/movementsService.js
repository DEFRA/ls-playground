import {
  countryData,
  countyData,
  parishData,
  holdingData,
  movementData,
  getAnimalTypeName
} from './dataService.js'

function loadCountries() {
  return loadLevelData(movementData, 'country', 'countryname')
}

function loadCounties(parentId) {
  const filteredData = movementData.filter((row) =>
    isCountryValid(parentId, toCphObject(row['source-cph']))
  )

  return loadLevelData(filteredData, 'county', 'countyname')
}

function loadParishes(parentId) {
  const filteredData = movementData.filter(
    (row) =>
      toCphObject(row['source-cph']).county === parentId ||
      toCphObject(row['target-cph']).county === parentId
  )

  return loadLevelData(filteredData, 'parish', 'parishname')
}

function loadHoldings(county, parish) {
  const filteredData = movementData.filter(
    (row) =>
      row['source-cph'].startsWith(`${county}/${parish}/`) ||
      row['target-cph'].startsWith(`${county}/${parish}/`)
  )

  return loadLevelData(filteredData, 'holding', 'holdingname')
}

function loadAnimals(holding) {
  const filteredData = movementData.filter(
    (row) => row['source-cph'] === holding || row['target-cph'] === holding
  )

  const output = {
    rows: [],
    totalIn: 0,
    totalOut: 0,
    movementCount: filteredData.length
  }

  const tmpRows = []
  for (const row of filteredData) {
    const animalType = row['animal-type']
    const animalName = getAnimalTypeName(animalType)
    const sourceCph = toCphObject(row['source-cph'])
    const targetCph = toCphObject(row['target-cph'])
    const sourceCount = Number(row['source-count'])
    const targetCount = Number(row['target-count'])

    buildAnimalNode(tmpRows, animalType, animalName)
    if (sourceCph.holding === holding) {
      tmpRows[animalType].out += sourceCount
      output.totalOut += sourceCount
    }

    if (targetCph.holding === holding) {
      tmpRows[animalType].in += targetCount
      output.totalIn += targetCount
    }
  }

  for (const row of Object.values(tmpRows)) {
    output.rows.push([
      row.id,
      row.name,
      row.in.toLocaleString(),
      row.out.toLocaleString()
    ])
  }

  output.rows.sort((a, b) => a[1].localeCompare(b[1]))
  return output
}

function loadLevelData(filteredData, id, name) {
  const output = {
    rows: [],
    totalIn: 0,
    totalOut: 0,
    movementCount: filteredData.length
  }

  const tmpRows = []
  for (const row of filteredData) {
    const sourceCph = toCphObject(row['source-cph'])
    const targetCph = toCphObject(row['target-cph'])
    const sourceCount = Number(row['source-count'])
    const targetCount = Number(row['target-count'])

    buildAnimalNode(tmpRows, sourceCph[id], sourceCph[name])
    buildAnimalNode(tmpRows, targetCph[id], targetCph[name])

    tmpRows[sourceCph[id]].out += sourceCount
    output.totalOut += sourceCount

    tmpRows[targetCph[id]].in += targetCount
    output.totalIn += targetCount
  }

  for (const row of Object.values(tmpRows)) {
    output.rows.push([
      row.id,
      row.name,
      row.in.toLocaleString(),
      row.out.toLocaleString()
    ])
  }

  output.rows.sort((a, b) => a[1].localeCompare(b[1]))
  return output
}

function toCphObject(rawCph) {
  const cph = rawCph.split('/')
  const county = countyData.find((x) => x.code === Number(cph[0]))
  const parish = parishData.find((x) => x.code === Number(cph[1]))
  const holding = holdingData.find((x) => x.cph === rawCph)
  const country = countryData.find((x) => x.code === county.countrycode)

  return {
    raw: rawCph,
    country: Number(country.code),
    countryname: country.name,
    county: county.code,
    countyname: county.name,
    parish: parish.code,
    parishname: parish.name,
    holding: holding.cph,
    holdingname: holding.name
  }
}

function buildAnimalNode(node, id, name) {
  if (!node[id]) {
    node[id] = {
      id,
      name,
      in: 0,
      out: 0
    }
  }
}

function isCountryValid(country, cph) {
  if (!country) return false
  return countyData.some(
    (county) => county.code === cph.county && county.countrycode === country
  )
}

export { loadCountries, loadCounties, loadParishes, loadHoldings, loadAnimals }
