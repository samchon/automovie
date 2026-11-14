import type { IAutoMovieTransform } from "@automovie/interface";

import type { Archetype } from "./Archetype";
import { ArchetypeCourse } from "./ArchetypeCourse";
import { ArchetypeFrame } from "./ArchetypeFrame";

/**
 * A moving support in time: an archetype following a course, with whatever of it moves as it goes.
 *
 * A ride is what the support publishes for whoever is carried by it or walks beside it: at any second, the archetype in its state at that second, the placement of its root in the world, and through `frame` the world frame of any of its contacts, which is the support frame a seated, standing or holding body is kept on. Its named instants are the course's, plus those the support adds, such as a crank's top dead centres or a horse's footfalls.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a ride publishes and to whom, and where its instants come from.
 * @evidence contracts/development/design.md#principled-representation A function of film seconds returning plain data, so a consumer samples it at its own instants and nothing is baked at one rate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and one constructor, shared by every vehicle and animal of this package (#3368's moving supports).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No vehicle is named here: what moves with the course is a function its producer's ride supplies.
 */
export namespace ArchetypeRide {
  /**
   * The support at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A pose together with the course state it was taken at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by a ride's `at` and read by whoever is carried and by the capture subjects.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; it extends `IPose` and repeats none of its members.
   */
  export interface ISample<
    Id extends string,
    Dimension extends string,
  > extends IPose<Id, Dimension> {
    /** Where the support is on its course. */
    course: ArchetypeCourse.IState;
  }

  /**
   * What moves with the course at one of its states: the archetype in its state there and its root's placement in the world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A support's own state at one course state: the archetype as posed there and its root's placement in the world with unit scale.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by each ride's pose function to `along`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPose<Id extends string, Dimension extends string> {
    /** The archetype in its state at that point of the course. */
    archetype: Archetype<Id, Dimension>;

    /** The placement of the archetype's root in the world, which may differ from the course's own by a lean or a bob. */
    placement: IAutoMovieTransform;
  }

  /**
   * A ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A ride as plain data and two pure samplers over film seconds: the plan, its duration in seconds, labelled instants in time order, the sample at a second and a contact's world frame at a second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `along` and by every ride of the package.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRide<Id extends string, Dimension extends string> {
    /** The planned course. */
    plan: ArchetypeCourse.IPlan;

    /** The film second the ride ends, its course's `duration`. */
    duration: number;

    /** Named instants in time order. */
    instants: readonly { seconds: number; label: string }[];

    /**
     * The support at a second, held at its start before its course begins and at its end after it ends.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and what is returned outside the course's range.
     * @evidence contracts/development/implementation.md#principled-implementation The plan's state at that second, mapped by the ride's pose function to the archetype's own state and placement.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One course sample, one pose.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is interpolated between samples: each is computed from the second alone.
     * @evidence contracts/development/implementation.md#efficient-algorithms One course sample and one pose per call.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the plan with every other sample; samples are not cached, since a consumer asks each second once.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the ride's own closure.
     */
    at: (seconds: number) => ISample<Id, Dimension>;

    /**
     * The world frame of one of the support's contacts at a second, seconds held to the ride as `at` holds them; an id the archetype lacks is refused as `Archetype.affordance` refuses it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and what is returned outside the course's range.
     * @evidence contracts/development/implementation.md#principled-implementation The contact's model-local frame in the archetype's state at that second, composed under the root's placement.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One sample, one lookup, one composition.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing id is refused, never given a default frame.
     * @evidence contracts/development/implementation.md#efficient-algorithms One sample per call.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `at` and `ArchetypeFrame.compose`.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the ride's own closure.
     */
    frame: (id: Id, seconds: number) => IAutoMovieTransform;
  }

  /**
   * A ride of an archetype along a course.
   *
   * @param archetype The support at rest.
   * @param course The course its root follows, or its plan when the caller has already planned it.
   * @param pose What moves with the course: given the course's state, the archetype in its state there and the root's placement. Absent, the archetype goes along unchanged.
   * @param instants Instants the support adds to the course's.
   * @returns The ride.
   * @throws {ArchetypeRefusal} As {@link ArchetypeCourse.plan} does for a malformed course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's role and the default.
   * @evidence contracts/development/implementation.md#principled-implementation The plan gives the course state in closed form and the pose function maps it to the support's own state, so each sample is independent of every other.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan the course unless a plan was handed in, merge the instants, return two samplers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the owners it calls.
   * @evidence contracts/development/implementation.md#efficient-algorithms One course sample and one pose per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is shared by every sample, and a ride that planned the course for its own instants hands that plan in; samples are not cached, since a consumer asks each second once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ride holds the rest archetype and the plan for as long as its caller keeps it.
   */
  export function along<Id extends string, Dimension extends string>(
    archetype: Archetype<Id, Dimension>,
    course: ArchetypeCourse.ICourse | ArchetypeCourse.IPlan,
    pose?: (state: ArchetypeCourse.IState) => IPose<Id, Dimension>,
    instants: readonly { seconds: number; label: string }[] = [],
  ): IRide<Id, Dimension> {
    const plan: ArchetypeCourse.IPlan =
      "legs" in course
        ? ArchetypeCourse.plan(archetype.archetype, course)
        : course;
    const at = (seconds: number): ISample<Id, Dimension> => {
      const state: ArchetypeCourse.IState = plan.at(seconds);
      return {
        ...(pose?.(state) ?? { archetype, placement: state.placement }),
        course: state,
      };
    };
    return {
      plan,
      duration: plan.duration,
      instants: [...plan.instants, ...instants].sort(
        (p: { seconds: number }, q: { seconds: number }): number =>
          p.seconds - q.seconds,
      ),
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: ISample<Id, Dimension> = at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }
}
