import {
  type IAutoMovieResolvedBone,
  Quaternion,
  samplePoseVelocity,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBase } from "../law/HumanBase";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { humanRig } from "../posture/humanRig";
import { poseBones } from "../posture/poseBones";
import type { HumanSegment } from "./HumanSegment";
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
   * @returns The entry state.
   */
  export function entry(
    person: HumanSegment.IPerson,
    previous: HumanSegment.ISegment | undefined,
    seconds: number,
  ): IHumanEntryState {
    const body = person.performer.body;
    // The difference interval of every rate read here, seconds.
    const step: number = 1e-3;
    const poses: Map<number, IAutoMoviePose> = new Map();
    const shown = (t: number): IAutoMoviePose => {
      let pose: IAutoMoviePose | undefined = poses.get(t);
      if (pose === undefined) {
        pose =
          previous === undefined ? HumanSegmentPose.initial(person) : HumanSegmentPose.of(person, previous, t);
        poses.set(t, pose);
      }
      return pose;
    };
    // What was displayed up to the entry: the motion it leaves ends here.
    const state: samplePoseVelocity.IState = samplePoseVelocity(
      shown,
      seconds,
      step,
      "before",
      humanRig(body),
    );
    const posture: IHumanPosture =
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
        (c: IHumanContactWindow): boolean =>
          c.part === part &&
          (c.kind === "plant" || c.kind === "pivot") &&
          u >= c.from - 1e-9 &&
          u <= c.to + 1e-9,
      );
    };
    // The same two earlier samples the pose velocity was read from, so a
    // foot's rate is the one-sided difference of the motion that ends here.
    const near: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      shown(seconds - step),
    );
    const far: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      shown(seconds - 2 * step),
    );
    const foot = (side: "left" | "right"): IHumanEntryState.IFoot => {
      const here: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const a: IAutoMovieResolvedBone = near.get(`${side}Foot`)!;
      const b: IAutoMovieResolvedBone = far.get(`${side}Foot`)!;
      const rate = (x: number, y: number, z: number): number =>
        (3 * x - 4 * y + z) / (2 * step);
      const bend = (x: number, y: number, z: number): number =>
        (x - 2 * y + z) / (step * step);
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(
        here.worldRotation,
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
          x: rate(here.worldPosition.x, a.worldPosition.x, b.worldPosition.x),
          y: rate(here.worldPosition.y, a.worldPosition.y, b.worldPosition.y),
          z: rate(here.worldPosition.z, a.worldPosition.z, b.worldPosition.z),
        },
        acceleration: {
          x: bend(here.worldPosition.x, a.worldPosition.x, b.worldPosition.x),
          y: bend(here.worldPosition.y, a.worldPosition.y, b.worldPosition.y),
          z: bend(here.worldPosition.z, a.worldPosition.z, b.worldPosition.z),
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
    const place = (t: number): IAutoMovieVector3 =>
      shown(t).root?.translation ?? { x: 0, y: 0, z: 0 };
    const p0: IAutoMovieVector3 = state.pose.root?.translation ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    const p1: IAutoMovieVector3 = place(seconds - step);
    const p2: IAutoMovieVector3 = place(seconds - 2 * step);
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
            (h: HumanSegment.IHeld): boolean => h.from <= seconds && seconds < h.until,
          )
          .map((h: HumanSegment.IHeld): ["left" | "right", string] => [h.side, h.prop]),
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
    previous: HumanSegment.ISegment | undefined,
    seconds: number,
  ): IHumanEntryState.ISupport[] {
    if (previous === undefined)
      return (["leftFoot", "rightFoot"] as const).map(
        (part: "leftFoot" | "rightFoot"): IHumanEntryState.ISupport => ({
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
        (c: IHumanContactWindow): boolean =>
          c.kind !== "grip" &&
          c.kind !== "strike" &&
          u >= c.from - 1e-9 &&
          u <= c.to + 1e-9,
      )
      .map(
        (c: IHumanContactWindow): IHumanEntryState.ISupport => ({
          part: c.part,
          kind: c.kind,
          support: c.support,
        }),
      );
  }
}
