import {
  Quaternion,
  Vector3,
  integrateMotionTrajectory,
} from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { Archetype } from "./Archetype";
import { ArchetypeCourse } from "./ArchetypeCourse";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";

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

  /**
   * A trailer towed by a leader: the trailer's coupling held on the leader's hitch at every second, and its axle following as a single-axle trailer does, its heading lagging into the turns.
   *
   * The trailer is drawn by any ride, a car's, a horse's or a cart's along a course. Its axle line, the trailer's own `X` axis through `axle`, never slides sideways, so its heading turns toward the hitch at the hitch's sideways speed over the coupling's distance ahead of the axle; the heading is integrated from the leader's start, the trailer then aligned behind the hitch, by the engine's integrator (`integrateMotionTrajectory`), so the trailer's path depends only on the leader's and its own start. A four-wheeled wagon's front axle turning on its pole is the same model with the pole's pivot as the axle. The ride publishes the leader's plan and instants, and at each second the leader's course state with the trailer's placement.
   *
   * @param leader The leader's ride.
   * @param hitch The leader's contact the trailer is hitched to.
   * @param trailer The trailer at rest.
   * @param coupling The trailer's contact that is held on the hitch, ahead of its axle along `+Z`.
   * @param options `axle`, the point of the trailer's axle line under its root, `+Z` forward, metres, the origin when absent; `pose`, what moves on the trailer at a course state, such as its wheels' spin, the trailer as given when absent.
   * @returns The trailer's ride.
   * @throws {ArchetypeRefusal} When the coupling does not lie ahead of the axle, or either id is no contact of its archetype.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is held, the trailer model, the integration, determinism and what is published.
   * @evidence contracts/development/implementation.md#principled-implementation The kinematic single-axle trailer: with the coupling a distance L ahead of the axle and the axle's velocity along the trailer's heading, the heading's rate is the hitch velocity's component along the trailer's left over L. The hitch's velocity is the central difference of the leader's hitch frame over a millisecond, the leader's state being closed form; the heading is integrated by RK4 at the integrator's default step and read by Hermite interpolation, so playback and seeking read one motion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Measure the coupling, integrate the heading over the leader's running time, then one sampler placing the axle behind the hitch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The trailer stands at the hitch's height less the coupling's, so a grade is followed only through the hitch; a tyre's sideways slip is left out, which holds at the walking-to-trotting speeds of drawn vehicles.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four right-hand-side evaluations per sixtieth of a second, each two reads of the leader, once per ride; a sample is one Hermite read and one leader read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The integrated heading serves every sample.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ride holds the leader, the trailer and the heading's knots for as long as its caller keeps it.
   */
  export function towed<
    LeaderId extends string,
    LeaderDimension extends string,
    Id extends string,
    Dimension extends string,
  >(
    leader: IRide<LeaderId, LeaderDimension>,
    hitch: LeaderId,
    trailer: Archetype<Id, Dimension>,
    coupling: Id,
    options: {
      axle?: IAutoMovieVector3;
      pose?: (state: ArchetypeCourse.IState) => Archetype<Id, Dimension>;
    } = {},
  ): IRide<Id, Dimension> {
    const axle: IAutoMovieVector3 = options.axle ?? { x: 0, y: 0, z: 0 };
    const local: IAutoMovieVector3 = trailer.affordance(coupling).frame.translation;
    const reach: number = local.z - axle.z;
    if (!(reach > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: trailer.archetype,
        axis: "coupling",
        value: reach,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "m" },
        reason: `the coupling lies ${-reach} m behind the axle, so the trailer would push rather than trail`,
        fix: "hitch the trailer by a contact ahead of its axle",
      });
    const hitchAt = (seconds: number): IAutoMovieVector3 =>
      leader.frame(hitch, seconds).translation;
    const end: number = Math.max(leader.duration, 1e-3);
    const start: IAutoMovieVector3 = ArchetypeFrame.axis(leader.at(0).placement, "z");

    // The heading, radians about +Y, turning toward the hitch at its sideways speed over the coupling's reach.
    const heading: integrateMotionTrajectory.ITrajectory = integrateMotionTrajectory({
      f: (t: number, x: readonly number[]): integrateMotionTrajectory.IRate => {
        const ahead: IAutoMovieVector3 = hitchAt(t + 5e-4);
        const behind: IAutoMovieVector3 = hitchAt(t - 5e-4);
        const vx: number = (ahead.x - behind.x) / 1e-3;
        const vz: number = (ahead.z - behind.z) / 1e-3;
        const theta: number = x[0]!;
        return { dx: [(vx * Math.cos(theta) - vz * Math.sin(theta)) / reach] };
      },
      x0: [Math.atan2(start.x, start.z)],
      t0: 0,
      t1: end,
    });
    const at = (seconds: number): ISample<Id, Dimension> => {
      const sample: ISample<LeaderId, LeaderDimension> = leader.at(seconds);
      const theta: number = heading.at(seconds).x[0]!;
      const rotation: IAutoMovieTransform["rotation"] = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        (theta * 180) / Math.PI,
      );
      const point: IAutoMovieVector3 = hitchAt(seconds);
      const placement: IAutoMovieTransform = {
        translation: Vector3.subtract(point, Quaternion.rotateVector(rotation, local)),
        rotation,
        scale: { ...ArchetypeFrame.UNIT },
      };
      return {
        archetype: options.pose?.(sample.course) ?? trailer,
        placement,
        course: { ...sample.course, placement },
      };
    };
    return {
      plan: leader.plan,
      duration: leader.duration,
      instants: leader.instants,
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
