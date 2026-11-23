/**
 * Whether a capture point parked past the shrunken support, inside the support
 * itself, calls for a step: a captured state has its capture point inside the
 * shrunken support (Koolen et al., Corollary 3), and a captured linear
 * inverted pendulum converges with the time constant 1 / omega, so an
 * excursion past the shrunken edge by more than the margin that has not
 * shrunk, measured, over a window of 1 / omega is not converging, and a step
 * is due (design-4017-edge, E3: step when the excursion is not shrinking).
 * A window that ends with the excursion smaller than it began restarts from
 * there, so a capture point converging inward through the band never steps;
 * the window closes once the capture point is back within the margin.
 *
 * @param input The window so far, if one is open: when it began, local
 *   seconds, and the excursion it began at, metres; the present excursion
 *   past the shrunken support, metres; the margin, metres; the present local
 *   seconds; and the pendulum's frequency, per second.
 * @returns The window to keep, if any, and whether a step is due.
 */
export function physicalCaptureBand(input: {
  band?: { since: number; excess: number };
  excess: number;
  margin: number;
  seconds: number;
  omega: number;
}): { band?: { since: number; excess: number }; due: boolean } {
  if (!(input.excess > input.margin) || !(input.omega > 0)) return { due: false };
  const open: { since: number; excess: number } | undefined = input.band;
  if (open === undefined)
    return { band: { since: input.seconds, excess: input.excess }, due: false };
  if (input.seconds - open.since < 1 / input.omega - 1e-9)
    return { band: open, due: false };
  if (input.excess < open.excess)
    return { band: { since: input.seconds, excess: input.excess }, due: false };
  return { band: open, due: true };
}
