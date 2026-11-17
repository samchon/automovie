import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanEntryState, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSegment, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieSamplePoseVelocity, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, samplePoseVelocity } from "@automovie/engine";

import { HumanBase } from "../law/HumanBase";
import { humanRig } from "../posture/humanRig";
import { poseBones } from "../posture/poseBones";
import { HumanSegmentPose } from "./HumanSegmentPose";

/**
 * The state a person enters an action from: the displayed pose and its
 * rates at the entry second, the feet, the supports, the base and the holds,
 * read from the action being left (`HumanSegmentPose`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and what it reads from its siblings.
 * @evidence contracts/development/design.md#principled-representation One responsibility of a placed action's evaluation, over the records `HumanSegment` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Split from `HumanSegment` unchanged, so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the sibling owners; nothing is duplicated between them.
 */
export namespace HumanSegmentEntry {
  /**
   * The state a person enters an action from at a second.
   *
   * @param person The person.
   * @param previous Their previous action, if any.
   * @param seconds The entry second.
   * @param blend The inertialization the cut into the action decays over, seconds; absent for an action entered over another.
   * @returns The entry state.
   */
  export function entry(
    person: IAutoMovieMotionHumanSegment.IPerson,
    previous: IAutoMovieMotionHumanSegment.ISegment | undefined,
    seconds: number,
    blend?: number,
  ): IAutoMovieMotionHumanEntryState {
    const body = person.performer.body;
    // The difference interval of every rate read here, seconds.
    const step: number = HumanSegmentPose.STEP;

    // What was displayed up to the entry: the motion it leaves ends here.
    // Its rates are read on the leaving action's fits continued from the
    // entry's (`HumanSegmentPose.continued`), to the tolerance the cut's
    // inertialization asks, the reading the cut's offset takes too; a body
    // with no previous action, or one entered over it, reads its samples as
    // shown.
    const read: HumanSegmentPose.IContinued =
      previous !== undefined && blend !== undefined
        ? left(person, previous, seconds, blend)
        : shown(person, previous, seconds, step);
    const state: IAutoMovieSamplePoseVelocity.IState = read.state;
    const posture: IAutoMovieMotionHumanPosture =
      previous === undefined
        ? person.initial
        : HumanSegmentPose.layered(
            person,
            previous.plan.posture(
              Math.min(
                previous.plan.duration,
                Math.max(0, seconds - previous.start),
              ),
            ),
            seconds,
          );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      state.pose,
    );
    const planted = (part: "leftFoot" | "rightFoot"): boolean => {
      if (previous === undefined) return true;
      const u: number = Math.min(
        1,
        Math.max(0, (seconds - previous.start) / previous.plan.duration),
      );
      return previous.plan.contacts.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === part &&
          (c.kind === "plant" || c.kind === "pivot") &&
          u >= c.from - 1e-9 &&
          u <= c.to + 1e-9,
      );
    };
    // The same three samples the pose velocity was read from, so a foot's
    // rate is the one-sided difference of the motion that ends here.
    const [instant, near, far] = read.samples.map(
      (
        pose: IAutoMoviePose,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        poseBones(body, pose),
    ) as [
      Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ];
    const foot = (side: "left" | "right"): IAutoMovieMotionHumanEntryState.IFoot => {
      const here: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const from: IAutoMovieResolvedBone = instant.get(`${side}Foot`)!;
      const a: IAutoMovieResolvedBone = near.get(`${side}Foot`)!;
      const b: IAutoMovieResolvedBone = far.get(`${side}Foot`)!;
      const rate = (x: number, y: number, z: number): number =>
        (3 * x - 4 * y + z) / (2 * step);
      const bend = (x: number, y: number, z: number): number =>
        (x - 2 * y + z) / (step * step);
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(
        from.worldRotation,
      );
      const turn = (bone: IAutoMovieResolvedBone): IAutoMovieVector3 =>
        samplePoseVelocity.rotationVector(
          Quaternion.multiply(bone.worldRotation, inverse),
        );
      const ar: IAutoMovieVector3 = turn(a);
      const br: IAutoMovieVector3 = turn(b);
      return {
        ankle: here.worldPosition,
        rotation: here.worldRotation,
        planted: planted(`${side}Foot`),
        velocity: {
          x: rate(from.worldPosition.x, a.worldPosition.x, b.worldPosition.x),
          y: rate(from.worldPosition.y, a.worldPosition.y, b.worldPosition.y),
          z: rate(from.worldPosition.z, a.worldPosition.z, b.worldPosition.z),
        },
        acceleration: {
          x: bend(from.worldPosition.x, a.worldPosition.x, b.worldPosition.x),
          y: bend(from.worldPosition.y, a.worldPosition.y, b.worldPosition.y),
          z: bend(from.worldPosition.z, a.worldPosition.z, b.worldPosition.z),
        },
        spin: {
          x: rate(0, ar.x, br.x),
          y: rate(0, ar.y, br.y),
          z: rate(0, ar.z, br.z),
        },
      };
    };
    // The root's acceleration by the one-sided second difference of the same
    // three samples; a body with no previous action stands at rest.
    const [p0, p1, p2] = read.samples.map(
      (pose: IAutoMoviePose): IAutoMovieVector3 =>
        pose.root?.translation ?? { x: 0, y: 0, z: 0 },
    ) as [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3];
    const second = (x: number, y: number, z: number): number =>
      (x - 2 * y + z) / (step * step);
    return {
      seconds,
      pose: state.pose,
      velocity: state.velocity,
      acceleration:
        previous === undefined
          ? { x: 0, y: 0, z: 0 }
          : {
              x: second(p0.x, p1.x, p2.x),
              y: second(p0.y, p1.y, p2.y),
              z: second(p0.z, p1.z, p2.z),
            },
      posture,
      feet: { left: foot("left"), right: foot("right") },
      supports: supports(previous, seconds),
      base:
        previous === undefined
          ? { kind: "standing" }
          : HumanBase.after({
              declared: previous.plan.base,
              entered: previous.context.entry.base,
              supports: supports(previous, seconds),
              share: (seconds - previous.start) / previous.plan.duration,
            }),
      holds: Object.fromEntries(
        person.holds
          .filter(
            (h: IAutoMovieMotionHumanSegment.IHeld): boolean =>
              h.from <= seconds && seconds < h.until,
          )
          .map((h: IAutoMovieMotionHumanSegment.IHeld): ["left" | "right", string] => [
            h.side,
            h.prop,
          ]),
      ),
      ...(previous === undefined
        ? {}
        : {
            from: {
              name: previous.name,
              family: previous.law.family ?? previous.name,
              params: previous.params,
              plan: previous.plan,
              start: previous.start,
              share: Math.min(
                1,
                Math.max(
                  0,
                  (seconds - previous.start) / previous.plan.duration,
                ),
              ),
            },
          }),
    };
  }

  /**
   * What the body rests on as an action is left at a second: the supports
   * its plan declares open there, a grip and a strike aside; both feet on
   * the ground before any action.
   *
   * @param previous The action left, if any.
   * @param seconds The film second.
   * @returns The supports.
   */
  export function supports(
    previous: IAutoMovieMotionHumanSegment.ISegment | undefined,
    seconds: number,
  ): IAutoMovieMotionHumanEntryState.ISupport[] {
    if (previous === undefined)
      return (["leftFoot", "rightFoot"] as const).map(
        (part: "leftFoot" | "rightFoot"): IAutoMovieMotionHumanEntryState.ISupport => ({
          part,
          kind: "plant",
          support: { kind: "ground" },
        }),
      );
    const u: number = Math.min(
      1,
      Math.max(0, (seconds - previous.start) / previous.plan.duration),
    );
    return previous.plan.contacts
      .filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.kind !== "grip" &&
          c.kind !== "strike" &&
          u >= c.from - 1e-9 &&
          u <= c.to + 1e-9,
      )
      .map(
        (c: IAutoMovieMotionHumanContactWindow): IAutoMovieMotionHumanEntryState.ISupport => ({
          part: c.part,
          kind: c.kind,
          support: c.support,
        }),
      );
  }

  /**
   * The state a body leaves at a second read from its poses as shown, each
   * sample read once: the reading of a body with no previous action, which
   * stands in its initial posture, or of one entered over its action.
   *
   * @param person The person.
   * @param previous Their previous action, if any.
   * @param seconds The second.
   * @param step The difference interval, seconds.
   * @returns The state and the samples it was read from.
   */
  function shown(
    person: IAutoMovieMotionHumanSegment.IPerson,
    previous: IAutoMovieMotionHumanSegment.ISegment | undefined,
    seconds: number,
    step: number,
  ): HumanSegmentPose.IContinued {
    const poses: Map<number, IAutoMoviePose> = new Map();
    const read = (t: number): IAutoMoviePose => {
      let pose: IAutoMoviePose | undefined = poses.get(t);
      if (pose === undefined) {
        pose =
          previous === undefined
            ? HumanSegmentPose.initial(person)
            : HumanSegmentPose.of(person, previous, t);
        poses.set(t, pose);
      }
      return pose;
    };
    const state: IAutoMovieSamplePoseVelocity.IState = samplePoseVelocity(
      read,
      seconds,
      step,
      "before",
      humanRig(person.performer.body),
    );
    return {
      state,
      samples: [read(seconds), read(seconds - step), read(seconds - 2 * step)],
    };
  }

  /**
   * The state a body leaves an action in at a second, its rates read on the
   * action's fits continued from the second's own (`HumanSegmentPose.continued`)
   * to the tolerance an inertialization over `blend` asks.
   *
   * @param person The person.
   * @param previous The action left.
   * @param seconds The second.
   * @param blend The inertialization the state feeds, seconds.
   * @returns The state and the continued samples it was read from.
   */
  function left(
    person: IAutoMovieMotionHumanSegment.IPerson,
    previous: IAutoMovieMotionHumanSegment.ISegment,
    seconds: number,
    blend: number,
  ): HumanSegmentPose.IContinued {
    return HumanSegmentPose.continued(
      (t: number, near?: HumanSegmentPose.INear): HumanSegmentPose.ISeeded =>
        HumanSegmentPose.seeded(person, previous, t, near),
      seconds,
      "before",
      humanRig(person.performer.body),
      blend,
    );
  }
}
