import { AutoMovieGravity, steerAutoMovieCrowd } from "@automovie/engine";
import type {
  IAutoMovieBodyMeasure,
  IAutoMovieCrowdAgent,
  IAutoMovieMotionHumanCrowd,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanSkill,
  IAutoMovieRandom,
  IAutoMovieSteerCrowd,
  IAutoMovieVector3,
} from "@automovie/interface";

import { run } from "../gait/internal/run";
import { walk } from "../gait/internal/walk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanResponse } from "../skill/HumanResponse";
import { HumanSkill } from "../skill/HumanSkill";
import { HUMAN_ATTRIBUTE_EFFECTS } from "./HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "./HumanAttribute";

/**
 * A crowd that keeps no formation, steered: each member (or each walking group,
 * as one agent) heads for its goals at its own drawn speed and avoids the
 * others and the obstacles, by one plan-time pass of the engine's
 * `steerAutoMovieCrowd`. The pass gives each member a course; the member's own
 * walk or run then keeps station on it (`walkStation`), so its feet are still
 * whole steps.
 *
 * A member's agent is a disc of its shoulders' half breadth (the shoulder
 * joint's half width plus the upper arm's radius) at its desired speed: its
 * gait's speed at its leg length by dynamic similarity (the walk's normal
 * Froude number, or the run's), scaled by a normal draw with the coefficient of
 * variation of pedestrians' desired speeds, 0.26 over 1.34 m/s (Helbing and
 * Molnar 1995), by fatigue, and in flight by morale
 * (`HUMAN_ATTRIBUTE_EFFECTS`). Its start is the cue plus its latency
 * (`HumanResponse`), and in flight its herding share is morale's. Every draw is
 * keyed by the member; adding a member changes the others' courses (they avoid
 * it) but never their draws.
 */
export namespace HumanCrowd {
  /**
   * The coefficient of variation of desired walking speeds: 0.26 over 1.34 m/s
   * (Helbing and Molnar 1995).
   */
  export const SPREAD: number = 0.26 / 1.34;

  /**
   * The least share of its gait's speed a member's draw may give: one half,
   * about 2.6 `SPREAD`s below the mean (provisional: a floor that keeps the
   * normal draw's far tail from a walker who barely moves).
   */
  export const SLOWEST: number = 0.5;

  /**
   * Seconds between two samples of a steered course, and between two checks of
   * a manoeuvre's spacing: the 24 frames a second the motion's checks are read
   * at (provisional: no film's own rate is known to the laws).
   */
  export const STEP: number = 1 / 24;

  /** What a member's desire reads of its ensemble: the seed and the id. */
  export interface IDesiredEnsemble {
    /** The ensemble's seed and id. */
    input: Pick<IAutoMovieMotionHumanEnsemble.IInput, "seed" | "id">;
  }

  /** What a member's desire reads of it. */
  export interface IDesiredMember
    extends Pick<
      IAutoMovieMotionHumanEnsemble.IMember,
      "index" | "proficiency" | "attributes"
    > {
    /** The member's hip height. */
    body: { measure: Pick<IAutoMovieBodyMeasure, "hipHeight"> };
  }

  /** What a member's half breadth reads of it. */
  export interface IHalfMember {
    /** The member's shoulder half width and upper arm radius. */
    body: {
      measure: Pick<IAutoMovieBodyMeasure, "shoulderHalfWidth" | "upperArmRadius">;
    };
  }

  /**
   * A member's desired speed and delay as the pass draws them: its gait's speed
   * at its leg length scaled by its keyed normal draw (floored at `SLOWEST`,
   * its spread widened in flight by low morale's fluctuation,
   * `HUMAN_ATTRIBUTE_EFFECTS.morale.fluctuation`), by fatigue and in flight by
   * morale, and its response latency when the request names one.
   *
   * @param ensemble The ensemble.
   * @param m The member.
   * @param request The request.
   * @returns The member's desire.
   */
  export function desired(
    ensemble: IDesiredEnsemble,
    m: IDesiredMember,
    request: Pick<IAutoMovieMotionHumanCrowd.IRequest, DesiredRequest>,
  ): IAutoMovieMotionHumanCrowd.IDesired {
    const skill: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
      m.proficiency,
      ensemble.input.seed,
    );
    const random: IAutoMovieRandom = HumanAttribute.stream(
      ensemble.input.seed,
      ensemble.input.id,
      m.index,
      "crowd",
    );
    const froude: number =
      request.gait === "walk" ? walk.FROUDE.normal : run.GAITS.run.froude;
    const speed: number =
      Math.sqrt(froude * AutoMovieGravity.STANDARD * m.body.measure.hipHeight) *
      Math.max(
        SLOWEST,
        1 +
          SPREAD *
            (request.flight === true
              ? HumanAttribute.effect(
                  HUMAN_ATTRIBUTE_EFFECTS.morale.fluctuation,
                  m.attributes.morale,
                  1,
                )
              : 1) *
            HumanSkill.normal(random, 0),
      ) *
      HumanAttribute.effect(
        HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace,
        m.attributes.fatigue,
        0,
      ) *
      (request.flight === true
        ? HumanAttribute.effect(
            HUMAN_ATTRIBUTE_EFFECTS.morale.speed,
            m.attributes.morale,
            1,
          )
        : 1);
    const delay: number =
      request.latency === undefined
        ? 0
        : HumanResponse.latency(
            skill,
            HumanAttribute.stream(
              ensemble.input.seed,
              ensemble.input.id,
              m.index,
              "crowd:latency",
            ),
            request.latency,
            false,
            m.attributes,
          );
    return { speed, delay };
  }

  /**
   * Plan the crowd's routes and sample all leaders together on the 24 Hz course
   * grid. A group shares its leader's route and arrival. The combined breadth
   * disc is a steering proxy; placed members' clearances depend on their
   * formation offsets and course heading.
   *
   * @param ensemble The ensemble.
   * @param request The goals, the gait, the cue and the obstacles.
   * @returns The course frames and arrivals.
   * @throws {HumanRefusal} When two steering proxies, or a proxy and an
   *   obstacle, overlap at two successive integration knots.
   */
  export function steer(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    request: IAutoMovieMotionHumanCrowd.IRequest,
  ): IAutoMovieMotionHumanCrowd.IResult {
    const members: readonly IAutoMovieMotionHumanEnsemble.IMember[] =
      ensemble.members;
    const grouped: Map<number, IAutoMovieMotionHumanEnsemble.IGroup> =
      new Map();
    for (const group of request.groups ?? [])
      for (const index of group.members) grouped.set(index, group);

    // One agent per lone member and per group, led by its first member.
    const leaders: IAutoMovieMotionHumanEnsemble.IMember[] = members.filter(
      (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
        (grouped.get(m.index)?.members[0] ?? m.index) === m.index,
    );
    const agents: IAutoMovieCrowdAgent[] = leaders.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieCrowdAgent => {
        const group: IAutoMovieMotionHumanEnsemble.IGroup | undefined =
          grouped.get(m.index);
        const breadth: number = (group?.members ?? [m.index]).reduce(
          (sum: number, i: number): number => sum + 2 * half(members[i]!),
          0,
        );
        const { speed, delay }: IAutoMovieMotionHumanCrowd.IDesired = desired(
          ensemble,
          m,
          request,
        );
        return {
          at: m.place.at,
          goal: request.goals(m),
          radius: breadth / 2,
          speed,
          start: request.start + delay,
          ...(request.flight === true
            ? {
                herding: HumanAttribute.effect(
                  HUMAN_ATTRIBUTE_EFFECTS.morale.herding,
                  m.attributes.morale,
                  1,
                ),
              }
            : {}),
        };
      },
    );
    const obstacles: IAutoMovieCrowdAgent.IObstacle[] = (
      request.obstacles ?? []
    ).map(
      (o: IAutoMovieMotionHumanObstacle): IAutoMovieCrowdAgent.IObstacle => ({
        footprint: o.footprint,
        ...(o.motion === undefined ? {} : { motion: o.motion }),
      }),
    );
    const pass: IAutoMovieSteerCrowd.IResult = steerAutoMovieCrowd({
      agents,
      obstacles,
      from: Math.min(request.start, request.until - 1e-3),
      to: request.until,
    });
    const contact: IAutoMovieCrowdAgent.IContact | undefined = pass.contacts[0];
    if (contact !== undefined) {
      const other: string =
        contact.other.kind === "agent"
          ? leaders[contact.other.index]!.subject
          : request.obstacles![contact.other.index]!.subject;
      throw new HumanRefusal({
        kind: "participant",
        performer: leaders[contact.agent]!.subject,
        axis: "crowd",
        value: other,
        reason: `${leaders[contact.agent]!.subject} and ${
          other
        } overlap by ${(contact.depth * 1000).toFixed(0)} mm from ${contact.seconds.toFixed(3)} s; the steering pass keeps people apart by anticipation and does not push them`,
        fix: "thin the crowd, widen the way, or start the members apart",
      });
    }

    // Sample all agents at one film second before seeking to the next.
    // Their course readers share that interpolation of the crowd state.
    const step: number = STEP;
    const count: number = Math.ceil((request.until - request.start) / step);
    const samples: IAutoMovieMotionHumanFormation.ISample[][] = leaders.map(
      (): IAutoMovieMotionHumanFormation.ISample[] => [],
    );
    for (let k: number = 0; k <= count; ++k) {
      const seconds: number = Math.min(request.until, request.start + k * step);
      for (const [a, course] of pass.courses.entries()) {
        const p: IAutoMovieVector3 = course.at(seconds).position;
        samples[a]!.push({ seconds, x: p.x, y: 0, z: p.z });
      }
    }
    const frames: IAutoMovieMotionHumanFormation.ICourse[] = samples.map(
      (
        values: IAutoMovieMotionHumanFormation.ISample[],
      ): IAutoMovieMotionHumanFormation.ICourse => ({
        kind: "course",
        samples: values,
      }),
    );
    const byLeader: Map<number, number> = new Map(
      leaders.map(
        (
          m: IAutoMovieMotionHumanEnsemble.IMember,
          a: number,
        ): [number, number] => [m.index, a],
      ),
    );
    const agentOf = (m: IAutoMovieMotionHumanEnsemble.IMember): number =>
      byLeader.get(grouped.get(m.index)?.members[0] ?? m.index)!;
    return {
      frames: members.map(
        (
          m: IAutoMovieMotionHumanEnsemble.IMember,
        ): IAutoMovieMotionHumanFormation.ICourse => frames[agentOf(m)]!,
      ),
      arrivals: members.map(
        (m: IAutoMovieMotionHumanEnsemble.IMember): number | null =>
          pass.courses[agentOf(m)]!.arrival,
      ),
    };
  }

  /**
   * A member's half breadth at the shoulders: the shoulder joint's half width
   * plus the upper arm's radius, metres.
   *
   * @param member The member.
   * @returns The half breadth.
   */
  export function half(member: IHalfMember): number {
    return (
      member.body.measure.shoulderHalfWidth + member.body.measure.upperArmRadius
    );
  }
}

/** The alternatives of `DesiredRequest`'s site. */
type DesiredRequest = "gait" | "latency" | "flight";
