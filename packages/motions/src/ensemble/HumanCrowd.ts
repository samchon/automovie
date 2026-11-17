import type { IAutoMovieCrowdAgent, IAutoMovieMotionHumanCrowd, IAutoMovieMotionHumanEnsemble, IAutoMovieMotionHumanFormation, IAutoMovieMotionHumanObstacle, IAutoMovieMotionHumanSkill, IAutoMovieRandom, IAutoMovieSteerCrowd, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieGravity, steerAutoMovieCrowd } from "@automovie/engine";

import { run } from "../actions/run";
import { walk } from "../actions/walk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanResponse } from "../skill/HumanResponse";
import { HumanSkill } from "../skill/HumanSkill";
import { HUMAN_ATTRIBUTE_EFFECTS } from "./HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "./HumanAttribute";

/**
 * A crowd that keeps no formation, steered: each member (or each walking
 * group, as one agent) heads for its goals at its own drawn speed and avoids
 * the others and the obstacles, by one plan-time pass of the engine's
 * `steerAutoMovieCrowd`. The pass gives each member a course; the member's
 * own walk or run then keeps station on it (`walkStation`), so its feet are
 * still whole steps.
 *
 * A member's agent is a disc of its shoulders' half breadth (the shoulder
 * joint's half width plus the upper arm's radius) at its desired speed: its
 * gait's speed at its leg length by dynamic similarity (the walk's normal
 * Froude number, or the run's), scaled by a normal draw with the
 * coefficient of variation of pedestrians' desired speeds, 0.26 over 1.34
 * m/s (Helbing and Molnar 1995), by fatigue, and in flight by morale
 * (`HUMAN_ATTRIBUTE_EFFECTS`). Its start is the cue plus its latency
 * (`HumanResponse`), and in flight its herding share is morale's. Every
 * draw is keyed by the member; adding a member changes the others' courses
 * (they avoid it) but never their draws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the pass gives, how each agent is built and from which sources, and the coupling.
 * @evidence contracts/development/design.md#principled-representation A request names goals, a gait, a cue and the obstacles; the result is a course frame per member, the data station keeping reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `steer`, a member's drawn desire `desired` (with `IDesired`), its half breadth `half`, and the desired speeds' spread `SPREAD` and floor `SLOWEST`; the law is the engine's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is animated by the pass: its courses are frames, walked by the vocabulary.
 */
export namespace HumanCrowd {
  /** The coefficient of variation of desired walking speeds: 0.26 over 1.34 m/s (Helbing and Molnar 1995). */
  export const SPREAD: number = 0.26 / 1.34;

  /** The least share of its gait's speed a member's draw may give: one half, about 2.6 `SPREAD`s below the mean (provisional: a floor that keeps the normal draw's far tail from a walker who barely moves). */
  export const SLOWEST: number = 0.5;

  /**
   * A member's desired speed and delay as the pass draws them: its gait's
   * speed at its leg length scaled by its keyed normal draw (floored at
   * `SLOWEST`, its spread widened in flight by low morale's fluctuation,
   * `HUMAN_ATTRIBUTE_EFFECTS.morale.fluctuation`), by fatigue and in flight
   * by morale, and its response
   * latency when the request names one.
   *
   * @param ensemble The ensemble.
   * @param m The member.
   * @param request The request.
   * @returns The member's desire.
   */
  export function desired(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    m: IAutoMovieMotionHumanEnsemble.IMember,
    request: Pick<IAutoMovieMotionHumanCrowd.IRequest, "gait" | "latency" | "flight">,
  ): IAutoMovieMotionHumanCrowd.IDesired {
    const skill: IAutoMovieMotionHumanSkill.ISkill = HumanSkill.resolve(
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
   * Steer the crowd.
   *
   * @param ensemble The ensemble.
   * @param request The goals, the gait, the cue and the obstacles.
   * @returns The course frames and arrivals.
   * @throws {HumanRefusal} When two members, or a member and an obstacle, stay closer than their summed radii for longer than one step: the pass is kinematic and does not push.
   */
  export function steer(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    request: IAutoMovieMotionHumanCrowd.IRequest,
  ): IAutoMovieMotionHumanCrowd.IResult {
    const members: readonly IAutoMovieMotionHumanEnsemble.IMember[] = ensemble.members;
    const grouped: Map<number, IAutoMovieMotionHumanEnsemble.IGroup> = new Map();
    for (const group of request.groups ?? [])
      for (const index of group.members) grouped.set(index, group);

    // One agent per lone member and per group, led by its first member.
    const leaders: IAutoMovieMotionHumanEnsemble.IMember[] = members.filter(
      (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
        (grouped.get(m.index)?.members[0] ?? m.index) === m.index,
    );
    const agents: IAutoMovieCrowdAgent[] = leaders.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieCrowdAgent => {
        const group: IAutoMovieMotionHumanEnsemble.IGroup | undefined = grouped.get(m.index);
        const breadth: number = (group?.members ?? [m.index]).reduce(
          (sum: number, i: number): number => sum + 2 * half(members[i]!),
          0,
        );
        const { speed, delay }: IAutoMovieMotionHumanCrowd.IDesired = desired(ensemble, m, request);
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
      (o: IAutoMovieMotionHumanObstacle.IObstacle): IAutoMovieCrowdAgent.IObstacle => ({
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

    // Each agent's course sampled at the film's rate, a member taking its agent's.
    const step: number = 1 / 24;
    const count: number = Math.ceil((request.until - request.start) / step);
    const frames: IAutoMovieMotionHumanFormation.ICourse[] = leaders.map(
      (_: IAutoMovieMotionHumanEnsemble.IMember, a: number): IAutoMovieMotionHumanFormation.ICourse => {
        const samples: IAutoMovieMotionHumanFormation.ISample[] = [];
        for (let k: number = 0; k <= count; ++k) {
          const seconds: number = Math.min(
            request.until,
            request.start + k * step,
          );
          const p: IAutoMovieVector3 = pass.courses[a]!.at(seconds).position;
          samples.push({ seconds, x: p.x, y: 0, z: p.z });
        }
        return { kind: "course", samples };
      },
    );
    const byLeader: Map<number, number> = new Map(
      leaders.map((m: IAutoMovieMotionHumanEnsemble.IMember, a: number): [number, number] => [
        m.index,
        a,
      ]),
    );
    const agentOf = (m: IAutoMovieMotionHumanEnsemble.IMember): number =>
      byLeader.get(grouped.get(m.index)?.members[0] ?? m.index)!;
    return {
      frames: members.map(
        (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieMotionHumanFormation.ICourse =>
          frames[agentOf(m)]!,
      ),
      arrivals: members.map(
        (m: IAutoMovieMotionHumanEnsemble.IMember): number | null =>
          pass.courses[agentOf(m)]!.arrival,
      ),
    };
  }

  /**
   * A member's half breadth at the shoulders: the shoulder joint's half
   * width plus the upper arm's radius, metres.
   *
   * @param member The member.
   * @returns The half breadth.
   */
  export function half(member: IAutoMovieMotionHumanEnsemble.IMember): number {
    return (
      member.body.measure.shoulderHalfWidth + member.body.measure.upperArmRadius
    );
  }
}
