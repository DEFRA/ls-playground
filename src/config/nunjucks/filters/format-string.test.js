import { urlEncode } from './format-string.js'

describe('#urlEncode', () => {
  test('String should be in encoded as expected', () => {
    expect(urlEncode('Hello World')).toBe('Hello%20World')
  })

  test('String should be in encoded as expected', () => {
    expect(urlEncode('Hello/World')).toBe('Hello%2FWorld')
  })

  test('String should be in encoded as expected', () => {
    expect(urlEncode('Hello&World')).toBe('Hello%26World')
  })

  test('String should be in encoded as expected', () => {
    expect(urlEncode('Hello://World')).toBe('Hello%3A%2F%2FWorld')
  })
})
