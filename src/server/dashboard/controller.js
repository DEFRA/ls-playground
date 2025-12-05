import {
  loadCountries,
  loadCounties,
  loadParishes,
  loadHoldings,
  loadAnimals
} from '../services/movementsService.js'
import {
  getCountryName,
  getCountyName,
  getParishName,
  getHoldingName
} from '../services/dataService.js'

function renderCountrySelector(request, h) {
  return h.view('dashboard/index', {
    pageTitle: 'Movement dashboard',
    movementData: loadCountries(),
    postBackUrl: '/dashboard',
    levelName: '',
    breadcrumbs: [
      {
        text: 'Home',
        href: '/'
      },
      {
        text: 'Dashboard'
      }
    ]
  })
}

function renderCountySelector(request, h) {
  const { country } = request.app.dashboardParams
  const levelName = getCountryName(country)

  return h.view('dashboard/county', {
    pageTitle: 'Movement dashboard',
    movementData: loadCounties(country),
    postBackUrl: `/dashboard/${country}`,
    levelName,
    breadcrumbs: [
      {
        text: 'Home',
        href: '/'
      },
      {
        text: `Dashboard`,
        href: `/dashboard`
      },
      {
        text: levelName
      }
    ]
  })
}

function renderParishSelector(request, h) {
  const { country, county } = request.app.dashboardParams
  const levelName = getCountyName(county)

  return h.view('dashboard/parish', {
    pageTitle: 'Movement dashboard',
    movementData: loadParishes(county),
    postBackUrl: `/dashboard/${country}/${county}`,
    levelName,
    breadcrumbs: [
      {
        text: 'Home',
        href: '/'
      },
      {
        text: `Dashboard`,
        href: `/dashboard`
      },
      {
        text: getCountryName(country),
        href: `/dashboard/${country}`
      },
      {
        text: levelName
      }
    ]
  })
}

function renderHoldingSelector(request, h) {
  const { country, county, parish } = request.app.dashboardParams
  const levelName = getParishName(parish)

  return h.view('dashboard/holding', {
    pageTitle: 'Movement dashboard',
    movementData: loadHoldings(county, parish),
    postBackUrl: `/dashboard/${country}/${county}/${parish}`,
    levelName,
    breadcrumbs: [
      {
        text: 'Home',
        href: '/'
      },
      {
        text: `Dashboard`,
        href: `/dashboard`
      },
      {
        text: getCountryName(country),
        href: `/dashboard/${country}`
      },
      {
        text: getCountyName(county),
        href: `/dashboard/${country}/${county}`
      },
      {
        text: getParishName(parish),
        href: `/dashboard/${country}/${county}/${parish}`
      },
      {
        text: levelName
      }
    ]
  })
}

function renderAnimalSelector(request, h) {
  const { country, county, parish } = request.app.dashboardParams
  const holding = request.app.dashboardParams.holding.replaceAll('-', '/')
  const levelName = getHoldingName(holding)

  return h.view('dashboard/holding', {
    pageTitle: 'Movement dashboard',
    movementData: loadAnimals(holding),
    postBackUrl: `/dashboard/${country}/${county}/${parish}/${holding}`,
    levelName,
    breadcrumbs: [
      {
        text: 'Home',
        href: '/'
      },
      {
        text: `Dashboard`,
        href: `/dashboard`
      },
      {
        text: getCountryName(country),
        href: `/dashboard/${country}`
      },
      {
        text: getCountyName(county),
        href: `/dashboard/${country}/${county}`
      },
      {
        text: getParishName(parish),
        href: `/dashboard/${country}/${county}/${parish}`
      },
      {
        text: levelName
      }
    ]
  })
}

export {
  renderAnimalSelector,
  renderHoldingSelector,
  renderParishSelector,
  renderCountySelector,
  renderCountrySelector
}
