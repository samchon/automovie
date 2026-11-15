import {
  AutoMovieGravity,
  type IAutoMovieCrowdAgent,
  type IAutoMovieRandom,
  steerAutoMovieCrowd,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { run } from "../actions/run";
import { walk } from "../actions/walk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanObstacle } from "../perform/HumanObstacle";
import { HumanResponse } from "../skill/HumanResponse";
import { HumanSkill } from "../skill/HumanSkill";
import { HUMAN_ATTRIBUTE_EFFECTS } from "./HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "./HumanAttribute";
import type { HumanEnsemble } from "./HumanEnsemble";
import type { IHumanFormation } from "./IHumanFormation";

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
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function; the law is the engine's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is animated by the pass: its courses are frames, walked by the vocabulary.
 */
export namespace HumanCrowd {
  /** The coefficient of variation of desired walking speeds: 0.26 over 1.34 m/s (Helbing and Molnar 1995). */
  export const SPREAD: number = 0.26 / 1.34;

  /** What a crowd is steered by. */
  export interface IRequest {
    /** Each member's goals: a point, or points in order. */
    goals: (member: HumanEnsemble.IMember) => IAutoMovieVector3 | readonly IAutoMovieVector3[];

    /** Its gait. */
    gait: "walk" | "run";

    /** The film second of the cue they set off on. */
    start: number;

    /** The film second the pass ends. */
    until: number;

    /** Each member's delay after the cue; none when absent. */
    latency?: HumanResponse.Latency;

    /** Whether they flee: morale then raises the desired speed and the herding share. Not when absent. */
    flight?: boolean;

    /** What they steer round. */
    obstacles?: readonly HumanObstacle.IObstacle[];

    /** Groups that walk together, each steered as one agent of its members' combined breadth; none when absent. */
    groups?: readonly HumanEnsemble.IGroup[];
  }

  /** A steered crowd. */
  export interface IResult {
    /** Each member's course frame, by member index; a grouped member's is its group's. */
    frames: readonly IHumanFormation.ICourse[];

    /** Each member's arrival second, or null when it does not arrive by `until`. */
    arrivals: readonly (number | null)[];
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
    ensemble: HumanEnsemble.IEnsemble,
    request: IRequest,
  ): IResult {
    const members: readonly HumanEnsemble.IMember[] = ensemble.members;
    const grouped: Map<number, HumanEnsemble.IGroup> = new Map();
    for (const group of request.groups ?? [])
      for (const index of group.members) grouped.set(index, group);

    // One agent per lone member and per group, led by its first member.
    const leaders: HumanEnsemble.IMember[] = members.filter(
      (m: HumanEnsemble.IMember): boolean => (grouped.get(m.index)?.members[0] ?? m.index) === m.index,
    );
    const agents: IAutoMovieCrowdAgent[] = leaders.map((m: HumanEnsemble.IMember): IAutoMovieCrowdAgent => {
      const group: HumanEnsemble.IGroup | undefined = grouped.get(m.index);
      const breadth: number = (group?.members ?? [m.index]).reduce(
        (sum: number, i: number): number => sum + 2 * half(members[i]!),
        0,
      );
      const skill: HumanSkill.ISkill = HumanSkill.resolve(m.proficiency, ensemble.input.seed);
      const random: IAutoMovieRandom = HumanAttribute.stream(ensemble.input.seed, ensemble.input.id, m.index, "crowd");
      const l: number = m.body.measure.hipHeight;
      const froude: number = request.gait === "walk" ? walk.FROUDE.normal : run.GAITS.run.froude;
      const speed: number =
        Math.sqrt(froude * AutoMovieGravity.STANDARD * l) *
        Math.max(0.5, 1 + SPREAD * HumanSkill.normal(random, 0)) *
        HumanAttribute.effect(HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace, m.attributes.fatigue, 0) *
        (request.flight === true ? HumanAttribute.effect(HUMAN_ATTRIBUTE_EFFECTS.morale.speed, m.attributes.morale, 1) : 1);
      const delay: number =
        request.latency === undefined
          ? 0
          : HumanResponse.latency(
              skill,
              HumanAttribute.stream(ensemble.input.seed, ensemble.input.id, m.index, "crowd:latency"),
              request.latency,
              false,
              m.attributes,
            );
      return {
        at: m.place.at,
        goal: request.goals(m),
        radius: breadth / 2,
        speed,
        start: request.start + delay,
        ...(request.flight === true
          ? { herding: HumanAttribute.effect(HUMAN_ATTRIBUTE_EFFECTS.morale.herding, m.attributes.morale, 1) }
          : {}),
      };
    });
    const obstacles: IAutoMovieCrowdAgent.IObstacle[] = (request.obstacles ?? []).map(
      (o: HumanObstacle.IObstacle): IAutoMovieCrowdAgent.IObstacle => ({
        footprint: o.footprint,
        ...(o.motion === undefined ? {} : { motion: o.motion }),
      }),
    );
    const pass: steerAutoMovieCrowd.IResult = steerAutoMovieCrowd({
      agents,
      obstacles,
      from: Math.min(request.start, request.until - 1e-3),
      to: request.until,
    });
    const contact: IAutoMovieCrowdAgent.IContact | undefined = pass.contacts[0];
    if (contact !== undefined)
      throw new HumanRefusal({
        kind: "participant",
        performer: leaders[contact.agent]!.subject,
        axis: "crowd",
        value: contact.other === null ? request.obstacles![contact.obstacle!]!.subject : leaders[contact.other]!.subject,
        reason: `${leaders[contact.agent]!.subject} and ${
          contact.other === null ? request.obstacles![contact.obstacle!]!.subject : leaders[contact.other]!.subject
        } overlap by ${(contact.depth * 1000).toFixed(0)} mm from ${contact.seconds.toFixed(3)} s; the steering pass keeps people apart by anticipation and does not push them`,
        fix: "thin the crowd, widen the way, or start the members apart",
      });

    // Each agent's course sampled at the film's rate, a member taking its agent's.
    const step: number = 1 / 24;
    const count: number = Math.ceil((request.until - request.start) / step);
    const frames: IHumanFormation.ICourse[] = leaders.map((_: HumanEnsemble.IMember, a: number): IHumanFormation.ICourse => {
      const samples: IHumanFormation.ISample[] = [];
      for (let k: number = 0; k <= count; ++k) {
        const seconds: number = Math.min(request.until, request.start + k * step);
        const p: IAutoMovieVector3 = pass.courses[a]!.at(seconds).position;
        samples.push({ seconds, x: p.x, y: 0, z: p.z });
      }
      return { kind: "course", samples };
    });
    const byLeader: Map<number, number> = new Map(leaders.map((m: HumanEnsemble.IMember, a: number): [number, number] => [m.index, a]));
    const agentOf = (m: HumanEnsemble.IMember): number => byLeader.get(grouped.get(m.index)?.members[0] ?? m.index)!;
    return {
      frames: members.map((m: HumanEnsemble.IMember): IHumanFormation.ICourse => frames[agentOf(m)]!),
      arrivals: members.map((m: HumanEnsemble.IMember): number | null => pass.courses[agentOf(m)]!.arrival),
    };
  }

  /**
   * A member's half breadth at the shoulders: the shoulder joint's half
   * width plus the upper arm's radius, metres.
   *
   * @param member The member.
   * @returns The half breadth.
   */
  export function half(member: HumanEnsemble.IMember): number {
    return member.body.measure.shoulderHalfWidth + member.body.measure.upperArmRadius;
  }
}
