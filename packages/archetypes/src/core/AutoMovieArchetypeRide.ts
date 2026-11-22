import { integrateMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeRideWitness } from "./ArchetypeRideWitness";
import type { ArchetypeTowedGeometry } from "./ArchetypeTowedGeometry";
import { ArchetypeTowing } from "./ArchetypeTowing";
import type { AutoMovieArchetype } from "./AutoMovieArchetype";
import { AutoMovieArchetypeCourse } from "./AutoMovieArchetypeCourse";
import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";

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
export namespace AutoMovieArchetypeRide {
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
    course: AutoMovieArchetypeCourse.IState;

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
   * One point of a line: an end on the leader's posed model, one on the towed support's, or a point a performer holds it at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a point names.
   * @evidence contracts/development/design.md#principled-representation A union of an end on either model or a held point, the others absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the points of `ILine`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type ILinePoint =
    | { leader: AutoMovieArchetypeSpan.End; trailer?: never; held?: never }
    | { trailer: AutoMovieArchetypeSpan.End; leader?: never; held?: never }
    | ILineHeld;

  /**
   * A line point held by a performer: its world position at each film second, such as a driver's displayed palm, so a held line follows the hand that shakes, takes up or gives it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reader's unit and space.
   * @evidence contracts/development/design.md#principled-representation A pure reader of film seconds returning world metres, the other ends absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplied by a performance's hand reader and read by `towed`'s line laying.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader is the performer's; the line owner invents no hand position.
   */
  export interface ILineHeld {
    /**
     * The held point in the world, metres, at a film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the film second it takes and the world point it returns, metres.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback the caller supplies; its implementation is the caller's.
     */
    held: (seconds: number) => IAutoMovieVector3;
    /** Absent: a held point is on neither model. */
    leader?: never;
    /** Absent: a held point is on neither model. */
    trailer?: never;
  }

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
    archetype: AutoMovieArchetype<Id, Dimension>;

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
    plan: AutoMovieArchetypeCourse.IPlan;

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
     * The world frame of one of the support's contacts at a second, seconds held to the ride as `at` holds them; an id the archetype lacks is refused as `AutoMovieArchetype.affordance` refuses it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and what is returned outside the course's range.
     * @evidence contracts/development/implementation.md#principled-implementation The contact's model-local frame in the archetype's state at that second, composed under the root's placement.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One sample, one lookup, one composition.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing id is refused, never given a default frame.
     * @evidence contracts/development/implementation.md#efficient-algorithms One sample per call.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `at` and `AutoMovieArchetypeFrame.compose`.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the ride's own closure.
     */
    frame(id: Id, seconds: number): IAutoMovieTransform;
  }

  /**
   * The world placement and selected contact frames at one tow instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Refers to the selected tow observation at one film second.
   * @evidence contracts/development/design.md#principled-representation Shares the contact query and its current posed geometry contract.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the canonical snapshot through the existing ride namespace.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alias leaves all field types and query behavior to the tow geometry owner.
   */
  export type ITowedSample<Id extends string> =
    ArchetypeTowedGeometry.ITowedSample<Id>;

  /**
   * A ride with an exact arbitrary-time contact query for the towed support.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the extended ride and the use of its query.
   * @evidence contracts/development/design.md#principled-representation The canonical tow-specific extension of a general ride.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the tow return type accessible from the ride namespace.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alias adds no alternative query representation.
   */
  export type ITowedRide<
    Id extends string,
    Dimension extends string,
  > = ArchetypeTowedGeometry.ITowedRide<Id, Dimension>;

  /**
   * A ride of an archetype along a course.
   *
   * @param archetype The support at rest.
   * @param course The course its root follows, or its plan when the caller has already planned it.
   * @param pose The support's model and root placement at the current course state and film second. Without a poser the source model follows the course unchanged.
   * @param instants Instants the support adds to the course's.
   * @returns The ride.
   * @throws {AutoMovieArchetypeRefusal} As {@link AutoMovieArchetypeCourse.plan} does for a malformed course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's role and the default.
   * @evidence contracts/development/implementation.md#principled-implementation The plan gives the course state in closed form and the pose function maps it to the support's own state, so each sample is independent of every other.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan the course unless a plan was handed in, merge the instants, return two samplers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the owners it calls.
   * @evidence contracts/development/implementation.md#efficient-algorithms One course sample and one pose per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is shared by every sample, and a ride that planned the course for its own instants hands that plan in; samples are not cached, since a consumer asks each second once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ride holds the rest archetype and the plan for as long as its caller keeps it.
   */
  export function along<Id extends string, D extends string>(
    archetype: AutoMovieArchetype<Id, D>,
    course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
    pose?: (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
    ) => IPose<Id, D>,
    instants: readonly { seconds: number; label: string }[] = [],
  ): IRide<Id, D> {
    const plan: AutoMovieArchetypeCourse.IPlan =
      course.kind === "plan"
        ? course
        : AutoMovieArchetypeCourse.plan(archetype.archetype, course);
    function at(seconds: number): ISample<Id, D> {
      const state: AutoMovieArchetypeCourse.IState = plan.at(seconds);
      const sample: IPose<Id, D> = pose?.(state, seconds) ?? {
        archetype,
        placement: state.placement,
      };
      return { ...sample, course: state };
    }
    const ride: IRide<Id, D> = {
      plan,
      duration: plan.duration,
      instants: [...plan.instants, ...instants].sort(
        (p: { seconds: number }, q: { seconds: number }): number =>
          p.seconds - q.seconds,
      ),
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: ISample<Id, D> = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
    if (pose !== undefined) ArchetypeRideWitness.constructed(ride, pose);
    return ride;
  }

  /**
   * A trailer towed by a leader: the trailer's coupling held on the leader's hitch at every second, and its axle following as a single-axle trailer does, its heading lagging into the turns.
   *
   * The trailer is drawn by any ride, a car's, a horse's or a cart's along a course. Its axle line, the trailer's own `X` axis through `axle`, never slides sideways, so its heading turns toward the hitch at the hitch's sideways speed over the coupling's distance ahead of the axle; the heading is integrated from the leader's start, the trailer then aligned behind the hitch, by the engine's integrator (`integrateMotionTrajectory`), so the trailer's path depends only on the leader's and its own start. A four-wheeled wagon is two such links: its pole and front axle turn about the front axle's pivot, trailing the hitch, and its body trails the pivot on its rear axle, the front axle's articulation set to the two links' difference. The ride publishes the leader's plan and instants, and at each second the leader's course state with the trailer's placement. The lines given in `lines` run between the two: at every second each of their points is found on the leader's model as the leader's ride poses and places it, or on the trailer's as this ride does, so a trace or a driving line stays on both at once, whatever either does.
   *
   * @param leader The leader's ride.
   * @param hitch The leader's contact the trailer is hitched to.
   * @param trailer The trailer at rest.
   * @param coupling The actual source contact held on the hitch; legacy inputs require it ahead along +Z, while declared single-axle support can tow a rear contact in reverse.
   * @param options support is producer-read actual axle geometry: a single axle permits body pitch, and fixedGround keeps two axles grounded with an optional actual drawbar hinge. Without it only an unchanged level coupling height is supported. Existing axle/front declarations must agree with supplied support; pose supplies current articulations and lines supplies actual inter-model spans. ground, with single-axle support, seats the wheels on the authored plane under the axle instead of the leader's course datum.
   * @returns The trailer's ride.
   * @throws {AutoMovieArchetypeRefusal} For inconsistent support/options, an unreachable or unsupported hitch height, an invalid support/articulation, a coupling that does not close, a nonpositive projected reach, missing contacts/line ends or front steering beyond its declared lock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is held, the trailer model, the integration, determinism and what is published.
   * @evidence contracts/development/implementation.md#principled-implementation Planar no-side-slip heading uses the actual height-dependent horizontal lever projection from ArchetypeTowing. The existing millisecond central difference and shared RK4 trajectory remain; a front pivot's velocity includes both heading and projected-length derivatives. Exact axle/pole pitch closes the actual coupling while keeping declared wheel supports at the common course-ground datum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare one declared geometry owner, integrate the existing planar headings, then sample its supported placement and source joint travels before emitting actual inter-model lines.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No unknown support is inferred, chassis height correction or stretched shaft hides mismatch. Actual coupling closure is checked at scale-dependent binary64 error. This planar model does not solve terrain profiles, suspension, wheel loads or tyre slip.
   * @evidence contracts/development/implementation.md#efficient-algorithms The existing four RK4 evaluations per default step use a fixed number of leader/course reads and closed geometry operations; sampling reads the prepared trajectory and source articulations once, without another solver loop.
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
    trailer: AutoMovieArchetype<Id, Dimension>,
    coupling: Id,
    options: {
      axle?: IAutoMovieVector3;
      pose?: (
        state: AutoMovieArchetypeCourse.IState,
      ) => AutoMovieArchetype<Id, Dimension>;
      front?: ArchetypeTowing.IFront<Id>;
      support?: ArchetypeTowing.Support<Id>;
      lines?: readonly ILine[];
      ground?: ArchetypeTowing.Ground;
    } = {},
  ): ITowedRide<Id, Dimension> {
    const geometry: ArchetypeTowing.IPrepared<Id> = ArchetypeTowing.prepare(
      trailer,
      coupling,
      options,
    );
    const front: ArchetypeTowing.IFront<Id> | null = geometry.front;
    const hitchAt = (
      seconds: number,
      witness?: ArchetypeRideWitness.Witness,
    ): IAutoMovieVector3 => {
      const read:
        | ArchetypeRideWitness.Reader<LeaderId, LeaderDimension>
        | undefined =
        witness === undefined ? undefined : ArchetypeRideWitness.of(leader);
      if (read === undefined || witness === undefined)
        return leader.frame(hitch, seconds).translation;
      const sample: ISample<LeaderId, LeaderDimension> = read(seconds, witness);
      return AutoMovieArchetypeFrame.compose(
        sample.placement,
        sample.archetype.affordance(hitch).frame,
      ).translation;
    };
    const groundAt: (seconds: number) => number = (seconds: number): number =>
      leader.plan.at(seconds).placement.translation.y;
    const end: number = Math.max(leader.duration, 1e-3);
    const start: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      leader.at(0).placement,
      "z",
    );
    const yaw: number = Math.atan2(start.x, start.z);

    // The headings, radians about +Y: the first link's turning toward the hitch at its sideways speed over its reach; a second link's toward the pivot at the pivot's sideways speed over the body's length.
    const heading: IAutoMovieIntegrateMotionTrajectory.ITrajectory = (() => {
      const stage = ArchetypeRideWitness.stages(leader);
      return integrateMotionTrajectory({
        f: (
          t: number,
          x: readonly number[],
        ): IAutoMovieIntegrateMotionTrajectory.IRate => {
          const probes = stage(t);
          const ahead: IAutoMovieVector3 = hitchAt(t + 5e-4, probes?.ahead);
          const behind: IAutoMovieVector3 = hitchAt(t - 5e-4, probes?.behind);
          const vx: number = (ahead.x - behind.x) / 1e-3;
          const vz: number = (ahead.z - behind.z) / 1e-3;
          const theta: number = x[0]!;
          const centre: IAutoMovieVector3 = hitchAt(t, probes?.centre);
          const reach: number = geometry.height(
            centre.y,
            geometry.ground(centre, theta, groundAt(t)),
          ).reach;
          const rate: number =
            (vx * Math.cos(theta) - vz * Math.sin(theta)) / reach;
          if (front === null) return { dx: [rate] };
          const reachRate: number =
            (geometry.height(ahead.y, groundAt(t + 5e-4)).reach -
              geometry.height(behind.y, groundAt(t - 5e-4)).reach) /
            1e-3;
          const px: number =
            vx - reachRate * Math.sin(theta) - reach * rate * Math.cos(theta);
          const pz: number =
            vz - reachRate * Math.cos(theta) + reach * rate * Math.sin(theta);
          const phi: number = x[1]!;
          return {
            dx: [
              rate,
              (px * Math.cos(phi) - pz * Math.sin(phi)) / geometry.body,
            ],
          };
        },
        x0: front === null ? [yaw] : [yaw, yaw],
        t0: 0,
        t1: end,
      });
    })();

    ArchetypeTowing.checkSteering(trailer, front, heading);
    for (const line of options.lines ?? [])
      if (line.points.length < 2)
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: trailer.archetype,
          axis: line.id,
          value: line.points.length,
          feasible: { kind: "range", minimum: 2, maximum: null, unit: "" },
          reason: `the line ${line.id} has ${line.points.length} points`,
          fix: "give the line its two ends at least",
        });

    /** The span owner resolves the actual posed endpoint before world placement. */
    const world = (
      model: Readonly<{
        archetype: string;
        parts: readonly IAutoMovieModelPart[];
        affordances: readonly IAutoMovieAffordance[];
      }>,
      where: IAutoMovieTransform,
      end: AutoMovieArchetypeSpan.End,
    ): IAutoMovieVector3 =>
      AutoMovieArchetypeFrame.point(
        where,
        AutoMovieArchetypeSpan.locate(
          model.archetype,
          end,
          model.parts,
          model.affordances,
        ),
      );
    /** Solve the current support once. Only a demanded frame or line lays its geometry. */
    const read = (
      seconds: number,
    ): ITowedSample<Id> & { full(): ISample<Id, Dimension> } => {
      const native:
        | ArchetypeRideWitness.Reader<LeaderId, LeaderDimension>
        | undefined = ArchetypeRideWitness.of(leader);
      const witness: ArchetypeRideWitness.Witness | undefined =
        native === undefined ? undefined : new ArchetypeRideWitness.Witness();
      const sample: ISample<LeaderId, LeaderDimension> =
        native === undefined || witness === undefined
          ? leader.at(seconds)
          : native(seconds, witness);
      const state: readonly number[] = heading.at(seconds).x;
      const theta: number = state[0]!;
      const phi: number = front === null ? theta : state[1]!;
      const point: IAutoMovieVector3 = hitchAt(seconds, witness);
      const posed: AutoMovieArchetype<Id, Dimension> =
        options.pose?.(sample.course) ?? trailer;
      const solved: ReturnType<typeof geometry.pose> = geometry.pose(
        point,
        geometry.ground(point, theta, groundAt(seconds)),
        theta,
        phi,
      );
      const placement: IAutoMovieTransform = solved.placement;
      const steered: AutoMovieArchetype<Id, Dimension> =
        Object.keys(solved.travels).length === 0
          ? posed
          : posed.articulate({ ...posed.state, ...solved.travels });
      const local: IAutoMovieVector3 =
        steered.affordance(coupling).frame.translation;
      const achieved: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
        placement,
        local,
      );
      const scale: number = Math.max(
        ...[point, local, placement.translation].flatMap(
          (p: IAutoMovieVector3): number[] => [
            Math.abs(p.x),
            Math.abs(p.y),
            Math.abs(p.z),
          ],
        ),
      );
      const error: number = Math.hypot(
        achieved.x - point.x,
        achieved.y - point.y,
        achieved.z - point.z,
      );
      if (!Number.isFinite(error) || error > 64 * Number.EPSILON * scale)
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: trailer.archetype,
          axis: "coupling",
          value: achieved,
          feasible: null,
          reason:
            "The posed source coupling does not close on its declared supported geometry",
          fix: "Keep the source coupling on its declared axle/drawbar and preserve those frames in pose.",
        });
      const pointAt = (part: ILinePoint): IAutoMovieVector3 =>
        part.leader !== undefined
          ? world(sample.archetype, sample.placement, part.leader)
          : part.trailer !== undefined
            ? world(steered, placement, part.trailer)
            : { ...part.held(seconds) };
      return {
        placement,
        frame: (id: Id): IAutoMovieTransform =>
          AutoMovieArchetypeFrame.compose(
            placement,
            steered.affordance(id).frame,
          ),
        tail: (id: string): ReturnType<ITowedSample<Id>["tail"]> => {
          const line: ILine | undefined = options.lines?.find(
            (candidate: ILine): boolean => candidate.id === id,
          );
          return line === undefined
            ? undefined
            : [pointAt(line.points.at(-2)!), pointAt(line.points.at(-1)!)];
        },
        full: (): ISample<Id, Dimension> => ({
          archetype: steered,
          placement,
          course: { ...sample.course, placement },
          ...(options.lines === undefined
            ? {}
            : {
                lines: options.lines.map(
                  (line: ILine): ILineState => ({
                    id: line.id,
                    radius: line.radius,
                    points: line.points.map(pointAt),
                  }),
                ),
              }),
        }),
      };
    };
    const at = (seconds: number): ISample<Id, Dimension> =>
      read(seconds).full();
    return {
      plan: leader.plan,
      duration: leader.duration,
      instants: leader.instants,
      at,
      geometry: read,
      // A contact's frame reads the solved support only; the lines are laid by `at` alone.
      frame: (id: Id, seconds: number): IAutoMovieTransform =>
        read(seconds).frame(id),
    };
  }
}
