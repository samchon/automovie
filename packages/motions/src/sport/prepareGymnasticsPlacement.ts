import { Quaternion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsFlight } from "./GymnasticsFlight";

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
 * @evidence contracts/development/implementation.md#principled-implementation The mass-weighted mean commutes with a rigid transform: Cworld = root + R Clocal. One ordinary canonical resolution at the origin supplies Clocal; each query uses the same heading owner as the resolver, then subtracts the rotated offset from its demanded world centre.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit a goal-free shape, copy its clinical table, resolve its local centre once, then return the rigid-placement reader. Varying articulations continue to use GymnasticsFlight.placed.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original clinical demands and normal resolver clamp. It refuses position-dependent goals instead of dropping them, changes no flight curve, and supplies no resolved flag or achieved target substitute.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation performs one existing canonical resolution/FK and mass reduction in B bones and S segments. Each query rotates one vector and copies J joint triples, with no FK or mass scan; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan shares only the fixed shape's canonical local COM. Body/model and copied clinical joints stay fixed, while every changing heading and world centre is evaluated. Returned joints are copied so a consumer cannot mutate subsequent queries.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader owns one copied clinical table and one COM vector for its plan's lifetime. Each query returns fresh root, table, triples and empty limbs; there is no global cache, history or external handle.
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
  const local: IAutoMovieVector3 = GymnasticsFlight.centre(body, model, {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints,
    limbs: {},
  });
  return (heading: Heading, centre: IAutoMovieVector3): IHumanPosture => {
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      resolveHumanPosture.heading(heading),
      local,
    );
    return {
      ...heading,
      root: { x: centre.x - offset.x, y: centre.y - offset.y, z: centre.z - offset.z },
      joints: copyJoints(joints),
      limbs: {},
    };
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
