import type { IAutoMovieConstructionPortLoop } from "@automovie/interface";

import { adjacentAutoMovieFloat64 } from "../../math/internal/adjacentAutoMovieFloat64";
import { AutoMovieConstructionPortAddress } from "./AutoMovieConstructionPortAddress";

/**
 * A finite inward radial endpoint whose literal port address stays admitted.
 *
 * `station` is the actual closed source domain in kernel mm; `phase` is the
 * caller's closed chart branch in radians. Loop station inputs retain public
 * metres. The returned dimensionless Q is greater than originalShare > 0. Both
 * that original control and Q are certified with the actual address owner.
 * Fixed-clock rounded coordinates are monotone on their intervening interval.
 * The caller still admits any separately selected q=0 endpoint at its source.
 *
 * For s=RN(y0+RN(RN(q*a)*c)), c>0 requires the rounded inner product to be at
 * most down(down(U-y0)/c). Dividing that threshold downward by positive a
 * bounds q. For c<0, use up(L-y0) before the negative division. Every threshold
 * is representable, so monotonic rounding preserves each sufficient inequality.
 * Phase uses the same proof: sense=+/-1 is an exact sign change and RN is sign
 * symmetric, while the final certificate retains the original product order.
 *
 * This is a conservative inner endpoint, not the largest representable Q.
 * Nonfinite or unrepresentable inverse steps and failed literal certificates
 * refuse. A level root only at the omitted boundary need not remain bracketed;
 * no claim of complete finite-input support or root-branch uniqueness is made.
 */
export function AutoMovieConstructionPortRadialRange(
  loop: IAutoMovieConstructionPortLoop,
  clock: number,
  station: readonly [number, number],
  phase: readonly [number, number],
  originalShare: number,
): number {
  const y0: number = loop.centre[0] * 1000;
  const p0: number = loop.centre[1];
  const a: number = loop.semi[0] * 1000;
  const b: number = loop.semi[1];
  if (
    !(a > 0 && b > 0 && originalShare > 0) ||
    !(loop.sense === 1 || loop.sense === -1)
  )
    throw new Error(
      "Port radial range needs a finite clock, centre, positive axes/share and signed phase sense.",
    );
  if (!(station[0] < station[1] && phase[0] < phase[1]))
    throw new Error(
      "Port radial range needs finite increasing closed source and phase bounds.",
    );

  /**
   * Certify the actual composed Float64 address without reading or moving a
   * source.
   */
  const admit: (share: number, role: string) => void = (
    share: number,
    role: string,
  ): void => {
    const [s, t]: [number, number] = AutoMovieConstructionPortAddress(
      loop,
      clock,
      share,
    );
    if (!(s >= station[0] && s <= station[1] && t >= phase[0] && t <= phase[1]))
      throw new Error(
        "Port radial range " + role + " fails literal source/phase admission.",
      );
  };
  admit(originalShare, "original control");

  /**
   * Bound one original multiply-multiply-add coordinate. The amplitude is
   * positive; a zero final direction has no upper limit. Negative sense in
   * phase is an exact sign change, not a regrouping of the address evaluator.
   */
  const bound: (
    centre: number,
    amplitude: number,
    direction: number,
    interval: readonly [number, number],
    owner: string,
  ) => number | null = (
    centre: number,
    amplitude: number,
    direction: number,
    interval: readonly [number, number],
    owner: string,
  ): number | null => {
    if (direction === 0) return null;
    let step: string = "boundary subtraction";
    try {
      const distance: number = adjacentAutoMovieFloat64(
        (direction > 0 ? interval[1] : interval[0]) - centre,
        direction < 0,
      );
      step = "direction division";
      const inner: number = adjacentAutoMovieFloat64(
        distance / direction,
        false,
      );
      step = "amplitude division";
      return adjacentAutoMovieFloat64(inner / amplitude, false);
    } catch (error: unknown) {
      throw new Error(
        "Port radial range " +
          owner +
          " " +
          step +
          " is unavailable: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  };

  const stationLimit: number | null = bound(
    y0,
    a,
    Math.cos(clock),
    station,
    "station",
  );
  const phaseLimit: number | null = bound(
    p0,
    b,
    loop.sense * Math.sin(clock),
    phase,
    "phase",
  );
  const maximum: number | null =
    stationLimit === null
      ? phaseLimit
      : phaseLimit === null
        ? stationLimit
        : Math.min(stationLimit, phaseLimit);
  if (maximum === null || !(maximum > originalShare))
    throw new Error(
      "Port radial range has no representable positive outer endpoint beyond its original control.",
    );
  admit(maximum, "candidate endpoint");
  return maximum;
}
