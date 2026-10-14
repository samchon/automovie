import type { IAutoMovieVector3 } from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation Taylor interpolation remainder, exact cap/sphere derivative enclosures and actual corner transport discrepancies bound each emitted facet against its generating patch.
 * @evidence contracts/common.md#clear-and-simple-design The captured profile metric owns coefficients; current frame/corner values own placement and Float32 discrepancy, independently of tissue clearance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No convexity, apex-only curvature, hull inscription or anatomical admission is inferred from this one-way representation bound.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre units, actual interval/corner premises, frame-value invalidation and the limited certificate direction.
 * @evidence contracts/performance.md#efficient-algorithms Three corners and fixed-size rational interval operations dominate each cell, with exact trig/root arithmetic cost driven by operand widths.
 * @evidence contracts/performance.md#reuse-equivalent-work Angle enclosures and complete frame/parameter/corner-value keyed errors are reused; one last nine-component frame norm is reused only on Object.is equality.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One geometry-owned instance retains profile coefficients, angles and corner errors until its geometry is released; public arbitrary queries have no independent cache-entry cap.
 */
export class HumanFaceOcularCellMetric {
  private readonly cap: HumanFaceOcularCapMetric;
  private readonly angles: Map<number, IHumanTrigonometricBounds> = new Map<
    number,
    IHumanTrigonometricBounds
  >();
  private readonly cornerErrors: Map<string, IHumanExactFraction> = new Map<
    string,
    IHumanExactFraction
  >();

  /** Owned last vector values; frame identity alone cannot admit reuse. */
  private frameNormValues: readonly number[] | undefined;

  /** Exact upper norm for those values, retained only after successful evaluation. */
  private frameNorm: IHumanExactFraction | undefined;

  private readonly radius: number;

  /**
   * Capture the admitted generating profile for actual-cell metric evaluation.
   *
   * The resolver-admitted radius and same-profile cap coefficients are captured together; HumanFaceOcularCapMetric compiles that profile while this instance owns per-geometry corner and angle reuse.
   *
   * Fixed scalar capture and exact coefficient compilation have bit-width-dependent cost. The radius/cap and initially empty maps serve all generated cells for the caller-owned geometry lifetime, without a task or handle.
   */
  constructor(profile: ReturnType<typeof resolveHumanFaceOpticalProfile>) {
    this.radius = profile.radius;
    this.cap = new HumanFaceOcularCapMetric(profile);
  }

  /** Bound the actual triangle's deviation from its own cap or sphere patch.
   *
   * @evidence contracts/common.md#principled-implementation The actual three-corner parameter rectangle supplies Taylor derivative bounds; exact represented placement and Float32 corner errors are added to that remainder.
   * @evidence contracts/common.md#clear-and-simple-design Cap/sphere branch, frame values and actual corner coordinates remain explicit query inputs rather than an orthonormal-frame identity assumption.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts All represented values enter the appropriate exact arithmetic and reuse keys; no patch-distance bound is relabelled physical contact clearance.
   * @evidence contracts/common.md#meaningful-documentation The method and class describe triangle cardinality, metre result, cache equivalence and one-way facet-to-patch meaning.
   * @evidence contracts/performance.md#efficient-algorithms Each triangle processes three corner errors with fixed-size rational interval arithmetic. Uncached cap corners need azimuth enclosures; sphere corners also need meridian-angle enclosures, so up to six distinct angles can be evaluated. Exact operand widths determine numeric cost, and a changed frame adds its nine-component norm calculation.
   * @evidence contracts/performance.md#reuse-equivalent-work Complete corner-value keys reuse prior errors and matching copied frame-vector values reuse the exact upper Frobenius norm.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful angle/corner results grow instance maps by distinct query values without an independent public-query cap; failed evaluations do not publish that corner result.
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
    const zero: IHumanExactFraction = Fraction.create(0n);
    const uMin: IHumanExactFraction = Fraction.from(
      Math.min(
        ...corners.map(
          (c: IHumanFaceOcularCellCorner): number => c.meridianParameter,
        ),
      ),
    );
    const uMax: IHumanExactFraction = Fraction.from(
      Math.max(
        ...corners.map(
          (c: IHumanFaceOcularCellCorner): number => c.meridianParameter,
        ),
      ),
    );
    const vMin: IHumanExactFraction = Fraction.from(
      Math.min(
        ...corners.map(
          (c: IHumanFaceOcularCellCorner): number => c.azimuthParameter,
        ),
      ),
    );
    const vMax: IHumanExactFraction = Fraction.from(
      Math.max(
        ...corners.map(
          (c: IHumanFaceOcularCellCorner): number => c.azimuthParameter,
        ),
      ),
    );
    const du: IHumanExactFraction = Fraction.add(uMax, Fraction.negate(uMin));
    const dv: IHumanExactFraction = Fraction.add(vMax, Fraction.negate(vMin));
    const absolute: (value: IHumanExactFraction) => IHumanExactFraction = (
      value: IHumanExactFraction,
    ): IHumanExactFraction =>
      value.numerator < 0n ? Fraction.negate(value) : value;
    const maximum: (
      a: IHumanExactFraction,
      b: IHumanExactFraction,
    ) => IHumanExactFraction = (
      a: IHumanExactFraction,
      b: IHumanExactFraction,
    ): IHumanExactFraction => (Fraction.compare(a, b) >= 0 ? a : b);
    const radius: IHumanExactFraction = Fraction.from(this.radius);
    const m11: IHumanExactFraction =
      branch === "sphere"
        ? radius
        : maximum(
            absolute(this.cap.secondDerivativeAtRadius(uMin)),
            absolute(this.cap.secondDerivativeAtRadius(uMax)),
          );
    const m12: IHumanExactFraction =
      branch === "sphere" ? radius : Fraction.create(1n);
    const m22: IHumanExactFraction = branch === "sphere" ? radius : uMax;
    const remainder: IHumanExactFraction = Fraction.divide(
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
    const vectors: IAutoMovieVector3[] = [frame.lateral, frame.up, frame.axis];
    const frameValues: number[] = vectors.flatMap(
      (vector: IAutoMovieVector3): number[] => [vector.x, vector.y, vector.z],
    );
    if (
      this.frameNorm === undefined ||
      frameValues.some(
        (value: number, at: number): boolean =>
          !Object.is(value, this.frameNormValues?.[at]),
      )
    ) {
      let frameSquared: IHumanExactFraction = zero;
      for (const value of frameValues)
        frameSquared = Fraction.add(
          frameSquared,
          Fraction.multiply(Fraction.from(value), Fraction.from(value)),
        );
      const norm: IHumanExactFraction = Fraction.from(
        Fraction.sqrtBounds(frameSquared)[1],
      );
      this.frameNormValues = frameValues;
      this.frameNorm = norm;
    }
    const frameNorm: IHumanExactFraction = this.frameNorm;
    let cornerError: IHumanExactFraction = zero;
    for (const corner of corners) {
      const key: string = [
        frame.center.x,
        frame.center.y,
        frame.center.z,
        ...vectors.flatMap((vector: IAutoMovieVector3): number[] => [
          vector.x,
          vector.y,
          vector.z,
        ]),
        corner.meridianParameter,
        corner.azimuthParameter,
        ...corner.position,
        branch,
      ].join(",");
      const cached: IHumanExactFraction | undefined =
        this.cornerErrors.get(key);
      if (cached !== undefined) {
        cornerError = maximum(cornerError, cached);
        continue;
      }
      const phi: IHumanTrigonometricBounds = this.angle(
        corner.azimuthParameter,
      );
      const u: IHumanExactFraction = Fraction.from(corner.meridianParameter);
      const r: Interval =
        branch === "cap"
          ? [u, u]
          : scale(this.angle(corner.meridianParameter).sin, radius);
      const z: Interval =
        branch === "cap"
          ? [this.cap.heightAtRadius(u), this.cap.heightAtRadius(u)]
          : scale(this.angle(corner.meridianParameter).cos, radius);
      const local: Interval[] = [multiply(r, phi.cos), multiply(r, phi.sin), z];
      let squaredError: IHumanExactFraction = zero;
      for (let axis: number = 0; axis < 3; axis++) {
        const key: "x" | "y" | "z" = (["x", "y", "z"] as const)[axis];
        let expected: Interval = [
          Fraction.from(frame.center[key]),
          Fraction.from(frame.center[key]),
        ];
        for (let coordinate: number = 0; coordinate < 3; coordinate++)
          expected = add(
            expected,
            scale(local[coordinate], Fraction.from(vectors[coordinate][key])),
          );
        let error: IHumanExactFraction = zero;
        for (const value of [
          corner.position[axis],
          Math.fround(corner.position[axis]),
        ]) {
          const represented: IHumanExactFraction = Fraction.from(value);
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
      const error: IHumanExactFraction = Fraction.from(
        Fraction.sqrtBounds(squaredError)[1],
      );
      this.cornerErrors.set(key, error);
      cornerError = maximum(cornerError, error);
    }
    const bound: IHumanExactFraction = Fraction.add(
      Fraction.multiply(remainder, frameNorm),
      cornerError,
    );
    return Fraction.sqrtBounds(Fraction.multiply(bound, bound))[1];
  }

  /**
   * Reuse exact sine and cosine enclosures for one represented radian angle within the admitted tessellation domain.
   *
   * The common trigonometric owner encloses sine/cosine of the represented radian angle. Cap and sphere corners reuse successful results keyed by that angle rather than a vertex ordinal or angular bucket.
   *
   * Expected constant-time lookup misses pay the exact rational enclosure cost. The map grows with distinct angles and lives with the geometry-owned metric, without an independent entry limit.
   */
  private angle(value: number): IHumanTrigonometricBounds {
    let result: IHumanTrigonometricBounds | undefined = this.angles.get(value);
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
  const values: IHumanExactFraction[] = [
    Fraction.multiply(a[0], b[0]),
    Fraction.multiply(a[0], b[1]),
    Fraction.multiply(a[1], b[0]),
    Fraction.multiply(a[1], b[1]),
  ].sort(Fraction.compare);
  return [values[0], values[3]];
}
