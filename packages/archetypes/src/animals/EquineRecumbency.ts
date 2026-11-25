import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
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
import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import { EquineBlend } from "./EquineBlend";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

/** A named instant of a ride. */
type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];

/**
 * Lateral recumbency with the limbs extended, as a mare lies during the
 * expulsion of a foal (MSD Veterinary Manual, parturition in horses), and the
 * rise from it.
 *
 * The lying pose is the halted body itself turned a quarter about its long axis
 * through its trunk's centre onto the given side, every joint kept as it stood
 * so all four limbs lie extended, and set down so its lowest part rests on the
 * floor. The horse goes down into it over the authored seconds by blending its
 * halted pose into the lying one on a minimum-jerk share, held on the floor by
 * its lowest part (`EquineBlend`), holds still, and rises back by the reverse
 * blend. The lower limbs, which stand out a little from the barrel's side, bear
 * with the flank.
 */
export namespace EquineRecumbency {
  /** When and onto which side the horse lies. */
  export interface ICue {
    /** Film second it starts going down, halted. */
    from: number;

    /** The side it lies on. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;

    /** Seconds to go down and, again, to rise. */
    down: number;

    /** Seconds it lies still. */
    hold: number;
  }

  /**
   * Lie a halted horse on its side with its limbs extended, then raise it.
   *
   * @param animal The equid at rest, as its producer built it.
   * @param ride Its ride, halted where it lies.
   * @param cue When and how.
   * @returns The ride with the recumbency over its halt.
   * @throws {AutoMovieArchetypeRefusal} For a start before the halt or a
   *   transition or hold that is not finite and positive (the hold may be
   *   zero).
   */
  export function after<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    cue: ICue,
  ): AutoMovieArchetypeRide.IRide<Id, D> {
    if (!(cue.from >= ride.duration) || !(cue.down > 0) || !(cue.hold >= 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: animal.archetype,
        axis: "from",
        value: cue.from,
        feasible: null,
        reason: `a recumbency starts once the horse has halted, at ${ride.duration} s, with a positive transition and a hold of zero or more`,
        fix: "Start after the halt with positive down seconds.",
      });
    const halt: AutoMovieArchetypeRide.ISample<Id, D> = ride.at(ride.duration);
    const trunk: IAutoMovieModelPart = halt.archetype.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "trunk",
    )!;
    const pivot: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
      halt.placement,
      trunk.transform!.translation,
    );
    const along: IAutoMovieVector3 = Quaternion.rotateVector(
      halt.placement.rotation,
      { x: 0, y: 0, z: 1 },
    );
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      Vector3.normalize({ x: along.x, y: 0, z: along.z }),
      cue.side === "left" ? -90 : 90,
    );
    const turned: IAutoMovieTransform = {
      ...halt.placement,
      rotation: Quaternion.normalize(
        Quaternion.multiply(turn, halt.placement.rotation),
      ),
      translation: Vector3.add(
        pivot,
        Quaternion.rotateVector(
          turn,
          Vector3.subtract(halt.placement.translation, pivot),
        ),
      ),
    };
    const posed: AutoMovieArchetype<Id, D> = halt.archetype;
    const cells: AutoMovieArchetype["convexCells"] = posed.convexCells;
    const lowest: number = Math.min(
      ...posed.parts
        .filter(
          (part: IAutoMovieModelPart): boolean =>
            part.transform !== undefined && part.transform !== null,
        )
        .map((part: IAutoMovieModelPart): number =>
          QuadrupedRestFloor(
            {
              ...part,
              transform: AutoMovieArchetypeFrame.compose(turned, part.transform!),
            },
            cells,
          ),
        ),
    );
    const lying: IAutoMovieTransform = {
      ...turned,
      translation: Vector3.add(turned.translation, { x: 0, y: -lowest, z: 0 }),
    };
    const rise: number = cue.from + cue.down + cue.hold;
    const end: number = rise + cue.down;
    const at = (seconds: number): AutoMovieArchetypeRide.ISample<Id, D> => {
      if (seconds <= cue.from || seconds >= end)
        return ride.at(Math.min(seconds, ride.duration));
      const share: number = minimumJerk.share(
        seconds < cue.from + cue.down
          ? (seconds - cue.from) / cue.down
          : seconds < rise
            ? 1
            : (end - seconds) / cue.down,
      );
      return {
        archetype:
          share >= 1
            ? halt.archetype
            : EquineBlend(
                halt.archetype,
                halt.placement,
                halt.archetype,
                lying,
                share,
              ),
        placement: AutoMovieArchetypeFrame.copy(lying),
        course: halt.course,
      };
    };
    return {
      plan: ride.plan,
      duration: end,
      instants: [
        ...ride.instants,
        { seconds: cue.from + cue.down, label: "lie:down" },
        { seconds: rise, label: "lie:rise" },
        { seconds: end, label: "lie:standing" },
      ].sort((p: Instant, q: Instant): number => p.seconds - q.seconds),
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, D> = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }
}
