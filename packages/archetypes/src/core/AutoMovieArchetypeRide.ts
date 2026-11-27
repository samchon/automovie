import {
  AutoMovieEngineMotionTrajectory,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { ArchetypeTowedGeometry } from "./ArchetypeTowedGeometry";
import { ArchetypeTowing } from "./ArchetypeTowing";
import type { AutoMovieArchetype } from "./AutoMovieArchetype";
import { AutoMovieArchetypeCourse } from "./AutoMovieArchetypeCourse";
import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";

/**
 * A moving support in time: an archetype following a course, with whatever of
 * it moves as it goes.
 *
 * A ride is what the support publishes for whoever is carried by it or walks
 * beside it: at any second, the archetype in its state at that second, the
 * placement of its root in the world, and through `frame` the world frame of
 * any of its contacts, which is the support frame a seated, standing or holding
 * body is kept on. Its named instants are the course's, plus those the support
 * adds, such as a crank's top dead centres or a horse's footfalls.
 */
export namespace AutoMovieArchetypeRide {
  /** The support at a second. */
  export interface ISample<
    Id extends string,
    Dimension extends string,
  > extends IPose<Id, Dimension> {
    /** Where the support is on its course. */
    course: AutoMovieArchetypeCourse.IState;

    /**
     * The lines a towing ride lays between the leader and this support at that
     * second, in the world; absent when it lays none.
     */
    lines?: readonly ILineState[];
  }

  /**
   * A line between two independently moving supports, such as a trace from a
   * horse's collar to a cart's single tree, or a driving line from the bit
   * through the terrets to the driver's hands: a round strap through its points
   * in order, each a point of the leader or of the towed support.
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
   * One point of a line: an end on the leader's posed model, one on the towed
   * support's, or a point a performer holds it at.
   */
  export type ILinePoint = ILineLeaderPoint | ILineTrailerPoint | ILineHeld;

  /** A point attached to the leader's posed model. */
  export interface ILineLeaderPoint {
    /** Identifies a leader anchor. */
    type: "leader";

    /** The end on the leader's model. */
    leader: AutoMovieArchetypeSpan.IEnd;

    /** A leader anchor has no trailer connection. */
    trailer?: never;

    /** A leader anchor has no held point. */
    held?: never;
  }

  /** A point attached to the towed support's posed model. */
  export interface ILineTrailerPoint {
    /** Identifies a trailer anchor. */
    type: "trailer";

    /** The end on the towed support's model. */
    trailer: AutoMovieArchetypeSpan.IEnd;

    /** A trailer anchor has no leader connection. */
    leader?: never;

    /** A trailer anchor has no held point. */
    held?: never;
  }

  /**
   * A line point held by a performer: its world position at each film second,
   * such as a driver's displayed palm, so a held line follows the hand that
   * shakes, takes up or gives it.
   */
  export interface ILineHeld {
    /** Identifies a held point. */
    type: "held";

    /** The held point in the world, metres, at a film second. */
    held: (seconds: number) => IAutoMovieVector3;

    /** A held point has no leader connection. */
    leader?: never;

    /** A held point has no trailer connection. */
    trailer?: never;
  }

  /** A line at one second. */
  export interface ILineState {
    /** The line's id. */
    id: string;

    /** The strap's radius, metres. */
    radius: number;

    /** Its points in the world, metres, in order. */
    points: readonly IAutoMovieVector3[];
  }

  /**
   * What moves with the course at one of its states: the archetype in its state
   * there and its root's placement in the world.
   */
  export interface IPose<Id extends string, Dimension extends string> {
    /** The archetype in its state at that point of the course. */
    archetype: AutoMovieArchetype<Id, Dimension>;

    /**
     * The placement of the archetype's root in the world, which may differ from
     * the course's own by a lean or a bob.
     */
    placement: IAutoMovieTransform;

    /**
     * One contact's frame in the archetype's space at this pose, read from what
     * carries it alone, without posing the whole model; undefined, or absent,
     * where only the posed `archetype` places it. A ride's `frame` reads it
     * first, so a carried reader's seat or stirrup does not pose a whole
     * horse.
     *
     * @param id The contact's id, one the archetype declares.
     * @returns The frame, or undefined.
     */
    frame?(id: Id): IAutoMovieTransform | undefined;
  }

  /** A ride. */
  export interface IRide<Id extends string, Dimension extends string> {
    /** The planned course. */
    plan: AutoMovieArchetypeCourse.IPlan;

    /** The film second the ride ends, its course's `duration`. */
    duration: number;

    /** Named instants in time order. */
    instants: readonly { seconds: number; label: string }[];

    /**
     * The support at a second, held at its start before its course begins and
     * at its end after it ends.
     */
    at: (seconds: number) => ISample<Id, Dimension>;

    /**
     * The world frame of one of the support's contacts at a second, seconds
     * held to the ride as `at` holds them; an id the archetype lacks is refused
     * as `AutoMovieArchetype.affordance` refuses it.
     */
    frame(id: Id, seconds: number): IAutoMovieTransform;
  }

  /** The world placement and selected contact frames at one tow instant. */
  export type ITowedSample<Id extends string> =
    ArchetypeTowedGeometry.ITowedSample<Id>;

  /** A ride with an exact arbitrary-time contact query for the towed support. */
  export type ITowedRide<
    Id extends string,
    Dimension extends string,
  > = ArchetypeTowedGeometry.ITowedRide<Id, Dimension>;

  /**
   * A ride of an archetype along a course.
   *
   * @param archetype The support at rest.
   * @param course The course its root follows, or its plan when the caller has
   *   already planned it.
   * @param pose The support's model and root placement at the current course
   *   state and film second. Without a poser the source model follows the
   *   course unchanged.
   * @param instants Instants the support adds to the course's.
   * @returns The ride.
   * @throws {AutoMovieArchetypeRefusal} As {@link AutoMovieArchetypeCourse.plan}
   *   does for a malformed course.
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
      return {
        archetype: sample.archetype,
        placement: sample.placement,
        course: state,
      };
    }
    const ride: IRide<Id, D> = {
      plan,
      duration: plan.duration,
      instants: [...plan.instants, ...instants].sort(
        (p: { seconds: number }, q: { seconds: number }): number =>
          p.seconds - q.seconds,
      ),
      at,
      // A contact's frame reads only what carries it where the poser can
      // place it alone; otherwise the posed model's own contact.
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const state: AutoMovieArchetypeCourse.IState = plan.at(seconds);
        const sample: IPose<Id, D> | undefined = pose?.(state, seconds);
        if (sample === undefined)
          return AutoMovieArchetypeFrame.compose(
            state.placement,
            archetype.affordance(id).frame,
          );
        // An id the archetype lacks is refused before any demand path reads it.
        archetype.affordance(id);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.frame?.(id) ?? sample.archetype.affordance(id).frame,
        );
      },
    };
    return ride;
  }

  /**
   * Ride a rigid articulated model. The travel reader is given a contact id
   * when a named frame needs only its carrier's inputs. A foreign or flexible
   * model requests full travels and uses its ordinary poser.
   */
  export function articulated<Id extends string, D extends string>(
    model: AutoMovieArchetype<Id, D>,
    plan: AutoMovieArchetypeCourse.IPlan,
    read: (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
      contact?: Id,
    ) => Partial<Record<Id, number>>,
    options: {
      instants?: readonly { seconds: number; label: string }[];
      placement?: (
        state: AutoMovieArchetypeCourse.IState,
        seconds: number,
      ) => IAutoMovieTransform;
    } = {},
  ): IRide<Id, D> {
    const site: ReturnType<typeof model.prepareArticulateSite> =
      model.prepareArticulateSite();
    return along(
      model,
      plan,
      (
        state: AutoMovieArchetypeCourse.IState,
        seconds: number,
      ): IPose<Id, D> => {
        return {
          get archetype(): typeof model {
            return model.articulate(read(state, seconds));
          },
          placement: options.placement?.(state, seconds) ?? state.placement,
          ...(site === undefined
            ? {}
            : {
                frame: (id: Id): IAutoMovieTransform | undefined =>
                  site(id, read(state, seconds, id))?.frame,
              }),
        };
      },
      options.instants,
    );
  }

  /**
   * A trailer towed by a leader: the trailer's coupling held on the leader's
   * hitch at every second, and its axle following as a single-axle trailer
   * does, its heading lagging into the turns.
   *
   * The trailer is drawn by any ride, a car's, a horse's or a cart's along a
   * course. Its axle line, the trailer's own `X` axis through `axle`, never
   * slides sideways, so its heading turns toward the hitch at the hitch's
   * sideways speed over the coupling's distance ahead of the axle; the heading
   * is integrated from the leader's start, the trailer then aligned behind the
   * hitch, by the engine's integrator (`integrateMotionTrajectory`), so the
   * trailer's path depends only on the leader's and its own start. A
   * four-wheeled wagon is two such links: its pole and front axle turn about
   * the front axle's pivot, trailing the hitch, and its body trails the pivot
   * on its rear axle, the front axle's articulation set to the two links'
   * difference. The ride publishes the leader's plan and instants, and at each
   * second the leader's course state with the trailer's placement. The lines
   * given in `lines` run between the two: at every second each of their points
   * is found on the leader's model as the leader's ride poses and places it, or
   * on the trailer's as this ride does, so a trace or a driving line stays on
   * both at once, whatever either does.
   *
   * @param leader The leader's ride.
   * @param hitch The leader's contact the trailer is hitched to.
   * @param trailer The trailer at rest.
   * @param coupling The source contact held on the hitch; legacy inputs require
   *   it ahead along +Z, while declared single-axle support can tow a rear
   *   contact in reverse.
   * @param options Support is producer-read axle geometry: a single axle
   *   permits body pitch, and fixedGround keeps two axles grounded with an
   *   optional drawbar hinge. Without it only an unchanged level coupling
   *   height is supported. Existing axle/front declarations must agree with
   *   supplied support; pose supplies current articulations and lines supplies
   *   inter-model spans. ground, with single-axle support, seats the wheels on
   *   the authored plane under the axle instead of the leader's course datum.
   * @returns The trailer's ride.
   * @throws {AutoMovieArchetypeRefusal} For inconsistent support/options, an
   *   unreachable or unsupported hitch height, an invalid support/articulation,
   *   a coupling that does not close, a nonpositive projected reach, missing
   *   contacts/line ends or front steering beyond its declared lock.
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
    // The hitch is one contact of the leader, read by itself on every route.
    const hitchAt = (seconds: number): IAutoMovieVector3 =>
      leader.frame(hitch, seconds).translation;
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
      return AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
        f: (
          t: number,
          x: readonly number[],
        ): IAutoMovieIntegrateMotionTrajectory.IRate => {
          const ahead: IAutoMovieVector3 = hitchAt(t + 5e-4);
          const behind: IAutoMovieVector3 = hitchAt(t - 5e-4);
          const vx: number = (ahead.x - behind.x) / 1e-3;
          const vz: number = (ahead.z - behind.z) / 1e-3;
          const theta: number = x[0]!;
          const centre: IAutoMovieVector3 = hitchAt(t);
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

    /** The span owner resolves the posed endpoint before world placement. */
    const world = (
      model: Readonly<{
        archetype: string;
        parts: readonly IAutoMovieModelPart[];
        affordances: readonly IAutoMovieAffordance[];
      }>,
      where: IAutoMovieTransform,
      end: AutoMovieArchetypeSpan.IEnd,
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
    /**
     * Solve the current support once. Only a demanded frame or line lays its
     * geometry.
     */
    const read = (
      seconds: number,
    ): ITowedSample<Id> & { full(): ISample<Id, Dimension> } => {
      const sample: ISample<LeaderId, LeaderDimension> = leader.at(seconds);
      const state: readonly number[] = heading.at(seconds).x;
      const theta: number = state[0]!;
      const phi: number = front === null ? theta : state[1]!;
      const point: IAutoMovieVector3 = hitchAt(seconds);
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
      if (error > 64 * Number.EPSILON * scale)
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
      const pointAt = (part: ILinePoint): IAutoMovieVector3 => {
        if (part.type === "leader")
          return world(sample.archetype, sample.placement, part.leader);
        if (part.type === "trailer")
          return world(steered, placement, part.trailer);
        return { ...part.held(seconds) };
      };
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
