import {
  Quaternion,
  Vector3,
  polynomialUnitRoots,
  rotationBetween,
  wrapDegrees,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The constant, cosine and sine terms of a first harmonic. */
type Harmonic = readonly [number, number, number];

/** Ascending coefficients after the tangent half-angle substitution. */
type Quadratic = readonly [number, number, number];

/** Ascending coefficients of a product of two quadratics. */
type Quartic = readonly [number, number, number, number, number];

/** The material and hinge directions resolved against a fixed plane. */
interface IPlane {
  axial: IAutoMovieVector3;
  radial: IAutoMovieVector3;
  tangent: IAutoMovieVector3;
}

/**
 * Find the rotations about a supporting line that let a swinging knee put
 * one material point and normal at a target while respecting thigh length
 * and the knee hinge. The material site and hinge axis both turn about the
 * target normal. In its tangent plane their two dot products with the
 * hip-to-target vector fix its coordinates. The squared length in that
 * plane must equal the squared length of those coordinates.
 *
 * @param input The supporting axis, current joint frames and target material site in metres.
 * @returns Geometric candidates nearest the original support angle first. The caller checks joint ranges and the remaining supports and collisions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed axis, target point and normal, units, candidate ordering and the caller's remaining admission work.
 * @evidence contracts/development/implementation.md#principled-implementation The knee's parent link length and its projection on the hinge axis are invariant. Eliminating the rotation about the site normal with the tangent plane Gram matrix gives a second harmonic in the supporting rotation. The tangent half-angle substitution gives a quartic.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve plane coordinates, isolate the support angles, then reconstruct the knee rotation and position.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rank-deficient tangent plane falls through to the caller's general fit. No stored pose, body-specific angle or inferred clearance replaces the native joint and support admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms The supporting angle roots come from two charts of one quartic, with fixed-size algebra for each root and no skeleton evaluation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every angle shares the same current thigh length, authored material site, normal plane and hinge projection.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call owns small coefficient and candidate arrays. It retains no body, pose or target history.
 */
export function prepareKneeSwingSupport(
  input: prepareKneeSwingSupport.IInput,
): prepareKneeSwingSupport.ICandidate[] {
  const support: IAutoMovieVector3 = Vector3.normalize(input.axis);
  const normal: IAutoMovieVector3 = Vector3.normalize(input.normal);
  if (Vector3.length(support) === 0 || Vector3.length(normal) === 0) return [];
  const start: IAutoMovieQuaternion = input.knee.worldRotation;
  const aligned: IAutoMovieQuaternion = Quaternion.multiply(
    rotationBetween(Quaternion.rotateVector(start, input.localNormal), normal),
    start,
  );
  const material: IAutoMovieVector3 = Quaternion.rotateVector(
    aligned,
    input.point,
  );
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(aligned, input.hinge);
  const point: IPlane = plane(material, normal);
  const hinge: IPlane = plane(axis, normal);
  const pp: number = Vector3.dot(point.radial, point.radial);
  const ee: number = Vector3.dot(hinge.radial, hinge.radial);
  const pe: number = Vector3.dot(point.radial, hinge.radial);
  const det: number = pp * ee - pe * pe;
  if (!(det > Number.EPSILON * pp * ee)) return [];

  const arm: IAutoMovieVector3 = Vector3.subtract(input.hip, input.pivot);
  const fixed: IAutoMovieVector3 = Vector3.addScaled(
    input.pivot,
    support,
    Vector3.dot(arm, support),
  );
  const origin: IAutoMovieVector3 = Vector3.subtract(input.goal, fixed);
  const cosine: IAutoMovieVector3 = Vector3.subtract(fixed, input.hip);
  const sine: IAutoMovieVector3 = Vector3.cross(arm, support);
  const link: IAutoMovieVector3 = Vector3.subtract(
    input.knee.worldPosition,
    input.hip,
  );
  const rest: number = Vector3.dot(
    link,
    Quaternion.rotateVector(start, input.hinge),
  );
  const span: Harmonic = [
    Vector3.dot(origin, origin) + Vector3.dot(cosine, cosine),
    2 * Vector3.dot(origin, cosine),
    2 * Vector3.dot(origin, sine),
  ];
  const at: (vector: IAutoMovieVector3) => Harmonic = (
    vector: IAutoMovieVector3,
  ): Harmonic => [
    Vector3.dot(origin, vector),
    Vector3.dot(cosine, vector),
    Vector3.dot(sine, vector),
  ];
  const u: Harmonic = at(point.axial);
  const v: Harmonic = at(hinge.axial);
  const x: Quadratic = tangent([
    (span[0] + Vector3.dot(material, material) - Vector3.dot(link, link)) / 2 -
      u[0],
    span[1] / 2 - u[1],
    span[2] / 2 - u[2],
  ]);
  const y: Quadratic = tangent([
    rest + Vector3.dot(material, axis) - v[0],
    -v[1],
    -v[2],
  ]);

  // With the denominator removed, det*|D_horizontal|² equals
  // ee*x² - 2*pe*x*y + pp*y². The tangent basis rotates as a rigid pair.
  const full: Quartic = product(tangent(span), [1, 0, 1]);
  const normalSquare: Quadratic = tangent(at(normal));
  const vertical: Quartic = product(normalSquare, normalSquare);
  const xx: Quartic = product(x, x);
  const xy: Quartic = product(x, y);
  const yy: Quartic = product(y, y);
  const equation: number[] = full.map(
    (coefficient: number, i: number): number =>
      det * (coefficient - vertical[i]!) -
      ee * xx[i]! +
      2 * pe * xy[i]! -
      pp * yy[i]!,
  );
  if (equation.some((n: number): boolean => !Number.isFinite(n))) return [];

  // Adjacent charts keep their root coordinates bounded at the half turn.
  const angles: number[] = [
    ...unitChart(equation).map(
      (z: number): number => (2 * Math.atan(z) * 180) / Math.PI,
    ),
    ...unitChart(equation.slice().reverse())
      .filter((z: number): boolean => Math.abs(z) < 1)
      .map((z: number): number =>
        wrapDegrees((2 * Math.atan2(1, z) * 180) / Math.PI),
      ),
  ];
  angles.sort((a: number, b: number): number => Math.abs(a) - Math.abs(b));
  const out: prepareKneeSwingSupport.ICandidate[] = [];
  for (const angle of angles) {
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(support, angle);
    const hip: IAutoMovieVector3 = Vector3.add(
      input.pivot,
      Quaternion.rotateVector(turn, arm),
    );
    const d: IAutoMovieVector3 = Vector3.subtract(input.goal, hip);
    const p: number = Vector3.dot(d, point.radial);
    const q: number = Vector3.dot(d, point.tangent);
    const a: number = Vector3.dot(d, hinge.radial);
    const b: number = Vector3.dot(d, hinge.tangent);
    const px: number =
      (Vector3.dot(d, d) +
        Vector3.dot(material, material) -
        Vector3.dot(link, link)) /
        2 -
      Vector3.dot(d, point.axial);
    const py: number =
      rest + Vector3.dot(material, axis) - Vector3.dot(d, hinge.axial);
    const divisor: number = p * b - q * a;
    if (divisor === 0) continue;
    const swing: number =
      (Math.atan2((p * py - px * a) / divisor, (px * b - q * py) / divisor) *
        180) /
      Math.PI;
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle(normal, swing),
      aligned,
    );
    const knee: IAutoMovieVector3 = Vector3.subtract(
      input.goal,
      Quaternion.rotateVector(rotation, input.point),
    );
    out.push({ angle, hip, knee, rotation, turn });
  }
  return out;
}

/** A vector's axial component and its two coefficients under plane rotation. */
function plane(vector: IAutoMovieVector3, normal: IAutoMovieVector3): IPlane {
  const axial: IAutoMovieVector3 = Vector3.scale(
    normal,
    Vector3.dot(vector, normal),
  );
  return {
    axial,
    radial: Vector3.subtract(vector, axial),
    tangent: Vector3.cross(normal, vector),
  };
}

/** Numerator over one plus the squared tangent of the half-angle. */
function tangent([constant, cosine, sine]: Harmonic): Quadratic {
  return [constant + cosine, 2 * sine, constant - cosine];
}

/** Multiply two ascending-coefficient quadratics. */
function product([a, b, c]: Quadratic, [d, e, f]: Quadratic): Quartic {
  return [a * d, a * e + b * d, a * f + b * e + c * d, b * f + c * e, c * f];
}

/** Isolate roots on [-1,1] by Horner substitution z = 2u - 1. */
function unitChart(coefficients: readonly number[]): number[] {
  let local: number[] = [coefficients[coefficients.length - 1]!];
  for (let i: number = coefficients.length - 2; i >= 0; --i) {
    const next: number[] = new Array<number>(local.length + 1).fill(0);
    next[0] = coefficients[i]!;
    local.forEach((coefficient: number, power: number): void => {
      next[power]! -= coefficient;
      next[power + 1]! += 2 * coefficient;
    });
    local = next;
  }
  return polynomialUnitRoots(local).map((u: number): number => 2 * u - 1);
}

/**
 * World geometry of the support rotation and its returned hinge candidates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the inputs and returned frames for the swing geometry.
 * @evidence contracts/development/design.md#principled-representation The model uses measured world frames and local hinge geometry so the construction follows the carrier and body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One geometric input and one candidate record serve the support controller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The records contain no fixed angles or completed native verdicts.
 */
export namespace prepareKneeSwingSupport {
  /**
   * The current thigh and the material site specified by the swing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the local and world frames and metres for each sampled point.
   * @evidence contracts/development/design.md#principled-representation Fixed-line rotation, a current hinge and an authored material target determine the geometric inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only the current frames and the required site.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the actual hinge direction and measured thigh rather than a shape-specific preset.
   */
  export interface IInput {
    /** A fixed point on the supporting line. */
    pivot: IAutoMovieVector3;
    /** The direction of the supporting line. */
    axis: IAutoMovieVector3;
    /** The current world position of the hip joint. */
    hip: IAutoMovieVector3;
    /** The current world frame of the knee bone. */
    knee: IAutoMovieResolvedBone;
    /** The actual hinge axis expressed in the knee bone's local frame. */
    hinge: IAutoMovieVector3;
    /** The local material point. */
    point: IAutoMovieVector3;
    /** The local unit material normal. */
    localNormal: IAutoMovieVector3;
    /** The world goal of the material point. */
    goal: IAutoMovieVector3;
    /** The world normal required at the site. */
    normal: IAutoMovieVector3;
  }

  /**
   * One support rotation with the corresponding world knee frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reference axis and units of the moved frames.
   * @evidence contracts/development/design.md#principled-representation Gives one candidate hip position and knee frame from the material constraints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Provides only the transforms needed to try the same pose in its support controller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Native ROM, support and collision still determine whether the candidate is usable.
   */
  export interface ICandidate {
    /** Signed supporting-axis angle in degrees. */
    angle: number;
    /** The moved hip joint in world metres. */
    hip: IAutoMovieVector3;
    /** The world knee position in metres. */
    knee: IAutoMovieVector3;
    /** The world knee rotation. */
    rotation: IAutoMovieQuaternion;
    /** The rigid rotation about the supporting line. */
    turn: IAutoMovieQuaternion;
  }
}
