import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanEnsemblePreset } from "./IHumanEnsemblePreset";
import type { HumanAttribute } from "./HumanAttribute";
import type { IHumanFormation } from "./IHumanFormation";

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
 * @evidence contracts/development/common.md#meaningful-documentation States the member naming, the draws and their keys, the override order and where a place comes from.
 * @evidence contracts/development/design.md#principled-representation A group as its count, a body pool, distributions and roles: the levels of Musse and Thalmann's hierarchical crowd (2001), the group as the controllable unit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanEnsemble.of` reads; the members are derived, never stored by the author.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A place is a formation or a list or a rule, never both a formation and places.
 */
export interface IHumanEnsemble {
  /** The group's id; its members are `${id}.${index}`. */
  id: string;

  /** The chain seed every draw starts from: the performance's `seed`. */
  seed: string;

  /** How many members, a positive whole number. */
  count: number;

  /** The body pool, at least one; each member's body is drawn from it by the seed. */
  bodies: readonly IHumanBody[];

  /** A named set of distributions; every attribute neutral and proficiency `trained` when absent. */
  preset?: IHumanEnsemblePreset.Name;

  /** Distributions overriding the preset's, by attribute. */
  attributes?: Readonly<Partial<Record<HumanAttribute.Name, HumanAttribute.IDistribution>>>;

  /** The distribution of the members' proficiency `p`, overriding the preset's. */
  proficiency?: HumanAttribute.IDistribution;

  /** Named roles and how many members take each, in the order they are filled. */
  roles?: Readonly<Record<string, IHumanEnsemble.IRole>>;

  /** The formation the members stand in, member `i` in slot `i`. */
  formation?: IHumanFormation;

  /** Each member's starting place, by index or as a rule, when there is no formation. */
  places?: readonly IHumanEnsemble.IPlace[] | ((index: number) => IHumanEnsemble.IPlace);

  /**
   * How much of each member is performed, by member: `full` performs it,
   * `instanced` displays a template member's pose moved to its place
   * (`HumanEnsemble.instance`), `population` hands it to the instanced
   * population layer (`HumanPopulation`) and leaves it out of the
   * performance. Declared by the author, never by a camera; `full` when
   * absent.
   */
  detail?: (member: IHumanEnsemble.IMemberRef) => IHumanEnsemble.Detail;
}

/**
 * Companion types of {@link IHumanEnsemble}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type states its members' meaning and units.
 * @evidence contracts/development/design.md#principled-representation A role is a count and a pick rule; a place is a floor point and a heading; a detail is a closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the ensemble's input names.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A role is a name, not a law: members of a role differ only by what the author builds for it.
 */
export namespace IHumanEnsemble {
  /** A role: how many members take it and which. */
  export interface IRole {
    /** How many members, a whole number. */
    count: number;

    /** Which: the front rank's, the rear rank's, a flank's (file 0 then the last file), or the given indices; the lowest free indices when absent. */
    pick?: "front" | "rear" | "flank" | readonly number[];
  }

  /** A starting place. */
  export interface IPlace {
    /** The floor point, world metres. */
    at: IAutoMovieVector3;

    /** The heading, degrees about +Y with 0 facing +Z. */
    yaw: number;
  }

  /** How much of a member is performed. */
  export type Detail = "full" | "instanced" | "population";

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
}
