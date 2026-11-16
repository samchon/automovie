import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmGeometry as G } from "./HumanArmGeometry";

/**
 * The single parent-first arm-chain FK used by cold placement and an explicit
 * derivative reader. Readers supply the same pure local articulations; world
 * parent/rest composition always runs for the current coordinates.
 *
 * @param setup The unchanged arm rig metadata.
 * @param at The current parent frame and optional completed same-frame shoulder point.
 * @param c The nine arm coordinates.
 * @param readShoulder The existing shoulder chart calculation or its scoped exact-input reader.
 * @param readRotation The existing local-joint projection/composition or its scoped exact-input reader.
 * @returns Fresh world joint positions and segment rotations, without probes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States current-coordinate FK, local-reader provenance, world-frame inputs, completed-shoulder provenance and fresh observation-free outputs.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the original upper/forearm/hand quaternion/rest-offset expression grouping and call order; the shoulder position is copied from completed actual same-frame FK when supplied, otherwise its original parent-offset expression runs.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One FK body accepts the existing pure local articulation readers, so cold and derivative paths share all hierarchy mathematics while probe attachment remains separate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rest scale stays unused as before, each world prefix is recomputed and supplied completed shoulder data requires unchanged parent/rest dependencies; reader inputs are current clinical coordinates rather than a fitted world result.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed three-joint world composition and two local-joint reader queries plus one shoulder query, with no fingertip or probe allocation; an available completed shoulder point replaces one repeated quaternion-vector rotation and vector addition with a fresh copy.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only actual invariant local-reader work and completed same-frame shoulder data; changing parent or coordinates still changes the corresponding world computation on every call.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no callback, input or result; the caller owns the fresh fixed-size chain record and its six world vectors/quaternions.
 */
export function resolveHumanArmChain(
  setup: G.ISetup,
  at: G.IFrame,
  c: readonly number[],
  readShoulder: typeof G.shoulder,
  readRotation: typeof G.rotation,
): Omit<G.IPlaced, "probes"> {
  const rest: G.ISetup["rest"] = setup.rest;
  const parent: G.IFrame["parent"] = at.parent;
  const wu: IAutoMovieQuaternion = Quaternion.multiply(
    parent.rotation,
    Quaternion.multiply(rest.upper.rotation, readShoulder(setup, c)),
  );
  const pu: IAutoMovieVector3 =
    at.shoulder === undefined
      ? Vector3.add(
          parent.position,
          Quaternion.rotateVector(parent.rotation, rest.upper.translation),
        )
      : { x: at.shoulder.x, y: at.shoulder.y, z: at.shoulder.z };
  const wl: IAutoMovieQuaternion = Quaternion.multiply(
    wu,
    Quaternion.multiply(
      rest.lower.rotation,
      readRotation(setup, setup.bones.lower, [c[3]!, c[4]!, c[5]!]),
    ),
  );
  const pl: IAutoMovieVector3 = Vector3.add(
    pu,
    Quaternion.rotateVector(wu, rest.lower.translation),
  );
  const wh: IAutoMovieQuaternion = Quaternion.multiply(
    wl,
    Quaternion.multiply(
      rest.hand.rotation,
      readRotation(setup, setup.bones.hand, [c[6]!, c[7]!, c[8]!]),
    ),
  );
  const ph: IAutoMovieVector3 = Vector3.add(
    pl,
    Quaternion.rotateVector(wl, rest.hand.translation),
  );
  return {
    shoulder: pu,
    elbow: pl,
    upper: wu,
    lower: wl,
    wrist: ph,
    hand: wh,
  };
}
