import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeFrame,
  ArchetypeRefusal,
  type ArchetypeRide,
} from "../core";
import { EquineLiberty } from "./EquineLiberty";
import type { EquineLibertyCue } from "./EquineLibertyCue";
import { QuadrupedLateralRest } from "./QuadrupedLateralRest";
import type { QuadrupedLateralRestPlan } from "./QuadrupedLateralRestPlan";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

/** The fastest a trained fall is staged from, metres per second: an authored bound at a slow gallop. */
const FALL_SPEED: number = 9;

/** A named instant of a ride. */
type Instant = ArchetypeRide.IRide<string, string>["instants"][number];

/**
 * A trained fall from a canter or gallop onto prepared ground: the horse goes down on one side, slides to a stop, lies still and rises.
 *
 * At the fall's start the horse is in its stride at speed v. It decelerates uniformly over the authored slide distance d, so it stops after 2d / v seconds, its travel s(τ) = vτ − v²τ² / 4d along its heading. Through the authored drop its every part blends, on a minimum-jerk share, from the stride's pose at the fall's start to the lateral rest's lying pose (`QuadrupedLateralRest`) on the landing side, both carried along the slide; the blended body is held on the floor by its lowest part, so nothing passes under it, and once down it slides lying. From the stop it plays the lateral rest on from its lying pose: the still hold, the roll back to the sternum and the rise to standing. The ground must be declared prepared and the speed at most `FALL_SPEED` (American Humane, horse guidelines for filmed media).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the deceleration, the blend, the floor support, the lateral rest that follows and the refusals.
 * @evidence contracts/development/design.md#principled-representation A ride in and a ride out on the same clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tripping device and no simulation: the slide is a closed-form deceleration and the rest is the shared one.
 */
export namespace EquineFall {
  /**
   * Stage a fall over a horse's ride.
   *
   * @param animal The equid at rest, as its producer built it.
   * @param ride Its ride, moving at the fall's start.
   * @param cue The fall.
   * @returns The ride up to the fall, then the fall, the lying hold and the rise.
   * @throws {ArchetypeRefusal} For unprepared ground, a fall started at a halt, outside the ride or above `FALL_SPEED`, or a drop or slide that is not finite and positive or a drop longer than the slide's time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the output and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Admit the cue, build the lateral rest at the stop, then per sample play the ride, the blended drop with the slide, or the rest from its lying pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, one clip, a three-phase sampler.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refusals are typed; the floor support raises the body by its lowest part only.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(P + A) per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shared lateral rest and floor reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the ride and the clip.
   */
  export function after<Id extends string, D extends string>(
    animal: Archetype<Id, D>,
    ride: ArchetypeRide.IRide<Id, D>,
    cue: EquineLibertyCue.IFall,
  ): ArchetypeRide.IRide<Id, D> {
    const refuse = (axis: string, value: unknown, reason: string): never => {
      throw new ArchetypeRefusal({
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
    if (!(Number.isFinite(cue.slide) && cue.slide > 0))
      refuse("slide", cue.slide, "a fall slides a positive distance");
    const stop: number = (2 * cue.slide) / speed;
    if (!(Number.isFinite(cue.drop) && cue.drop > 0 && cue.drop <= stop))
      refuse(
        "drop",
        cue.drop,
        `a fall's drop is positive and within its slide's ${stop} s`,
      );

    const start: ArchetypeRide.ISample<Id, D> = ride.at(cue.from);
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
    const clip: QuadrupedLateralRestPlan.IClip<Id, D> = QuadrupedLateralRest(
      animal,
      EquineLiberty.rested(animal, ground, cue.rest),
      cue.lateral,
    );
    const down: number = clip.events.lateralOn;
    const lying: QuadrupedLateralRestPlan.ISample<Id, D> = clip.sample(down);
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

    const at = (seconds: number): ArchetypeRide.ISample<Id, D> => {
      if (seconds < cue.from) return ride.at(seconds);
      const course: ArchetypeRide.ISample<Id, D>["course"] = ride.plan.at(
        Math.min(seconds, ride.duration),
      );
      if (seconds >= cue.from + stop) {
        const shown: QuadrupedLateralRestPlan.ISample<Id, D> = clip.sample(
          Math.min(clip.duration, down + seconds - cue.from - stop),
        );
        return {
          archetype: shown.animal,
          placement: ArchetypeFrame.compose(
            slid(ground, seconds),
            shown.placement,
          ),
          course,
        };
      }
      const flat: IAutoMovieTransform = ArchetypeFrame.compose(
        slid(ground, seconds),
        lying.placement,
      );
      const share: number = minimumJerk.share(
        Math.min(1, (seconds - cue.from) / cue.drop),
      );
      if (share >= 1)
        return { archetype: lying.animal, placement: flat, course };
      return {
        archetype: blended(
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
      duration: cue.from + stop + clip.duration - down,
      instants,
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: ArchetypeRide.ISample<Id, D> = at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /** The body between two posed models at their placements, read in the second's placement and held on the floor by its lowest part. */
  function blended<Id extends string, D extends string>(
    from: Archetype<Id, D>,
    fromPlacement: IAutoMovieTransform,
    to: Archetype<Id, D>,
    toPlacement: IAutoMovieTransform,
    share: number,
  ): Archetype<Id, D> {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      toPlacement.rotation,
    );
    const local = (frame: IAutoMovieTransform): IAutoMovieTransform => ({
      ...frame,
      rotation: Quaternion.multiply(inverse, frame.rotation),
      translation: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(frame.translation, toPlacement.translation),
      ),
    });
    const mix = (
      a: IAutoMovieTransform,
      b: IAutoMovieTransform,
    ): IAutoMovieTransform =>
      local({
        ...b,
        rotation: Quaternion.slerp(a.rotation, b.rotation, share),
        translation: Vector3.lerp(a.translation, b.translation, share),
      });
    const source: ReadonlyMap<string, IAutoMovieModelPart> = new Map(
      from.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    let parts: IAutoMovieModelPart[] = to.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const was: IAutoMovieModelPart | undefined = source.get(part.id);
        if (
          was?.transform === undefined ||
          was.transform === null ||
          part.transform === undefined ||
          part.transform === null
        )
          return part;
        return {
          ...part,
          transform: mix(
            ArchetypeFrame.compose(fromPlacement, was.transform),
            ArchetypeFrame.compose(toPlacement, part.transform),
          ),
        };
      },
    );

    // Hold the blended body on the floor by its lowest part.
    const lowest: number = Math.min(
      ...parts
        .filter(
          (part: IAutoMovieModelPart): boolean =>
            part.transform !== undefined && part.transform !== null,
        )
        .map((part: IAutoMovieModelPart): number =>
          QuadrupedRestFloor({
            ...part,
            transform: ArchetypeFrame.compose(toPlacement, part.transform!),
          }),
        ),
    );
    const lift: IAutoMovieVector3 = Quaternion.rotateVector(inverse, {
      x: 0,
      y: Math.max(0, -lowest),
      z: 0,
    });
    parts = parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart =>
        part.transform === undefined || part.transform === null
          ? part
          : {
              ...part,
              transform: {
                ...part.transform,
                translation: Vector3.add(part.transform.translation, lift),
              },
            },
    );
    const contacts: ReadonlyMap<string, IAutoMovieTransform> = new Map(
      from.affordances.map(
        (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => [
          contact.id,
          contact.frame,
        ],
      ),
    );
    return to.reposed(
      parts,
      new Map(
        to.affordances.map(
          (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => {
            const was: IAutoMovieTransform =
              contacts.get(contact.id) ?? contact.frame;
            const frame: IAutoMovieTransform = mix(
              ArchetypeFrame.compose(fromPlacement, was),
              ArchetypeFrame.compose(toPlacement, contact.frame),
            );
            return [
              contact.id,
              {
                ...frame,
                translation: Vector3.add(frame.translation, lift),
              },
            ];
          },
        ),
      ),
    );
  }

  /** The turn about the vertical that carries +Z onto a rotation's forward direction on the floor. */
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
