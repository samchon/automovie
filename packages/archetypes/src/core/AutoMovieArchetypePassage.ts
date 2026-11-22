import {
  Quaternion,
  computeModelRestExtent,
  convexHull2D,
  segmentSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieComputeModelRestExtent,
  IAutoMovieCrowdAgent,
  IAutoMovieModel,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeCourse } from "./AutoMovieArchetypeCourse";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import type { AutoMovieArchetypeRide } from "./AutoMovieArchetypeRide";

/**
 * Clearance between bodies that pass one another on planned courses: ridden
 * or driven supports, walkers given a timed course, and fixed set pieces.
 *
 * Each body is a footprint on the floor: the convex hull of an outline, grown
 * by a radius, so a rest-extent box, a disc and a capsule are one form. A
 * participant's footprint is carried by its course plan's placement at every
 * second; an obstacle's stands in the world. Each body keeps its own margin
 * from any other, and a pair keeps the larger of its two.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is measured, the footprint form, how a footprint moves and how a pair's margin is chosen.
 * @evidence contracts/development/design.md#principled-representation Floor-plan geometry in world metres and film seconds: outlines in a body's own root frame or the world, plans for time, margins in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `footprint`, `conflicts` and `admit`, read by a staged passage of mounted pairs, walkers and set pieces; the course plans are `AutoMovieArchetypeCourse`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Participants and obstacles are separate lists, so a fixed body never carries a plan and a moving one always does.
 */
export namespace AutoMovieArchetypePassage {
  /**
   * A body's floor footprint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame, unit and range.
   * @evidence contracts/development/design.md#principled-representation A convex outline in metres, y ignored, grown by a radius of at least 0; `conflicts` refuses an empty or nonfinite outline and a negative radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; given by a participant and an obstacle, and made from a model by `footprint`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFootprint {
    /** The outline's points, metres; their convex hull on the floor is the outline. A participant's are in its root's frame, `+X` to its left and `+Z` ahead; an obstacle's are in the world. At least one. */
    outline: readonly IAutoMovieVector3[];

    /** Metres the outline grows by on every side, at least 0: a disc's radius about one point, a capsule's about two. */
    radius: number;
  }

  /**
   * A body that moves on a planned course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A unique name, the plan whose placement carries the footprint, and a margin in metres of at least 0.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; a mounted pair, a walker or a vehicle in a passage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
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

  /**
   * A body fixed in the set.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A unique name, a footprint in the world and a margin in metres of at least 0.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; a dais, a barrier or a reviewing stand in a passage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IObstacle {
    /** Its name, unique among the participants and obstacles; conflicts name it. */
    id: string;

    /** Its footprint in the world. */
    footprint: IFootprint;

    /** The clearance it keeps from every participant, metres, at least 0. */
    margin: number;
  }

  /**
   * A passage to measure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit, default and range.
   * @evidence contracts/development/design.md#principled-representation The bodies, a window in film seconds and a sampling step in seconds; `conflicts` refuses duplicate names, a window that does not run forward and a step that is not positive.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the argument of `conflicts` and `admit`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IProps {
    /** The moving bodies. */
    participants: readonly IParticipant[];

    /** The fixed bodies; none when absent. Obstacles are measured against participants only. */
    obstacles?: readonly IObstacle[];

    /** The first film second measured; 0 when absent. */
    from?: number;

    /** The last film second measured, after `from`; the latest participant plan's end when absent. */
    to?: number;

    /** Seconds between measured instants, positive, such as one film frame; each sampled minimum between instants is refined. */
    step: number;
  }

  /**
   * An interval in which two bodies come inside their margin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The two names, the interval and the closest instant in film seconds, and the closest and required clearances in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; listed by `conflicts` and carried by `admit`'s refusal as its value.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
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

    /** Their least clearance in the interval, metres: the outlines' distance less both radii, negative only where the radii overlap. */
    clearance: number;

    /** The margin the pair keeps, metres: the larger of the two bodies'. */
    required: number;
  }

  /**
   * A model's footprint: the floor rectangle of its rest-pose extent, everything its portable parts draw, carried equipment included.
   *
   * @param model The model, standing in its own frame.
   * @returns The rectangle's four corners in the model's frame, radius 0.
   * @throws {AutoMovieArchetypeRefusal} When the model has no portable geometry to measure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured, the frame and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's `computeModelRestExtent`, which places every part vertex as the renderer does, read on the floor axes. A posed body's limbs reaching beyond the rest pose are outside it, so the caller's margin covers them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One measurement and its four corners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A model with nothing to measure is refused, never given a stand-in size.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the model's vertices inside the engine's measurement.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one model; a caller footprinting many members of one model keeps the result.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function footprint(model: IAutoMovieModel): IFootprint {
    const extent: IAutoMovieComputeModelRestExtent.IResult =
      computeModelRestExtent(model);
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
   * A ride's footprint over a window: the floor rectangle holding every posed extent of the ridden model in its root's frame, so swinging limbs, a nodding head and anything the ride carries count.
   *
   * @param ride The ride, whose samples carry the posed model and its placement.
   * @param from The first film second.
   * @param to The last film second, after `from`.
   * @param step Seconds between poses read, positive.
   * @param carried The world points of a body the ride carries at a second, such as a seated rider's bones; none when absent.
   * @returns The rectangle's four corners in the root's frame, radius 0.
   * @throws {AutoMovieArchetypeRefusal} When no posed model has portable geometry to measure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured, the frame, the window and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's `computeModelRestExtent` of each posed model read every step, whose parts already stand where the ride put them in the root's frame; the union of those extents bounds every read pose. A pose reaching further between reads is outside it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One extent per read and a running union.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is padded; an unmeasurable ride is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pose and one vertex pass per read.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the ride and window.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
        computeModelRestExtent(sample.archetype);
      if (posed !== null) {
        grow(posed.min.x, posed.min.z);
        grow(posed.max.x, posed.max.z);
      }

      // A carried body's world points, such as a seated rider's bones, brought into the root's frame.
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(
        sample.placement.rotation,
      );
      for (const point of carried(seconds)) {
        const local: IAutoMovieVector3 = Quaternion.rotateVector(inverse, {
          x: point.x - sample.placement.translation.x,
          y: point.y - sample.placement.translation.y,
          z: point.z - sample.placement.translation.z,
        });
        grow(local.x, local.z);
      }
    }
    if (!Number.isFinite(low.x))
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
   * Every interval in which a pair of bodies comes inside its margin, in time order.
   *
   * @param archetype The name a refusal carries.
   * @param props The passage.
   * @returns The conflicts, each pair's intervals separately; empty for an admitted passage and for one without participants, since obstacles are measured only against them.
   * @throws {AutoMovieArchetypeRefusal} When a name is empty or repeated, a footprint is empty, nonfinite or has a negative radius, a margin is negative or nonfinite, the window does not run forward, or the step is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's order and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The clearance of two placed footprints is the least distance between their convex hulls, from the engine's segment distance over edge pairs and zero when one hull holds the other's vertex, less both radii. It is continuous in time because each plan's placement is. Instants every `step` locate each run below the margin; bisection between an admitted and a refused instant places each end, and golden-section search refines the closest instant of a run and every sampled minimum between instants, so a dip between two admitted instants is found when it is the bracket's one minimum. A level run is refined once, at its first instant. A dip that enters and leaves between instants with no sampled minimum beside it is not proven absent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the inputs and hull every footprint once, measure every pair at every instant, then scan each pair's run of values.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Margins and the step are the caller's; no clearance is clamped and no pair is skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms For P participants, O obstacles, T instants and hulls of at most V vertices: T*P placements and T*(P*P/2+P*O) hull distances of O(V*V), plus a fixed number of refinements per run and per sampled minimum.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each participant is placed once per instant and that placement serves all its pairs; the hulls are built once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call holds the T*P placed hulls and T values per pair until it returns the conflicts.
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
   * A participant as a moving obstacle crowd steering walks round: its footprint's hull in its own frame, carried by its plan.
   *
   * @param participant The participant; its footprint's radius must be 0, since a steering obstacle is a bare polygon.
   * @returns The obstacle; its motion reads the plan's position and heading at a film second.
   * @throws {AutoMovieArchetypeRefusal} On `footprint.radius` when the radius is not 0.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the motion and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The hull of the outline is the convex footprint the steering pass reads in the body's frame, and the yaw is the plan's forward axis seen from above, the same convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One hull and one reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rounded footprint is refused rather than shrunk to its core. The participant's margin grows the hull outward with mitred corners, which hold every point within the margin, so steering keeps the authored clearance; the steered courses are still verified with `conflicts`.
   * @evidence contracts/development/implementation.md#efficient-algorithms One hull; constant work per reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one participant.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The motion keeps the participant's plan for as long as the obstacle is held.
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
        convexHull2D(
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
        const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
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
   * @throws {AutoMovieArchetypeRefusal} As `conflicts` does for malformed inputs, and at the earliest conflict on the later-listed participant's plan, `participants[i].plan`, with the conflict as its value, the required clearance as its feasible range and both names and the interval in its reason.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the refusal's axis, value, range and reason.
   * @evidence contracts/development/implementation.md#principled-implementation `conflicts`, then the first in time order; the later-listed participant's route is the one an author reroutes against the earlier, and against an obstacle the participant's own.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One measurement and one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is admitted inside a margin.
   * @evidence contracts/development/implementation.md#efficient-algorithms As `conflicts`, plus a scan of the participant names.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One call of `conflicts`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

/** Where a steering obstacle stands at a second: its world position and its yaw in degrees. */
type IObstaclePlacement = ReturnType<
  NonNullable<IAutoMovieCrowdAgent.IObstacle["motion"]>
>;

/** Halvings that place an interval's end, and golden-section steps that place a minimum: forty shrink a one-frame bracket below a picosecond, past which a film second carries no meaning. */
const REFINE: number = 40;

/** The golden section's inner ratio, (sqrt 5 - 1) / 2. */
const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

/** A body's admitted footprint: its hull, radius and margin. */
interface IHull {
  /** The convex hull's points on the floor, counter-clockwise, y 0. */
  points: IAutoMovieVector3[];

  /** The footprint's radius, metres. */
  radius: number;

  /** The body's margin, metres. */
  margin: number;
}

/** Two bodies measured together. */
interface IPair {
  /** The earlier-listed participant's name. */
  subject: string;

  /** The later-listed participant's or the obstacle's name. */
  other: string;

  /** The margin the pair keeps, metres. */
  required: number;

  /**
   * The pair's clearance at any film second.
   *
   * @param seconds The film second.
   * @returns Metres.
   */
  at(seconds: number): number;

  /**
   * The pair's clearance at a measured instant, from the shared placements.
   *
   * @param k The instant's index.
   * @returns Metres.
   */
  sampled(k: number): number;
}

/** A located minimum of a pair's clearance. */
interface IMinimum {
  /** The film second. */
  seconds: number;

  /** The clearance there, metres. */
  clearance: number;
}

/** Refuse a window that does not run forward or a step that is not positive. */
function admitWindow(
  archetype: string,
  from: number,
  to: number,
  step: number,
): void {
  if (!(Number.isFinite(from) && Number.isFinite(to) && to > from))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "to",
      value: to,
      feasible: { kind: "range", minimum: from, maximum: null, unit: "s" },
      reason: `the window from ${from} s to ${to} s does not run forward`,
      fix: "give finite seconds with the last after the first",
    });
  if (!(Number.isFinite(step) && step > 0))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "step",
      value: step,
      feasible: { kind: "range", minimum: 0, maximum: null, unit: "s" },
      reason: `a step of ${step} s does not advance`,
      fix: "give a positive step, such as one film frame",
    });
}

/** Admit one body's name, margin and footprint, and hull its outline. */
function admitBody(
  archetype: string,
  axis: string,
  body: AutoMovieArchetypePassage.IObstacle,
  names: Set<string>,
): IHull {
  const refuse: (field: string, value: unknown, reason: string) => never = (
    field: string,
    value: unknown,
    reason: string,
  ): never => {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: `${axis}.${field}`,
      value,
      reason,
      fix: "give each body a unique name, a finite margin and radius of at least 0 and at least one finite outline point",
    });
  };
  if (body.id.length === 0 || names.has(body.id))
    refuse("id", body.id, `the name "${body.id}" is empty or already taken`);
  names.add(body.id);
  if (!(Number.isFinite(body.margin) && body.margin >= 0))
    refuse("margin", body.margin, "a margin is finite and at least 0");
  if (!(Number.isFinite(body.footprint.radius) && body.footprint.radius >= 0))
    refuse(
      "footprint.radius",
      body.footprint.radius,
      "a radius is finite and at least 0",
    );
  if (
    body.footprint.outline.length === 0 ||
    body.footprint.outline.some(
      (point: IAutoMovieVector3): boolean =>
        !(Number.isFinite(point.x) && Number.isFinite(point.z)),
    )
  )
    refuse(
      "footprint.outline",
      body.footprint.outline,
      "an outline has at least one finite point",
    );
  return {
    points: convexHull2D(
      body.footprint.outline.map(
        (point: IAutoMovieVector3): IAutoMovieVector3 => ({
          x: point.x,
          y: 0,
          z: point.z,
        }),
      ),
    ),
    radius: body.footprint.radius,
    margin: body.margin,
  };
}

/** A hull carried by a plan's placement at a second, projected onto the floor. */
function place(
  plan: AutoMovieArchetypeCourse.IPlan,
  points: readonly IAutoMovieVector3[],
  seconds: number,
): IAutoMovieVector3[] {
  const state: AutoMovieArchetypeCourse.IState = plan.at(seconds);
  const origin: IAutoMovieVector3 = state.placement.translation;
  return points.map((point: IAutoMovieVector3): IAutoMovieVector3 => {
    const turned: IAutoMovieVector3 = Quaternion.rotateVector(
      state.placement.rotation,
      point,
    );
    return { x: origin.x + turned.x, y: 0, z: origin.z + turned.z };
  });
}

/** The least distance between two convex floor hulls: over every pair of edges, a single point or segment being its own edge, and zero when one holds a vertex of the other. */
function separation(
  a: readonly IAutoMovieVector3[],
  b: readonly IAutoMovieVector3[],
): number {
  let least: number = Infinity;
  for (let i: number = 0; i < sides(a); ++i)
    for (let j: number = 0; j < sides(b); ++j)
      least = Math.min(
        least,
        segmentSegmentDistance(
          a[i]!,
          a[(i + 1) % a.length]!,
          b[j]!,
          b[(j + 1) % b.length]!,
        ),
      );
  return least > 0 && (inside(a[0]!, b) || inside(b[0]!, a)) ? 0 : least;
}

/** How many edges a hull has: one for a point or a segment, else one per vertex. */
function sides(hull: readonly IAutoMovieVector3[]): number {
  return hull.length < 3 ? 1 : hull.length;
}

/** Whether a point lies inside a counter-clockwise hull of at least three vertices: on the left of, or on, every edge. */
function inside(
  point: IAutoMovieVector3,
  hull: readonly IAutoMovieVector3[],
): boolean {
  if (hull.length < 3) return false;
  return hull.every((from: IAutoMovieVector3, i: number): boolean => {
    const to: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
    return (
      (to.x - from.x) * (point.z - from.z) -
        (to.z - from.z) * (point.x - from.x) >=
      0
    );
  });
}

/** One pair's conflicts: each run of instants inside the margin, and each sampled minimum whose refinement dips inside it. */
function scan(
  pair: IPair,
  times: readonly number[],
): AutoMovieArchetypePassage.IConflict[] {
  const slack: number[] = times.map(
    (_: number, k: number): number => pair.sampled(k) - pair.required,
  );
  const below: (seconds: number) => boolean = (seconds: number): boolean =>
    pair.at(seconds) - pair.required < 0;
  const found: AutoMovieArchetypePassage.IConflict[] = [];
  const last: number = times.length - 1;
  let k: number = 0;
  while (k <= last) {
    const before: number = times[Math.max(0, k - 1)]!;
    const after: number = times[Math.min(last, k + 1)]!;
    if (slack[k]! < 0) {
      let end: number = k;
      while (end < last && slack[end + 1]! < 0) ++end;
      let deepest: number = k;
      for (let m: number = k + 1; m <= end; ++m)
        if (slack[m]! < slack[deepest]!) deepest = m;
      const enter: number =
        k === 0 ? times[0]! : edge(below, times[k - 1]!, times[k]!);
      const leave: number =
        end === last ? times[last]! : edge(below, times[end + 1]!, times[end]!);
      const refined: IMinimum = least(
        pair,
        Math.max(enter, times[Math.max(0, deepest - 1)]!),
        Math.min(leave, times[Math.min(last, deepest + 1)]!),
        {
          seconds: times[deepest]!,
          clearance: slack[deepest]! + pair.required,
        },
      );
      found.push(conflict(pair, enter, leave, refined));
      k = end + 1;
      continue;
    }
    // A sampled minimum: below the instant before it and not above the one
    // after, so a level run is refined once, at its first instant.
    const minimum: boolean =
      (k === 0 || slack[k]! < slack[k - 1]!) &&
      (k === last || slack[k]! <= slack[k + 1]!) &&
      before < after;
    if (!minimum) {
      ++k;
      continue;
    }
    const refined: IMinimum = least(pair, before, after, {
      seconds: times[k]!,
      clearance: slack[k]! + pair.required,
    });
    if (!(refined.clearance < pair.required)) {
      ++k;
      continue;
    }
    const dip: AutoMovieArchetypePassage.IConflict = conflict(
      pair,
      edge(below, before, refined.seconds),
      edge(below, after, refined.seconds),
      refined,
    );
    found.push(dip);
    while (k <= last && times[k]! <= dip.to) ++k;
  }
  return found;
}

/** The refused end of a bracket between an admitted second and a refused one, by bisection. */
function edge(
  below: (seconds: number) => boolean,
  admitted: number,
  refused: number,
): number {
  let outside: number = admitted;
  let within: number = refused;
  for (let step: number = 0; step < REFINE; ++step) {
    const middle: number = (outside + within) / 2;
    if (below(middle)) within = middle;
    else outside = middle;
  }
  return within;
}

/** The least clearance in a bracket by golden-section search, or the sampled one when no inner reading is lower. */
function least(
  pair: IPair,
  low: number,
  high: number,
  sampled: IMinimum,
): IMinimum {
  let a: number = low;
  let b: number = high;
  let c: number = b - GOLDEN * (b - a);
  let d: number = a + GOLDEN * (b - a);
  let fc: number = pair.at(c);
  let fd: number = pair.at(d);
  for (let step: number = 0; step < REFINE; ++step)
    if (fc < fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - GOLDEN * (b - a);
      fc = pair.at(c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + GOLDEN * (b - a);
      fd = pair.at(d);
    }
  const best: IMinimum =
    fc < fd ? { seconds: c, clearance: fc } : { seconds: d, clearance: fd };
  return best.clearance < sampled.clearance ? best : sampled;
}

/** A conflict record of a pair over an interval. */
function conflict(
  pair: IPair,
  from: number,
  to: number,
  closest: IMinimum,
): AutoMovieArchetypePassage.IConflict {
  return {
    subject: pair.subject,
    other: pair.other,
    from,
    to,
    seconds: closest.seconds,
    clearance: closest.clearance,
    required: pair.required,
  };
}

/** A counter-clockwise hull grown outward by a distance with mitred corners, which holds every point within that distance of the hull; a point or a segment grows into a square or a rectangle about it. */
function mitre(
  hull: readonly IAutoMovieVector3[],
  distance: number,
): IAutoMovieVector3[] {
  if (distance === 0) return [...hull];
  if (hull.length < 3) {
    const a: IAutoMovieVector3 = hull[0]!;
    const b: IAutoMovieVector3 = hull[hull.length - 1]!;
    const length: number = Math.hypot(b.x - a.x, b.z - a.z);
    const ux: number = length > 0 ? (b.x - a.x) / length : 1;
    const uz: number = length > 0 ? (b.z - a.z) / length : 0;
    const corner: (
      from: IAutoMovieVector3,
      along: number,
      across: number,
    ) => IAutoMovieVector3 = (
      from: IAutoMovieVector3,
      along: number,
      across: number,
    ): IAutoMovieVector3 => ({
      x: from.x + distance * (along * ux - across * uz),
      y: 0,
      z: from.z + distance * (along * uz + across * ux),
    });
    return [
      corner(a, -1, -1),
      corner(b, 1, -1),
      corner(b, 1, 1),
      corner(a, -1, 1),
    ];
  }
  // Each edge's outward normal is its direction turned clockwise, the side away from a counter-clockwise interior.
  const normal: (k: number) => IAutoMovieVector3 = (
    k: number,
  ): IAutoMovieVector3 => {
    const from: IAutoMovieVector3 = hull[k]!;
    const to: IAutoMovieVector3 = hull[(k + 1) % hull.length]!;
    const length: number = Math.hypot(to.x - from.x, to.z - from.z);
    return { x: (to.z - from.z) / length, y: 0, z: -(to.x - from.x) / length };
  };
  return hull.map((vertex: IAutoMovieVector3, k: number): IAutoMovieVector3 => {
    const a: IAutoMovieVector3 = normal((k + hull.length - 1) % hull.length);
    const b: IAutoMovieVector3 = normal(k);
    const scale: number = distance / (1 + a.x * b.x + a.z * b.z);
    return {
      x: vertex.x + (a.x + b.x) * scale,
      y: 0,
      z: vertex.z + (a.z + b.z) * scale,
    };
  });
}
