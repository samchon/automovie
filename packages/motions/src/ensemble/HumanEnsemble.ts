import { AutoMovieComposition, type IAutoMovieRandom } from "@automovie/engine";

import { HumanChain } from "../HumanChain";
import type { IHumanBody } from "../body/IHumanBody";
import type { HumanChainCore } from "../chain/HumanChainCore";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanPerformer } from "../perform/IHumanPerformer";
import { HumanSkill } from "../skill/HumanSkill";
import type { IAutoMovieProficiency } from "../skill/IAutoMovieProficiency";
import { HUMAN_ATTRIBUTE_EFFECTS } from "./HUMAN_ATTRIBUTE_EFFECTS";
import { HUMAN_ENSEMBLE_PRESETS } from "./HUMAN_ENSEMBLE_PRESETS";
import { HumanAttribute } from "./HumanAttribute";
import type { IHumanEnsemblePreset } from "./IHumanEnsemblePreset";
import { HumanFormation } from "./HumanFormation";
import { instance } from "./instance";
import type { IHumanEnsemble } from "./IHumanEnsemble";
import type { IHumanFormation } from "./IHumanFormation";

/**
 * A group of people as one subject: its members resolved from the group's
 * input, handed to a performance as performers and chains, and the seeded
 * choices an author makes over them.
 *
 * Nothing here writes motion: each member performs the vocabulary's actions
 * the author's `build` appends. Attributes shape how and when, never what:
 * an outcome such as five misfires is the author's count, and `pick` only
 * chooses which members it falls on. Every draw is keyed by the chain seed,
 * the ensemble, the member's index and the quantity, so adding a member
 * leaves the others' bodies, attributes and roles bit-identical; discipline
 * replaces the drawn proficiency on the axes `HUMAN_ATTRIBUTE_EFFECTS` names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace does, what it never does, the draw keys and how discipline reaches the laws.
 * @evidence contracts/development/design.md#principled-representation A resolved ensemble is its input and its members; a member is a performer's data plus its role, attributes, slot and detail.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of`, `performers`, `members`, `chains`, `pick`, `seed`, `groups` (#3457).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member has a law of its own.
 */
export namespace HumanEnsemble {
  /** A resolved ensemble. */
  export interface IEnsemble {
    /** The input it was resolved from. */
    input: IHumanEnsemble;

    /** Its members, in index order. */
    members: readonly IMember[];
  }

  /** One resolved member. */
  export interface IMember {
    /** Its index, from 0. */
    index: number;

    /** Its subject id, `${ensemble}.${index}`. */
    subject: string;

    /** Its role, or null. */
    role: string | null;

    /** Its body, drawn from the pool. */
    body: IHumanBody;

    /** Its body's index in the pool. */
    pool: number;

    /** Its attributes, each in [0, 1]; an attribute the group does not state is absent. */
    attributes: Readonly<Partial<Record<HumanAttribute.Name, number>>>;

    /** Its proficiency: the drawn `p`, with discipline on the axes it replaces. */
    proficiency: IAutoMovieProficiency;

    /** Its starting place. */
    place: IHumanEnsemble.IPlace;

    /** Its slot in the formation's own frame, or null without a formation. */
    slot: HumanFormation.ILocal | null;

    /** How much of it is performed. */
    detail: IHumanEnsemble.Detail;

    /**
     * A prop of its own, `${subject}.${name}`: its musket, its horse.
     *
     * @param name The prop's name within the member.
     * @returns The prop's subject id.
     */
    prop(name: string): string;
  }

  /** A sub-ensemble that walks together. */
  export interface IGroup {
    /** Its index, from 0. */
    index: number;

    /** Its members' indices, consecutive. */
    members: readonly number[];
  }

  /**
   * Resolve an ensemble's members.
   *
   * @param input The ensemble.
   * @param read Reads a guide's placed root, when the formation follows a guide: each member's start is its slot at second 0.
   * @returns The ensemble.
   * @throws {HumanRefusal} When the count, the pool, a distribution, a role or a place cannot be met, naming the ensemble and the axis.
   */
  export function of(
    input: IHumanEnsemble,
    read?: HumanFormation.Reader,
  ): IEnsemble {
    const refuse = (axis: string, value: unknown, reason: string, fix: string, feasible?: HumanRefusal.Feasible): never => {
      throw new HumanRefusal({
        kind: "parameter",
        axis: `${input.id}.${axis}`,
        value,
        ...(feasible === undefined ? {} : { feasible }),
        reason,
        fix,
      });
    };
    if (!(Number.isInteger(input.count) && input.count > 0))
      refuse("count", input.count, "an ensemble has a positive whole number of members", "give a positive count");
    if (input.bodies.length === 0)
      refuse("bodies", 0, "an ensemble's body pool is empty", "give at least one body");
    const formation: IHumanFormation | undefined =
      input.formation === undefined ? undefined : HumanFormation.of(input.formation);
    if (formation !== undefined && HumanFormation.count(formation) < input.count)
      refuse(
        "formation",
        HumanFormation.count(formation),
        `the formation holds ${HumanFormation.count(formation)} slots for ${input.count} members`,
        "give the formation a slot for every member",
        { kind: "range", minimum: input.count, maximum: null, unit: "" },
      );
    if (formation === undefined && input.places === undefined)
      refuse("places", undefined, "an ensemble needs a formation or places", "give a formation or places");

    // The distributions: the preset's rows, overridden by the input's.
    const preset: IHumanEnsemblePreset | undefined =
      input.preset === undefined ? undefined : HUMAN_ENSEMBLE_PRESETS[input.preset];
    const distributions: Partial<Record<HumanAttribute.Name, HumanAttribute.IDistribution>> = {
      ...(preset?.attributes ?? {}),
      ...(input.attributes ?? {}),
    };
    const proficiency: HumanAttribute.IDistribution = input.proficiency ??
      preset?.proficiency ?? { mean: HumanSkill.LEVELS.trained, spread: 0 };

    // Each member's own draws, keyed by its index.
    const members: IMember[] = [];
    for (let index: number = 0; index < input.count; ++index) {
      const subject: string = `${input.id}.${index}`;
      const attributes: Partial<Record<HumanAttribute.Name, number>> = {};
      for (const name of HumanAttribute.NAMES) {
        const d: HumanAttribute.IDistribution | undefined = distributions[name];
        if (d !== undefined)
          attributes[name] = HumanAttribute.draw(input.seed, input.id, index, name, d);
      }
      const p: number = HumanAttribute.draw(input.seed, input.id, index, "proficiency", proficiency);
      const axes: Partial<Record<IAutoMovieProficiency.Axis, number>> = {};
      if (attributes.discipline !== undefined)
        for (const axis of HUMAN_ATTRIBUTE_EFFECTS.discipline.axes)
          axes[axis] = attributes.discipline;
      const pool: number = Math.min(
        input.bodies.length - 1,
        Math.floor(HumanAttribute.stream(input.seed, input.id, index, "body").float(0) * input.bodies.length),
      );
      const slot: HumanFormation.ILocal | null =
        formation === undefined ? null : HumanFormation.local(formation, index);
      const place: IHumanEnsemble.IPlace =
        formation !== undefined
          ? placeOf(HumanFormation.slot(formation, index, 0, read))
          : typeof input.places === "function"
            ? input.places(index)
            : (input.places![index] ??
              refuse("places", input.places!.length, `${input.places!.length} places for ${input.count} members`, "give a place for every member"));
      members.push({
        index,
        subject,
        role: null,
        body: input.bodies[pool]!,
        pool,
        attributes,
        proficiency: Object.keys(axes).length === 0 ? { p } : { p, axes },
        place,
        slot,
        detail: "full",
        prop: (name: string): string => `${subject}.${name}`,
      });
    }

    // Roles in the order given, each from the members its pick names that no earlier role took.
    for (const [role, spec] of Object.entries(input.roles ?? {})) {
      const free: IMember[] = members.filter((m: IMember): boolean => m.role === null);
      const candidates: IMember[] = spec.pick !== undefined && typeof spec.pick !== "string"
        ? spec.pick.map((i: number): IMember =>
            members[i] !== undefined && members[i]!.role === null
              ? members[i]!
              : refuse(`roles.${role}.pick`, i, `member ${i} does not exist or already has a role`, "pick free members by index"),
          )
        : spec.pick === "front"
          ? free.filter((m: IMember): boolean => m.slot === null || m.slot.rank === 0)
          : spec.pick === "rear"
            ? free.filter((m: IMember): boolean => m.slot === null || m.slot.rank === rearRank(formation, m.slot.block)).reverse()
            : spec.pick === "flank"
              ? flank(free, formation)
              : free;
      if (!(Number.isInteger(spec.count) && spec.count >= 0) || spec.count > candidates.length)
        refuse(
          `roles.${role}`,
          spec.count,
          `the role ${role} asks ${spec.count} members and ${candidates.length} can take it`,
          "ask no more members than the pick offers",
          { kind: "range", minimum: 0, maximum: candidates.length, unit: "" },
        );
      for (const m of candidates.slice(0, spec.count)) m.role = role;
    }

    // Each member's detail, read once its role is known.
    if (input.detail !== undefined)
      for (const m of members)
        m.detail = input.detail({
          index: m.index,
          role: m.role,
          block: m.slot?.block ?? null,
          rank: m.slot?.rank ?? null,
        });
    return { input, members };
  }

  /**
   * The performers to spread into `HumanPerformance.IInput.performers`: every
   * member that is performed, with its body, place, proficiency and
   * attributes; population members are left out.
   *
   * @param ensemble The ensemble.
   * @returns The performers.
   */
  export function performers(ensemble: IEnsemble): IHumanPerformer[] {
    return ensemble.members
      .filter((m: IMember): boolean => m.detail !== "population")
      .map(
        (m: IMember): IHumanPerformer => ({
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
  export function members(ensemble: IEnsemble): readonly IMember[] {
    return ensemble.members;
  }

  /**
   * The members' chains in parallel, in index order: what `build` appends to
   * each fully performed member's empty chain. An instanced member performs
   * the `instance` law for `seconds` over its template, the lowest-index
   * full member of its block on the same body of the pool, lagging it by a
   * whole number of film frames drawn up to `LAG` seconds; templates come
   * first in the group, since an instance reads its template's placed path.
   * Population members are left out.
   *
   * @param ensemble The ensemble.
   * @param build Appends a member's actions to its empty chain.
   * @param seconds How long instanced members last; required when any member is instanced.
   * @returns The composition.
   * @throws {HumanRefusal} When an instanced member has no template, or no span is given.
   */
  export function chains(
    ensemble: IEnsemble,
    build: (member: IMember, chain: HumanChain) => HumanChainCore,
    seconds?: number,
  ): AutoMovieComposition {
    const full: IMember[] = ensemble.members.filter((m: IMember): boolean => m.detail === "full");
    const instanced: IMember[] = ensemble.members.filter((m: IMember): boolean => m.detail === "instanced");
    return AutoMovieComposition.parallel(
      ...full.map((m: IMember): AutoMovieComposition => build(m, HumanChain.subject(m.subject)).node),
      ...instanced.map((m: IMember): AutoMovieComposition => {
        const template: IMember | undefined = full.find(
          (f: IMember): boolean => f.pool === m.pool && (f.slot?.block ?? 0) === (m.slot?.block ?? 0),
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
          HumanAttribute.stream(ensemble.input.seed, ensemble.input.id, m.index, "instance").float(0) *
            (Math.round(LAG * instance.RATE) + 1),
        );
        return HumanChain.subject(m.subject).registered(instance.name, { of: template.subject, seconds, shift }).node;
      }),
    );
  }

  /**
   * The most an instanced member lags its template, seconds (provisional:
   * about one standard deviation of an elite's command latency under the
   * orienting law, sqrt(25^2 + 40^2) ms, `look.reactionLaw`).
   */
  export const LAG: number = 0.047;

  /**
   * Which members an authored outcome falls on: exactly `count` of those
   * `among` admits, chosen by the seed, and where an attribute is named the
   * members lower in it more often (weighted sampling without replacement
   * with weight `1 - value`, Efraimidis and Spirakis 2006: the largest keys
   * `u^(1 / w)`).
   *
   * @param ensemble The ensemble.
   * @param count How many, the author's.
   * @param name The outcome's name, which keys its draws.
   * @param among Which members may take it; all when absent.
   * @param weighted The attribute whose low values the outcome favours; uniform when absent.
   * @returns The chosen members' indices, ascending.
   * @throws {HumanRefusal} When fewer members are admitted than asked.
   */
  export function pick(
    ensemble: IEnsemble,
    count: number,
    name: string,
    among?: (member: IMember) => boolean,
    weighted?: HumanAttribute.Name,
  ): number[] {
    const admitted: IMember[] = ensemble.members.filter((m: IMember): boolean => among?.(m) ?? true);
    if (!(Number.isInteger(count) && count >= 0 && count <= admitted.length))
      throw new HumanRefusal({
        kind: "parameter",
        axis: `${ensemble.input.id}.pick.${name}`,
        value: count,
        feasible: { kind: "range", minimum: 0, maximum: admitted.length, unit: "" },
        reason: `${count} members asked for ${name} and ${admitted.length} may take it`,
        fix: "ask no more members than may take the outcome",
      });
    return admitted
      .map((m: IMember): { index: number; key: number } => {
        const u: number = Math.max(1e-12, HumanAttribute.stream(ensemble.input.seed, ensemble.input.id, m.index, `pick:${name}`).float(0));
        const w: number = weighted === undefined ? 1 : Math.max(1e-6, 1 - (m.attributes[weighted] ?? 0.5));
        return { index: m.index, key: Math.log(u) / w };
      })
      .sort((a: { key: number; index: number }, b: { key: number; index: number }): number => b.key - a.key || a.index - b.index)
      .slice(0, count)
      .map((e: { index: number }): number => e.index)
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
  export function seed(ensemble: IEnsemble, index: number, name: string): number {
    return HumanAttribute.stream(ensemble.input.seed, ensemble.input.id, index, `seed:${name}`).uint32(0);
  }

  /**
   * Sub-ensembles that walk together, as many pedestrians do in twos and
   * threes (Moussaïd et al. 2010): members are taken in index order, and an
   * ungrouped member starts a group with probability `q` whose size is drawn
   * from `sizes`, taking the next members. With `s` the mean size, a start
   * share `q = share / (s - share (s - 1))` puts `share` of the members in
   * groups on average, since `q s / (q s + 1 - q)` of them are grouped.
   *
   * @param ensemble The ensemble.
   * @param spec The grouped share in [0, 1] and the group sizes allowed, each at least 2.
   * @returns The groups, in index order; members not in one walk alone.
   * @throws {HumanRefusal} When the share lies outside [0, 1] or a size is below 2.
   */
  export function groups(
    ensemble: IEnsemble,
    spec: { share: number; sizes: readonly number[] },
  ): IGroup[] {
    if (!(spec.share >= 0 && spec.share <= 1) || spec.sizes.length === 0 || spec.sizes.some((s: number): boolean => !(Number.isInteger(s) && s >= 2)))
      throw new HumanRefusal({
        kind: "parameter",
        axis: `${ensemble.input.id}.groups`,
        value: spec,
        reason: "a grouped share lies in [0, 1] and every group size is a whole number of at least 2",
        fix: "give a share in [0, 1] and sizes of 2 or more",
      });
    const mean: number = spec.sizes.reduce((a: number, b: number): number => a + b, 0) / spec.sizes.length;
    const start: number = spec.share / (mean - spec.share * (mean - 1));
    const out: IGroup[] = [];
    const n: number = ensemble.members.length;
    for (let i: number = 0; i < n; ) {
      const random: IAutoMovieRandom = HumanAttribute.stream(ensemble.input.seed, ensemble.input.id, i, "group");
      const size: number = spec.sizes[Math.min(spec.sizes.length - 1, Math.floor(random.float(1) * spec.sizes.length))]!;
      if (random.float(0) < start && i + size <= n) {
        out.push({ index: out.length, members: Array.from({ length: size }, (_: unknown, k: number): number => i + k) });
        i += size;
      } else ++i;
    }
    return out;
  }
}

/** A slot as a starting place. */
function placeOf(slot: IHumanFormation.ISlot): IHumanEnsemble.IPlace {
  return { at: slot.at, yaw: slot.heading };
}

/** The last rank of a block, or 0 without a formation. */
function rearRank(formation: IHumanFormation | undefined, block: number): number {
  if (formation === undefined) return 0;
  let last: number = 0;
  let index: number = 0;
  for (let b: number = 0; b < block; ++b) index += formation.blocks[b]!.count;
  for (let k: number = 0; k < formation.blocks[block]!.count; ++k)
    last = Math.max(last, HumanFormation.local(formation, index + k).rank);
  return last;
}

/** The free members on a flank: file 0 first, then the last file of each block; without a formation, the first and the last. */
function flank(
  free: readonly HumanEnsemble.IMember[],
  formation: IHumanFormation | undefined,
): HumanEnsemble.IMember[] {
  if (formation === undefined) return free.length < 2 ? [...free] : [free[0]!, free[free.length - 1]!];
  const last: number = Math.max(0, ...free.map((m: HumanEnsemble.IMember): number => m.slot?.file ?? 0));
  return [
    ...free.filter((m: HumanEnsemble.IMember): boolean => m.slot?.file === 0),
    ...free.filter((m: HumanEnsemble.IMember): boolean => m.slot?.file === last && last !== 0),
  ];
}
