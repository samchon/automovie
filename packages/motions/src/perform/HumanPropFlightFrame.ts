import { Quaternion, Vector3, projectileAt } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieMotionPropLaunch,
  IAutoMovieProjectile,
  IAutoMovieProjectileState,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropFrame } from "./HumanPropFrame";
import { HumanPropOutcome } from "./HumanPropOutcome";

/**
 * The displayed origin of a prop already in flight and its frame at a contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Samples a flight or realized contact on the film clock.
 * @evidence contracts/development/design.md#principled-representation Converts the physical projectile centre to the displayed origin and keeps a resting prop relative to the carrier it struck.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shares frame and contact projection between playback and catch admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the placed engine flight and contact outcome through their owners.
 */
export namespace HumanPropFlightFrame {
  /**
   * Read the displayed world frame at film seconds from an already selected flight.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the selected flight, film clock and displayed frame.
   * @evidence contracts/development/implementation.md#principled-implementation Samples the engine trajectory before contact, the realized continuation after contact, or the settled frame on the struck carrier.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Projects the displayed origin after choosing the flight or continuation sample.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Respects recorded contact times and keeps the display offset for extended shapes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Traverses only the chosen flight's continuation legs and demands the struck carrier frame only when settled.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Samples the already-built trajectory without collision searches or a second trajectory.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows existing flight data and keeps no query cache.
   */
  export function sample(
    self: IAutoMovieMotionHumanPerformanceState,
    latest: IAutoMovieMotionHumanPropFlight.IFlight,
    seconds: number,
  ): IAutoMovieRigidTransform {
    if (seconds < latest.end) {
      const state: IAutoMovieProjectileState = projectileAt(
        latest.projectile,
        seconds - latest.launch,
      );
      return originFrame(
        latest.published.sphere,
        state.position,
        state.rotation!,
      );
    }

    // After the first contact: the leg running at that second, or the
    // contact the last one ended at.
    let contact: IAutoMovieMotionHumanPropFlight.IContact = latest.contact!;
    const t: number = seconds - latest.launch;
    for (const leg of latest.legs ?? []) {
      if (t < leg.from) break;
      if (t < leg.end) {
        const state: IAutoMovieProjectileState = HumanPropOutcome.at(leg, t);
        return originFrame(
          latest.published.sphere,
          state.position,
          state.rotation ?? contact.offset.rotation,
        );
      }
      contact = leg.contact!;
    }
    const carrier: IAutoMovieRigidTransform | undefined = struckFrame(
      self,
      contact.struck,
      seconds,
    );
    return carrier === undefined
      ? contact.offset
      : HumanPropFrame.compose(carrier, contact.offset);
  }

  /** Convert a projectile's centre back to the displayed prop origin. */
  function originFrame(
    sphere: IAutoMovieMotionPropLaunch["sphere"],
    position: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieRigidTransform {
    return {
      position:
        sphere === undefined
          ? position
          : Vector3.subtract(
              position,
              Quaternion.rotateVector(rotation, sphere.centre),
            ),
      rotation,
    };
  }

  /**
   * Place the contact on the film clock and express the displayed rest relative to what it struck.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines contact geometry, its recorded flight velocity, physical outcome and carrier-relative rest.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the engine state at the hit, uses the launch's collision radius for the outcome, and projects physical centre and settled embedding into the displayed frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The outcome owner decides contact physics, and the frame owner applies the borrowed carrier transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Leaves the engine hit point and velocity as observed and records embedding only where the body's data grants it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads only the meeting, its outcome and the target frame. An explicit sphere supplies its radius without projecting model shapes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the displayed-origin projection with flight sampling.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only contact observations and the new rest transform.
   */
  export function contactOf(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    meeting: IAutoMovieMotionHumanPropOutcome.IMeeting,
    projectile: IAutoMovieProjectile,
    zero: number,
    sphere: IAutoMovieMotionPropLaunch["sphere"],
  ): IAutoMovieMotionHumanPropFlight.IContact {
    const state: IAutoMovieProjectileState = projectileAt(
      projectile,
      meeting.hit.time,
    );
    const at: number = zero + meeting.hit.time;
    const world: IAutoMovieRigidTransform = originFrame(
      sphere,
      HumanPropOutcome.rest(prop, meeting.struck, state, sphere?.radius),
      state.rotation!,
    );
    const carrier: IAutoMovieRigidTransform | undefined = struckFrame(
      self,
      meeting.struck,
      at,
    );
    return {
      struck: meeting.struck,
      point: meeting.hit.point,
      normal: meeting.hit.normal!,
      velocity: state.velocity,
      offset:
        carrier === undefined ? world : HumanPropFrame.relative(carrier, world),
      outcome:
        HumanPropOutcome.decide(prop, meeting.struck, sphere?.radius)?.kind ??
        "stick",
    };
  }

  /** The world frame of what a flight struck at a second: a bone's, a prop's, or none for the floor. */
  function struckFrame(
    self: IAutoMovieMotionHumanPerformanceState,
    struck: IAutoMovieMotionHumanPropFlight.Struck,
    seconds: number,
  ): IAutoMovieRigidTransform | undefined {
    switch (struck.kind) {
      case "person":
        return HumanPropFrame.bone(
          HumanPerformanceRead.bones(self, struck.subject, seconds).get(
            struck.bone,
          )!,
        );
      case "prop":
        return HumanPerformanceRead.prop(self, struck.subject, seconds);
      case "ground":
        return undefined;
    }
  }
}
