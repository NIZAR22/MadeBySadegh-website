import { formatPhoneInput, splitEmail } from '@/utils/format'

describe('formatPhoneInput', () => {
  it.each([
    ['3', '(3'],
    ['321', '(321) '],
    ['3213', '(321) 3'],
    ['321345', '(321) 345-'],
    ['3213451480', '(321) 345-1480'],
    ['(321) 345-1480', '(321) 345-1480'],
    ['32134514809', '(321) 345-1480'],
    ['+1 (321) 345-1480', '(321) 345-1480'],
    ['13213451480', '(321) 345-1480'],
    ['1-321', '(321) ']
  ])('formats %s as %s', (input, expected) => {
    expect(formatPhoneInput(input)).toBe(expected)
  })

  it('leaves input without digits unchanged', () => {
    expect(formatPhoneInput('abc')).toBe('abc')
    expect(formatPhoneInput('')).toBe('')
  })
})

describe('splitEmail', () => {
  it('splits before the @', () => {
    expect(splitEmail('name@example.com')).toEqual(['name', '@example.com'])
  })

  it('keeps a value without @ in one piece', () => {
    expect(splitEmail('not-an-email')).toEqual(['not-an-email', ''])
  })
})
