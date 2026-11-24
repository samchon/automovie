/** Hairer and Wanner DOPRI5 `a` rows (CDOPRI) of the Butcher tableau. */
const DOPRI5_A: readonly (readonly number[])[] = [
  [],
  [0.2],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
];

/** DOPRI5 dense-output `d` terms (DOPCOR), as carried by MESA's mod_dopri5. */
const DOPRI5_D: readonly number[] = [
  -12715105075 / 11282082432,
  0,
  87487479700 / 32700410799,
  -10690763975 / 1880347072,
  701980252875 / 199316789632,
  -1453857185 / 822651844,
  69997945 / 29380423,
];

/**
 * One step of x' = -x from 1 read at `theta` of it, by the published
 * coefficients.
 */
export const dopri5Reference: (h: number, theta: number) => number = (
  h: number,
  theta: number,
): number => {
  const k: number[] = [];
  for (const row of DOPRI5_A)
    k.push(
      -(
        1 +
        h *
          row.reduce(
            (sum: number, a: number, index: number): number =>
              sum + a * k[index]!,
            0,
          )
      ),
    );
  const ydiff: number = -k[6]! - 1;
  const bspl: number = h * k[0]! - ydiff;
  const third: number = ydiff - h * k[6]! - bspl;
  const fourth: number =
    h *
    DOPRI5_D.reduce(
      (sum: number, d: number, index: number): number => sum + d * k[index]!,
      0,
    );
  const rest: number = 1 - theta;
  return 1 + theta * (ydiff + rest * (bspl + theta * (third + rest * fourth)));
};
