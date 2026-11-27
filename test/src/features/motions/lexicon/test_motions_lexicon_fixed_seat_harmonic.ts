import {
  fixedSeatHarmonic
} from "../../../../../packages/motions/src/lexicon/internal/fixedSeatHarmonic";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A harmonic's value at a turn. */
const value = (f: fixedSeatHarmonic.IHarmonic, t: number): number =>
  f.constant + f.cosine * Math.cos(t) + f.sine * Math.sin(t);

/**
 * `fixedSeatHarmonic` recovers `A + B cos t + C sin t` from a joint range's
 * ends and middle, and `best` finds the turn where the greater of two such
 * distances is least.
 *
 * Scenarios, a range a radian either side of its centre:
 *
 * 1. `2 + cos t + 0.5 sin t` read at −1, 0 and 1 gives back 2, 1 and 0.5.
 * 2. Two copies of `2 + cos t`, largest at the centre, are least at the first end
 *    tried, −1.
 * 3. `1 + sin t` and `1 − sin t` are least where they cross, at the centre.
 */
export function test_motions_lexicon_fixed_seat_harmonic(): void {
  const f: fixedSeatHarmonic.IHarmonic = {
    constant: 2,
    cosine: 1,
    sine: 0.5,
  };
  const g: fixedSeatHarmonic.IHarmonic = fixedSeatHarmonic(
    value(f, -1),
    value(f, 0),
    value(f, 1),
    1,
  );
  TestValidator.predicate(
    "recovered",
    nclose(g.constant, 2, 1e-12) &&
      nclose(g.cosine, 1, 1e-12) &&
      nclose(g.sine, 0.5, 1e-12),
  );
  const dome: fixedSeatHarmonic.IHarmonic = { constant: 2, cosine: 1, sine: 0 };
  TestValidator.predicate(
    "least at an end",
    fixedSeatHarmonic.best(dome, dome, 1, 0) === -1,
  );
  TestValidator.predicate(
    "least where they cross",
    nclose(
      fixedSeatHarmonic.best(
        { constant: 1, cosine: 0, sine: 1 },
        { constant: 1, cosine: 0, sine: -1 },
        1,
        0.5,
      ),
      0,
      1e-12,
    ),
  );
}
