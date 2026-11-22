import type { IAutoMovieTransform } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import type { AutoMovieArchetypeEquineLibertyCue } from "./AutoMovieArchetypeEquineLibertyCue";
import { AutoMovieArchetypeEquineStance } from "./AutoMovieArchetypeEquineStance";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import { AutoMovieArchetypeQuadrupedLateralRest } from "./AutoMovieArchetypeQuadrupedLateralRest";
import type { AutoMovieArchetypeQuadrupedLateralRestPlan } from "./AutoMovieArchetypeQuadrupedLateralRestPlan";
import { AutoMovieArchetypeQuadrupedRest } from "./AutoMovieArchetypeQuadrupedRest";
import type { AutoMovieArchetypeQuadrupedRestPlan } from "./AutoMovieArchetypeQuadrupedRestPlan";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import { createQuadruped } from "./createQuadruped";

/** A rest clip, sternal or lateral. */
type Clip<Id extends string, D extends string> =
  | AutoMovieArchetypeQuadrupedRestPlan.IClip<Id, D>
  | AutoMovieArchetypeQuadrupedLateralRestPlan.IClip<Id, D>;

/** A rest clip's sample. */
type Shown<Id extends string, D extends string> =
  | AutoMovieArchetypeQuadrupedRestPlan.ISample<Id, D>
  | AutoMovieArchetypeQuadrupedLateralRestPlan.ISample<Id, D>;

/** A named instant of a ride. */
type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];

/**
 * A trained horse's liberty work after it halts: the bow, kneel and sit as stance rows, then optionally a lie-down and stay or a lateral "dead" hold and the rise from it.
 *
 * The rows play through the stance (`AutoMovieArchetypeEquineStance` with `EquineLibertyRows`). A recline plays the shared rests from the halt: the sternal rest (`AutoMovieArchetypeQuadrupedRest`), or the lateral rest that rolls onto a side, holds it and rolls back to rise (`AutoMovieArchetypeQuadrupedLateralRest`), each placed at the halt and carrying the horse's own tack through its actual carriers; the rest's phases are its named entry, hold and exit, and its events join the ride's instants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what plays the rows and the recline and how they are placed.
 * @evidence contracts/development/design.md#principled-representation A ride in and a ride out on the same clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry for the liberty work.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rests are the shared ones; no pose is duplicated here.
 */
export namespace AutoMovieArchetypeEquineLiberty {
  /**
   * Play liberty rows and an optional recline over a horse's ride after it halts.
   *
   * @param animal The equid at rest, as its producer built it.
   * @param ride Its ride, halted where the work starts.
   * @param rows The bow, kneel and sit rows, or any other stance rows.
   * @param recline The lie-down or dead hold after the rows, if any.
   * @returns The ride with the work over its halt.
   * @throws {AutoMovieArchetypeRefusal} For a recline asked for before the halt or before the last row ends, or anything the stance or the rests refuse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the output and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Play the rows through the stance; from the recline's start, sample its rest clip in the halt's placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Stance, then one clip.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A recline overlapping the rows or the travel refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms One clip build; each sample reads one layer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stance, the shared rests and carriers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the stance ride and the clip.
   */
  export function after<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    rows: readonly AutoMovieArchetypeEquineStanceCue.Cue[],
    recline?: AutoMovieArchetypeEquineLibertyCue.IRecline,
  ): AutoMovieArchetypeRide.IRide<Id, D> {
    const stance: AutoMovieArchetypeRide.IRide<Id, D> =
      AutoMovieArchetypeEquineStance.after(animal, ride, rows);
    if (recline === undefined) return stance;
    const last: number = Math.max(
      ride.duration,
      ...rows.map(
        (row: AutoMovieArchetypeEquineStanceCue.Cue): number =>
          row.from + row.entry + row.hold + row.exit,
      ),
    );
    if (!(Number.isFinite(recline.from) && recline.from >= last))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: animal.archetype,
        axis: "from",
        value: recline.from,
        feasible: null,
        reason: `a recline starts once the horse has halted and its rows have ended, at ${last} s`,
        fix: "Start the recline after the ride's halt and the last row.",
      });
    const halt: AutoMovieArchetypeRide.ISample<Id, D> = ride.at(ride.duration);
    const params: AutoMovieArchetypeQuadrupedRestPlan.IParams = rested(
      animal,
      halt.placement,
      recline.rest,
    );
    const clip: Clip<Id, D> =
      recline.lateral === undefined
        ? AutoMovieArchetypeQuadrupedRest(animal, params)
        : AutoMovieArchetypeQuadrupedLateralRest(
            animal,
            params,
            recline.lateral,
          );
    const at = (seconds: number): AutoMovieArchetypeRide.ISample<Id, D> => {
      if (seconds < recline.from) return stance.at(seconds);
      const local: number = Math.min(clip.duration, seconds - recline.from);
      const shown: Shown<Id, D> = clip.sample(local);
      return {
        archetype: shown.animal,
        // A sternal rest poses its parts in place; a lateral rest adds a rigid placer.
        placement:
          "placement" in shown
            ? AutoMovieArchetypeFrame.compose(halt.placement, shown.placement)
            : AutoMovieArchetypeFrame.copy(halt.placement),
        course: ride.plan.at(Math.min(seconds, ride.duration)),
      };
    };
    const instants: Instant[] = [
      ...stance.instants,
      ...Object.entries(clip.events).map(
        ([label, seconds]: [string, number]): Instant => ({
          label: `rest:${label}`,
          seconds: recline.from + seconds,
        }),
      ),
    ].sort((p: Instant, q: Instant): number => p.seconds - q.seconds);
    return {
      plan: ride.plan,
      duration: Math.max(stance.duration, recline.from + clip.duration),
      instants,
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

  /**
   * A shared rest's parameters at a placement: the authored rest with the horse's own carriers and the floor under the placement.
   *
   * @param animal The equid at rest.
   * @param placement Where it lies down.
   * @param rest The authored rest.
   * @returns The rest plan's parameters in the placement's model space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and output.
   * @evidence contracts/development/implementation.md#principled-implementation The floor is the world floor read in the placement's model space; the carriers are the shared quadruped carriers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One carrier read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the recline and the fall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record.
   */
  export function rested<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    placement: IAutoMovieTransform,
    rest: AutoMovieArchetypeEquineLibertyCue.Rest,
  ): AutoMovieArchetypeQuadrupedRestPlan.IParams {
    const carriers: ReturnType<typeof QuadrupedCarriage.of> =
      QuadrupedCarriage.of(animal, createQuadruped.species(animal));
    return {
      ...rest,
      floorY: -placement.translation.y,
      parts: carriers.parts,
      contacts: carriers.contacts,
    };
  }
}
