import { AutoMovieEngineQuaternion, AutoMovieEngineMath, AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMovieComputeModelRestExtent, IAutoMovieCrowdAgent, IAutoMovieModel, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import type { AutoMovieArchetypeCourse } from "./AutoMovieArchetypeCourse";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import type { AutoMovieArchetypeRide } from "./AutoMovieArchetypeRide";
import { AutoMovieArchetypePassageSearch } from "./internal/AutoMovieArchetypePassageSearch";

/**
 * Clearance between bodies that pass one another on planned courses: ridden or
 * driven supports, walkers given a timed course, and fixed set pieces.
 *
 * Each body is a footprint on the floor: the convex hull of an outline, grown
 * by a radius, so a rest-extent box, a disc and a capsule are one form. A
 * participant's footprint is carried by its course plan's placement at every
 * second; an obstacle's stands in the world. Each body keeps its own margin
 * from any other, and a pair keeps the larger of its two.
 */
export namespace AutoMovieArchetypePassage {
  /** A body's floor footprint. */
  export interface IFootprint {
    /**
     * The outline's points, metres; their convex hull on the floor is the
     * outline. A participant's are in its root's frame, `+X` to its left and
     * `+Z` ahead; an obstacle's are in the world. At least one.
     */
    outline: readonly IAutoMovieVector3[];

    /**
     * Metres the outline grows by on every side, at least 0: a disc's radius
     * about one point, a capsule's about two.
     */
    radius: number;
  }

  /** A body that moves on a planned course. */
  export interface IParticipant {
    /** Its name, unique among the participants and obstacles; conflicts name it. */
    id: string;

    /** Its course; the footprint rides the plan's placement. */
    plan: AutoMovieArchetypeCourse.IPlan;

    /** Its footprint in its root's frame. */
    footprint: IFootprint;

    /** The clearance it keeps from every other body, metres, at least 0. */
    margin: number;
  }

  /** A body fixed in the set. */
  export interface IObstacle {
    /** Its name, unique among the participants and obstacles; conflicts name it. */
    id: string;

    /** Its footprint in the world. */
    footprint: IFootprint;

    /** The clearance it keeps from every participant, metres, at least 0. */
    margin: number;
  }

  /** A passage to measure. */
  export interface IProps {
    /** The moving bodies. */
    participants: readonly IParticipant[];

    /**
     * The fixed bodies; none when absent. Obstacles are measured against
     * participants only.
     */
    obstacles?: readonly IObstacle[];

    /** The first film second measured; 0 when absent. */
    from?: number;

    /**
     * The last film second measured, after `from`; the latest participant
     * plan's end when absent.
     */
    to?: number;

    /**
     * Seconds between measured instants, positive, such as one film frame; each
     * sampled minimum between instants is refined.
     */
    step: number;
  }

  /** An interval in which two bodies come inside their margin. */
  export interface IConflict {
    /** The earlier-listed participant. */
    subject: string;

    /** The later-listed participant, or the obstacle. */
    other: string;

    /** The first film second inside the margin. */
    from: number;

    /** The last film second inside the margin. */
    to: number;

    /** The film second the two come closest in the interval. */
    seconds: number;

    /**
     * Their least clearance in the interval, metres: the outlines' distance
     * less both radii, negative only where the radii overlap.
     */
    clearance: number;

    /** The margin the pair keeps, metres: the larger of the two bodies'. */
    required: number;
  }

  /**
   * A model's footprint: the floor rectangle of its rest-pose extent,
   * everything its portable parts draw, carried equipment included.
   *
   * @param model The model, standing in its own frame.
   * @returns The rectangle's four corners in the model's frame, radius 0.
   * @throws {AutoMovieArchetypeRefusal} When the model has no portable geometry
   *   to measure.
   */
  export function footprint(model: IAutoMovieModel): IFootprint {
    const extent: IAutoMovieComputeModelRestExtent.IResult =
      AutoMovieEngineFilm.computeModelRestExtent(model);
    if (extent === null)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: model.name ?? model.id,
        axis: "model",
        value: model.id,
        reason:
          "the model draws no portable geometry to measure a footprint from",
        fix: "give the passage the body's footprint outline instead",
      });
    return {
      outline: [
        { x: extent.min.x, y: 0, z: extent.min.z },
        { x: extent.max.x, y: 0, z: extent.min.z },
        { x: extent.max.x, y: 0, z: extent.max.z },
        { x: extent.min.x, y: 0, z: extent.max.z },
      ],
      radius: 0,
    };
  }

  /**
   * A ride's footprint over a window: the floor rectangle holding every posed
   * extent of the ridden model in its root's frame, so swinging limbs, a
   * nodding head and anything the ride carries count.
   *
   * @param ride The ride, whose samples carry the posed model and its
   *   placement.
   * @param from The first film second.
   * @param to The last film second, after `from`.
   * @param step Seconds between poses read, positive.
   * @param carried The world points of a body the ride carries at a second,
   *   such as a seated rider's bones; none when absent.
   * @returns The rectangle's four corners in the root's frame, radius 0.
   * @throws {AutoMovieArchetypeRefusal} When no posed model has portable
   *   geometry to measure.
   */
  export function envelope(
    ride: AutoMovieArchetypeRide.IRide<string, string>,
    from: number,
    to: number,
    step: number,
    carried: (
      seconds: number,
    ) => readonly IAutoMovieVector3[] = (): readonly IAutoMovieVector3[] => [],
  ): IFootprint {
    const low: IAutoMovieVector3 = { x: Infinity, y: 0, z: Infinity };
    const high: IAutoMovieVector3 = { x: -Infinity, y: 0, z: -Infinity };
    const grow: (x: number, z: number) => void = (
      x: number,
      z: number,
    ): void => {
      low.x = Math.min(low.x, x);
      low.z = Math.min(low.z, z);
      high.x = Math.max(high.x, x);
      high.z = Math.max(high.z, z);
    };
    for (let k: number = 0; from + k * step <= to; ++k) {
      const seconds: number = from + k * step;
      const sample: AutoMovieArchetypeRide.ISample<string, string> =
        ride.at(seconds);
      const posed: IAutoMovieComputeModelRestExtent.IResult =
        AutoMovieEngineFilm.computeModelRestExtent(sample.archetype);
      if (posed !== null) {
        grow(posed.min.x, posed.min.z);
        grow(posed.max.x, posed.max.z);
      }

      // A carried body's world points, such as a seated rider's bones, brought into the root's frame.
      const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
        sample.placement.rotation,
      );
      for (const point of carried(seconds)) {
        const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(inverse, {
          x: point.x - sample.placement.translation.x,
          y: point.y - sample.placement.translation.y,
          z: point.z - sample.placement.translation.z,
        });
        grow(local.x, local.z);
      }
    }
    if (low.x === Infinity)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "passage",
        axis: "ride",
        value: from,
        reason: "no posed model of the ride draws portable geometry",
        fix: "give the passage the body's footprint outline instead",
      });
    return {
      outline: [
        { x: low.x, y: 0, z: low.z },
        { x: high.x, y: 0, z: low.z },
        { x: high.x, y: 0, z: high.z },
        { x: low.x, y: 0, z: high.z },
      ],
      radius: 0,
    };
  }

  /**
   * Every interval in which a pair of bodies comes inside its margin, in time
   * order.
   *
   * @param archetype The name a refusal carries.
   * @param props The passage.
   * @returns The conflicts, each pair's intervals separately; empty for an
   *   admitted passage and for one without participants, since obstacles are
   *   measured only against them.
   * @throws {AutoMovieArchetypeRefusal} When a name is empty or repeated, a
   *   footprint is empty, nonfinite or has a negative radius, a margin is
   *   negative or nonfinite, the window does not run forward, or the step is
   *   not positive.
   */
  export function conflicts(archetype: string, props: IProps): IConflict[] {
    const participants: readonly IParticipant[] = props.participants;
    if (participants.length === 0) return [];
    const obstacles: readonly IObstacle[] = props.obstacles ?? [];
    const from: number = props.from ?? 0;
    const to: number =
      props.to ??
      Math.max(
        from,
        ...participants.map(
          (participant: IParticipant): number => participant.plan.duration,
        ),
      );
    admitWindow(archetype, from, to, props.step);
    const names: Set<string> = new Set();
    const moving: IHull[] = participants.map(
      (participant: IParticipant, index: number): IHull =>
        admitBody(archetype, `participants[${index}]`, participant, names),
    );
    const fixed: IHull[] = obstacles.map(
      (obstacle: IObstacle, index: number): IHull =>
        admitBody(archetype, `obstacles[${index}]`, obstacle, names),
    );

    // The instants: every step from the first second, and the last.
    const times: number[] = [];
    for (let k: number = 0; from + k * props.step < to; ++k)
      times.push(from + k * props.step);
    times.push(to);
    const placed: IAutoMovieVector3[][][] = times.map(
      (seconds: number): IAutoMovieVector3[][] =>
        participants.map(
          (participant: IParticipant, index: number): IAutoMovieVector3[] =>
            place(participant.plan, moving[index]!.points, seconds),
        ),
    );

    // Each pair measures from both bodies' placements at a second.
    const pairs: IPair[] = [];
    participants.forEach((subject: IParticipant, i: number): void => {
      for (let j: number = i + 1; j < participants.length; ++j)
        pairs.push({
          subject: subject.id,
          other: participants[j]!.id,
          required: Math.max(moving[i]!.margin, moving[j]!.margin),
          at: (seconds: number): number =>
            separation(
              place(subject.plan, moving[i]!.points, seconds),
              place(participants[j]!.plan, moving[j]!.points, seconds),
            ) -
            moving[i]!.radius -
            moving[j]!.radius,
          sampled: (k: number): number =>
            separation(placed[k]![i]!, placed[k]![j]!) -
            moving[i]!.radius -
            moving[j]!.radius,
        });
      fixed.forEach((obstacle: IHull, o: number): void => {
        pairs.push({
          subject: subject.id,
          other: obstacles[o]!.id,
          required: Math.max(moving[i]!.margin, obstacle.margin),
          at: (seconds: number): number =>
            separation(
              place(subject.plan, moving[i]!.points, seconds),
              obstacle.points,
            ) -
            moving[i]!.radius -
            obstacle.radius,
          sampled: (k: number): number =>
            separation(placed[k]![i]!, obstacle.points) -
            moving[i]!.radius -
            obstacle.radius,
        });
      });
    });
    return pairs
      .flatMap((pair: IPair): IConflict[] => scan(pair, times))
      .sort((a: IConflict, b: IConflict): number => a.from - b.from);
  }

  /**
   * A participant as a moving obstacle crowd steering walks round: its
   * footprint's hull in its own frame, carried by its plan.
   *
   * @param participant The participant; its footprint's radius must be 0, since
   *   a steering obstacle is a bare polygon.
   * @returns The obstacle; its motion reads the plan's position and heading at
   *   a film second.
   * @throws {AutoMovieArchetypeRefusal} On `footprint.radius` when the radius
   *   is not 0.
   */
  export function obstacle(
    participant: IParticipant,
  ): IAutoMovieCrowdAgent.IObstacle {
    if (participant.footprint.radius !== 0)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: participant.id,
        axis: "footprint.radius",
        value: participant.footprint.radius,
        feasible: { kind: "range", minimum: 0, maximum: 0, unit: "m" },
        reason:
          "a steering obstacle is a bare polygon and cannot carry a radius",
        fix: "give the participant an outline that already holds its rounding",
      });
    return {
      footprint: mitre(
        AutoMovieEngineMath.convexHull2D(
          participant.footprint.outline.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 => ({
              x: p.x,
              y: 0,
              z: p.z,
            }),
          ),
        ),
        participant.margin,
      ),
      motion: (seconds: number): IObstaclePlacement => {
        const state: AutoMovieArchetypeCourse.IState =
          participant.plan.at(seconds);
        const ahead: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
          state.placement.rotation,
          { x: 0, y: 0, z: 1 },
        );
        return {
          position: { ...state.placement.translation },
          yaw: (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI,
        };
      },
    };
  }

  /**
   * Admit a passage: refuse its first conflict.
   *
   * @param archetype The name the refusal carries.
   * @param props The passage.
   * @throws {AutoMovieArchetypeRefusal} As `conflicts` does for malformed
   *   inputs, and at the earliest conflict on the later-listed participant's
   *   plan, `participants[i].plan`, with the conflict as its value, the
   *   required clearance as its feasible range and both names and the interval
   *   in its reason.
   */
  export function admit(archetype: string, props: IProps): void {
    const found: IConflict[] = conflicts(archetype, props);
    if (found.length === 0) return;
    const first: IConflict = found[0]!;
    const ids: string[] = props.participants.map(
      (participant: IParticipant): string => participant.id,
    );
    const routed: number = ids.includes(first.other)
      ? ids.indexOf(first.other)
      : ids.indexOf(first.subject);
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: `participants[${routed}].plan`,
      value: first,
      feasible: {
        kind: "range",
        minimum: first.required,
        maximum: null,
        unit: "m",
      },
      reason: `${first.subject} and ${first.other} come within ${first.clearance} m from ${first.from} s to ${first.to} s, closest at ${first.seconds} s, inside their ${first.required} m margin`,
      fix: "reroute or retime one of them through that interval, or space their marks wider",
    });
  }
}

const { admitWindow, admitBody, place, separation, scan, mitre } = AutoMovieArchetypePassageSearch;
type IObstaclePlacement = AutoMovieArchetypePassageSearch.IObstaclePlacement;
type IHull = AutoMovieArchetypePassageSearch.IHull;

type IPair = AutoMovieArchetypePassageSearch.IPair;
