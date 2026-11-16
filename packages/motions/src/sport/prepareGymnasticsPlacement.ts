import { Quaternion, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { GymnasticsFlight } from "./GymnasticsFlight";

/** The root orientation that changes while the prepared articulation stays fixed. */
type Heading = Pick<IHumanPosture, "yaw" | "pitch" | "roll">;

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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the goal-free shape, copy its clinical table, prepare its actual canonical source and observe private requested FK for local COM once, then return fresh rigid demands with the producer's checked capability. Varying articulations retain their ordinary query preparation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves original clinical demands and ordinary ROM projection; positional goals are refused rather than dropped. The resolver independently checks current joint/body/ROM/context and constructs the actual current root orientation, without a caller-set resolved flag, achieved target substitute or unchecked clamping bypass.
 * @evidence contracts/development/implementation.md#efficient-algorithms One canonical preparation observes fresh mass-bearing FK plus O(S) reduction without eagerly copying its unused public pose. Queries rotate one offset and copy J raw triples without FK/mass scans; an eligible displayed consumer reuses actual projected joints. Exact dependency checks/fresh outputs remain and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan shares its actual fixed canonical articulation and COM. Every root/heading is still evaluated, original demands stay present, and live raw/body/ROM/context checks govern consumption; changed overlays or unsupported goals use ordinary solving. Fresh joint tuples isolate caller mutation from this preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns one copied clinical table, canonical preparation and COM vector. Per-query raw postures and weakly owned checked capabilities retain no history or FK reader; every root/table/tuple/limb record is fresh and no external handle is acquired.
 */
export function prepareGymnasticsPlacement(
  body: IHumanBody,
  model: GymnasticsFlight.Model,
  posture: IHumanPosture,
): (heading: Heading, centre: IAutoMovieVector3) => IHumanPosture {
  if (
    Object.values(posture.limbs).some((goal: IHumanPosture.IGoal | undefined): boolean => goal !== undefined) ||
    Object.values(posture.digits ?? {}).some((goal: IHumanPosture.IDigitGoal | undefined): boolean => goal !== undefined) ||
    posture.rotation !== undefined
  )
    throw new Error("Fixed gymnastic placement requires joint-only articulation");

  const joints: IHumanPosture["joints"] = copyJoints(posture.joints);
  const prepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints,
    limbs: {},
  });
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of model.segments) requested.add(segment.bone);
  const local: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model, resolveHumanPosture.preparedBones(prepared, requested),
  );
  return (heading: Heading, centre: IAutoMovieVector3): IHumanPosture => {
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      resolveHumanPosture.heading(heading),
      local,
    );
    return resolveHumanPosture.carried(prepared, {
      root: { x: centre.x - offset.x, y: centre.y - offset.y, z: centre.z - offset.z },
      yaw: heading.yaw,
      pitch: heading.pitch,
      roll: heading.roll,
      joints: copyJoints(joints),
      limbs: {},
    });
  };
}

/** Copy the authored tuples so neither the input nor a returned posture owns retained shape data. */
function copyJoints(source: IHumanPosture["joints"]): IHumanPosture["joints"] {
  const joints: IHumanPosture["joints"] = {};
  for (const bone of Object.keys(source) as AutoMovieHumanoidBone[]) {
    const value: readonly [number, number, number] | undefined = source[bone];
    if (value !== undefined) joints[bone] = [value[0], value[1], value[2]];
  }
  return joints;
}
