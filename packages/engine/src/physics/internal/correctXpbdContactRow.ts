import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";
import type { IAutoMovieXpbdContactRow } from "./IAutoMovieXpbdContactRow";
import type { IAutoMovieXpbdResponder } from "./IAutoMovieXpbdResponder";
import { pairXpbdContactRow } from "./pairXpbdContactRow";

/**
 * A contact's positional correction (Mueller et al. 2020, section 3.3.1)
 * through the pair's row (`pairXpbdContactRow`): `dlambda = (c - alphaTilde
 * lambda) / (w + alphaTilde)`, the spring's compliance `w / omega^2` so the
 * contact keeps its natural frequency against the inertia it really moves. A
 * correction that would carry a joint axis onto or past a bound holds that axis
 * and is solved again (`IAutoMovieXpbdContactRow.limit`), at most once more per
 * newly held axis.
 *
 * @param trees The pass's articulated response; each body alone when absent.
 * @param first The first body.
 * @param second The second body.
 * @param away The unit world direction pushing the first body out.
 * @param c The depth beyond the allowed error, metres.
 * @param armA The first body's world arm to the contact point, metres.
 * @param armB The second body's world arm to the contact point, metres.
 * @param omega The contact spring's natural angular frequency, per second.
 * @param h The substep, seconds.
 * @param lambda The contact's accumulated normal multiplier.
 * @returns The multiplier's change.
 */
export function correctXpbdContactRow(
  trees: IAutoMovieXpbdResponder | undefined,
  first: AutoMovieXpbdBody,
  second: AutoMovieXpbdBody,
  away: IAutoMovieVector3,
  c: number,
  armA: IAutoMovieVector3,
  armB: IAutoMovieVector3,
  omega: number,
  h: number,
  lambda: number,
): number {
  for (;;) {
    const row: IAutoMovieXpbdContactRow = pairXpbdContactRow(
      trees,
      first,
      second,
      away,
      armA,
      armB,
    );
    const tilde: number = row.weight / (omega * omega) / (h * h);
    const total: number = row.weight + tilde;
    if (!(total > 0)) return 0;
    const delta: number = (c - tilde * lambda) / total;
    if (row.limit(delta)) continue;
    row.apply(delta);
    return delta;
  }
}
