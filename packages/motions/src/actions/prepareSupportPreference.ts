import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";
import { supportContact } from "./supportContact";

/** A key's actual contact targets in world metres. */
type AutoMovieSupportPreferencePlace = (
  contact: IAutoMovieMotionHumanSupport.IContact,
) => IAutoMovieVector3 | null;

/** A prepared stance shape placed over the current support sites. */
type AutoMovieSupportPreferenceRead = (
  from: IAutoMovieMotionHumanPosture,
  place: AutoMovieSupportPreferencePlace,
) => IAutoMovieMotionHumanPosture;

/**
 * Prepare the shape shared by a support stance's distinct transfer keys.
 *
 * @param body The stance's fixed performer.
 * @param base The action's joint-space entry.
 * @returns A planning-local reader placing each stance's fixed shape above its current contact targets and root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the stance-local shape and changing placement inputs.
 * @evidence contracts/development/implementation.md#principled-implementation Projection and FK of the authored angular configuration are translation invariant. A single zero-root observation supplies root-relative material points and the minimum collider height. Each key places those values using its current contact targets and predecessor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure An unspecified stance returns its entry preference. Otherwise the angle-only shape and its bounds precede one rigid placement reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the contact form, anchor averaging, grounded-contact test and complete collider floor. Every key still receives its own fit and refusal policy.
 * @evidence contracts/development/implementation.md#efficient-algorithms One FK and collider reduction per authored shape replace up to two FK reads per key. Placement is linear in the number of contact targets.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each reader closes over its own stance geometry. Targets remain evaluated at each key, including target changes caused by newly laid support.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fixed projected frames and one floor value release with the planning operation. Query roots and target reads are not retained.
 */
export function prepareSupportPreference(
  body: IAutoMovieMotionHumanBody,
  base: IAutoMovieMotionHumanPosture,
): (
  stance: IAutoMovieMotionHumanSupport.IStance,
  from: IAutoMovieMotionHumanPosture,
  place: AutoMovieSupportPreferencePlace,
) => IAutoMovieMotionHumanPosture {
  const shapes: Map<
    IAutoMovieMotionHumanSupport.IStance,
    AutoMovieSupportPreferenceRead
  > = new Map();
  return (
    stance: IAutoMovieMotionHumanSupport.IStance,
    from: IAutoMovieMotionHumanPosture,
    place: AutoMovieSupportPreferencePlace,
  ): IAutoMovieMotionHumanPosture => {
    if (stance.prefer === undefined) return base;
    let read: AutoMovieSupportPreferenceRead | undefined = shapes.get(stance);
    if (read === undefined) {
      read = prepareStance(body, base, stance, stance.prefer);
      shapes.set(stance, read);
    }
    return read(from, place);
  };
}

/** Prepare the actual projected geometry of one stated angular preference. */
function prepareStance(
  body: IAutoMovieMotionHumanBody,
  base: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanSupport.IStance,
  preferred: NonNullable<IAutoMovieMotionHumanSupport.IStance["prefer"]>,
): AutoMovieSupportPreferenceRead {
  const shape: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: base.yaw + (stance.turn ?? 0),
    pitch: preferred.pitch,
    roll: preferred.roll,
    joints: { ...base.joints, ...stand.relaxed(body), ...preferred.joints },
    limbs: {},
  };
  const frames: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, resolveHumanPosture(body, shape));
  const lowest: number = HumanColliders.lowest(body, frames);
  const form: ReturnType<typeof supportContact.prepareForm> =
    supportContact.prepareForm(body, false);
  return (
    from: IAutoMovieMotionHumanPosture,
    place: AutoMovieSupportPreferencePlace,
  ): IAutoMovieMotionHumanPosture => {
    const anchors: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [];
    for (const contact of stance.contacts) {
      const at: IAutoMovieVector3 | null = place(contact);
      if (at !== null) anchors.push(form(contact, at).target);
    }
    const shift: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const target of anchors) {
      const bone: IAutoMovieResolvedBone = frames.get(target.bone)!;
      const relative: IAutoMovieVector3 =
        target.point === undefined
          ? bone.worldPosition
          : Vector3.add(
              bone.worldPosition,
              Quaternion.rotateVector(bone.worldRotation, target.point),
            );
      shift.x += (target.goal.x - (relative.x + from.root.x)) / anchors.length;
      if (target.goal.y > 0)
        shift.y +=
          (target.goal.y - (relative.y + from.root.y)) / anchors.length;
      shift.z += (target.goal.z - (relative.z + from.root.z)) / anchors.length;
    }
    const root: IAutoMovieVector3 = Vector3.add(from.root, shift);
    const grounded: boolean = stance.contacts.some(
      (contact: IAutoMovieMotionHumanSupport.IContact): boolean =>
        supportContact.onFloorTarget(place(contact)),
    );
    const low: number = lowest + root.y;
    return {
      ...shape,
      root: { ...root, y: root.y - (grounded ? low : Math.min(0, low)) },
    };
  };
}
