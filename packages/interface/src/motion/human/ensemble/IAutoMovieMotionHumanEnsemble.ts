import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieProficiency } from "../skill/IAutoMovieProficiency";
import type { IAutoMovieMotionHumanAttribute } from "./IAutoMovieMotionHumanAttribute";
import type { IAutoMovieMotionHumanEnsemblePreset } from "./IAutoMovieMotionHumanEnsemblePreset";
import type { IAutoMovieMotionHumanFormation } from "./IAutoMovieMotionHumanFormation";

/**
 * A group of people written once: its members are performers of the
 * grammar, `${id}.${index}` with the index from 0, each given a body from the
 * group's pool, a proficiency and attribute values drawn from the group's
 * distributions, an optional role, and a place.
 *
 * The draws are keyed by the chain seed, the id, the member's index and the
 * quantity (`HumanAttribute.stream`), so adding a member or an attribute
 * leaves every other member's values bit-identical. A preset names a set of
 * distributions (`HUMAN_ENSEMBLE_PRESETS`); `attributes` and `proficiency`
 * override its rows. A member's place is its formation slot at second 0, or
 * the place given.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the member naming, the draws and their keys, the override order and where a place comes from. index: Its index, from 0. subject: Its subject id, `${ensemble}.${index}`. role: Its role, or null.
 * @evidence contracts/development/design.md#principled-representation A group as its count, a body pool, distributions and roles: the levels of Musse and Thalmann's hierarchical crowd (2001), the group as the controllable unit. index: Its index, from 0. subject: Its subject id, `${ensemble}.${index}`. role: Its role, or null.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanEnsemble.of` reads; the members are derived, never stored by the author. Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.of, input); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve, input).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A place is a formation or a list or a rule, never both a formation and places. Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanAttribute.Name, IAutoMovieProficiency identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanEnsemble {
  /** The group's id; its members are `${id}.${index}`. */
  id: string;

  /** The chain seed every draw starts from: the performance's `seed`. */
  seed: string;

  /** How many members, a positive whole number. */
  count: number;

  /** The body pool, at least one; each member's body is drawn from it by the seed. */
  bodies: readonly IAutoMovieMotionHumanBody[];

  /** A named set of distributions; every attribute neutral and proficiency `trained` when absent. */
  preset?: IAutoMovieMotionHumanEnsemblePreset.Name;

  /** Distributions overriding the preset's, by attribute. */
  attributes?: Readonly<
    Partial<
      Record<
        IAutoMovieMotionHumanAttribute.Name,
        IAutoMovieMotionHumanAttribute.IDistribution
      >
    >
  >;

  /** The distribution of the members' proficiency `p`, overriding the preset's; the preset's when absent ({@link HUMAN_ENSEMBLE_PRESETS}: mean 0.9 for `elite` to 0.25 for `rabble`). `p` is the skill of every member's actions ({@link IAutoMovieProficiency}). */
  proficiency?: IAutoMovieMotionHumanAttribute.IDistribution;

  /** Named roles and how many members take each, in the order they are filled. */
  roles?: Readonly<Record<string, IAutoMovieMotionHumanEnsemble.IRole>>;

  /** The formation the members stand in, member `i` in slot `i`. */
  formation?: IAutoMovieMotionHumanFormation;

  /** Each member's starting place, by index or as a rule, when there is no formation. */
  places?:
    | readonly IAutoMovieMotionHumanEnsemble.IPlace[]
    | ((index: number) => IAutoMovieMotionHumanEnsemble.IPlace);

  /**
   * How much of each member is performed, by member: `full` performs it,
   * `instanced` displays a template member's pose moved to its place
   * (`HumanEnsemble.instance`), `population` hands it to the instanced
   * population layer (`HumanPopulation`) and leaves it out of the
   * performance. Declared by the author, never by a camera; `full` when
   * absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanEnsemble.detail: How much of each member is performed, by member: `full` performs it, `instanced` displays a template member's pose moved to its place (`HumanEnsemble.instance`), `population` hands it to the instanced population layer (`HumanPopulation`) and leaves it out of the performance. Declared by the author, never by a camera; `full` when absent.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanEnsemble.detail is used through packages/motions/src/ensemble/HumanEnsemble.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanEnsemble.detail is used through packages/motions/src/ensemble/HumanEnsemble.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanEnsemble.detail is used through packages/motions/src/ensemble/HumanEnsemble.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanEnsemble.detail is used through packages/motions/src/ensemble/HumanEnsemble.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanEnsemble.detail is used through packages/motions/src/ensemble/HumanEnsemble.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanEnsemble.detail is used through packages/motions/src/ensemble/HumanEnsemble.ts.
   */
  detail?: (
    member: IAutoMovieMotionHumanEnsemble.IMemberRef,
  ) => IAutoMovieMotionHumanEnsemble.Detail;
}

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
 */
export namespace IAutoMovieMotionHumanEnsemble {
  /**
   * A member's desired speed and delay as the pass draws them: its gait's speed at its leg length scaled by its keyed normal draw (floored at `SLOWEST`, its spread widened in flight by low morale's fluctuation, `HUMAN_ATTRIBUTE_EFFECTS.morale.fluctuation`), by fatigue and in flight by morale, and its response latency when the request names one. One resolved member.
   *
   * @evidence contracts/development/common.md#meaningful-documentation index: Its index, from 0. subject: Its subject id, `${ensemble}.${index}`. role: Its role, or null.
   * @evidence contracts/development/design.md#principled-representation index: Its index, from 0. subject: Its subject id, `${ensemble}.${index}`. role: Its role, or null.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.desired, m); ensemble/HumanCrowd.ts (HumanCrowd.steer.leaders, m); ensemble/HumanCrowd.ts (HumanCrowd.steer.agents, m); ensemble/HumanCrowd.ts (HumanCrowd.steer.frames, _); ensemble/HumanCrowd.ts (HumanCrowd.steer.byLeader, m); ensemble/HumanCrowd.ts (HumanCrowd.steer.agentOf, m).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanAttribute.Name, IAutoMovieProficiency identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IMember {
    /** Its index, from 0. */
    index: number;

    /** Its subject id, `${ensemble}.${index}`. */
    subject: string;

    /** Its role, or null. */
    role: string | null;

    /** Its body, drawn from the pool. */
    body: IAutoMovieMotionHumanBody;

    /** Its body's index in the pool. */
    pool: number;

    /** Its attributes, each in [0, 1]; an attribute the group does not state is absent. */
    attributes: Readonly<
      Partial<Record<IAutoMovieMotionHumanAttribute.Name, number>>
    >;

    /** Its proficiency: the drawn `p`, with discipline on the axes it replaces. */
    proficiency: IAutoMovieProficiency;

    /** Its starting place. */
    place: IAutoMovieMotionHumanEnsemble.IPlace;

    /** Its slot in the formation's own frame, or null without a formation. */
    slot: IAutoMovieMotionHumanFormation.ILocal | null;

    /** How much of it is performed. */
    detail: IAutoMovieMotionHumanEnsemble.Detail;

    /**
     * A prop of its own, `${subject}.${name}`: its musket, its horse.
     *
     * @param name The prop's name within the member.
     * @returns The prop's subject id.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanEnsemble.IMember.prop: A prop of its own, `${subject}.${name}`: its musket, its horse.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanEnsemble.IMember.prop is used through packages/motions/src/ensemble/HumanEnsemble.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanEnsemble.IMember.prop is used through packages/motions/src/ensemble/HumanEnsemble.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanEnsemble.IMember.prop is used through packages/motions/src/ensemble/HumanEnsemble.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanEnsemble.IMember.prop is used through packages/motions/src/ensemble/HumanEnsemble.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanEnsemble.IMember.prop is used through packages/motions/src/ensemble/HumanEnsemble.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanEnsemble.IMember.prop is used through packages/motions/src/ensemble/HumanEnsemble.ts.
     */
    prop(name: string): string;
  }

  /**
   * A slot as a starting place. A starting place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: The floor point, world metres. yaw: The heading, degrees about +Y with 0 facing +Z.
   * @evidence contracts/development/design.md#principled-representation at: The floor point, world metres. yaw: The heading, degrees about +Y with 0 facing +Z.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsembleMembers.ts (placeOf, return); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlace {
    /** The floor point, world metres. */
    at: IAutoMovieVector3;

    /** The heading, degrees about +Y with 0 facing +Z. */
    yaw: number;
  }

  /**
   * How much of a member is performed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation How much of a member is performed.
   * @evidence contracts/development/design.md#principled-representation Closed choices "full", "instanced", "population" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in ensemble/IAutoMovieMotionHumanEnsemble.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
   */
  export type Detail = "full" | "instanced" | "population";

  /**
   * A sub-ensemble that walks together.
   *
   * @evidence contracts/development/common.md#meaningful-documentation index: Its index, from 0.
   * @evidence contracts/development/design.md#principled-representation index: Its index, from 0.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.groups, return); ensemble/HumanCrowd.ts (HumanCrowd.steer); ensemble/HumanCrowd.ts (HumanCrowd.steer.agents); ensemble/HumanEnsemble.ts (HumanEnsemble.groups).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanEnsemble.groups.
   */
  export interface IGroup {
    /** Its index, from 0. */
    index: number;

    /** Its members' indices, consecutive. */
    members: readonly number[];
  }

  /**
   * A member's desired speed and delay as the pass draws them: its gait's speed at its leg length scaled by its keyed normal draw (floored at `SLOWEST`, its spread widened in flight by low morale's fluctuation, `HUMAN_ATTRIBUTE_EFFECTS.morale.fluctuation`), by fatigue and in flight by morale, and its response latency when the request names one. A resolved ensemble.
   *
   * @evidence contracts/development/common.md#meaningful-documentation members: Its members, in index order.
   * @evidence contracts/development/design.md#principled-representation members: Its members, in index order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.desired, ensemble); ensemble/HumanCrowd.ts (HumanCrowd.steer, ensemble); ensemble/HumanEnsemble.ts (HumanEnsemble.of, return); ensemble/HumanEnsemble.ts (HumanEnsemble.performers, ensemble); ensemble/HumanEnsemble.ts (HumanEnsemble.members, ensemble); ensemble/HumanEnsemble.ts (HumanEnsemble.chains, ensemble).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanEnsemble, IAutoMovieMotionHumanEnsemble.IMember identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IEnsemble {
    /** The input it was resolved from. */
    input: IAutoMovieMotionHumanEnsemble;

    /** Its members, in index order. */
    members: readonly IAutoMovieMotionHumanEnsemble.IMember[];
  }

  /**
   * A role: how many members take it and which.
   *
   * @evidence contracts/development/common.md#meaningful-documentation pick: Which: the front rank's, the rear rank's, a flank's (file 0 then the last file), or the given indices; the lowest free indices when absent.
   * @evidence contracts/development/design.md#principled-representation pick: Which: the front rank's, the rear rank's, a flank's (file 0 then the last file), or the given indices; the lowest free indices when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in ensemble/IAutoMovieMotionHumanEnsemble.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
   */
  export interface IRole {
    /** How many members, a whole number. */
    count: number;

    /** Which: the front rank's, the rear rank's, a flank's (file 0 then the last file), or the given indices; the lowest free indices when absent. */
    pick?: "front" | "rear" | "flank" | readonly number[];
  }

  /**
   * What a detail rule reads of a member.
   *
   * @evidence contracts/development/common.md#meaningful-documentation index: The member's index. role: Its role, or null. block: Its block in the formation, or null without one.
   * @evidence contracts/development/design.md#principled-representation index: The member's index. role: Its role, or null. block: Its block in the formation, or null without one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in ensemble/IAutoMovieMotionHumanEnsemble.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
   */
  export interface IMemberRef {
    /** The member's index. */
    index: number;

    /** Its role, or null. */
    role: string | null;

    /** Its block in the formation, or null without one. */
    block: number | null;

    /** Its rank in its block, from 0 at the front, or null without a formation. */
    rank: number | null;
  }

  /**
   * Sub-ensembles that walk together, as many pedestrians do in twos and threes (Moussaïd et al. 2010): members are taken in index order, and an ungrouped member starts a group with probability `q` whose size is drawn from `sizes`, taking the next members. With `s` the mean size, a start share `q = share / (s - share (s - 1))` puts `share` of the members in groups on average, since `q s / (q s + 1 - q)` of them are grouped. Input spec of HumanEnsemble.groups. The grouped share in [0, 1] and the group sizes allowed, each at least 2.
   *
   * @evidence contracts/development/common.md#meaningful-documentation share: Expected share of ensemble members assigned to groups, in [0, 1]; a random grouping need not realise the exact fraction. sizes: Allowed group member counts, each at least 2; the grouping procedure draws among these sizes.
   * @evidence contracts/development/design.md#principled-representation share: Expected share of ensemble members assigned to groups, in [0, 1]; a random grouping need not realise the exact fraction. sizes: Allowed group member counts, each at least 2; the grouping procedure draws among these sizes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.groups, spec).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanEnsemble.groups.
   */
  export type IGroupsSpec = {
    /** Expected share of ensemble members assigned to groups, in [0, 1]; a random grouping need not realise the exact fraction. */
    share: number;
    /** Allowed group member counts, each at least 2; the grouping procedure draws among these sizes. */
    sizes: readonly number[];
  };
}
