import {
  Quaternion,
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import { AutoMovieArchetypeEquineLiberty } from "./AutoMovieArchetypeEquineLiberty";
import type { AutoMovieArchetypeEquineLibertyCue } from "./AutoMovieArchetypeEquineLibertyCue";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedLateralRest } from "./AutoMovieArchetypeQuadrupedLateralRest";
import type { AutoMovieArchetypeQuadrupedLateralRestPlan } from "./AutoMovieArchetypeQuadrupedLateralRestPlan";
import { EquineBlend } from "./equine/EquineBlend";
import { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * The fastest a trained fall is staged from, metres per second: an authored
 * bound at a canter or slow gallop.
 */
const FALL_SPEED: number = 7;

/**
 * A trained fall from a canter or gallop onto prepared ground: the horse goes
 * down on one side, slides to a stop, lies still and rises.
 *
 * At the fall's start the horse is in its stride at speed v. It decelerates
 * uniformly over the authored slide distance d, so it stops after 2d / v
 * seconds, its travel s(τ) = vτ − v²τ² / 4d along its heading. Through the
 * authored drop its every part blends, on a minimum-jerk share, from the
 * stride's pose at the fall's start to the lateral rest's lying pose
 * (`AutoMovieArchetypeQuadrupedLateralRest`) on the landing side, both carried
 * along the slide; the blended body is held on the floor by its lowest part, so
 * nothing passes under it, and once down it slides lying. From the stop it
 * plays the lateral rest on from its lying pose: the still hold, the roll back
 * to the sternum and the rise to standing; it then may walk off from where it
 * stood up, its first steps a ride from standing along its heading. The ground
 * must be declared prepared and the speed at most `FALL_SPEED` (American
 * Humane, horse guidelines for filmed media).
 */
export namespace AutoMovieArchetypeEquineFall {
  /**
   * Stage a fall over a horse's ride.
   *
   * @param animal The equid at rest, as its producer built it.
   * @param ride Its ride, moving at the fall's start.
   * @param cue The fall.
   * @returns The ride up to the fall, then the fall, the lying hold and the
   *   rise.
   * @throws {AutoMovieArchetypeRefusal} For unprepared ground, a fall started
   *   at a halt, outside the ride or above `FALL_SPEED`, or a drop or slide
   *   that is not finite and positive or a drop longer than the slide's time.
   */
  export function after<Id extends string, D extends string>(
    animal: AutoMovieArchetype<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    ride: AutoMovieArchetypeRide.IRide<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    cue: AutoMovieArchetypeEquineLibertyCue.IFall,
  ): AutoMovieArchetypeRide.IRide<
    Id,
    D | AutoMovieArchetypeQuadrupedBody.Dimension
  > {
    /** The source dimensions with the quadruped size the ride solves. */
    type Dimension = D | AutoMovieArchetypeQuadrupedBody.Dimension;
    const refuse = (axis: string, value: unknown, reason: string): never => {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: animal.archetype,
        axis,
        value,
        feasible: null,
        reason,
        fix: "Stage a fall from a canter or gallop no faster than the bound, onto ground marked prepared, with a positive drop within the slide's time.",
      });
    };
    if (cue.prepared !== true)
      refuse(
        "surface",
        cue.prepared,
        "a fall goes only onto ground marked prepared",
      );
    if (!(cue.from >= 0 && cue.from < ride.duration))
      refuse("from", cue.from, "a fall starts within the ride");
    const speed: number = ride.plan.at(cue.from).speed;
    if (!(speed > 0 && speed <= FALL_SPEED))
      refuse(
        "speed",
        speed,
        `a fall starts from a moving horse no faster than ${FALL_SPEED} m/s`,
      );
    if (!(cue.slide > 0))
      refuse("slide", cue.slide, "a fall slides a positive distance");
    const stop: number = (2 * cue.slide) / speed;
    if (!(cue.drop > 0 && cue.drop <= stop))
      refuse(
        "drop",
        cue.drop,
        `a fall's drop is positive and within its slide's ${stop} s`,
      );

    const start: AutoMovieArchetypeRide.ISample<Id, Dimension> = ride.at(
      cue.from,
    );
    const heading: IAutoMovieQuaternion = yaw(start.placement.rotation);
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
      x: 0,
      y: 0,
      z: 1,
    });
    const ground: IAutoMovieTransform = {
      ...start.placement,
      rotation: heading,
      translation: { ...start.placement.translation, y: 0 },
    };
    const clip: AutoMovieArchetypeQuadrupedLateralRestPlan.IClip<
      Id,
      Dimension
    > = AutoMovieArchetypeQuadrupedLateralRest.plan(
      animal,
      AutoMovieArchetypeEquineLiberty.rested(animal, ground, cue.rest),
      cue.lateral,
    );
    const down: number = clip.events.lateralOn;
    const lying: AutoMovieArchetypeQuadrupedLateralRestPlan.ISample<
      Id,
      Dimension
    > = clip.sample(down);
    const travel = (seconds: number): number => {
      const tau: number = Math.min(stop, seconds - cue.from);
      return speed * tau - (speed * speed * tau * tau) / (4 * cue.slide);
    };
    const slid = (
      frame: IAutoMovieTransform,
      seconds: number,
    ): IAutoMovieTransform => ({
      ...frame,
      translation: Vector3.addScaled(
        frame.translation,
        forward,
        travel(seconds),
      ),
    });

    // Once standing it may walk off from where it rose, along its heading.
    const risen: number = cue.from + stop + clip.duration - down;
    const stand: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
      slid(ground, risen),
      clip.sample(clip.duration).placement,
    ).translation;
    const away: AutoMovieArchetypeRide.IRide<Id, Dimension> | undefined =
      cue.away === undefined
        ? undefined
        : AutoMovieArchetypeQuadruped.ride(
            animal,
            {
              start: {
                x: stand.x,
                z: stand.z,
                heading: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
              },
              cruise: cue.away.speed,
              startSpeed: 0,
              endSpeed: 0,
              acceleration: 1,
              deceleration: 1,
              startFromStanding: true,
              legs: [{ kind: "straight", length: cue.away.length }],
            },
            "walk",
          );

    const at = (
      seconds: number,
    ): AutoMovieArchetypeRide.ISample<Id, Dimension> => {
      if (seconds < cue.from) return ride.at(seconds);
      if (away !== undefined && seconds >= risen)
        return away.at(seconds - risen);
      const course: AutoMovieArchetypeRide.ISample<Id, Dimension>["course"] =
        ride.plan.at(Math.min(seconds, ride.duration));
      if (seconds >= cue.from + stop) {
        const shown: AutoMovieArchetypeQuadrupedLateralRestPlan.ISample<
          Id,
          Dimension
        > = clip.sample(
          Math.min(clip.duration, down + seconds - cue.from - stop),
        );
        return {
          archetype: shown.animal,
          placement: AutoMovieArchetypeFrame.compose(
            slid(ground, seconds),
            shown.placement,
          ),
          course,
        };
      }
      const flat: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
        slid(ground, seconds),
        lying.placement,
      );
      const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(1, (seconds - cue.from) / cue.drop),
      );
      if (share >= 1)
        return { archetype: lying.animal, placement: flat, course };
      return {
        archetype: EquineBlend(
          start.archetype,
          slid(start.placement, seconds),
          lying.animal,
          flat,
          share,
        ),
        placement: flat,
        course,
      };
    };
    const instants: Instant[] = [
      ...ride.instants.filter(
        (instant: Instant): boolean => instant.seconds < cue.from,
      ),
      { seconds: cue.from, label: "fall:start" },
      { seconds: cue.from + cue.drop, label: "fall:down" },
      { seconds: cue.from + stop, label: "fall:stop" },
      ...Object.entries(clip.events)
        .filter(([, seconds]: [string, number]): boolean => seconds > down)
        .map(
          ([label, seconds]: [string, number]): Instant => ({
            label: `rest:${label}`,
            seconds: cue.from + stop + seconds - down,
          }),
        ),
    ].sort((p: Instant, q: Instant): number => p.seconds - q.seconds);
    return {
      plan: ride.plan,
      duration: risen + (away?.duration ?? 0),
      instants: [
        ...instants,
        ...(away?.instants ?? []).map(
          (instant: Instant): Instant => ({
            ...instant,
            seconds: instant.seconds + risen,
          }),
        ),
      ],
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, Dimension> =
          at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /**
   * The turn about the vertical that carries +Z onto a rotation's forward
   * direction on the floor.
   */
  function yaw(rotation: IAutoMovieQuaternion): IAutoMovieQuaternion {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
    );
  }
}

/** A named instant of a ride. */
type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];
