import { Quaternion, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanPostureCurve } from "../posture/createHumanPostureCurve";
import { prepareHumanPostureRigCheck } from "../posture/prepareHumanPostureRigCheck";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** The root orientation that changes while the prepared articulation stays fixed. */
type Heading = Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll">;

/**
 * Prepare placement of one fixed gymnastic articulation by its centre of mass.
 * The body and mass model belong to the unchanged body's plan. Each query may
 * change only root heading and centre, in degrees and world metres.
 *
 * @param body The plan's body with an unchanged skeleton and physical profile.
 * @param model Its mass model.
 * @param posture The fixed clinical joints, with no limb/digit goals or whole-body rotation.
 * @returns A reader producing a fresh posture at the requested heading and centre.
 * @throws {Error} When goals or a separate whole-body rotation make the articulation depend on its placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed-articulation premise, allowed query changes, units, body lifetime and refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A mass-weighted mean commutes with rigid placement: Cworld = root + R Clocal. One actual canonical preparation at the origin supplies both Clocal and the fixed projected articulation. Each query uses the ordinary heading owner and subtracts the rotated offset from its demanded centre; resolver admission alone proves whether its carried joint-only solution still applies.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preserve the owner's existing copy of fixed goal-free clinical coefficients, then explicitly capture that neutral source with createHumanPostureCurve. Its prepared entry supplies the actual existing resolver token and rig guard once; unsupported capture uses the original preparation. Requested mass FK/COM and rigid output retain their original owners. This certifies only this fixed source, never an arbitrary enclosing flight callback.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves original clinical demands and ordinary ROM projection; positional goals are refused rather than dropped. The resolver alone issues an owned raw graph from its actual private source and checks current joint/body/ROM/context at consumption. No arbitrary caller JSON, resolved flag, achieved target substitute or unchecked clamping bypass certifies the pose.
 * @evidence contracts/development/implementation.md#efficient-algorithms One actual canonical preparation still observes fresh mass-bearing FK and O(S) reduction without eagerly copying its unused public pose or solving twice. Explicit capture adds O(J) immutable coefficient copying and rig admission at construction; each query keeps its existing rig comparison, one offset rotation and J output copies. Changed/unsupported metadata repeats ordinary preparation/FK/mass work. Total gains are unmeasured and the added capture layer remains a simplification candidate if measurements show no benefit.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan's explicitly unchanged body/profile/model fixes mass and collider data. Identical genuine FK/topology owners plus current skeleton/topology/ROM/axes/rest-frame scalar checks prove the local COM epoch; failed proof re-prepares actual canonical joints and COM together. Raw/overlay/context admission remains the resolver's, and fresh tuples isolate output mutation; rig proof is never presented as live profile/model validation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its existing copied clinical coefficients plus the explicit capture's immutable O(J) snapshot, a bounded mass-name set and one current actual canonical/COM/checker prefix. Invalidation replaces that prefix without a linked history; unsupported proof retains ordinary per-query preparation. Per-query postures/capabilities retain no FK reader, and every root/table/tuple/limb record is fresh without external handles.
 */
export function prepareGymnasticsPlacement(
  body: IAutoMovieMotionHumanBody,
  model: IAutoMovieResolveCenterOfMass.IModel,
  posture: IAutoMovieMotionHumanPosture,
): (heading: Heading, centre: IAutoMovieVector3) => IAutoMovieMotionHumanPosture {
  if (
    Object.values(posture.limbs).some((goal: IAutoMovieHumanLimbGoal | undefined): boolean => goal !== undefined) ||
    Object.values(posture.digits ?? {}).some((goal: IAutoMovieHumanDigitGoal | undefined): boolean => goal !== undefined) ||
    posture.rotation !== undefined
  )
    throw new Error("Fixed gymnastic placement requires joint-only articulation");

  const joints: IAutoMovieMotionHumanPosture["joints"] = copyJoints(posture.joints);
  const source: ReturnType<typeof createHumanPostureCurve> = createHumanPostureCurve({
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints,
    limbs: {},
  });
  let requested: Set<AutoMovieHumanoidBone> | undefined;
  const prepare: () => IPlacement = (): IPlacement => {
    const captured: createHumanPostureCurve.ICaptured | undefined = createHumanPostureCurve.prepared(body, source);
    const prepared: resolveHumanPosture.IPrepared = captured?.prepared ?? resolveHumanPosture.prepare(body, source(0));
    if (requested === undefined) {
      requested = new Set();
      for (const segment of model.segments) requested.add(segment.bone);
    }
    return {
      prepared,
      local: resolveAutoMovieCenterOfMass.place(
        model, resolveHumanPosture.preparedBones(prepared, requested),
      ),
      rig: body.poseResolution,
      topology: body.topology,
      unchanged: captured?.unchanged ?? prepareHumanPostureRigCheck(body),
    };
  };
  let fixed: IPlacement = prepare();
  return (heading: Heading, centre: IAutoMovieVector3): IAutoMovieMotionHumanPosture => {
    const rotation: ReturnType<typeof resolveHumanPosture.heading> = resolveHumanPosture.heading(heading);
    if (fixed.rig !== body.poseResolution || fixed.topology !== body.topology ||
      fixed.unchanged?.() !== true) fixed = prepare();
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(rotation, fixed.local);
    return resolveHumanPosture.rigid(fixed.prepared,
      { x: centre.x - offset.x, y: centre.y - offset.y, z: centre.z - offset.z },
      heading.yaw, heading.pitch, heading.roll,
    );
  };
}

/** One actual fixed-articulation preparation and the rig/ROM epoch its mass offset belongs to. */
interface IPlacement {
  /** Genuine source capability, kept separate from mutable public pose views. */
  prepared: resolveHumanPosture.IPrepared;

  /** Actual neutral canonical COM, metres in the body's root frame. */
  local: IAutoMovieVector3;

  /** The genuine immutable FK owner used for that actual canonical mass observation. */
  rig: IAutoMovieMotionHumanBody["poseResolution"];

  /** The actual topology context of the same canonical preparation. */
  topology: IAutoMovieMotionHumanBody["topology"];

  /** Genuine current rig/ROM proof; absence requires ordinary preparation at every query. */
  unchanged: (() => boolean) | undefined;
}

/** Copy the authored tuples so neither the input nor a returned posture owns retained shape data. */
function copyJoints(source: IAutoMovieMotionHumanPosture["joints"]): IAutoMovieMotionHumanPosture["joints"] {
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const bone of Object.keys(source) as AutoMovieHumanoidBone[]) {
    const value: readonly [number, number, number] | undefined = source[bone];
    if (value !== undefined) joints[bone] = [value[0], value[1], value[2]];
  }
  return joints;
}
