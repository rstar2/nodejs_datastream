const { parseLine, parseFile, ParseError } = require('./parse');

describe('parseLine', () => {
  test('succeeds', () => {
    expect(parseLine('11 22')).toEqual([11, 22]);
  });

  test('fails with InvalidPattern', () => {
    expect(parseLine('13 13 1443')).toBe(ParseError.InvalidPattern);
  });

  test('fails with InvalidNumbers', () => {
    expect(parseLine('11 22a')).toBe(ParseError.InvalidNumbers);
    expect(parseLine('11a 22')).toBe(ParseError.InvalidNumbers);
  });
});

describe('parseFile', () => {
  // Mock the console.error as it will be called and will trace "errors"
  test('succeeds', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(
      parseFile(`
    # skip comments
    # skip blank lines
    # "fix" offset-ed lines
    # skip "errors" 
    11 22

        22 33
    33 44

    13 13 1443
    2e 45
    56 r56

    44 55
`)
    ).toEqual([
      [11, 22],
      [22, 33],
      [33, 44],
      [44, 55],
    ]);

    // expect 3 ParseError.XXXX "errors"
    expect(spy).toHaveBeenCalledTimes(3);

    spy.mockRestore();
  });
});
