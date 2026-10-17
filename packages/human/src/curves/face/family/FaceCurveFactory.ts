import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import { FaceHeadFamily } from "./FaceHeadFamily";
import { FaceMath as F } from "./FaceMath";
import type { IAutoMovieFaceMeasurements as M } from "./IAutoMovieFaceMeasurements";
import { generateFaceEars } from "./generateFaceEars";
import { generateFaceEyes } from "./generateFaceEyes";
import { generateFaceNoseMouth } from "./generateFaceNoseMouth";

/** Generate native Bernstein face/upper-neck courses in an actual neck frame. All input lengths are scaled uniformly before parent placement. This family admits longitudinal head-child motion; relative head rotation, lateral motion, reflection, shear and unexpected upstream boundaries throw before delivery. The result contains curves and the mid-neck P/fullJ operator, not skin topology.
 *
 * @author Samchon
 */
export class FaceCurveFactory implements R.Factory {
  /** Region identifier used by the assembly DAG; this factory owns neck.midTube and accepts no upstream section. */
  public readonly region: string = "face";

  /** Retain semantic dimensions and the internally resolved native-to-neck registration. Construction clones the dimensions before applying an allowed head-child Y shift.
   *
   * @param measurements Native physical and dimensionless family inputs.
   * @param registration Actual neck/head registration with a proper rotation.
   */
  public constructor(
    private readonly measurements: M.Identity,
    private readonly registration: M.Registration,
  ) {}
  private prepare(context: AutoMovieCurveParentContext): {
    /** Private cloned dimensions after the allowed longitudinal head-child shift. */
    spec: M.Identity;

    /** Place a native mm point by uniform scale, proper registration and actual neck frame. */
    point: (p: C.Vector) => F.V;

    /** Rotate a native direction or mm/mm derivative without applying length scale. */
    direction: (v: C.Vector) => F.V;
  } {
    const r: M.Registration = this.registration;
    const spec: M.Identity = structuredClone(this.measurements);
    if (!Number.isFinite(spec.scale) || spec.scale <= 0)
      throw new Error("Positive finite physical scale required");
    const neck: C.Frame = context.frame(r.neckBone);
    const head: C.Frame = context.frame(r.headBone);
    if (head.parent !== r.neckBone)
      throw new Error("Actual head child of neck required");
    const axes: C.Matrix = r.sourceAxesInNeck;
    // Registration has exactly one proper rotation. Reuse the shared context's
    // existing frame admission rather than accepting scale/shear as anatomy.
    // 64*epsilon admits floating-point orthonormality noise only; this is a
    // registration test, not an anatomical or surface-distance tolerance.
    for (let i: number = 0; i < 3; i++)
      for (let j: number = 0; j < 3; j++) {
        const dot: number = axes[i]!.reduce(
          (sum: number, x: number, k: number): number => sum + x * axes[j]![k]!,
          0,
        );
        if (
          !Number.isFinite(dot) ||
          Math.abs(dot - (i === j ? 1 : 0)) > 64 * Number.EPSILON
        )
          throw new Error("Proper source registration required");
        if (
          Math.abs(neck.rotation[i]![j]! - head.rotation[i]![j]!) >
          64 * Number.EPSILON
        )
          throw new Error(
            "Articulated head rotation needs a separate family chart",
          );
      }
    const determinant: number =
      axes[0][0] * (axes[1][1] * axes[2][2] - axes[1][2] * axes[2][1]) -
      axes[0][1] * (axes[1][0] * axes[2][2] - axes[1][2] * axes[2][0]) +
      axes[0][2] * (axes[1][0] * axes[2][1] - axes[1][1] * axes[2][0]);
    if (determinant <= 0)
      throw new Error("Reflected source registration rejected");
    const rotate: (p: C.Vector) => F.V = (p: C.Vector): F.V =>
      axes.map((row: C.Vector): number =>
        row.reduce(
          (sum: number, x: number, k: number): number => sum + x * p[k]!,
          0,
        ),
      ) as F.V;
    const local: (p: C.Vector) => F.V = (p: C.Vector): F.V =>
      F.add(
        r.sourceOriginInNeckMm,
        rotate(F.mul(F.add(p, r.sourceOriginMm, -1), spec.scale)),
      );
    const point: (p: C.Vector) => F.V = (p: C.Vector): F.V =>
      F.vec(context.point(r.neckBone, local(p)));
    const direction: (v: C.Vector) => F.V = (v: C.Vector): F.V =>
      F.vec(context.direction(r.neckBone, rotate(v)));
    const actualHead: C.Vector = context.inversePoint(
      r.neckBone,
      context.point(r.headBone, [0, 0, 0]),
    );
    const delta: F.V = F.add(actualHead, local(r.headOriginNativeMm), -1);
    const nativeDelta: F.V = [0, 1, 2].map(
      (k: number): number =>
        axes.reduce(
          (sum: number, row: C.Vector, i: number): number =>
            sum + row[k]! * delta[i]!,
          0,
        ) / spec.scale,
    ) as F.V;
    // The 1e-8 mm guard permits numerical registration residue, not lateral
    // articulation. The physical-Y fields have no lateral deformation rule.
    if (Math.abs(nativeDelta[0]) > 1e-8 || Math.abs(nativeDelta[2]) > 1e-8)
      throw new Error(
        "Lateral head registration changes need an explicit source-chart conversion",
      );
    const dy: number = nativeDelta[1];
    if (dy !== 0) {
      const shift: (p: C.Vector) => F.V = (p: C.Vector): F.V =>
        F.add(p, [0, dy, 0]);
      spec.head.frame.localOrigin = shift(spec.head.frame.localOrigin);
      spec.head.dimensions.chinHeight += dy;
      spec.head.dimensions.upperNeckOffset += dy;
      spec.noseMouth.oral.origin = shift(spec.noseMouth.oral.origin);
      spec.noseMouth.nasal.origin = shift(spec.noseMouth.nasal.origin);
      for (const side of ["left", "right"] as const) {
        spec.eyes.eyes[side].placement.medialAnchorMm = shift(
          spec.eyes.eyes[side].placement.medialAnchorMm,
        );
        spec.eyes.eyes[side].eyeComponent.centerMm = shift(
          spec.eyes.eyes[side].eyeComponent.centerMm,
        );
      }
      spec.ears.parentFrame.originMm = shift(spec.ears.parentFrame.originMm);
    }
    if (spec.head.dimensions.upperNeckOffset <= 0)
      throw new Error("Head anchor must leave a positive upper-neck collar");
    return { spec, point, direction };
  }

  /** Emit exact world-mm cubics and analytic nostril ovals, grouped as head and bilateral ears. Publish the actual four-span mid-neck section and fullJ, whose mm/mm units cancel uniform length scaling. Inputs are not mutated.
   *
   * @param context Admitted actual bone frames used for point and vector placement.
   * @param upstream Must be empty because this factory owns its neck boundary.
   * @returns Primitive groups plus the neck-owned mid-tube boundary.
   * @throws Error when registration, scale, head-child chart or upstream ownership fails.
   */
  public construct(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): R.Result {
    if (upstream.size !== 0)
      throw new Error(
        "Face owns its mid-neck operator; unexpected upstream boundary",
      );
    const { spec, point, direction }: ReturnType<FaceCurveFactory["prepare"]> =
      this.prepare(context);
    const nose: ReturnType<typeof generateFaceNoseMouth> =
      generateFaceNoseMouth(spec.noseMouth);
    const family: FaceHeadFamily = new FaceHeadFamily(spec.head, nose.curves);
    const native: F.Curve[] = [
      ...family.curves(),
      ...nose.curves,
      ...generateFaceEyes(spec.eyes),
      ...generateFaceEars(spec.ears),
    ];
    const primitive: (curve: F.Curve) => C.Cubic = (
      curve: F.Curve,
    ): C.Cubic => ({
      type: "cubicBezier",
      name: curve.name,
      closed: curve.closed,
      unit: "mm",
      phaseUnit: curve.lengthsMm
        ? "mm"
        : curve.signedRadians || curve.closed
          ? "turn"
          : "normalized",
      phaseIntervals: curve.lengthsMm
        ? curve.lengthsMm.map((v: number): number => v * spec.scale)
        : curve.signedRadians
          ? curve.signedRadians.map(
              (v: number): number => Math.abs(v) / (2 * Math.PI),
            )
          : (curve.normalizedWidths ??
            curve.spans.map((): number =>
              curve.closed ? 1 / curve.spans.length : 1,
            )),
      spans: curve.spans.map(
        (s: F.S): C.Span => s.map(point) as unknown as C.Span,
      ),
    });
    const primitives: C.Primitive[] = native.map(primitive);
    for (const oval of nose.ovals)
      primitives.push({
        ...oval,
        center: point(oval.center),
        u: direction(oval.u),
        v: direction(oval.v),
        radiusU: oval.radiusU * spec.scale,
        radiusV: oval.radiusV * spec.scale,
      });
    const mid: C.Cubic = primitives.find(
      (c: C.Primitive): boolean => c.name === "neck.midTube",
    ) as C.Cubic;
    // J is d(world-mm)/d(longitudinal-mm): uniform length scaling cancels.
    const value: C.Boundary = {
      id: "neck.midTube",
      section: mid,
      fullJ: family.jet.map(
        (s: F.S): C.Span => s.map(direction) as unknown as C.Span,
      ),
      longitudinalUnit: "mm",
      longitudinalAxis: direction([0, 1, 0]),
    };
    return {
      groups: [
        {
          part: "head",
          side: null,
          primitives: primitives.filter(
            (p: C.Primitive): boolean => !p.name.startsWith("ear."),
          ),
        },
        ...(["left", "right"] as const).map(
          (side: M.Side): R.Result["groups"][number] => ({
            part: "ear",
            side,
            primitives: primitives.filter((p: C.Primitive): boolean =>
              p.name.startsWith("ear." + side + "."),
            ),
          }),
        ),
      ],
      boundaries: [{ bone: this.registration.neckBone, value }],
    };
  }

  /** Evaluate a head support at native physical Y, then place its controls through the same registered parent frame as construct. Cranial sections are closed; below the jaw-angle plane only the open anterior arc is delivered. This is a geometric support, not a filled facial aperture or skin boundary.
   *
   * @param context Actual neck/head frames subject to the same registration checks.
   * @param nativeY Native chart height in mm, within chin-prominence through crown.
   * @returns World-mm Bernstein section with turn intervals when closed, or normalized intervals for the open lower-face arc.
   * @throws Error outside the skull chart or when registration is unsupported.
   */
  public evaluateSection(
    context: AutoMovieCurveParentContext,
    nativeY: number,
  ): C.Cubic {
    const { spec, point }: ReturnType<FaceCurveFactory["prepare"]> =
      this.prepare(context);
    const family: FaceHeadFamily = new FaceHeadFamily(
      spec.head,
      generateFaceNoseMouth(spec.noseMouth).curves,
    );
    const curve: F.Curve = family.section(nativeY);
    return {
      type: "cubicBezier",
      name: curve.name,
      closed: curve.closed,
      unit: "mm",
      phaseUnit: curve.closed ? "turn" : "normalized",
      phaseIntervals: curve.spans.map((): number => 1 / curve.spans.length),
      spans: curve.spans.map(
        (s: F.S): C.Span => s.map(point) as unknown as C.Span,
      ),
    };
  }
}
