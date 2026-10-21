import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanHeadFrame } from "./HumanHeadFrame";
import type { HumanHeadYPort } from "./HumanHeadYPort";
import type { HumanPosteriorCapPort } from "./HumanPosteriorCapPort";
import { HumanHeadPosteriorMedian } from "./HumanHeadPosteriorMedian";
import { HumanPosteriorHemisphereSurface } from "./HumanPosteriorHemisphereSurface";

/** Apply one pooled posterior rule to the main owner's current frame and exact ports. */
export namespace HumanPosteriorSurface {
  type Vector = HumanCurve.Vector;

  /** One main-owned actual side; no feature or cap is regenerated here. */
  export interface Side {
    /** Existing side and reflection identity. */
    side: "left" | "right";
    /** Actual current canthal direction, used to orient its admitted outside chart. */
    normal: Vector;
    /** Actual U1 function with main-qualified physical-Y addresses and full jets. */
    front: HumanHeadYPort.Result;
    /** Actual whole front-to-shared-median cap function and exact mixed/angular jets. */
    cap: HumanPosteriorCapPort.Result;
    /** Existing nonuniform cap addresses, expressed in this same intrinsic coordinate. */
    samplingU: readonly number[];
    /** Main-selected shared physical-Y addresses; no new density is chosen here. */
    samplingY: readonly number[];
  }

  /** Main chooses all source-corresponding branches and the shared boundary domain. */
  export interface Input {
    /** Sole existing HeadFrame, carrying current actual physical inputs. */
    frame: HumanHeadFrame.Result;
    /** One actual selected median contact and full upper tangent/station jet. */
    medianTop: HumanHeadPosteriorMedian.Top;
    /** Main-owned lower Y of the one shared posterior authority, millimetres. */
    medianLowerYmm: number;
    /** Both current front and cap owners; the adapter chooses neither branch. */
    sides: readonly [Side,Side];
  }

  /** Canonical front addresses must also be bound into the old incident chart. */
  export interface FrontAddress {
    /** Existing side. */
    side: Side["side"];
    /** Same physical-Y curve consumed directly by the new skin. */
    canonicalBoundary: HumanSurface.Boundary;
    /** Same original U1 object, retained with its independent normalized V unit. */
    originalBoundary: HumanSurface.Boundary;
    /** Exact original V -> physical Y and its first/second Jacobians. */
    originalToPhysicalY: HumanHeadYPort.Result["physicalAddress"];
  }

  /** Actual skin and construction retain the sole boundary objects from this call. */
  export interface Result {
    /** Two complete front-to-median posterior/outside charts in their admitted domains. */
    patches: HumanSurface.Patch[];
    /** Same curve objects used by the skin, offered to construction without refitting. */
    boundaries: HumanSurface.Boundary[];
    /** Sole median P/Py/Pyy and cross authority; adjacent regions reuse this object. */
    median: HumanHeadPosteriorMedian.Result;
    /** Full hemisphere evaluators and unchanged cap angular two-jet authorities. */
    hemispheres: HumanPosteriorHemisphereSurface.Result[];
    /** Explicit maps for the main-owned front edge-address integration. */
    frontAddresses: FrontAddress[];
    /** Exact evidence binding of the single common rule, identical for every person. */
    evidence: { medianSha256: string; shapeSha256: string; shapeSelection: string };
    /** Source conditioning, parameter meaning and ungenerated neighbors. */
    limitations: string[];
  }

  /**
   * Nineteen original source levels identify the median's two common curvature
   * scalars. Thirty-seven complete original Hermite arcs identify the four
   * common log-radius interior scalars after endpoint feature laws are fixed.
   * This uses the recorded pooled8 original-span rule unchanged. The separate
   * sixteen-point sensitivity and every whole-person omission remain evidence,
   * rather than per-person coefficients or an unobserved q correction.
   *
   * Main injects its actual shared frame, selected cap branches and exact front
   * functions. The median is constructed exactly once from the supplied actual
   * top two-jet; both incident halves consume that same object. The same patch
   * evaluator supplies skin and construction. Original source bytes, mesh,
   * normals, control points or person identities are never read at runtime.
   */
  export function build(input: Input): Result {
    const frame: HumanHeadFrame.Result = input.frame;
    const height: number = frame.crownY-frame.eyeY, topY: number = input.medianTop.positionMm[1];
    if (!(Number.isFinite(input.medianLowerYmm) && input.medianLowerYmm < topY &&
      height > 0 && frame.lengthMm > 0) ||
      input.sides[0].side === input.sides[1].side ||
      input.sides.some((side: Side): boolean => side.front.side !== side.side ||
        side.front.boundary.start < input.medianLowerYmm ||
        side.front.boundary.end !== topY))
      throw new Error("Posterior assembly requires actual current sides and one main-owned physical-Y domain");
    const median: HumanHeadPosteriorMedian.Result = HumanHeadPosteriorMedian.build({
      sagittalZmm:frame.supportMm[2],headLengthMm:frame.lengthMm,
      eyeToCrownMm:height,lowerYmm:input.medianLowerYmm,top:input.medianTop,law:medianRule,
    });
    // The same overlapping median addresses prevent independent edge samplings.
    const overlapLower: number = Math.max(input.sides[0].front.boundary.start,input.sides[1].front.boundary.start);
    const first: readonly number[] = input.sides[0].samplingY.filter((y: number): boolean => y >= overlapLower);
    const second: readonly number[] = input.sides[1].samplingY.filter((y: number): boolean => y >= overlapLower);
    if (first.length !== second.length || first.some((y: number,i: number): boolean => y !== second[i]) ||
      first[0] !== overlapLower || first.at(-1) !== topY)
      throw new Error("Both posterior halves must consume the main owner's same physical-Y median addresses");
    const hemispheres: HumanPosteriorHemisphereSurface.Result[] = input.sides.map(
      (side: Side): HumanPosteriorHemisphereSurface.Result => HumanPosteriorHemisphereSurface.build({
        side:side.side,normal:side.normal,front:side.front,back:median,cap:side.cap,
        lowerYmm:side.front.boundary.start,upperYmm:topY,law:shapeRule,
        samplingU:side.samplingU,samplingY:side.samplingY,
      }));
    const registry: Map<string,HumanSurface.Boundary> = new Map();
    for (const hemisphere of hemispheres) for (const boundary of hemisphere.boundaries) {
      const existing: HumanSurface.Boundary | undefined = registry.get(boundary.id);
      if (existing !== undefined && existing !== boundary)
        throw new Error("Posterior assembly received multiple authorities for one boundary identity");
      registry.set(boundary.id,boundary);
    }
    return {
      patches:hemispheres.map((hemisphere: HumanPosteriorHemisphereSurface.Result): HumanSurface.Patch => hemisphere.patch),
      boundaries:[...registry.values()],median,hemispheres,
      frontAddresses:input.sides.map((side: Side): FrontAddress => ({
        side:side.side,canonicalBoundary:side.front.boundary,originalBoundary:side.front.originalBoundary,
        originalToPhysicalY:side.front.physicalAddress,
      })),
      evidence:{medianSha256:medianRule.evidenceSha256,shapeSha256:shapeRule.evidenceSha256,
        shapeSelection:"pooled-eight-point-original-span-H1; four common runtime interior coefficients"},
      limitations:[
        "The source pooled fit is conditioned on source top/front/median fields. Actual current port transport, target corner compatibility and matched rendering are separate checks",
        "Eight-to-sixteen coefficient sensitivity has measured source-point max0.01250366147068289mm and tangent max0.01308520432974392degree; this is not an asymptotic convergence certificate",
        "Four-source whole-person omission reaches7.250014646220021mm source-conditional error; unseen morphology and independent native/clinical parameter effects are unqualified",
        "Main must bind each returned original-V-to-physical-Y map and same canonical object into the old incident chart; object names do not erase a parameter-unit mismatch",
        "The same median object covers the selected union domain. Unequal named-brow lower ends leave explicitly unpaired lower boundary intervals, never an invented ear or neck join",
        "The registered head-support sagittal datum and limited median cross-curvature identification do not certify an anatomical midsagittal plane or per-person asymmetry",
        "Ear attachment, lower occipital/neck, medial forehead and missing face remain separate domains; old retained skin must not be silently overlaid as a fallback",
        "No clinical certification, full-head likeness, regularity/contact result or completion is claimed before the main owner's actual whole-region inspection",
      ],
    };
  }

  const medianRule: HumanHeadPosteriorMedian.Law = Object.freeze({
    kind:"source19-posterior-median-quadratic-v1",
    forwardCurvature:0.32358318600827357,crossCurvature:-0.08177172135265216,
    evidenceSha256:"ace34c605788098b847a1041ccc5d1d328f6d795afa69ecead697609413d45ba",
  });
  const shapeRule: HumanPosteriorHemisphereSurface.Law = Object.freeze({
    kind:"source37-posterior-median-log-radius-v1",
    interior:Object.freeze([-2.8268081296138847,3.393491622542175,-5.286776864787889,7.416636206142153]) as readonly [number,number,number,number],
    evidenceSha256:"ac2e3a3cc180bc3838ac43571025c0f3468838921680c1ff61fb009a47f2770c",
  });
}
