/**
 * Scalar second-order calculus for the lip skin's two-coordinate chart. The lip
 * model supplies the admitted coordinates and shape coefficients.
 */
export namespace AutoMovieHumanHeadLipJet {
  /** Value, station, phase, station², station-phase and phase². */
  export type Jet = [number, number, number, number, number, number];

  /** The positive Euclidean chord and its two borrowed coordinate jets. */
  export function chord(x: Jet, y: Jet, length: number): Jet {
    return compose(
      add(multiply(x, x), multiply(y, y)),
      length,
      1 / (2 * length),
      -1 / (4 * length ** 3),
    );
  }

  /** Quotient of two scalar second-order fields. */
  export function quotient(a: Jet, b: Jet): Jet {
    return multiply(a, compose(b, 1 / b[0], -1 / b[0] ** 2, 2 / b[0] ** 3));
  }

  /** Scalar second-order chain rule in two coordinates. */
  export function compose(
    a: Jet,
    value: number,
    first: number,
    second: number,
  ): Jet {
    return [
      value,
      first * a[1],
      first * a[2],
      first * a[3] + second * a[1] ** 2,
      first * a[4] + second * a[1] * a[2],
      first * a[5] + second * a[2] ** 2,
    ];
  }

  /** Scalar componentwise sum. */
  export function add(a: Jet, b: Jet): Jet {
    return [
      a[0] + b[0],
      a[1] + b[1],
      a[2] + b[2],
      a[3] + b[3],
      a[4] + b[4],
      a[5] + b[5],
    ];
  }

  /** Scalar componentwise difference. */
  export function subtract(a: Jet, b: Jet): Jet {
    return [
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2],
      a[3] - b[3],
      a[4] - b[4],
      a[5] - b[5],
    ];
  }

  /** Scalar second-order product rule in two coordinates. */
  export function multiply(a: Jet, b: Jet): Jet {
    return [
      a[0] * b[0],
      a[1] * b[0] + a[0] * b[1],
      a[2] * b[0] + a[0] * b[2],
      a[3] * b[0] + 2 * a[1] * b[1] + a[0] * b[3],
      a[4] * b[0] + a[1] * b[2] + a[2] * b[1] + a[0] * b[4],
      a[5] * b[0] + 2 * a[2] * b[2] + a[0] * b[5],
    ];
  }
}
