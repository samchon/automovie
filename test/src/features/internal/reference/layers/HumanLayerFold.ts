import { HumanAnatomy } from "../../HumanAnatomy";
import type { HumanLayerFinding } from "../../HumanLayerFinding";
import { HumanLayerPlane } from "../../HumanLayerPlane";
import { HumanLayerPolygon } from "../../HumanLayerPolygon";
import { HumanLayerSite } from "../../HumanLayerSite";
import { HumanAnatomyShared } from "../../HumanAnatomyShared";

/** A point in space, mm. */
type V3 = HumanAnatomy.V3;

/** A point in a section's plane, mm. */
type V2 = [number, number];

/** The shared vector helpers, by a short name. */
const A: typeof HumanAnatomy = HumanAnatomy;

/** Sectors of the section's bearing in which the extra concave turning is located. */
const BINS: number = 24;

/**
 * Fold detection: whether a generated section turns concavely where its
 * reference does not.
 *
 * The reading is the exterior-turn excess (total absolute turning less the
 * net turning, zero for a convex loop, four times the angle of an inward V)
 * of the generated loop less the reference loop's own. It is an indicator of
 * a gross fold, not a match target: a universal section may be smoother or
 * more modelled than its reference, so only turning the reference does not
 * have, beyond a stated margin, is reported.
 */
export namespace HumanLayerFold {
  /** Arclength step at which turning is read, mm. */
  export const TURN_STEP: number = 1;

  /** Finer step whose difference from {@link TURN_STEP} measures what resampling adds to turning, mm. */
  export const TURN_FINE: number = 0.5;

  /**
   * Least excess turning that reads as a fold, degrees: the inward V whose
   * sagitta over a 10 mm chord is `HumanAnatomyShared.CREASE` (1 mm), the least
   * that reads as a crease, has walls at atan(1 / 5) from the tangent and
   * adds four times that angle, 45.2 degrees.
   */
  export const FOLD_FLOOR: number = (4 * Math.atan((2 * HumanAnatomyShared.CREASE) / 10) * 180) / Math.PI;

  /** A fold reading of one layer. */
  export interface IReading {
    /** Generated minus reference excess turning, degrees. */
    degrees: number;

    /** The margin, degrees: {@link FOLD_FLOOR}, or what 0.5 mm resampling adds to either loop when that is more. */
    limit: number;

    /** The finding when the reading passes its margin; null otherwise. */
    finding: HumanLayerFinding.IFinding | null;
  }

  /**
   * Read the excess concave turning of a generated section against its reference.
   *
   * @param props.person Person, for the finding.
   * @param props.site The layer the section belongs to.
   * @param props.gen The generated loop, counter-clockwise.
   * @param props.ref The reference loop, counter-clockwise.
   */
  export function read(props: { person: string; site: HumanLayerSite.ISite; gen: V2[]; ref: V2[] }): IReading {
    const deg: number = 180 / Math.PI;
    const g1: HumanLayerPolygon.ITurning = HumanLayerPolygon.turning(props.gen, TURN_STEP);
    const g2: HumanLayerPolygon.ITurning = HumanLayerPolygon.turning(props.gen, TURN_FINE);
    const r1: HumanLayerPolygon.ITurning = HumanLayerPolygon.turning(props.ref, TURN_STEP);
    const r2: HumanLayerPolygon.ITurning = HumanLayerPolygon.turning(props.ref, TURN_FINE);
    const degrees: number = (g1.excess - r1.excess) * deg;
    const limit: number = Math.max(FOLD_FLOOR, (Math.abs(g1.excess - g2.excess) + Math.abs(r1.excess - r2.excess)) * deg);

    if (!(degrees > limit)) return { degrees, limit, finding: null };

    return { degrees, limit, finding: locate(props, g1, r1, degrees, limit) };
  }
}

/** Sector index of a point's bearing from a centre. */
function sector(p: V2, c: V2): number {
  return Math.floor(((Math.atan2(p[1] - c[1], p[0] - c[0]) / (2 * Math.PI) + 1) % 1) * BINS) % BINS;
}

/** The concave turning, radians, of each sector of a loop's bearing. */
function concave(t: HumanLayerPolygon.ITurning, c: V2): Float64Array {
  const sum: Float64Array = new Float64Array(BINS);

  t.turns.forEach((turn: number, i: number): void => {
    if (turn >= 0) return;
    sum[sector(t.points[i]!, c)] += -turn;
  });

  return sum;
}

/**
 * Address a fold: the sector of the generated loop whose concave turning
 * exceeds the reference's most, the chain phases of its concave turns, and its
 * sharpest turn's place.
 */
function locate(
  props: { person: string; site: HumanLayerSite.ISite; gen: V2[]; ref: V2[] },
  g1: HumanLayerPolygon.ITurning,
  r1: HumanLayerPolygon.ITurning,
  degrees: number,
  limit: number,
): HumanLayerFinding.IFinding {
  const deg: number = 180 / Math.PI;
  const plane: HumanLayerPlane.IPlane = props.site.plane;
  const gc: V2 = HumanLayerPolygon.centroid(props.gen);
  const rc: V2 = HumanLayerPolygon.centroid(props.ref);
  const hg: Float64Array = concave(g1, gc);
  const hr: Float64Array = concave(r1, rc);
  let best: number = 0;

  for (let i: number = 1; i < BINS; i++) if (hg[i]! - hr[i]! > hg[best]! - hr[best]!) best = i;

  let worst: number = -1;
  const phases: number[] = [];

  g1.turns.forEach((turn: number, i: number): void => {
    if (sector(g1.points[i]!, gc) !== best || turn >= 0) return;
    phases.push(HumanLayerSite.phase(props.site, HumanLayerPlane.world(plane, g1.points[i]!)));

    if (worst < 0 || turn < g1.turns[worst]!) worst = i;
  });

  const at: V3 = HumanLayerPlane.world(plane, g1.points[Math.max(0, worst)]!);

  return {
    person: props.person,
    chain: props.site.chain,
    layer: props.site.layer,
    reading: "fold",
    phase: phases.length > 0 ? HumanLayerPolygon.arc(phases) : null,
    bearing: HumanLayerPolygon.bearing(A.sub(at, HumanLayerPlane.world(plane, gc))),
    value: degrees,
    limit,
    mean: (hg[best]! - hr[best]!) * deg,
    unit: "deg",
    at,
    detail: `excess turning generated ${(g1.excess * deg).toFixed(1)}, reference ${(r1.excess * deg).toFixed(1)}; the mean is the extra concave turning in the worst 15-degree sector`,
  };
}
