import type {
  IAutoMovieHumanBindBone,
  IAutoMovieHumanBonePlacement,
  IAutoMovieHumanSkeleton,
  IAutoMoviePolygonBodyCue,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { Quaternion, Vector3 } from "three";

import type { AutoMovieHumanPolygon } from "../../AutoMovieHumanPolygon.js";

/** Prepare rigid visual cues for one polygon drawing on its source clock. */
export function prepareHumanPolygonPresentation(
  presentation: AutoMovieHumanPolygon.IPresentation,
  bones: ReadonlyMap<string, IAutoMovieHumanBindBone>,
  emitted: ReadonlySet<string>,
): (seconds: number) => AutoMoviePolygonPose {
  const { subject, poseAt, actorFrameAt }: AutoMovieHumanPolygon.IPresentation =
    presentation;
  const children: Map<string, string[]> = new Map();
  for (const { bone, parent } of bones.values()) {
    if (parent === null) continue;
    const siblings: string[] | undefined = children.get(parent);
    if (siblings === undefined) children.set(parent, [bone]);
    else siblings.push(bone);
  }

  const cuesByBone: Map<string, AutoMoviePreparedPolygonCue> = new Map();
  const occupied: Set<string> = new Set();
  let firstCue: number = Infinity;
  for (const cue of presentation.cues) {
    if (cue.subject !== subject) continue;
    if (!bones.has(cue.bone))
      throw new Error(`Unsupported polygon cue target: ${cue.bone}`);
    if (cue.at < 0 || cue.duration < 0)
      throw new Error(`Invalid polygon cue timing: ${cue.bone}`);
    firstCue = Math.min(firstCue, cue.at);

    const subtree: string[] = [cue.bone];
    let hasEmittedPart: boolean = false;
    for (const bone of subtree) {
      if (occupied.has(bone))
        throw new Error(`Overlapping polygon cue subtree: ${bone}`);
      occupied.add(bone);
      hasEmittedPart ||= emitted.has(bone);
      for (const child of children.get(bone) ?? []) subtree.push(child);
    }

    if (!hasEmittedPart)
      throw new Error(`Unsupported polygon cue target: ${cue.bone}`);

    // Authored cue admission measures the quaternion norm. Registered
    // skeletal placements use the drawing's separate squared-norm tolerance.
    const { x, y, z, w }: IAutoMoviePolygonBodyCue["rotation"] = cue.rotation;
    const norm: number = Math.hypot(x, y, z, w);
    if (Math.abs(norm - 1) > 1e-6)
      throw new Error(`Invalid polygon rotation: ${cue.bone}`);
    const timing: IAutoMoviePolygonCueTiming = {
      at: cue.at,
      duration: cue.duration,
      rotation: new Quaternion(x / norm, y / norm, z / norm, w / norm),
    };
    let prepared: AutoMoviePreparedPolygonCue;
    if (cue.kind === "bend") {
      prepared = { ...timing, kind: cue.kind, bone: cue.bone };
    } else if (cue.kind === "detach") {
      const translation: Vector3 = new Vector3(
        cue.translation.x,
        cue.translation.y,
        cue.translation.z,
      );
      const released: Map<string, IAutoMoviePolygonFrame> = new Map();
      const selected: Set<string> = new Set(subtree);
      const actor: IAutoMoviePolygonFrame = actorFrame(actorFrameAt, cue.at);

      // Capture the branch's world placement once so later poses and actor
      // staging cannot drive the released parts.
      for (const placement of poseAt(cue.at).posed) {
        if (!selected.has(placement.bone)) continue;
        if (released.has(placement.bone))
          throw new Error(
            `Duplicate polygon release placement: ${placement.bone}`,
          );
        const frame: IAutoMoviePolygonFrame = boneFrame(placement);
        frame.position.applyQuaternion(actor.rotation).add(actor.position);
        frame.rotation.premultiply(actor.rotation);
        released.set(placement.bone, frame);
      }
      const origin: IAutoMoviePolygonFrame | undefined = released.get(cue.bone);
      if (origin === undefined || released.size !== subtree.length)
        throw new Error(`Incomplete polygon release pose: ${cue.bone}`);
      prepared = {
        ...timing,
        kind: cue.kind,
        pivot: origin.position,
        released,
        translation,
      };
    } else {
      throw new Error("Unsupported polygon cue kind");
    }
    for (const bone of subtree) cuesByBone.set(bone, prepared);
  }

  return (seconds: number): AutoMoviePolygonPose => {
    const pose: AutoMoviePolygonPose = poseAt(seconds);
    if (seconds < firstCue) return pose;
    const live: Map<string, IAutoMovieHumanBonePlacement> = new Map(
      pose.posed.map(
        (
          placement: IAutoMovieHumanBonePlacement,
        ): [string, IAutoMovieHumanBonePlacement] => [
          placement.bone,
          placement,
        ],
      ),
    );
    const deltas: Map<AutoMoviePreparedPolygonCue, IAutoMoviePolygonFrame> =
      new Map();
    let actor: IAutoMoviePolygonFrame | undefined;
    let inverseActorRotation: Quaternion | undefined;
    return {
      posed: pose.posed.map(
        (
          placement: IAutoMovieHumanBonePlacement,
        ): IAutoMovieHumanBonePlacement => {
          const cue: AutoMoviePreparedPolygonCue | undefined = cuesByBone.get(
            placement.bone,
          );
          if (cue === undefined || seconds < cue.at) return placement;
          const amount: number =
            cue.duration === 0
              ? 1
              : Math.min(1, (seconds - cue.at) / cue.duration);
          if (amount === 0) return placement;

          let delta: IAutoMoviePolygonFrame | undefined = deltas.get(cue);
          if (delta === undefined) {
            const rotation: Quaternion = new Quaternion().slerp(
              cue.rotation,
              amount,
            );
            if (cue.kind === "bend") {
              const joint: IAutoMovieHumanBonePlacement | undefined = live.get(
                cue.bone,
              );
              if (joint === undefined)
                throw new Error(`Missing polygon bend pivot: ${cue.bone}`);
              const frame: IAutoMoviePolygonFrame = boneFrame(joint);

              // Conjugating the local rotation gives the same turn in body
              // coordinates, which the flat descendant placements share.
              rotation
                .premultiply(frame.rotation)
                .multiply(frame.rotation.invert());
              delta = { position: frame.position, rotation };
            } else {
              actor ??= actorFrame(actorFrameAt, seconds);
              inverseActorRotation ??= actor.rotation.clone().invert();
              delta = {
                position: cue.pivot
                  .clone()
                  .addScaledVector(cue.translation, amount),
                rotation,
              };
            }
            deltas.set(cue, delta);
          }

          // Admit the raw placement before a release can replace it.
          let frame: IAutoMoviePolygonFrame = boneFrame(placement);
          if (cue.kind === "bend") {
            frame.position
              .sub(delta.position)
              .applyQuaternion(delta.rotation)
              .add(delta.position);
            frame.rotation.premultiply(delta.rotation);
          } else {
            const release: IAutoMoviePolygonFrame | undefined =
              cue.released.get(placement.bone);
            if (
              release === undefined ||
              actor === undefined ||
              inverseActorRotation === undefined
            )
              throw new Error(
                `Missing polygon release frame: ${placement.bone}`,
              );

            // Existing groups are actor-local. Cancel the live parent frame
            // so the renderer applies it once and reaches the intended world pose.
            frame = {
              position: release.position
                .clone()
                .sub(cue.pivot)
                .applyQuaternion(delta.rotation)
                .add(delta.position)
                .sub(actor.position)
                .applyQuaternion(inverseActorRotation),
              rotation: release.rotation
                .clone()
                .premultiply(delta.rotation)
                .premultiply(inverseActorRotation),
            };
          }
          return {
            bone: placement.bone,
            position: [frame.position.x, frame.position.y, frame.position.z],
            rotation: [
              frame.rotation.x,
              frame.rotation.y,
              frame.rotation.z,
              frame.rotation.w,
            ],
          };
        },
      ),
    };
  };
}

/** A complete evaluated pose in registered Human body coordinates. */
type AutoMoviePolygonPose = Pick<IAutoMovieHumanSkeleton.IOutput, "posed">;

/** One evaluated frame retained or used for rigid placement arithmetic. */
interface IAutoMoviePolygonFrame {
  position: Vector3;
  rotation: Quaternion;
}

/** Shared timing and authored rotation of a prepared visual cue. */
interface IAutoMoviePolygonCueTiming {
  at: number;
  duration: number;
  rotation: Quaternion;
}

/** A live bend or a frozen shot-world release with its authored displacement. */
type AutoMoviePreparedPolygonCue = IAutoMoviePolygonCueTiming &
  (
    | { kind: "bend"; bone: string }
    | {
        kind: "detach";
        pivot: Vector3;
        released: ReadonlyMap<string, IAutoMoviePolygonFrame>;
        translation: Vector3;
      }
  );

/**
 * Admit a finite quaternion with the same squared-norm tolerance as a polygon
 * pose.
 */
function unitRotation(
  x: number,
  y: number,
  z: number,
  w: number,
  label: string,
): Quaternion {
  if (Math.abs(x ** 2 + y ** 2 + z ** 2 + w ** 2 - 1) > 1e-6)
    throw new Error(`Invalid polygon rotation: ${label}`);
  return new Quaternion(x, y, z, w).normalize();
}

/**
 * Copy one source joint frame for arithmetic without mutating the evaluated
 * pose.
 */
function boneFrame(
  placement: IAutoMovieHumanBonePlacement,
): IAutoMoviePolygonFrame {
  if (placement.position.length !== 3 || placement.rotation.length !== 4)
    throw new Error(`Invalid polygon placement: ${placement.bone}`);
  return {
    position: new Vector3(...placement.position),
    rotation: unitRotation(...placement.rotation, placement.bone),
  };
}

/** Read the actor parent frame in shot world or use the fixed identity frame. */
function actorFrame(
  actorFrameAt: AutoMovieHumanPolygon.IPresentation["actorFrameAt"],
  seconds: number,
): IAutoMoviePolygonFrame {
  if (actorFrameAt === undefined)
    return { position: new Vector3(), rotation: new Quaternion() };
  const { position, rotation }: IAutoMovieRigidTransform =
    actorFrameAt(seconds);
  return {
    position: new Vector3(position.x, position.y, position.z),
    rotation: unitRotation(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w,
      "actor frame",
    ),
  };
}
