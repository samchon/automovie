import {
  AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import type { IAutoMovieHumanCurveSpecimen } from "../../IAutoMovieHumanCurveSpecimen";
import { ArmCurveMath as M } from "../family/ArmCurveMath";
import { AutoMovieArmCurveFactory } from "../family/AutoMovieArmCurveFactory";
import type { IAutoMovieArmMeasurements as P } from "../family/IAutoMovieArmMeasurements";
import { ArmIdentityRules as G } from "./ArmIdentityRules";
import { resolveArmIdentityPhysical } from "./resolveArmIdentityPhysical";

/** Convert admitted public arm dimensions into the common neutral-T tensor family.
 *
 * Circumferences size the authored cubic, independent depths set its aspect, and a common half-excess-area taper separates mass distribution from distal flattening.
 *
 * Actual torso and hand sections and complete physical jets remain authoritative at the ends. Common publish/bind, rather than this map lookup, authenticates those owners; this class does not contain source-gate section tables.
 */
export class ArmIdentityCurveFactory implements R.Factory {
  /** Assembly key for both arm groups. */
  public readonly region: string = "arms";

  /** Resolved joint distances, relaxed girths, section extras and provenance; construction reads this admitted state. */
  public readonly physical: resolveArmIdentityPhysical.Resolved;

  /** Resolve one existing specimen and optional side-specific dimensions; no skeleton is generated and invalid physical combinations throw. */
  public constructor(
    specimen: IAutoMovieHumanCurveSpecimen,
    additional: resolveArmIdentityPhysical.Options = {},
  ) {
    this.physical = resolveArmIdentityPhysical(specimen, additional);
  }
  /** Construct world-millimetre courses from the actual neutral-T hierarchy and four canonical upper-arm/wrist operators, with no new boundary ownership. */
  public construct(
    context: ArmIdentityCurveFactory.Parent,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): R.Result {
    return this.constructDetailed(context, upstream).result;
  }

  /** Return the same construction with its generated recipe and tensors for inspection; missing or degenerate owner sections and unsupported numerical states throw. */
  public constructDetailed(
    context: ArmIdentityCurveFactory.Parent,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ArmIdentityCurveFactory.Detailed {
    const sides: Partial<P["sides"]> = {};
    const observations: Record<string, unknown> = {};
    for (const side of ["left", "right"] as const) {
      const d: resolveArmIdentityPhysical.Side = this.physical.sides[side];
      const start: C.Boundary | undefined = upstream.get(
          side + ".upperArm.midTube",
        ),
        end: C.Boundary | undefined = upstream.get(side + ".wrist.midTube");
      if (!start || !end)
        throw new Error(
          "Both genuine canonical arm boundaries must be bound before construction",
        );
      const sign: number = side === "left" ? 1 : -1;
      const u: C.Vector = context.direction(side + "LowerArm", [0, sign, 0]),
        v: C.Vector = context.direction(side + "LowerArm", [0, 0, 1]);
      const wristPoles: C.Vector[] = end.section.spans.map(
        (s: C.Span): C.Vector => s[0],
      );
      const width: (axis: C.Vector) => number = (axis: C.Vector): number => {
        const values: number[] = wristPoles.map((p: C.Vector): number =>
          M.dot(p, axis),
        );
        return Math.max(...values) - Math.min(...values);
      };
      const wristU: number = width(u),
        wristV: number = width(v);
      if (!(wristU > 0 && wristV > 0 && Number.isFinite(wristU + wristV)))
        throw new Error(
          "Actual wrist must expose nondegenerate transverse diameters",
        );
      const upperV: number = d.extras.upperArmDepthMm,
        upperU: number = G.otherDiameter(d.upperArmCircumferenceMm, upperV);
      // Chart U is superior/inferior; forearm physical depth is dorsal/palmar U.
      const foreU: number = d.extras.forearmDepthMm,
        foreV: number = G.otherDiameter(d.forearmCircumferenceMm, foreU);
      // Symmetric planar poles and a common quarter-circle handle rule define this uncalibrated section convention; dimensions carry the identity variation.
      const section: (
        name: string,
        segment: P.Station["segment"],
        fraction: number,
        breadth: number,
        depth: number,
        roll: number,
      ) => P.Station = (
        name: string,
        segment: P.Station["segment"],
        fraction: number,
        breadth: number,
        depth: number,
        roll: number,
      ): P.Station => ({
        name,
        segment,
        mechanicalFraction: fraction,
        skin: {
          originOffsetInSegmentMm: [0, 0, 0],
          sectionBasisInSegment: [
            [1, 0, 0],
            [0, 0, -1],
            [0, 1, 0],
          ],
          breadthMm: breadth,
          depthMm: depth,
          centerOffsetUmm: 0,
          centerOffsetVmm: 0,
          cardinalShapeURatios: [1, 0, -1, 0],
          cardinalShapeVRatios: [0, 1, 0, -1],
          cardinalNormalOffsetsMm: [0, 0, 0, 0],
          quarterRoundingRatio: G.rounding,
          roundingRule: "oppositeCardinalSpan",
          rollOffsetDegrees: roll,
        },
      });
      const stations: P.Station[] = [
        {
          name: "upperArm.midTube",
          segment: "upperarm",
          mechanicalFraction: 0.25,
        },
        section(
          "upperArm.relaxedMidCourse",
          "upperarm",
          0.5,
          upperU,
          upperV,
          0,
        ),
        section(
          "upperArm.distalTransition",
          "upperarm",
          0.75,
          G.blend(upperU, d.extras.elbowBreadthMm, 0.5),
          G.blend(upperV, d.extras.elbowDepthMm, 0.5),
          0,
        ),
        section(
          "elbow.jointCourse",
          "elbow",
          0,
          d.extras.elbowBreadthMm,
          d.extras.elbowDepthMm,
          0,
        ),
      ];
      for (const fraction of G.stations) {
        // Blend excess section area separately from aspect. The actual owner wrist is still consumed below, never rebuilt from these two range diagnostics.
        const taper: number =
          (fraction - G.forearmMaximumFraction) /
          (1 - G.forearmMaximumFraction);
        const roll: number =
          d.extras.forearmTwistDegrees * Math.sin(Math.PI * taper);
        const [breadth, depth]: readonly [number, number] = G.forearmDiameters(
          foreU,
          foreV,
          wristU,
          wristV,
          fraction,
        );
        const course: P.Station = section(
          fraction === G.forearmMaximumFraction
            ? "forearm.relaxedMaximumCourse"
            : fraction === G.forearmHalfAreaFraction
              ? "forearm.halfExcessAreaCourse"
              : "forearm.distalTaperCourse",
          "forearm",
          fraction,
          breadth,
          depth,
          roll,
        );
        // The supported maximum-girth course has zero transverse derivative instead of inheriting an unrelated elbow-to-distal secant. This is local support tangency, not a proof of the global girth maximum.
        if (fraction === G.forearmMaximumFraction)
          course.longitudinalTangent = "segment-axis";
        stations.push(course);
      }
      stations.push({
        name: "wrist.midTube",
        segment: "forearm",
        mechanicalFraction: 1,
      });
      sides[side] = {
        upperArmLengthMm: d.upperArmLengthMm,
        forearmLengthMm: d.forearmLengthMm,
        stations,
      };
      observations[side] = {
        upperMidTargetGirthMm: d.upperArmCircumferenceMm,
        upperMidCubicGirthMm: G.perimeter(upperU, upperV),
        foreMaximumTargetGirthMm: d.forearmCircumferenceMm,
        foreMaximumCubicGirthMm: G.perimeter(foreU, foreV),
        actualWristTransverseDiametersMm: [wristU, wristV],
        mechanicalTerminalChartFraction: 1,
        actualWristPositionPolicy:
          "Owner skin section can be offset from Hand joint; its actual P/fullJ is retained without moving it onto the nominal mechanical chart endpoint",
        independentScalarCountPerSide: 9,
        sourceGateMeasurementsUsed: 0,
      };
    }
    const parameters: P = {
      identity: "current-public-physical-arm",
      sides: sides as P["sides"],
    };
    const factory: AutoMovieArmCurveFactory = new AutoMovieArmCurveFactory(
      parameters,
    );
    const output: ReturnType<AutoMovieArmCurveFactory["generate"]> =
      factory.generate(new ArmIdentityCurveFactory.Context(context), upstream);
    return { parameters, factory, ...output, observations };
  }
}
export namespace ArmIdentityCurveFactory {
  /** Parent-first point and direction operations; callers provide the common actual hierarchy instead of a post-generation transform. */
  export type Parent = Pick<AutoMovieCurveParentContext, "point" | "direction">;

  /** Construction products and diagnostics from one call, sharing the same factory tensors.
   *
   * @author Samchon
   */
  export interface Detailed {
    /** Internal named section recipe produced from this instance's physical dimensions and owner wrist pole ranges. */
    parameters: P;

    /** Actual operator used for the returned groups and evaluateBoundary inspections. */
    factory: AutoMovieArmCurveFactory;

    /** World-space curve groups; no arm-owned endpoint boundary is emitted. */
    result: R.Result;

    /** Interpolation tensors and physical arc intervals for each side. */
    families: Record<"left" | "right", AutoMovieArmCurveFactory.Family>;

    /** Side diagnostics for target/constructed cubic girths, owner wrist extents and input-count conventions; these do not validate biological form. */
    observations: Record<string, unknown>;
  }

  /** Delegate the existing arm operator's context ABI to the supplied actual point/direction provider. */
  export class Context extends AutoMovieCurveParentContext {
    /** Retain the caller's resolved hierarchy; the empty base hierarchy is never used by the overridden placement operations. */
    public constructor(private readonly actual: Parent) {
      super([], []);
    }

    /** Transform a local millimetre point through its actual resolved parent hierarchy; no post-generation placement is applied. */
    public override point(bone: string, point: C.Vector): C.Vector {
      return this.actual.point(bone, point);
    }
    /** Delegate a direction without translation; node admission and unresolved-arithmetic errors remain the actual provider's responsibility. */
    public override direction(bone: string, direction: C.Vector): C.Vector {
      return this.actual.direction(bone, direction);
    }
  }
}
