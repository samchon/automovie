import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";

/** The available cardinal coordinates in quaternion-vector order. */
const AXES: readonly ["x", "y", "z"] = ["x", "y", "z"];

/**
 * Enclose signed sector tests made from rounded endpoint and direction
 * components.
 */
const SECTOR_ROUNDOFF: number = 32 * Number.EPSILON;

/** Enclose evaluated dot ceilings and the displayed cardinal factor composition. */
const DOT_ROUNDOFF: number = 128 * Number.EPSILON;

/**
 * Prepare a squared chord lower bound on the local wrist rotation error for
 * exactly cardinal crossed flexion and abduction axes with zero rig twist. The
 * original rotation is abduction times flexion in either factor order once the
 * twist is identity. With abduction axis n and flexion axis v, R(v) lies on the
 * abduction arc and R⁻¹(n) on the flexion arc. Each direction's chord to its
 * permitted arc bounds the full rotation angle.
 *
 * @param basis The projector's admitted cardinal joint axes.
 * @param flexion The actual sorted rig flexion interval, degrees.
 * @param abduction The actual sorted rig abduction interval, degrees.
 * @returns A squared chord bound for a finite local demand, or undefined for
 *   unsupported axes or intervals.
 */
export function prepareCardinalWristChord(
  basis: IAutoMovieJointAxes,
  flexion: IAutoMovieAngleRange,
  abduction: IAutoMovieAngleRange,
): ((rotation: IAutoMovieQuaternion) => number) | undefined {
  if (basis.rotationOrder !== undefined) return undefined;
  const a: number = cardinal(basis.abduction);
  const f: number = cardinal(basis.flexion);
  const t: number = cardinal(basis.twist);
  if (a < 0 || f < 0 || t < 0 || a === f || a === t || f === t)
    return undefined;

  const abductionKey: (typeof AXES)[number] = AXES[a]!;
  const flexionKey: (typeof AXES)[number] = AXES[f]!;
  const crossKey: (typeof AXES)[number] = AXES[t]!;
  const sign: number = (a - f + 3) % 3 === 1 ? 1 : -1;
  const abd: ReturnType<typeof arc> = arc(
    abduction,
    basis.abduction[abductionKey],
  );
  const flex: ReturnType<typeof arc> = arc(flexion, basis.flexion[flexionKey]);
  if (abd === undefined || flex === undefined) return undefined;

  return (rotation: IAutoMovieQuaternion): number => {
    const x: number = rotation[abductionKey];
    const y: number = rotation[flexionKey];
    const z: number = rotation[crossKey];
    const w: number = rotation.w;
    const xx: number = x * x;
    const yy: number = y * y;
    const zz: number = z * z;
    const squared: number = xx + yy + zz + w * w;
    if (!(squared >= 0.5 && squared <= 2)) return 0;
    const scale: number = 2 / squared;
    const dotA: number = abd(
      1 - scale * (xx + zz),
      scale * (w * x - sign * z * y),
    );
    const dotF: number = flex(
      1 - scale * (yy + zz),
      scale * (w * y - sign * x * z),
    );

    // A norm-square read in this exponent interval incurs at most five
    // relative unit roundoffs, giving at most eighteen absolute roundoffs
    // per normalized matrix entry. The two endpoint products, addition and
    // displayed cardinal quaternion products fit within the wider dot guard.
    return 2 * Math.max(0, 1 - Math.min(dotA, dotF) - DOT_ROUNDOFF);
  };
}

/** Read the coordinate of an actual signed cardinal vector, or decline. */
function cardinal(axis: IAutoMovieVector3): number {
  if (Math.abs(axis.x) === 1 && axis.y === 0 && axis.z === 0) return 0;
  if (axis.x === 0 && Math.abs(axis.y) === 1 && axis.z === 0) return 1;
  if (axis.x === 0 && axis.y === 0 && Math.abs(axis.z) === 1) return 2;
  return -1;
}

/** The largest dot of a planar direction with any point on a short unit arc. */
function arc(
  range: IAutoMovieAngleRange,
  sign: number,
): ((x: number, y: number) => number) | undefined {
  const a: number = sign * range.min * Quaternion.DEG2RAD;
  const b: number = sign * range.max * Quaternion.DEG2RAD;
  const low: number = Math.min(a, b);
  const high: number = Math.max(a, b);
  if (!(low >= -2 * Math.PI && high <= 2 * Math.PI && high - low < Math.PI))
    return undefined;
  const lowX: number = Math.cos(low);
  const lowY: number = Math.sin(low);
  const highX: number = Math.cos(high);
  const highY: number = Math.sin(high);
  return (x: number, y: number): number =>
    lowX * y - lowY * x >= -SECTOR_ROUNDOFF &&
    x * highY - y * highX >= -SECTOR_ROUNDOFF
      ? Math.sqrt(x * x + y * y)
      : Math.max(x * lowX + y * lowY, x * highX + y * highY);
}
