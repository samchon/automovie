import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanClinicalIk as ClinicalIk } from "./AutoMovieHumanClinicalIk";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/** Analytical clinical leg seeds measured from the same body's public Human FK. */
export namespace AutoMovieHumanLegIk {
  /** Requested minimum knee bend at one actual world ankle support. */
  export interface ISupport {
    /** Own side. */ side: "left" | "right";
    /** Desired world ankle centre, metres. */ position: Math3D.Vector;
    /** Minimum clinical knee flexion, degrees; greater bend remains available. */ kneeFlexion: number;
  }

  /**
   * Seed an ankle-centre reach from a real point carried by that foot or a toe.
   *
   * Current and neutral outputs are obtained from the same public fixed-body
   * evaluator, so caller-owned pose/body snapshots cannot be mixed. The complete
   * posed bone rotation maps the bone-local witness into evaluator
   * metres. Translating that witness to its independent goal gives an ankle
   * translation seed, which delegates the existing anatomical leg construction.
   * The delegated seed resets the acting ankle and replaces that leg's controls;
   * consumers retaining authored toe/foot controls must restore them before
   * final fitting. The seed may change foot orientation, so it is not an exact point solver or
   * support certificate; the consumer must fit and inspect the original witness
   * and complete foot geometry afterward. No stored rest-foot offset is used.
   *
   * @param evaluate Borrowed public fixed-body evaluator; no calibration is performed here.
   * @param target Bone-local Foot-descendant witness and evaluator-frame goal, metres. Scene actor/root conversion belongs to the consumer; numeric coordinates alone cannot prove their scene provenance.
   * @returns Independent clinical seed, with other body regions retained.
   */
  export function seedPoint(
    evaluate: Skeleton.PoseEvaluator,
    pose: IAutoMovieHumanPose,
    side: "left" | "right",
    target: ClinicalIk.ITarget,
    orientKnee: boolean = false,
  ): IAutoMovieHumanPose {
    if (typeof evaluate !== "function" || typeof orientKnee !== "boolean" || !["left", "right"].includes(side) || target === null || typeof target !== "object" || !finitePoint(target.position) || target.localPoint !== undefined && !finitePoint(target.localPoint))
      throw new Error("Human foot-point seed requires an anatomical side and finite metre points");
    const current: Skeleton.IOutput = evaluate(pose);
    const neutral: Skeleton.IOutput = evaluate({});
    const foot: string = `${side}Foot`;
    const bones: Map<string, Skeleton.IBone> = new Map(current.bones.map((bone: Skeleton.IBone): [string, Skeleton.IBone] => [bone.bone, bone]));
    let ancestor: string | null = target.bone;
    const visited: Set<string> = new Set();
    while (ancestor !== foot) {
      if (ancestor === null || visited.has(ancestor) || !bones.has(ancestor))
        throw new Error("Human foot-point seed requires a point on the selected Foot subtree");
      visited.add(ancestor);
      ancestor = bones.get(ancestor)!.parent;
    }
    const carrier: Skeleton.IPlacement = placement(current, target.bone);
    if (!finitePoint(carrier.position) || carrier.rotation.length !== 4 || ![0, 1, 2, 3].every((index: number): boolean => Number.isFinite(carrier.rotation[index])) || Math.abs(Math.hypot(...carrier.rotation) - 1) > 1e-6)
      throw new Error("Human foot-point seed requires an actual unit posed bone frame");
    const point: Math3D.Vector = Math3D.add(carrier.position, Math3D.rotate(carrier.rotation, target.localPoint ?? [0, 0, 0]));
    const ankle: Math3D.Vector = placement(current, foot).position;
    const goal: Math3D.Vector = Math3D.add(ankle, Math3D.sub(target.position, point));
    return seed(pose, side, goal, current, neutral, orientKnee);
  }

  /**
   * Largest root height consistent with every measured leg's requested knee
   * bend and horizontal ankle reach. Horizontal placement and rotation are
   * caller-owned. The result makes no sole-plane or collision guarantee;
   * infeasible horizontal reaches are reported explicitly and still require
   * endpoint fitting/inspection. No body dimensions or targets are changed.
   */
  export function supportHeight(
    current: Skeleton.IOutput,
    neutral: Skeleton.IOutput,
    root: { translation: Math3D.Vector; rotation: Math3D.Quaternion },
    supports: readonly ISupport[],
  ): {height:number;feasible:boolean} {
    if (supports.length === 0) throw new Error("Human support height requires an actual support leg");
    if (!Array.isArray(root.translation) || root.translation.length !== 3 || !root.translation.every(Number.isFinite) ||
      !Array.isArray(root.rotation) || root.rotation.length !== 4 || !root.rotation.every(Number.isFinite) ||
      Math.abs(Math.hypot(...root.rotation) - 1) > 1e-6)
      throw new Error("Human support requires a finite metre root and unit rotation");
    let height: number = Infinity;
    let feasible: boolean = true;
    for (const support of supports) {
      if (!Number.isFinite(support.kneeFlexion) || !Array.isArray(support.position) || support.position.length !== 3 || !support.position.every(Number.isFinite) || !["left", "right"].includes(support.side))
        throw new Error("Human support dimensions must be finite");
      const hip: Math3D.Vector = Math3D.rotate(root.rotation, placement(current, `${support.side}UpperLeg`).position);
      const upper: number = Math.hypot(...Math3D.sub(placement(neutral, `${support.side}UpperLeg`).position, placement(neutral, `${support.side}LowerLeg`).position));
      const lower: number = Math.hypot(...Math3D.sub(placement(neutral, `${support.side}LowerLeg`).position, placement(neutral, `${support.side}Foot`).position));
      const angle: number = bound("legs.<side>.knee.flexion", support.kneeFlexion) * Math.PI / 180;
      const reachSquared: number = upper * upper + lower * lower + 2 * upper * lower * Math.cos(angle);
      const horizontalSquared: number = (support.position[0] - root.translation[0] - hip[0]) ** 2 + (support.position[2] - root.translation[2] - hip[2]) ** 2;
      feasible &&= horizontalSquared <= reachSquared;
      height = Math.min(height, support.position[1] - hip[1] + Math.sqrt(Math.max(0, reachSquared - horizontalSquared)));
    }
    return { height, feasible };
  }

  /**
   * Seed one leg's joint-centre reach using its actual neutral segment lengths.
   * The target is in the evaluator's metre frame; current supplies the pelvis
   * rotation and hip position for exactly the supplied body's pose. Twist is
   * optional and orients the knee plane toward the target before sagittal reach.
   * The returned pose is independent. Other regions remain authored, the ankle
   * starts at neutral, and public clinical bounds constrain the seed. This is
   * neither an exact sole-frame solver nor proof of reachability: callers must
   * evaluate and retain the endpoint residual, particularly at range limits.
   */
  export function seed(
    pose: IAutoMovieHumanPose,
    side: "left" | "right",
    target: Math3D.Vector,
    current: Skeleton.IOutput,
    neutral: Skeleton.IOutput,
    orientKnee: boolean = false,
  ): IAutoMovieHumanPose {
    if (!Array.isArray(target) || target.length !== 3 || !target.every(Number.isFinite))
      throw new Error("Human leg target requires three finite metre coordinates");
    const hips: Skeleton.IPlacement = placement(current, "hips");
    const inverse: Math3D.Quaternion = [-hips.rotation[0], -hips.rotation[1], -hips.rotation[2], hips.rotation[3]];
    const raw: Math3D.Vector = Math3D.rotate(inverse, Math3D.sub(target, placement(current, `${side}UpperLeg`).position));
    const twist: number = orientKnee ? Math.max(-Math.PI / 4, Math.min(Math.PI / 4, Math.atan2(-raw[2], raw[0]))) : 0;
    const direction: Math3D.Vector = orientKnee ? Math3D.rotate([0, Math.sin(-twist / 2), 0, Math.cos(-twist / 2)], raw) : raw;
    const upper: number = Math.hypot(...Math3D.sub(placement(neutral, `${side}UpperLeg`).position, placement(neutral, `${side}LowerLeg`).position));
    const lower: number = Math.hypot(...Math3D.sub(placement(neutral, `${side}LowerLeg`).position, placement(neutral, `${side}Foot`).position));
    if (!(upper > 0.0001 && lower > 0.0001))
      throw new Error("Human leg requires nondegenerate measured segments");
    const distance: number = Math.min(upper + lower - 0.00005, Math.max(Math.abs(upper - lower) + 0.00005, Math.hypot(...direction)));
    const knee: number = Math.acos(Math.max(-1, Math.min(1, (distance * distance - upper * upper - lower * lower) / (2 * upper * lower))));
    const flexion: number = Math.atan2(direction[0], Math.sign(-direction[1]) * Math.hypot(direction[1], direction[2])) + Math.atan2(lower * Math.sin(knee), upper + lower * Math.cos(knee));
    const abduction: number = Math.atan2((side === "left" ? 1 : -1) * Math.sign(-direction[1]) * direction[2], Math.abs(direction[1]));
    const result: IAutoMovieHumanPose = structuredClone(pose);
    result.legs ??= { left: {}, right: {} };
    result.legs[side] = {
      hip: {
        flexion: bound("legs.<side>.hip.flexion", flexion * 180 / Math.PI),
        abduction: bound("legs.<side>.hip.abduction", abduction * 180 / Math.PI),
        rotation: bound("legs.<side>.hip.rotation", (side === "right" ? 1 : -1) * twist * 180 / Math.PI),
      },
      knee: { flexion: bound("legs.<side>.knee.flexion", knee * 180 / Math.PI) },
      ankle: { dorsiflexion: 0 },
    };
    return result;
  }
}

/** Read every coordinate, including a sparse untyped array's missing slots. */
function finitePoint(value: unknown): value is Math3D.Vector {
  return Array.isArray(value) && value.length === 3 && [0, 1, 2].every((index: number): boolean => Number.isFinite(value[index]));
}

/** Exact bone lookup prevents silent substitution of another body's joint. */
function placement(output: Skeleton.IOutput, bone: string): Skeleton.IPlacement {
  const result: Skeleton.IPlacement | undefined = output.posed.find((row: Skeleton.IPlacement): boolean => row.bone === bone);
  if (result === undefined) throw new Error(`Human leg joint is absent: ${bone}`);
  return result;
}

/** Read the same clinical bounds as FK rather than maintaining another ROM table. */
function bound(path: string, degrees: number): number {
  const row: (typeof AutoMovieHumanPoseChannels)[number] | undefined = AutoMovieHumanPoseChannels.find(
    (channel: (typeof AutoMovieHumanPoseChannels)[number]): boolean => channel[0] === path,
  );
  if (row === undefined) throw new Error(`Human clinical leg channel is absent: ${path}`);
  return Math.max(row[4], Math.min(row[5], degrees));
}
