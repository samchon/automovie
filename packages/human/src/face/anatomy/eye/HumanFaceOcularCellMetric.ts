import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanTrigonometricBounds } from "../../../common/measure/IHumanTrigonometricBounds";
import { encloseHumanTrigonometricAngle } from "../../../common/measure/encloseHumanTrigonometricAngle";
import { HumanFaceOcularCapMetric } from "./HumanFaceOcularCapMetric";
import type { resolveHumanFaceOpticalFrame } from "./resolveHumanFaceOpticalFrame";
import type { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";
import type { IHumanFaceOcularCellCorner } from "./structures/IHumanFaceOcularCellCorner";

type Interval = readonly [IHumanExactFraction, IHumanExactFraction];

/**
 * Certify actual exterior facets against their generating parametric patch.
 * For barycentric parameter interpolation, Taylor's integral remainder and
 * Var(u)<=range(u)^2/4 give the vector deviation bound
 * (Muu*du^2+2*Muv*du*dv+Mvv*dv^2)/8. The cap uses its actual radial interval:
 * Muu=max|G''|, Muv=1 and Mvv=rMax. The sphere uses R for all three.
 * Neither convexity nor a maximum curvature at the apex is required.
 *
 * Exact trigonometric/profile enclosures compare every actual emitted corner
 * and its Float32 transport copy with the generating patch point. Their maximum discrepancy is added to the
 * interpolation bound. The frame's exact Frobenius norm bounds its operator
 * norm, so both source placement and posed roundoff belong to the certificate.
 * This is a facet-to-patch distance bound, not an inscription, reverse
 * Hausdorff, tissue clearance or permission to bypass physical admission.
 * The constructor captures the generating radius and cap coefficients. Each
 * query still reads its current frame and actual corners, whose values are
 * included in the corner-cache key. The last frame norm is retained only while
 * all nine represented vector components match their owned value copy. A
 * mutable frame is therefore reread by value; its centre remains part of the
 * separate corner-error key. Reuse retains the same exact square sum and upper
 * square-root enclosure rather than substituting an orthonormal-frame premise.
 *
 */
export class HumanFaceOcularCellMetric {
  private readonly cap: HumanFaceOcularCapMetric;
  private readonly angles = new Map<number, IHumanTrigonometricBounds>();
  private readonly cornerErrors = new Map<string, IHumanExactFraction>();

  /** Owned last vector values; frame identity alone cannot admit reuse. */
  private frameNormValues: readonly number[] | undefined;

  /** Exact upper norm for those values, retained only after successful evaluation. */
  private frameNorm: IHumanExactFraction | undefined;

  private readonly radius: number;

  constructor(profile: ReturnType<typeof resolveHumanFaceOpticalProfile>) {
    this.radius = profile.radius;
    this.cap = new HumanFaceOcularCapMetric(profile);
  }

  /** Bound the actual triangle's deviation from its own cap or sphere patch.
   */
  bound(
    branch: "cap" | "sphere",
    frame: ReturnType<typeof resolveHumanFaceOpticalFrame>,
    corners: readonly IHumanFaceOcularCellCorner[],
  ): number {
    if (corners.length !== 3)
      throw new Error(
        "An exterior cell certificate needs three actual corners.",
      );
    const zero = Fraction.create(0n);
    const uMin = Fraction.from(
      Math.min(...corners.map((c) => c.meridianParameter)),
    );
    const uMax = Fraction.from(
      Math.max(...corners.map((c) => c.meridianParameter)),
    );
    const vMin = Fraction.from(
      Math.min(...corners.map((c) => c.azimuthParameter)),
    );
    const vMax = Fraction.from(
      Math.max(...corners.map((c) => c.azimuthParameter)),
    );
    const du = Fraction.add(uMax, Fraction.negate(uMin));
    const dv = Fraction.add(vMax, Fraction.negate(vMin));
    const absolute = (value: IHumanExactFraction): IHumanExactFraction =>
      value.numerator < 0n ? Fraction.negate(value) : value;
    const maximum = (
      a: IHumanExactFraction,
      b: IHumanExactFraction,
    ): IHumanExactFraction => (Fraction.compare(a, b) >= 0 ? a : b);
    const radius = Fraction.from(this.radius);
    const m11 =
      branch === "sphere"
        ? radius
        : maximum(
            absolute(this.cap.secondDerivativeAtRadius(uMin)),
            absolute(this.cap.secondDerivativeAtRadius(uMax)),
          );
    const m12 = branch === "sphere" ? radius : Fraction.create(1n);
    const m22 = branch === "sphere" ? radius : uMax;
    const remainder = Fraction.divide(
      Fraction.add(
        Fraction.add(
          Fraction.multiply(m11, Fraction.multiply(du, du)),
          Fraction.multiply(
            Fraction.create(2n),
            Fraction.multiply(m12, Fraction.multiply(du, dv)),
          ),
        ),
        Fraction.multiply(m22, Fraction.multiply(dv, dv)),
      ),
      Fraction.create(8n),
    );
    const vectors = [frame.lateral, frame.up, frame.axis];
    const frameValues = vectors.flatMap((vector) => [vector.x, vector.y, vector.z]);
    if (
      this.frameNorm === undefined ||
      frameValues.some((value, at) => !Object.is(value, this.frameNormValues?.[at]))
    ) {
      let frameSquared = zero;
      for (const value of frameValues)
        frameSquared = Fraction.add(
          frameSquared,
          Fraction.multiply(Fraction.from(value), Fraction.from(value)),
        );
      const norm = Fraction.from(Fraction.sqrtBounds(frameSquared)[1]);
      this.frameNormValues = frameValues;
      this.frameNorm = norm;
    }
    const frameNorm = this.frameNorm;
    let cornerError = zero;
    for (const corner of corners) {
      const key = [
        frame.center.x,
        frame.center.y,
        frame.center.z,
        ...vectors.flatMap((vector) => [vector.x, vector.y, vector.z]),
        corner.meridianParameter,
        corner.azimuthParameter,
        ...corner.position,
        branch,
      ].join(",");
      const cached = this.cornerErrors.get(key);
      if (cached !== undefined) {
        cornerError = maximum(cornerError, cached);
        continue;
      }
      const phi = this.angle(corner.azimuthParameter);
      const u = Fraction.from(corner.meridianParameter);
      const r: Interval =
        branch === "cap"
          ? [u, u]
          : scale(this.angle(corner.meridianParameter).sin, radius);
      const z: Interval =
        branch === "cap"
          ? [this.cap.heightAtRadius(u), this.cap.heightAtRadius(u)]
          : scale(this.angle(corner.meridianParameter).cos, radius);
      const local = [multiply(r, phi.cos), multiply(r, phi.sin), z];
      let squaredError = zero;
      for (let axis = 0; axis < 3; axis++) {
        const key = (["x", "y", "z"] as const)[axis];
        let expected: Interval = [
          Fraction.from(frame.center[key]),
          Fraction.from(frame.center[key]),
        ];
        for (let coordinate = 0; coordinate < 3; coordinate++)
          expected = add(
            expected,
            scale(local[coordinate], Fraction.from(vectors[coordinate][key])),
          );
        let error = zero;
        for (const value of [
          corner.position[axis],
          Math.fround(corner.position[axis]),
        ]) {
          const represented = Fraction.from(value);
          error = maximum(
            error,
            maximum(
              absolute(Fraction.add(represented, Fraction.negate(expected[0]))),
              absolute(Fraction.add(represented, Fraction.negate(expected[1]))),
            ),
          );
        }
        squaredError = Fraction.add(
          squaredError,
          Fraction.multiply(error, error),
        );
      }
      const error = Fraction.from(Fraction.sqrtBounds(squaredError)[1]);
      this.cornerErrors.set(key, error);
      cornerError = maximum(cornerError, error);
    }
    const bound = Fraction.add(
      Fraction.multiply(remainder, frameNorm),
      cornerError,
    );
    return Fraction.sqrtBounds(Fraction.multiply(bound, bound))[1];
  }

  /**
   * Reuse exact sine and cosine enclosures for one represented radian angle within the admitted tessellation domain.
   */
  private angle(value: number): IHumanTrigonometricBounds {
    let result = this.angles.get(value);
    if (result === undefined) {
      result = encloseHumanTrigonometricAngle(value);
      this.angles.set(value, result);
    }
    return result;
  }
}

/** Add ordered rational interval endpoints without rounding. */
function add(a: Interval, b: Interval): Interval {
  return [Fraction.add(a[0], b[0]), Fraction.add(a[1], b[1])];
}

/** Scale an ordered rational interval, reversing endpoints for a negative scalar. */
function scale(a: Interval, b: IHumanExactFraction): Interval {
  return b.numerator >= 0n
    ? [Fraction.multiply(a[0], b), Fraction.multiply(a[1], b)]
    : [Fraction.multiply(a[1], b), Fraction.multiply(a[0], b)];
}

/** Bound a rational interval product by all four exact endpoint products. */
function multiply(a: Interval, b: Interval): Interval {
  const values = [
    Fraction.multiply(a[0], b[0]),
    Fraction.multiply(a[0], b[1]),
    Fraction.multiply(a[1], b[0]),
    Fraction.multiply(a[1], b[1]),
  ].sort(Fraction.compare);
  return [values[0], values[3]];
}
