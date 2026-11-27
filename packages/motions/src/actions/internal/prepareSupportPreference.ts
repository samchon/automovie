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

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { stand } from "./stand";
import { supportContact } from "./supportContact";

/**
 * Prepare the shape shared by a support stance's distinct transfer keys.
 *
 * @param body The stance's fixed performer.
 * @param base The action's joint-space entry.
 * @returns A planning-local reader placing each stance's fixed shape above its
 *   current contact targets and root.
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

/** A key's actual contact targets in world metres. */
type AutoMovieSupportPreferencePlace = (
  contact: IAutoMovieMotionHumanSupport.IContact,
) => IAutoMovieVector3 | null;

/** A prepared stance shape placed over the current support sites. */
type AutoMovieSupportPreferenceRead = (
  from: IAutoMovieMotionHumanPosture,
  place: AutoMovieSupportPreferencePlace,
) => IAutoMovieMotionHumanPosture;

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
