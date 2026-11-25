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

/** The displayed origin of a prop already in flight and its frame at a contact. */
export namespace HumanPropFlightFrame {
  /**
   * Read the displayed world frame at film seconds from an already selected
   * flight.
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
   * Place the contact on the film clock and express the displayed rest relative
   * to what it struck.
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

  /**
   * The world frame of what a flight struck at a second: a bone's, a prop's, or
   * none for the floor.
   */
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
