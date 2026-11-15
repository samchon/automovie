import {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";

/**
 * The swivels a joint's three-angle box provably refuses: for a joint whose
 * bone-local rotation is a fixed rotation turned about a fixed axis by the
 * swivel (the chain root of `hingedArmSwivel.pose`), a test of whether every
 * swivel from `low` to `high` degrees reads past the joint's box in both of
 * the charts `decomposeJointRotationOnBasis` chooses between, so that
 * `jointRomOvershoot` scores each of them above zero.
 *
 * A rotation turned about a fixed axis by `ψ` has a matrix whose every entry
 * is `a + b cos ψ + c sin ψ` (Rodrigues' formula between two fixed
 * rotations), so every entry the decomposition reads is such a sinusoid,
 * fitted exactly from the rotation at 0, 90 and 180 degrees. Each clinical
 * bound is then a sinusoid's sign. The middle angle of the composition
 * (`atan2(s, cos)` with a non-negative cosine, so `asin(s)`) lies past a
 * bound `q` where `s - sin q` is positive; an outer angle `atan2(y, x)` lies
 * past the upper end `β` of an interval no wider than a half turn where
 * `y cos β - x sin β` (the vector's length times `sin(δ - β)`) is positive,
 * and past the lower end `α` where `x sin α - y cos α` is. The alternate
 * chart (`alternateRigJointAngles`) turns each outer angle by a half turn,
 * negating its vector, and reflects the middle angle about its right angle.
 * Where one such sinusoid exceeds `MARGIN`, its exact roots bound an arc of
 * swivels (`φ ± acos((MARGIN - a) / R)`), and a reading is refused on the
 * union of its axes' arcs.
 *
 * Every refusal is certain. A sinusoid above `MARGIN` puts its angle past
 * the bound by more than `MARGIN` radians, the joints' tolerance
 * (`ROM_TOLERANCE`, about 1.7e-4), far beyond the rounding of the fit, of
 * the arc's ends and of the decomposition itself (near 1e-15); and an outer
 * angle's vector is then longer than `MARGIN`, past the gimbal band
 * (`sqrt(ε)`, 1.5e-8) inside which the decomposition pins that angle
 * instead. A joint gated by swing and twist, which the box does not score,
 * an axis without an interval, an outer interval wider than a half turn
 * (whose refusal is an intersection, not a union, of two arcs) and a middle
 * interval met twice by the half turn the middle angle covers refuse
 * nothing, so the test only ever says less than the box would.
 *
 * @param props The joint and its rotation by swivel.
 * @returns Whether every swivel in `[low, high]`, degrees, is refused; a joint with nothing to refuse refuses no swivel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the premise on the rotation, why each entry is a sinusoid, each bound's sinusoid for both charts, the margin and why every refusal is certain, and every case that refuses nothing.
 * @evidence contracts/development/implementation.md#principled-implementation Rodrigues' formula makes each entry an exact sinusoid in the swivel, so each bound's crossing swivels are a sinusoid's two arccos roots, and an angle's interval maps through the rest frame and the chart exactly as `decomposeJointRotationOnBasis` and `alternateRigJointAngles` read it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The entries are fitted once, each reading's axes give their bound sinusoids, the sinusoids their arcs, the arcs one merged list per reading, and the test reads the lists.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sound by construction, never by sampling: an arc is refused only from its sinusoid's roots with the joints' tolerance to spare, and a case the analysis does not cover refuses nothing rather than guessing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three rotations and nine dot products each fit the entries, a few arcs per reading are merged once, and each test is a scan of a handful of merged arcs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The arcs are built once per rotation and read by every test of its sweep.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the two merged arc lists in the returned test only.
 */
export function boxExcludedSwivels(props: {
  /** The joint's clinical basis, admitted and normalized (`normalizeJointAxes`). */
  basis: IAutoMovieJointAxes;

  /** The rest frame lifting the joint's rest-relative angles to clinical ones; omitted, they are clinical. */
  frame?: IAutoMovieRestFrame | undefined;

  /** The joint's resolved range of motion, as the decomposition's domain and the overshoot read it; `null` refuses nothing. */
  constraint: IAutoMovieJointConstraint | null;

  /** The joint's bone-local rotation at a swivel, degrees: a fixed rotation turned about a fixed axis by the swivel. */
  rotation: (swivel: number) => IAutoMovieQuaternion;
}): (low: number, high: number) => boolean {
  const constraint: IAutoMovieJointConstraint | null = props.constraint;
  if (
    constraint === null ||
    (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
  )
    return (): boolean => false;
  const basis: IAutoMovieJointAxes = props.basis;
  const handed: 1 | -1 =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const axes: IAutoMovieVector3[] = [
    basis.flexion,
    basis.abduction,
    Vector3.scale(basis.twist, handed),
  ];

  // The entries R'[i][j] = axisᵢ · (R axisⱼ) at swivels 0, 90 and 180.
  const sampled: number[][][] = [0, 90, 180].map(
    (swivel: number): number[][] => {
      const q: IAutoMovieQuaternion = props.rotation(swivel);
      const turned: IAutoMovieVector3[] = axes.map(
        (axis: IAutoMovieVector3): IAutoMovieVector3 =>
          Quaternion.rotateVector(q, axis),
      );
      return axes.map((row: IAutoMovieVector3): number[] =>
        turned.map((column: IAutoMovieVector3): number =>
          Vector3.dot(row, column),
        ),
      );
    },
  );
  const entry = (i: number, j: number): ISinusoid => {
    const [zero, quarter, half] = sampled.map(
      (m: number[][]): number => m[i]![j]!,
    ) as [number, number, number];
    const a: number = (zero + half) / 2;
    return { a, b: (zero - half) / 2, c: quarter - a };
  };

  // How each clinical axis is read from the entries (as
  // `decomposeJointRotationOnBasis` reads it): a distal twist composes
  // Ry(a)·Rx(f)·Rz(t), with flexion in the middle; a proximal one
  // Rz(t)·Ry(a)·Rx(f), with abduction in the middle.
  const reading: Record<Axis, IRead> =
    basis.twistPlacement === "distal"
      ? {
          flexion: { sine: scaled(entry(1, 2), -1) },
          abduction: { y: entry(0, 2), x: entry(2, 2), turn: 1 },
          twist: { y: entry(1, 0), x: entry(1, 1), turn: handed },
        }
      : {
          flexion: { y: entry(2, 1), x: entry(2, 2), turn: 1 },
          abduction: { sine: scaled(entry(2, 0), -1) },
          twist: { y: entry(1, 0), x: entry(0, 0), turn: handed },
        };

  // Each chart's refused swivels: the union of its axes' arcs.
  const charts: (IArc[] | "all")[] = [false, true].map(
    (alternate: boolean): IArc[] | "all" => {
      const arcs: IArc[] = [];
      for (const axis of AXES) {
        const range: IAutoMovieAngleRange | null = constraint[axis];
        if (range === null) continue;
        const read: IRead = reading[axis];
        for (const bound of bounds(
          read,
          rig(range, props.frame?.[axis]),
          alternate,
        )) {
          const arc: IArc | "all" | null = arcOf(bound);
          if (arc === "all") return "all";
          if (arc !== null) arcs.push(arc);
        }
      }
      return merged(arcs);
    },
  );
  return (low: number, high: number): boolean =>
    charts.every((chart: IArc[] | "all"): boolean => {
      if (chart === "all") return true;
      const turns: number = 360 * Math.floor(low / 360);
      return chart.some(
        (arc: IArc): boolean =>
          arc.from <= low - turns && arc.to >= high - turns,
      );
    });
}

/**
 * How far past a bound, in sine or projected units, a reading must lie to be
 * refused: the joints' tolerance (`ROM_TOLERANCE`) in radians, past the
 * rounding of every step and the decomposition's gimbal band.
 */
const MARGIN: number = (ROM_TOLERANCE * Math.PI) / 180;

/** The three clinical axes. */
const AXES: readonly Axis[] = ["flexion", "abduction", "twist"];

/** A clinical axis. */
type Axis = "flexion" | "abduction" | "twist";

/** `a + b cos ψ + c sin ψ`. */
interface ISinusoid {
  a: number;
  b: number;
  c: number;
}

/** How an axis is read: the middle angle's sine, or an outer angle's vector and the sign its rest-relative angle takes. */
type IRead = { sine: ISinusoid } | { y: ISinusoid; x: ISinusoid; turn: 1 | -1 };

/** A refused interval of swivels, degrees. */
interface IArc {
  from: number;
  to: number;
}

/** A sinusoid times a number. */
function scaled(f: ISinusoid, by: number): ISinusoid {
  return { a: f.a * by, b: f.b * by, c: f.c * by };
}

/** `u·f + v·g`. */
function combined(f: ISinusoid, u: number, g: ISinusoid, v: number): ISinusoid {
  return { a: u * f.a + v * g.a, b: u * f.b + v * g.b, c: u * f.c + v * g.c };
}

/** A clinical interval as rest-relative degrees, ordered (the inverse of `toClinicalAngle`). */
function rig(
  range: IAutoMovieAngleRange,
  frame: IAutoMovieAxisFrame | undefined,
): [number, number] {
  const sign: number = frame?.sign ?? 1;
  const neutral: number = frame?.neutral ?? 0;
  const ends: number[] = [
    (range.min - neutral) * sign,
    (range.max - neutral) * sign,
  ];
  return [Math.min(...ends), Math.max(...ends)];
}

/**
 * The sinusoids positive where one chart's reading of an axis lies past its
 * rest-relative interval `[lo, hi]`, any full-turn alias of the angle
 * considered (`nearestAngleAlias`); none where the analysis cannot refuse.
 */
function bounds(
  read: IRead,
  [lo, hi]: [number, number],
  alternate: boolean,
): ISinusoid[] {
  if (hi - lo >= 360) return [];
  if ("sine" in read) {
    // The middle angle is asin(s), or in the alternate chart 180 - asin(s),
    // which lies in [lo, hi] exactly where asin(s) lies in [180 - hi, 180 - lo].
    const [from, to] = alternate ? [180 - hi, 180 - lo] : [lo, hi];
    const first: number = Math.ceil((-90 - to) / 360);
    const last: number = Math.floor((90 - from) / 360);
    if (last < first) return [{ a: 1, b: 0, c: 0 }];
    if (last > first) return [];
    const p: number = Math.max(from + 360 * first, -90);
    const q: number = Math.min(to + 360 * first, 90);
    const out: ISinusoid[] = [];
    if (q < 90) out.push({ ...read.sine, a: read.sine.a - Math.sin(q * RAD) });
    if (p > -90)
      out.push(
        scaled({ ...read.sine, a: read.sine.a - Math.sin(p * RAD) }, -1),
      );
    return out;
  }
  // An outer angle δ = atan2(y, x) reads `turn · δ`, or a half turn more in
  // the alternate chart, where the vector is negated.
  if (hi - lo > 180) return [];
  const ends: number[] = [lo * read.turn, hi * read.turn];
  const alpha: number = Math.min(...ends) * RAD;
  const beta: number = Math.max(...ends) * RAD;
  const sign: number = alternate ? -1 : 1;
  return [
    scaled(combined(read.y, Math.cos(beta), read.x, -Math.sin(beta)), sign),
    scaled(combined(read.x, Math.sin(alpha), read.y, -Math.cos(alpha)), sign),
  ];
}

/** The swivels where a sinusoid exceeds `MARGIN`, degrees: an arc between its roots, every swivel, or none. */
function arcOf(f: ISinusoid): IArc | "all" | null {
  const radius: number = Math.hypot(f.b, f.c);
  if (f.a - radius > MARGIN) return "all";
  if (f.a + radius <= MARGIN) return null;
  const centre: number = Math.atan2(f.c, f.b) / RAD;
  const half: number = Math.acos((MARGIN - f.a) / radius) / RAD;
  return { from: centre - half, to: centre + half };
}

/**
 * Arcs merged into disjoint intervals covering one full turn from 0 and the
 * one after it, so an interval starting in [0, 360) is refused exactly when
 * one merged interval holds it; every swivel when they cover a turn.
 */
function merged(arcs: IArc[]): IArc[] | "all" {
  const pieces: IArc[] = [];
  for (const arc of arcs) {
    const from: number = arc.from - 360 * Math.floor(arc.from / 360);
    for (const turn of [-360, 0, 360])
      pieces.push({
        from: from + turn,
        to: from + (arc.to - arc.from) + turn,
      });
  }
  pieces.sort((x: IArc, y: IArc): number => x.from - y.from);
  const out: IArc[] = [];
  for (const piece of pieces) {
    const last: IArc | undefined = out[out.length - 1];
    if (last !== undefined && piece.from <= last.to)
      last.to = Math.max(last.to, piece.to);
    else out.push({ ...piece });
  }
  if (out.some((arc: IArc): boolean => arc.from <= 0 && arc.to >= 360))
    return "all";
  return out;
}

/** Radians per degree. */
const RAD: number = Math.PI / 180;
