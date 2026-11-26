import { AutoMovieComposition } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanAttribute,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanChain } from "../HumanChain";
import { HumanRefusal } from "../law/HumanRefusal";
import { HUMAN_ATTRIBUTE_EFFECTS } from "./HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "./HumanAttribute";
import { HumanEnsembleMembers } from "./HumanEnsembleMembers";
import { instance } from "./instance";

/**
 * Resolve an ensemble's members.
 *
 * @param input The ensemble.
 * @param read Reads a guide's placed root, when the formation follows a guide:
 *   each member's start is its slot at second 0.
 * @returns The ensemble.
 * @throws {HumanRefusal} When the count, the pool, a distribution, a role or a
 *   place cannot be met, naming the ensemble and the axis.
 */
export function HumanEnsemble(
  input: IAutoMovieMotionHumanEnsemble.IInput,
  read?: IAutoMovieMotionHumanFormation.Reader,
): IAutoMovieMotionHumanEnsemble.IEnsemble {
  return HumanEnsembleMembers.resolve(input, read);
}

/**
 * A group of people as one subject: its members resolved from the group's
 * input, handed to a performance as performers and chains, and the seeded
 * choices an author makes over them.
 *
 * Nothing here writes motion: each member performs the vocabulary's actions the
 * author's `build` appends. Attributes shape how and when, never what: an
 * outcome such as five misfires is the author's count, and `pick` only chooses
 * which members it falls on. Every draw is keyed by the chain seed, the
 * ensemble, the member's index and the quantity, so adding a member leaves the
 * others' bodies, attributes and roles bit-identical; discipline replaces the
 * drawn proficiency on the axes `HUMAN_ATTRIBUTE_EFFECTS` names.
 */
export namespace HumanEnsemble {
  /**
   * The performers to spread into `HumanPerformance.IInput.performers`: every
   * member that is performed, with its body, place, proficiency and attributes;
   * population members are left out.
   *
   * @param ensemble The ensemble.
   * @returns The performers.
   */
  export function performers(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
  ): IAutoMovieMotionHumanPerformer[] {
    return ensemble.members
      .filter(
        (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
          m.detail !== "population",
      )
      .map(
        (
          m: IAutoMovieMotionHumanEnsemble.IMember,
        ): IAutoMovieMotionHumanPerformer => ({
          subject: m.subject,
          body: m.body,
          at: m.place.at,
          yaw: m.place.yaw,
          proficiency: m.proficiency,
          attributes: m.attributes,
        }),
      );
  }

  /**
   * The members, in index order.
   *
   * @param ensemble The ensemble.
   * @returns The members.
   */
  export function members(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
  ): readonly IAutoMovieMotionHumanEnsemble.IMember[] {
    return ensemble.members;
  }

  /**
   * The members' chains in parallel, in index order: what `build` appends to
   * each fully performed member's empty chain. An instanced member performs the
   * `instance` law for `seconds` over its template, the lowest-index full
   * member of its block on the same body of the pool, lagging it by a whole
   * number of film frames drawn up to `LAG` seconds; templates come first in
   * the group, since an instance reads its template's placed path. Population
   * members are left out.
   *
   * @param ensemble The ensemble.
   * @param build Appends a member's actions to its empty chain.
   * @param seconds How long instanced members last; required when any member is
   *   instanced.
   * @returns The composition.
   * @throws {HumanRefusal} When an instanced member has no template, or no span
   *   is given.
   */
  export function chains(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    build: (
      member: IAutoMovieMotionHumanEnsemble.IMember,
      chain: IAutoMovieMotionHumanChain,
    ) => IAutoMovieMotionHumanChainCore,
    seconds?: number,
  ): IAutoMovieComposition {
    const full: IAutoMovieMotionHumanEnsemble.IMember[] =
      ensemble.members.filter(
        (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
          m.detail === "full",
      );
    const instanced: IAutoMovieMotionHumanEnsemble.IMember[] =
      ensemble.members.filter(
        (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
          m.detail === "instanced",
      );
    return AutoMovieComposition.parallel(
      ...full.map(
        (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieComposition =>
          build(m, HumanChain.subject(m.subject)).node,
      ),
      ...instanced.map(
        (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieComposition => {
          const template: IAutoMovieMotionHumanEnsemble.IMember | undefined =
            full.find(
              (f: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
                f.pool === m.pool &&
                (f.slot?.block ?? 0) === (m.slot?.block ?? 0),
            );
          if (template === undefined || seconds === undefined)
            throw new HumanRefusal({
              kind: "participant",
              performer: m.subject,
              axis: `${ensemble.input.id}.detail`,
              value: m.detail,
              reason:
                seconds === undefined
                  ? "an instanced member needs the span it lasts"
                  : `no fully performed member of block ${m.slot?.block ?? 0} has ${m.subject}'s body`,
              fix: "give chains the span, and perform at least one member of each body and block in full",
            });
          const shift: number = Math.floor(
            HumanAttribute.stream(
              ensemble.input.seed,
              ensemble.input.id,
              m.index,
              "instance",
            ).float(0) *
              (Math.round(LAG * instance.RATE) + 1),
          );
          return HumanChain.subject(m.subject).registered(instance.name, {
            of: template.subject,
            duration: seconds,
            shift,
          }).node;
        },
      ),
    );
  }

  /**
   * The most an instanced member lags its template, seconds (provisional: about
   * one standard deviation of an elite's command latency under the orienting
   * law, sqrt(25^2 + 40^2) ms, `look.reactionLaw`).
   */
  export const LAG: number = 0.047;

  /**
   * A member's station in a formation, for the walk family's `station`: its
   * slot, and its slow dress deviation, whose bound is `DRESS` scaled by its
   * discipline (`HUMAN_ATTRIBUTE_EFFECTS.discipline.dress`, the neutral 0.5
   * when absent) and whose draws are the member's own.
   *
   * @param ensemble The ensemble.
   * @param member The member.
   * @param formation The formation it keeps; the ensemble's when absent.
   * @param until The film second the station ends; the frame's rest when
   *   absent.
   * @returns The station.
   * @throws {Error} When neither a formation nor the ensemble's is given.
   */
  export function station(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    member: IAutoMovieMotionHumanEnsemble.IMember,
    formation?: IAutoMovieMotionHumanFormation,
    until?: number,
  ): IAutoMovieMotionHumanFormation.IStation {
    const kept: IAutoMovieMotionHumanFormation | undefined =
      formation ?? ensemble.input.formation;
    if (kept === undefined)
      throw new Error(`${member.subject} keeps no formation`);
    return {
      formation: kept,
      slot: member.index,
      ...(until === undefined ? {} : { until }),
      dress: {
        bound:
          DRESS *
          HumanAttribute.effect(
            HUMAN_ATTRIBUTE_EFFECTS.discipline.dress,
            member.attributes.discipline,
            0.5,
          ),
        seed: HumanAttribute.stream(
          ensemble.input.seed,
          ensemble.input.id,
          member.index,
          "dress",
        ).seed,
      },
    };
  }

  /**
   * The bound of a member's slow dress deviation at the effect's factor 1,
   * metres (provisional: about the 4 cm dressing a formed line keeps, the
   * tolerance the interface's layouts call dressing).
   */
  export const DRESS: number = 0.04;
  /**
   * Which members an authored outcome falls on: exactly `count` of those
   * `among` admits, chosen by the seed, and where an attribute is named the
   * members lower in it more often (weighted sampling without replacement with
   * weight `1 - value`, Efraimidis and Spirakis 2006: the largest keys `u^(1 /
   * w)`).
   *
   * @param ensemble The ensemble.
   * @param count How many, the author's.
   * @param name The outcome's name, which keys its draws.
   * @param among Which members may take it; all when absent.
   * @param weighted The attribute whose low values the outcome favours; uniform
   *   when absent.
   * @returns The chosen members' indices, ascending.
   * @throws {HumanRefusal} When fewer members are admitted than asked.
   */
  export function pick(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    count: number,
    name: string,
    among?: (member: IAutoMovieMotionHumanEnsemble.IMember) => boolean,
    weighted?: IAutoMovieMotionHumanAttribute.Name,
  ): number[] {
    const admitted: IAutoMovieMotionHumanEnsemble.IMember[] =
      ensemble.members.filter(
        (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
          among?.(m) ?? true,
      );
    if (!(count >= 0 && count <= admitted.length))
      throw new HumanRefusal({
        kind: "parameter",
        axis: `${ensemble.input.id}.pick.${name}`,
        value: count,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: admitted.length,
          unit: "",
        },
        reason: `${count} members asked for ${name} and ${admitted.length} may take it`,
        fix: "ask no more members than may take the outcome",
      });
    return admitted
      .map((m: IAutoMovieMotionHumanEnsemble.IMember): IPickResult => {
        const u: number = Math.max(
          1e-12,
          HumanAttribute.stream(
            ensemble.input.seed,
            ensemble.input.id,
            m.index,
            `pick:${name}`,
          ).float(0),
        );
        const w: number =
          weighted === undefined
            ? 1
            : Math.max(1e-6, 1 - (m.attributes[weighted] ?? 0.5));
        return { index: m.index, key: Math.log(u) / w };
      })
      .sort(
        (a: IPickA, b: IPickB): number => b.key - a.key || a.index - b.index,
      )
      .slice(0, count)
      .map((e: IPickE): number => e.index)
      .sort((a: number, b: number): number => a - b);
  }

  /**
   * A member-keyed seed for something the production draws per member: its
   * musket, its horse's tempo. The same for the same member and name, and
   * unchanged by adding members.
   *
   * @param ensemble The ensemble.
   * @param index The member.
   * @param name What the seed is for.
   * @returns A whole number in [0, 2^32).
   */
  export function seed(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    index: number,
    name: string,
  ): number {
    return HumanAttribute.stream(
      ensemble.input.seed,
      ensemble.input.id,
      index,
      `seed:${name}`,
    ).uint32(0);
  }

  /**
   * Sub-ensembles that walk together, as many pedestrians do in twos and threes
   * (Moussaïd et al. 2010): members are taken in index order, and an ungrouped
   * member starts a group with probability `q` whose size is drawn from
   * `sizes`, taking the next members. With `s` the mean size, a start share `q
   * = share / (s - share (s - 1))` puts `share` of the members in groups on
   * average, since `q s / (q s + 1 - q)` of them are grouped.
   *
   * @param ensemble The ensemble.
   * @param spec The grouped share in [0, 1] and the group sizes allowed, each
   *   at least 2.
   * @returns The groups, in index order; members not in one walk alone.
   * @throws {HumanRefusal} When the share lies outside [0, 1] or a size is
   *   below 2.
   */
  export function groups(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    spec: IAutoMovieMotionHumanEnsemble.IGroupsSpec,
  ): IAutoMovieMotionHumanEnsemble.IGroup[] {
    if (
      !(spec.share >= 0 && spec.share <= 1) ||
      spec.sizes.length === 0 ||
      spec.sizes.some((s: number): boolean => !(s >= 2))
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: `${ensemble.input.id}.groups`,
        value: spec,
        reason:
          "a grouped share lies in [0, 1] and every group size is a whole number of at least 2",
        fix: "give a share in [0, 1] and sizes of 2 or more",
      });
    const mean: number =
      spec.sizes.reduce((a: number, b: number): number => a + b, 0) /
      spec.sizes.length;
    const start: number = spec.share / (mean - spec.share * (mean - 1));
    const out: IAutoMovieMotionHumanEnsemble.IGroup[] = [];
    const n: number = ensemble.members.length;
    for (let i: number = 0; i < n; ) {
      const random: IAutoMovieRandom = HumanAttribute.stream(
        ensemble.input.seed,
        ensemble.input.id,
        i,
        "group",
      );
      const size: number =
        spec.sizes[
          Math.min(
            spec.sizes.length - 1,
            Math.floor(random.float(1) * spec.sizes.length),
          )
        ]!;
      if (random.float(0) < start && i + size <= n) {
        out.push({
          index: out.length,
          members: Array.from(
            { length: size },
            (_: unknown, k: number): number => i + k,
          ),
        });
        i += size;
      } else ++i;
    }
    return out;
  }
}

/** The record of `IPickE`'s site. */
type IPickE = { index: number };

/** The record of `IPickB`'s site. */
type IPickB = { key: number; index: number };

/** The record of `IPickA`'s site. */
type IPickA = { key: number; index: number };

/** The record of `IPickResult`'s site. */
type IPickResult = { index: number; key: number };
