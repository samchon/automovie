import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import { AutoMovieFootMath64 as M } from "../family/AutoMovieFootMath64";
import type { IAutoMovieFootDimensions64 as D } from "../family/IAutoMovieFootDimensions64";
import type { IAutoMovieFootIdentityBridge64 as I } from "./IAutoMovieFootIdentityBridge64";
import { buildAutoMovieFootIdentityCourses64 } from "./buildAutoMovieFootIdentityCourses64";
import { buildAutoMovieFootIdentityToes64 } from "./buildAutoMovieFootIdentityToes64";
import { resolveAutoMovieFootIndependent64 } from "./resolveAutoMovieFootIndependent64";

/**
 * Resolve a shared public specimen and current ankle dependencies into foot recipes.
 *
 * The caller supplies the matching rest skeleton and parent context. Checks the
 * 55-joint count, LowerLeg/Foot/Toes links, positive public dimensions and available
 * ankle IDs. The canonical family validates the consumed ankle's shape/chart later.
 * Projected Foot-to-Toes direction defines forward; current ankle poles locate the
 * cut independently of the joint. All generated dimensions remain relative to it.
 *
 * Explicit heel, toe and public length inputs must agree; no hidden heel shift or
 * toe rescaling repairs a conflict. The standing datum follows the parent rather
 * than solving loaded ground contact. Sparse soft form uses declared conventions,
 * not native registration or saved output controls. Invalid combinations throw.
 */
export function resolveAutoMovieFootIdentity64(props: {
  /** Public dimensions resolved for the same identity as skeleton. */
  measurements: IAutoMovieHumanMeasurements;

  /** Shared 55-bone rest skeleton and its pternion landmark. */
  skeleton: IAutoMovieHumanSkeleton;

  /** Current actual parent placement; its Foot gauge carries the rest recipe. */
  context: AutoMovieCurveParentContext;

  /** Leg-owned canonical ankles already bound to their respective Foot consumers. */
  upstream: ReadonlyMap<string, C.Boundary>;

  /** Independent physical side overrides; no curve, normal or control input. */
  additional?: Partial<Record<"left" | "right", Partial<I.Independent>>>;

  /** Optional prefix for both ankle keys, separated by a colon. */
  namespace?: string;
}): {
  /** Relative dimensional recipes consumed by the original continuous family. */
  parameters: D.Parameters;

  /** Current physical measurements retained for construction inspection. */
  resolved: Readonly<Record<"left" | "right", I.Resolved>>;
} {
  const sides: Partial<Record<"left" | "right", D.Side>> = {};
  const bindings: Partial<Record<"left" | "right", D.Binding>> = {};
  const resolved: Partial<Record<"left" | "right", I.Resolved>> = {};
  if (props.skeleton.joints.length !== 55)
    throw new Error("Complete actual 55-bone rest skeleton required");
  for (const side of ["left", "right"] as const) {
    const bone: string = side + "Foot";
    const joint: IAutoMovieHumanSkeleton.IJoint | undefined =
      props.skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
      );
    const toeJoint: IAutoMovieHumanSkeleton.IJoint | undefined =
      props.skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
          j.bone === side + "Toes",
      );
    if (
      !joint ||
      !toeJoint ||
      joint.parent !== side + "LowerLeg" ||
      toeJoint.parent !== bone
    )
      throw new Error("Actual LowerLeg/Foot/Toes parent chain required");
    const leg: IAutoMovieHumanMeasurements["identity"]["body"]["leftLeg"] =
      props.measurements.identity.body[
        side === "left" ? "leftLeg" : "rightLeg"
      ];
    if (
      ![
        leg.footLength,
        leg.footBreadth,
        leg.ankleHeight,
        leg.navicularHeight,
      ].every((v: number): boolean => Number.isFinite(v) && v > 0)
    )
      throw new Error("Positive public foot dimensions required");
    const id: string =
      (props.namespace ? props.namespace + ":" : "") + side + ".ankle.midTube";
    const boundary: C.Boundary | undefined = props.upstream.get(id);
    if (!boundary) throw new Error("Missing actual upstream ankle " + id);
    const ankle: C.Vector = props.context.point(bone, [0, 0, 0]);
    const toes: C.Vector = props.context.point(side + "Toes", [0, 0, 0]);
    const up: C.Vector = props.context.direction(bone, [0, 1, 0]);
    const forward0: C.Vector = M.sub(toes, ankle);
    const forward: C.Vector = M.unit(
      M.sub(forward0, M.mul(up, M.dot(forward0, up))),
    );
    if (M.norm(forward) < 0.99)
      throw new Error("Distinct projected actual Toes joint required");
    const x: C.Vector = [
      up[1] * forward[2] - up[2] * forward[1],
      up[2] * forward[0] - up[0] * forward[2],
      up[0] * forward[1] - up[1] * forward[0],
    ];
    const parentBasis: C.Matrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ].map(
      (v: number[]): C.Vector =>
        props.context.direction(bone, v as unknown as C.Vector),
    ) as unknown as C.Matrix;
    const gauge: M.Frame = { origin: ankle, basis: parentBasis };
    const poles: C.Vector[] = boundary.section.spans.map(
      (span: C.Span): C.Vector => M.local(gauge, span[0]),
    );
    const cut: C.Vector = M.world(gauge, [
      (poles[0]![0] + poles[2]![0]) / 2,
      poles[0]![1],
      (poles[1]![2] + poles[3]![2]) / 2,
    ]);
    // The shared collar convention extrudes 0.025 foot lengths along actual J.
    // Its bounds use cubic derivative roots, not a sampled replacement ellipse.
    const drop: number = 0.025 * leg.footLength;
    const footFrame: M.Frame = { origin: ankle, basis: [x, up, forward] };
    const collarW: number[] = [];
    for (let i: number = 0; i < 4; i++) {
      const span: C.Span = boundary.section.spans[i]!.map(
        (p: C.Vector, k: number): C.Vector =>
          M.sub(p, M.mul(boundary.fullJ[i]![k]!, drop)),
      ) as unknown as C.Span;
      const q: number[] = span.map(
        (p: C.Vector): number => M.local(footFrame, p)[2],
      );
      const d: number[] = [0, 1, 2].map(
        (k: number): number => 3 * (q[k + 1]! - q[k]!),
      );
      const times: number[] = [
        0,
        1,
        ...M.roots([
          d[0]!,
          d[0]! / 3 + (2 * d[1]!) / 3,
          (2 * d[1]!) / 3 + d[2]! / 3,
          d[2]!,
        ]),
      ];
      collarW.push(
        ...times.map(
          (t: number): number => M.local(footFrame, M.bezier(span, t))[2],
        ),
      );
    }
    const ballW: number = M.dot(forward0, forward);
    const heelMark: typeof props.skeleton.landmarks.left.pternion.position =
      props.skeleton.landmarks[side].pternion.position;
    const heelLocal: C.Vector = [
      heelMark.x - joint.position.x,
      heelMark.y - joint.position.y,
      heelMark.z - joint.position.z,
    ];
    const heelFromSkeleton: number = -M.dot(
      M.sub(props.context.point(bone, heelLocal), ankle),
      forward,
    );
    const requestedHeel: number =
      props.additional?.[side]?.heelBehindAnkleMm ?? heelFromSkeleton;
    const toeJointHeight: number = M.dot(forward0, up) + joint.position.y;
    const m: I.Independent = resolveAutoMovieFootIndependent64(
      leg,
      props.additional?.[side],
      {
        heelBehindAnkleMm: requestedHeel,
        availableHalluxExtentMm: leg.footLength - requestedHeel - ballW,
        mtpCenterHeightMm: toeJointHeight,
      },
    );
    if (!(m.ballHeightMm > toeJointHeight))
      throw new Error(
        "Ball dorsal height must contain the actual shared Toes fulcrum",
      );
    // Straight physical toe lengths project through their independent rest splay.
    // Their longest tip must respect the same public heel-to-tip length.
    const rootW: number[] = m.toeRootRetractionMm.map(
      (v: number): number => ballW - v,
    );
    const projected: number[] = m.toeLengthMm.map(
      (v: number, i: number): number => v * Math.cos(m.toeSplayRad[i]!),
    );
    const heelW: number = -m.heelBehindAnkleMm;
    const longest: number = Math.max(
      ...rootW.map((w: number, i: number): number => w + projected[i]!),
    );
    if (Math.abs(longest - heelW - leg.footLength) > 1e-7)
      throw new Error(
        "Independent toe lengths, actual Toes fulcrum, heel reach and public foot length disagree",
      );
    const toeBand: number =
      m.toeBreadthMm.reduce((a: number, b: number): number => a + b, 0) +
      4 * m.webGapMm;
    const centers: number[] = [];
    let u: number = -toeBand / 2;
    for (const width of m.toeBreadthMm) {
      centers.push(u + width / 2);
      u += width + m.webGapMm;
    }
    // Common 0.04L proximal clearance and 0.005L distal reach leave room for the
    // branch construction. They are geometric conventions, not measured MTP sites.
    const parentW: number = Math.min(...rootW) - 0.04 * leg.footLength;
    const reach: number = Math.max(...rootW) + 0.005 * leg.footLength;
    const r: I.Resolved = {
      side,
      measurements: m,
      joint: { ankle, toes },
      upAxisWorld: up,
      forwardAxisWorld: forward,
      footLengthMm: leg.footLength,
      footBreadthMm: leg.footBreadth,
      heelW,
      rootW,
      projectedToeLengthMm: projected,
      toeCenterU: centers,
      parentW,
      webReach: reach,
      collarRangeW: [Math.min(...collarW), Math.max(...collarW)],
      // The public rest skeleton's standing Y=0 datum travels with the Foot node;
      // generation does not translate the final curves to force ground contact.
      floorLocalY: -joint.position.y,
      toeJointHeightAboveFloorMm: toeJointHeight,
    };
    const placementOffset: C.Vector = M.sub(ankle, cut);
    const intoParent: (v: C.Vector) => C.Vector = (v: C.Vector): C.Vector => [
      M.dot(v, parentBasis[0]),
      M.dot(v, parentBasis[1]),
      M.dot(v, parentBasis[2]),
    ];
    const localPlacement: C.Matrix = [
      intoParent(x),
      intoParent(up),
      intoParent(forward),
    ];
    const dimensions: D.Dimensions = {
      heelReach_mm: -heelW,
      forefootWebReach_mm: reach,
      breadth_mm: leg.footBreadth,
      instepHeight_mm: m.instepHeightMm,
      medialArchHeight_mm: leg.navicularHeight,
      floorOffsetAlongLocalUp_mm: r.floorLocalY,
      collarDrop_mm: drop,
    };
    const courses: Record<string, D.Course> =
      buildAutoMovieFootIdentityCourses64(r, leg.navicularHeight);
    sides[side] = {
      placement: {
        originOffset_parent_mm: intoParent(placementOffset),
        basisX_parent: localPlacement[0],
        basisY_parent: localPlacement[1],
        basisZ_parent: localPlacement[2],
        localChirality: side === "left" ? 1 : -1,
      },
      dimensions,
      heelPole: { outwardRatio: 0, heightAboveFloor_mm: m.heelPadHeightMm },
      courses,
      ...buildAutoMovieFootIdentityToes64(r, courses.forefoot!, dimensions),
    };
    bindings[side] = {
      bone,
      boundaryId: id,
      ankleChart: {
        originMm: [0, 0, 0],
        axes: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
      },
    };
    resolved[side] = r;
  }
  return {
    parameters: {
      sides: sides as Record<"left" | "right", D.Side>,
      bindings: bindings as Record<"left" | "right", D.Binding>,
    },
    resolved: resolved as Record<"left" | "right", I.Resolved>,
  };
}
