import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanAttribute } from "../ensemble/IAutoMovieMotionHumanAttribute";
import type { IAutoMovieMotionHumanEnsemblePreset } from "../ensemble/IAutoMovieMotionHumanEnsemblePreset";
import type { IAutoMovieMotionHumanFormation } from "../ensemble/IAutoMovieMotionHumanFormation";
import type { IAutoMovieProficiency } from "../skill/IAutoMovieProficiency";

/**
 * Staging data for arranging performers as an ensemble.
 */
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
export namespace IAutoMovieMotionHumanEnsemble {
  /**
   * A group of people written once: its members are performers of the grammar,
   * `${id}.${index}` with the index from 0, each given a body from the group's
   * pool, a proficiency and attribute values drawn from the group's
   * distributions, an optional role, and a place.
   *
   * The draws are keyed by the chain seed, the id, the member's index and the
   * quantity (`HumanAttribute.stream`), so adding a member or an attribute
   * leaves every other member's values bit-identical. A preset names a set of
   * distributions (`HUMAN_ENSEMBLE_PRESETS`); `attributes` and `proficiency`
   * override its rows. A member's place is its formation slot at second 0, or
   * the place given.
   */
  export interface IInput {
    /** The group's id; its members are `${id}.${index}`. */
    id: string;

    /** The chain seed every draw starts from: the performance's `seed`. */
    seed: string;

    /** How many members, a positive whole number. */
    count: number;

    /**
     * The body pool, at least one; each member's body is drawn from it by the
     * seed.
     */
    bodies: readonly IAutoMovieMotionHumanBody[];

    /**
     * A named set of distributions; every attribute neutral and proficiency
     * `trained` when absent.
     */
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

    /**
     * The distribution of the members' proficiency `p`, overriding the
     * preset's; the preset's when absent (`HUMAN_ENSEMBLE_PRESETS`: mean 0.9
     * for `elite` to 0.25 for `rabble`). `p` is the skill of every member's
     * actions ({@link IAutoMovieProficiency}).
     */
    proficiency?: IAutoMovieMotionHumanAttribute.IDistribution;

    /** Named roles and how many members take each, in the order they are filled. */
    roles?: Readonly<Record<string, IAutoMovieMotionHumanEnsemble.IRole>>;

    /** The formation the members stand in, member `i` in slot `i`. */
    formation?: IAutoMovieMotionHumanFormation;

    /**
     * Each member's starting place, by index or as a rule, when there is no
     * formation.
     */
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
     */
    detail?: (
      member: IAutoMovieMotionHumanEnsemble.IMemberRef,
    ) => IAutoMovieMotionHumanEnsemble.Detail;
  }

  /**
   * A member's desired speed and delay as the pass draws them: its gait's speed
   * at its leg length scaled by its keyed normal draw (floored at `SLOWEST`,
   * its spread widened in flight by low morale's fluctuation,
   * `HUMAN_ATTRIBUTE_EFFECTS.morale.fluctuation`), by fatigue and in flight by
   * morale, and its response latency when the request names one. One resolved
   * member.
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

    /**
     * Its attributes, each in [0, 1]; an attribute the group does not state is
     * absent.
     */
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
     */
    prop(name: string): string;
  }

  /** A slot as a starting place. A starting place. */
  export interface IPlace {
    /** The floor point, world metres. */
    at: IAutoMovieVector3;

    /** The heading, degrees about +Y with 0 facing +Z. */
    yaw: number;
  }

  /** How much of a member is performed. */
  export type Detail = "full" | "instanced" | "population";

  /** A sub-ensemble that walks together. */
  export interface IGroup {
    /** Its index, from 0. */
    index: number;

    /** Its members' indices, consecutive. */
    members: readonly number[];
  }

  /**
   * A member's desired speed and delay as the pass draws them: its gait's speed
   * at its leg length scaled by its keyed normal draw (floored at `SLOWEST`,
   * its spread widened in flight by low morale's fluctuation,
   * `HUMAN_ATTRIBUTE_EFFECTS.morale.fluctuation`), by fatigue and in flight by
   * morale, and its response latency when the request names one. A resolved
   * ensemble.
   */
  export interface IEnsemble {
    /** The input it was resolved from. */
    input: IAutoMovieMotionHumanEnsemble.IInput;

    /** Its members, in index order. */
    members: readonly IAutoMovieMotionHumanEnsemble.IMember[];
  }

  /** A role: how many members take it and which. */
  export interface IRole {
    /** How many members, a whole number. */
    count: number;

    /**
     * Which: the front rank's, the rear rank's, a flank's (file 0 then the last
     * file), or the given indices; the lowest free indices when absent.
     */
    pick?: "front" | "rear" | "flank" | readonly number[];
  }

  /** What a detail rule reads of a member. */
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
   * Sub-ensembles that walk together, as many pedestrians do in twos and threes
   * (Moussaïd et al. 2010): members are taken in index order, and an ungrouped
   * member starts a group with probability `q` whose size is drawn from
   * `sizes`, taking the next members. With `s` the mean size, a start share `q
   * = share / (s - share (s - 1))` puts `share` of the members in groups on
   * average, since `q s / (q s + 1 - q)` of them are grouped. Input spec of
   * HumanEnsemble.groups. The grouped share in [0, 1] and the group sizes
   * allowed, each at least 2.
   */
  export type IGroupsSpec = {
    /**
     * Expected share of ensemble members assigned to groups, in [0, 1]; a
     * random grouping need not realise the exact fraction.
     */
    share: number;
    /**
     * Allowed group member counts, each at least 2; the grouping procedure
     * draws among these sizes.
     */
    sizes: readonly number[];
  };
}
