import {
  renderAnimalSelector,
  renderHoldingSelector,
  renderParishSelector,
  renderCountySelector,
  renderCountrySelector
} from './controller.js'

const dateRegex = /^\d{4}-\d{2}-\d{2}(?:,\d{4}-\d{2}-\d{2})?$/

export const dashboard = {
  plugin: {
    name: 'dashboard',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/dashboard/{segments*}',
          handler: async (request, h) => {
            const raw = request.params.segments || ''
            const parts = raw ? raw.split('/') : []

            const [s1, s2, s3, s4, s5] = parts

            let fromDate, toDate, country, county, parish, holding

            if (s1 && dateRegex.test(s1)) {
              // pattern: /dashboard/{date}[/{country}[/{county}[/{parish}[/{holding}]]]]
              const dateParts = s1.split(',')
              fromDate = dateParts[0]
              toDate =
                dateParts.length === 2
                  ? dateParts[1]
                  : new Date().toISOString().slice(0, 10)
              country = Number(s2)
              county = Number(s3)
              parish = Number(s4)
              holding = s5
            } else {
              // pattern: /dashboard[/{country}[/{county}[/{parish}[/{holding}]]]]
              fromDate = toDate = undefined
              country = Number(s1)
              county = Number(s2)
              parish = Number(s3)
              holding = s4
            }

            // Attach normalised params for the controller
            request.app.dashboardParams = {
              fromDate,
              toDate,
              country,
              county,
              parish,
              holding
            }

            if (holding !== undefined) return renderAnimalSelector(request, h)
            if (!isNaN(parish)) return renderHoldingSelector(request, h)
            if (!isNaN(county)) return renderParishSelector(request, h)
            if (!isNaN(country)) return renderCountySelector(request, h)
            return renderCountrySelector(request, h)
          }
        }
      ])
    }
  }
}
