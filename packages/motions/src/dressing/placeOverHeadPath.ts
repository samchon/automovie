import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { StrikingBody } from "../striking/StrikingBody";

/**
 * How far above the crown the loop's plane passes, metres (provisional: clear
 * of the hair).
 */
const CLEAR: number = 0.06;

/**
 * How far off the chest the loop's front rests beyond the holding hands'
 * clearance (`IProps.clearance`), metres: half a pendant's thickness.
 */
const REST: number = 0.003;

/** How finely the front's fall is searched, degrees. */
const STEP: number = 1;

/** The model's up, along which a loop's normal lies. */
const NORMAL: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The model's forward, from a loop's back toward its front. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * The path of a neck loop set over a partner's head, as frames of the loop,
 * from where the hand holds it to where it is worn.
 *
 * The partner's head is read where it is: the crown, the nape, the throat and
 * the sternum regions on the displayed bones. The neck's axis runs from the
 * middle of the nape and the throat up to the crown; the head's forward is the
 * nape-to-throat direction across it. Five frames, each reached on a
 * minimum-jerk share of its own segment, the segments shared out by the
 * distance their pivot travels: the loop as the hands hold it; level above the
 * crown, `CLEAR` over it, its centre on the neck's axis and its front toward
 * the face; level around the neck, centred on the axis; slid back till its back
 * point lies on the nape; turned about the nape's side-to-side axis until its
 * front rests `REST` off the chest plane at the sternum. The first three
 * segments pivot on the loop's centre, the last two on its back point.
 */
export namespace placeOverHeadPath {
  /** What the path is prepared from. */
  export interface IProps {
    /** The loop's world frame as the hand holds it at entry. */
    start: IAutoMovieRigidTransform;

    /** The loop's back point (`wear`) in its own frame, metres. */
    wear: IAutoMovieVector3;

    /** The loop's front (`front`) in its own frame, metres. */
    front: IAutoMovieVector3;

    /** The loop's centre, the middle of its `opening`, in its own frame, metres. */
    centre: IAutoMovieVector3;

    /** The partner's body. */
    body: IAutoMovieMotionHumanBody;

    /** The partner's displayed bones where the path is read. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * How far off the chest the hands holding the loop's front must stay,
     * metres: the gripping hand's depth below its handle and the audit's skin.
     */
    clearance: number;
  }

  /** The prepared path. */
  export interface IPath {
    /** The loop's frame at a progress in [0, 1]. */
    at: (progress: number) => IAutoMovieRigidTransform;

    /** The frame above the crown, where the hands reach highest. */
    apex: IAutoMovieRigidTransform;

    /** The worn frame. */
    worn: IAutoMovieRigidTransform;

    /** The length the pivots travel, metres. */
    length: number;
  }

  /** One key frame and the loop point it pivots on into the next. */
  interface IKey {
    /** The loop's world frame. */
    frame: IAutoMovieRigidTransform;

    /** The loop point, in its own frame, the segment from this key pivots on. */
    pivot: IAutoMovieVector3;
  }

  /**
   * Prepare the path.
   *
   * @param props The loop and the partner.
   * @returns The path.
   */
  export function prepare(props: IProps): IPath {
    const region = (
      name: AutoMovieHumanoidRegion,
    ): ReturnType<typeof StrikingBody.region> =>
      StrikingBody.region(props.body, props.bones, name);
    const crown: IAutoMovieVector3 = region("crown").point;
    const nape: IAutoMovieVector3 = region("nape").point;
    const throat: IAutoMovieVector3 = region("throat").point;
    const chest: ReturnType<typeof StrikingBody.region> = region("sternum");
    const neck: IAutoMovieVector3 = Vector3.lerp(nape, throat, 0.5);
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(crown, neck),
    );
    const across: IAutoMovieVector3 = Vector3.subtract(throat, nape);
    const forward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(across, Vector3.scale(up, Vector3.dot(across, up))),
    );
    const level: IAutoMovieQuaternion = HumanHand.align(
      { normal: NORMAL, forward: FORWARD },
      { normal: up, forward },
    );
    const placed = (
      rotation: IAutoMovieQuaternion,
      local: IAutoMovieVector3,
      world: IAutoMovieVector3,
    ): IAutoMovieRigidTransform => ({
      position: Vector3.subtract(
        world,
        Quaternion.rotateVector(rotation, local),
      ),
      rotation,
    });

    // The front's fall about the nape's side-to-side axis.
    const side: IAutoMovieVector3 = Quaternion.rotateVector(level, {
      x: 1,
      y: 0,
      z: 0,
    });
    const tilted = (degrees: number): IAutoMovieQuaternion =>
      Quaternion.normalize(
        Quaternion.multiply(Quaternion.fromAxisAngle(side, degrees), level),
      );
    const gap = (degrees: number): number => {
      const frame: IAutoMovieRigidTransform = placed(
        tilted(degrees),
        props.wear,
        nape,
      );
      const front: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, props.front),
      );
      return (
        Vector3.dot(Vector3.subtract(front, chest.point), chest.normal) -
        REST -
        props.clearance
      );
    };
    // The hands hold the front until the loop is worn, so its front comes no
    // nearer the chest than they can: a loop whose front is already within
    // that clearance when level cannot be lowered onto the chest by hand.
    if (gap(0) <= 0)
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: gap(0) + REST + props.clearance,
        feasible: {
          kind: "range",
          minimum: REST + props.clearance,
          maximum: null,
          unit: "m",
        },
        reason: `the loop's front, held level at the nape, lies within the holding hands' clearance of ${(1000 * (REST + props.clearance)).toFixed(0)} mm off the partner's chest`,
        fix: "use a loop whose front hangs farther from the nape",
      });
    let fall: number = 90;
    for (let d: number = 0; d <= 90; d += STEP)
      if (gap(d) <= 0) {
        let lo: number = Math.max(0, d - STEP);
        let hi: number = d;
        for (let i: number = 0; i < 40; ++i) {
          const mid: number = (lo + hi) / 2;
          if (gap(mid) > 0) lo = mid;
          else hi = mid;
        }
        fall = lo;
        break;
      }
    const keys: readonly IKey[] = [
      { frame: props.start, pivot: props.centre },
      {
        frame: placed(
          level,
          props.centre,
          Vector3.add(crown, Vector3.scale(up, CLEAR)),
        ),
        pivot: props.centre,
      },
      { frame: placed(level, props.centre, neck), pivot: props.wear },
      { frame: placed(level, props.wear, nape), pivot: props.wear },
      { frame: placed(tilted(fall), props.wear, nape), pivot: props.wear },
    ];

    // Each segment's length: the distance its pivot travels.
    const lengths: number[] = keys
      .slice(0, -1)
      .map((key: IKey, i: number): number =>
        Math.max(
          1e-6,
          Vector3.distance(
            pivotOf(key.frame, key.pivot),
            pivotOf(keys[i + 1]!.frame, key.pivot),
          ),
        ),
      );
    const total: number = lengths.reduce(
      (a: number, b: number): number => a + b,
      0,
    );
    return {
      apex: keys[1]!.frame,
      worn: keys[4]!.frame,
      length: total,
      at: (progress: number): IAutoMovieRigidTransform => {
        let left: number = Math.min(1, Math.max(0, progress)) * total;
        for (let i: number = 0; i < lengths.length; ++i) {
          if (left <= lengths[i]! || i === lengths.length - 1) {
            const s: number = minimumJerk.share(
              Math.min(1, left / lengths[i]!),
            );
            const a: IKey = keys[i]!;
            const b: IKey = keys[i + 1]!;
            const rotation: IAutoMovieQuaternion = Quaternion.slerp(
              a.frame.rotation,
              b.frame.rotation,
              s,
            );
            const pivot: IAutoMovieVector3 = Vector3.lerp(
              pivotOf(a.frame, a.pivot),
              pivotOf(b.frame, a.pivot),
              s,
            );
            return placed(rotation, a.pivot, pivot);
          }
          left -= lengths[i]!;
        }
        return keys[4]!.frame;
      },
    };
  }
}

/** A loop point's world place on a frame. */
function pivotOf(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
}
