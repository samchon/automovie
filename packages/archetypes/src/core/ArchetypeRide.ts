import type { IAutoMovieIntegrateMotionTrajectory, IAutoMovieAffordance, IAutoMovieModelPart, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import {
  Quaternion,
  Vector3,
  integrateMotionTrajectory,
} from "@automovie/engine";


import type { Archetype } from "./Archetype";
import { ArchetypeCourse } from "./ArchetypeCourse";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import { ArchetypeSpan } from "./ArchetypeSpan";
import { ArchetypeUnits } from "./ArchetypeUnits";

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

    /** The lines a towing ride lays between the leader and this support at that second, in the world; absent when it lays none. */
    lines?: readonly ILineState[];
  }

  /**
   * A line between two independently moving supports, such as a trace from a horse's collar to a cart's single tree, or a driving line from the bit through the terrets to the driver's hands: a round strap through its points in order, each a point of the leader or of the towed support.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a line is and what its points name.
   * @evidence contracts/development/design.md#principled-representation An id, a radius in metres and an ordered list of attachment points, each an end of either model in the form a span's end takes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here, beside the coupling that moves both models; read by `towed`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A point names its model by its one key, so it cannot name both.
   */
  export interface ILine {
    /** The line's id, unique among a ride's lines. */
    id: string;

    /** The strap's radius, metres. */
    radius: number;

    /** The points the line runs through, in order; at least two. */
    points: readonly ILinePoint[];
  }

  /**
   * One point of a line: an end on the leader's posed model, or one on the towed support's.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a point names.
   * @evidence contracts/development/design.md#principled-representation A union of an end on either model, the other side absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the points of `ILine`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type ILinePoint =
    | { leader: ArchetypeSpan.End; trailer?: never }
    | { trailer: ArchetypeSpan.End; leader?: never };

  /**
   * A line at one second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and space.
   * @evidence contracts/development/design.md#principled-representation The line's id, its radius in metres and its points in the world, in order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; carried by a towed ride's samples.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ILineState {
    /** The line's id. */
    id: string;

    /** The strap's radius, metres. */
    radius: number;

    /** Its points in the world, metres, in order. */
    points: readonly IAutoMovieVector3[];
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
      course.kind === "plan"
        ? course
        : ArchetypeCourse.plan(archetype.archetype, course);
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
   * The trailer is drawn by any ride, a car's, a horse's or a cart's along a course. Its axle line, the trailer's own `X` axis through `axle`, never slides sideways, so its heading turns toward the hitch at the hitch's sideways speed over the coupling's distance ahead of the axle; the heading is integrated from the leader's start, the trailer then aligned behind the hitch, by the engine's integrator (`integrateMotionTrajectory`), so the trailer's path depends only on the leader's and its own start. A four-wheeled wagon is two such links: its pole and front axle turn about the front axle's pivot, trailing the hitch, and its body trails the pivot on its rear axle, the front axle's articulation set to the two links' difference. The ride publishes the leader's plan and instants, and at each second the leader's course state with the trailer's placement. The lines given in `lines` run between the two: at every second each of their points is found on the leader's model as the leader's ride poses and places it, or on the trailer's as this ride does, so a trace or a driving line stays on both at once, whatever either does.
   *
   * @param leader The leader's ride.
   * @param hitch The leader's contact the trailer is hitched to.
   * @param trailer The trailer at rest.
   * @param coupling The trailer's contact that is held on the hitch, ahead of its axle along `+Z`.
   * @param options `axle`, the point of the trailer's (rear) axle line under its root, `+Z` forward, metres, the origin when absent; `pose`, what moves on the trailer at a course state, such as its wheels' spin, the trailer as given when absent; `front`, a turning front axle: `pivot`, the point it turns about, on the trailer's centre line between the coupling and the axle, and `turn`, the `wheel` articulation that turns it, positive to the left, which the coupling rides; `lines`, the lines laid between the leader and the trailer, none when absent.
   * @returns The trailer's ride.
   * @throws {ArchetypeRefusal} When the coupling does not lie ahead of the axle, or of the front axle's pivot, or the pivot ahead of the axle; when either id is no contact of its archetype; when a line has fewer than two points or names a part or contact its model lacks; or when the leader's path turns the front axle past its lock at any step of the integration, giving the most it needed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is held, the trailer model, the integration, determinism and what is published.
   * @evidence contracts/development/implementation.md#principled-implementation The kinematic single-axle trailer: with the coupling a distance L ahead of the axle and the axle's velocity along the trailer's heading, the heading's rate is the hitch velocity's component along the trailer's left over L. The hitch's velocity is the central difference of the leader's hitch frame over a millisecond, the leader's state being closed form; the heading is integrated by RK4 at the integrator's default step and read by Hermite interpolation, so playback and seeking read one motion. With a front axle the pivot's velocity is the hitch's less the first link's turn times its reach, and the body's heading turns toward the pivot at the pivot's sideways speed over the body's length: the standard model of a car with a pivoted trailer, here a pole with a dolly and its body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Measure the coupling, integrate the heading over the leader's running time, then one sampler placing the axle behind the hitch and laying the lines on the two posed models.
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
      front?: { pivot: IAutoMovieVector3; turn: Id };
      lines?: readonly ILine[];
    } = {},
  ): IRide<Id, Dimension> {
    const axle: IAutoMovieVector3 = options.axle ?? { x: 0, y: 0, z: 0 };
    const local: IAutoMovieVector3 =
      trailer.affordance(coupling).frame.translation;

    // The links from the hitch back: the coupling to the axle, or the pole to the front axle's pivot and the pivot to the rear axle.
    const pivot: IAutoMovieVector3 | null = options.front?.pivot ?? null;
    const reach: number = local.z - (pivot ?? axle).z;
    const body: number = pivot === null ? 0 : pivot.z - axle.z;
    for (const [axis, value, behind] of [
      ["coupling", reach, pivot === null ? "axle" : "front axle's pivot"],
      ...(pivot === null ? [] : [["pivot", body, "rear axle"] as const]),
    ] as const)
      if (!(value > 0))
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype: trailer.archetype,
          axis,
          value,
          feasible: { kind: "range", minimum: 0, maximum: null, unit: "m" },
          reason: `the ${axis} lies ${-value} m behind the ${behind}, so the trailer would push rather than trail`,
          fix: `hitch the trailer by a contact ahead of its ${behind}`,
        });
    const hitchAt = (seconds: number): IAutoMovieVector3 =>
      leader.frame(hitch, seconds).translation;
    const end: number = Math.max(leader.duration, 1e-3);
    const start: IAutoMovieVector3 = ArchetypeFrame.axis(
      leader.at(0).placement,
      "z",
    );
    const yaw: number = Math.atan2(start.x, start.z);

    // The headings, radians about +Y: the first link's turning toward the hitch at its sideways speed over its reach; a second link's toward the pivot at the pivot's sideways speed over the body's length.
    const heading: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      integrateMotionTrajectory({
        f: (
          t: number,
          x: readonly number[],
        ): IAutoMovieIntegrateMotionTrajectory.IRate => {
          const ahead: IAutoMovieVector3 = hitchAt(t + 5e-4);
          const behind: IAutoMovieVector3 = hitchAt(t - 5e-4);
          const vx: number = (ahead.x - behind.x) / 1e-3;
          const vz: number = (ahead.z - behind.z) / 1e-3;
          const theta: number = x[0]!;
          const rate: number =
            (vx * Math.cos(theta) - vz * Math.sin(theta)) / reach;
          if (pivot === null) return { dx: [rate] };
          const px: number = vx - reach * rate * Math.cos(theta);
          const pz: number = vz + reach * rate * Math.sin(theta);
          const phi: number = x[1]!;
          return {
            dx: [rate, (px * Math.cos(phi) - pz * Math.sin(phi)) / body],
          };
        },
        x0: pivot === null ? [yaw] : [yaw, yaw],
        t0: 0,
        t1: end,
      });

    // A front axle turned past its lock at any knot refuses the course, naming the most it needed.
    if (options.front !== undefined) {
      const lock: number = trailer.affordance(options.front.turn).travel ?? 0;
      let most: number = 0;
      for (let k: number = 0; k < heading.knots; k++) {
        const x: readonly number[] = heading.at(
          Math.min(heading.t0 + k * heading.h, heading.t1),
        ).x;
        most = Math.max(most, Math.abs((x[0]! - x[1]!) / ArchetypeUnits.DEGREE));
      }
      if (most > lock)
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype: trailer.archetype,
          axis: "front",
          value: most,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: lock,
            unit: "degrees",
          },
          reason: `the leader's path turns the front axle ${most} degrees, past its ${lock} degree lock`,
          fix: "lead the trailer on wider turns",
        });
    }
    for (const line of options.lines ?? [])
      if (line.points.length < 2)
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype: trailer.archetype,
          axis: line.id,
          value: line.points.length,
          feasible: { kind: "range", minimum: 2, maximum: null, unit: "" },
          reason: `the line ${line.id} has ${line.points.length} points`,
          fix: "give the line its two ends at least",
        });

    // The lines at a second: each point on its own model, posed and placed as the leader's ride and this one have it.
    const lay = (
      lead: ISample<LeaderId, LeaderDimension>,
      posed: Archetype<Id, Dimension>,
      placement: IAutoMovieTransform,
    ): { lines?: readonly ILineState[] } => {
      if (options.lines === undefined) return {};
      const world = (
        model: Readonly<{
          archetype: string;
          parts: readonly IAutoMovieModelPart[];
          affordances: readonly IAutoMovieAffordance[];
        }>,
        where: IAutoMovieTransform,
        end: ArchetypeSpan.End,
      ): IAutoMovieVector3 =>
        ArchetypeFrame.point(
          where,
          ArchetypeSpan.locate(
            model.archetype,
            end,
            model.parts,
            model.affordances,
          ),
        );
      return {
        lines: options.lines.map(
          (line: ILine): ILineState => ({
            id: line.id,
            radius: line.radius,
            points: line.points.map(
              (point: ILinePoint): IAutoMovieVector3 =>
                point.leader !== undefined
                  ? world(lead.archetype, lead.placement, point.leader)
                  : world(posed, placement, point.trailer),
            ),
          }),
        ),
      };
    };
    const at = (seconds: number): ISample<Id, Dimension> => {
      const sample: ISample<LeaderId, LeaderDimension> = leader.at(seconds);
      const state: readonly number[] = heading.at(seconds).x;
      const theta: number = state[0]!;
      const turn = (radians: number): IAutoMovieTransform["rotation"] =>
        Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          radians / ArchetypeUnits.DEGREE,
        );
      const point: IAutoMovieVector3 = hitchAt(seconds);
      const posed: Archetype<Id, Dimension> =
        options.pose?.(sample.course) ?? trailer;
      if (pivot === null || options.front === undefined) {
        const rotation: IAutoMovieTransform["rotation"] = turn(theta);
        const placement: IAutoMovieTransform = {
          translation: Vector3.subtract(
            point,
            Quaternion.rotateVector(rotation, local),
          ),
          rotation,
          scale: { ...ArchetypeFrame.UNIT },
        };
        return {
          archetype: posed,
          placement,
          course: { ...sample.course, placement },
          ...lay(sample, posed, placement),
        };
      }

      // The pivot behind the hitch along the first link, the body behind the pivot along the second, and the front axle turned by the links' difference.
      const phi: number = state[1]!;
      const rotation: IAutoMovieTransform["rotation"] = turn(phi);
      const joint: IAutoMovieVector3 = Vector3.subtract(
        point,
        Quaternion.rotateVector(turn(theta), Vector3.subtract(local, pivot)),
      );
      const placement: IAutoMovieTransform = {
        translation: Vector3.subtract(
          joint,
          Quaternion.rotateVector(rotation, pivot),
        ),
        rotation,
        scale: { ...ArchetypeFrame.UNIT },
      };
      const steer: Partial<Record<Id, number>> = {};
      steer[options.front.turn] = (theta - phi) / ArchetypeUnits.DEGREE;
      const steered: Archetype<Id, Dimension> = posed.articulate({
        ...posed.state,
        ...steer,
      });
      return {
        archetype: steered,
        placement,
        course: { ...sample.course, placement },
        ...lay(sample, steered, placement),
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
