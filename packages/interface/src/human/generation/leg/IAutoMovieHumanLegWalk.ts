import type { IAutoMovieHumanFootSource } from "../foot/IAutoMovieHumanFootSource";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanLegProximal } from "./IAutoMovieHumanLegProximal";

/**
 * Public and intermediate leg-site laws and the actual pre-loft ankle/proximal connections. Runtime construction and admission remain with AutoMovieHumanLegWalk in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes public and intermediate leg-site laws and the actual pre-loft ankle/proximal connections; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Public and intermediate leg-site laws and the actual pre-loft ankle/proximal connections. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanLegWalk; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing LegWalk contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanLegWalk {
  /**
   * Public tape laws and optional retained shape rows of the same source.
   *
   * One law supplies public and intermediate sites to the same construction.
   * The caller owns the lookup and its finite list for one source definition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Public tape laws and optional retained shape rows of the same source.
   * @evidence contracts/development/design.md#principled-representation Keeps the five public sites distinct from normalized profile rows that author their intervening shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A callable lookup and optional names preserve existing callers without a parallel curve owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Intermediate names do not become new measurements or sampled mesh readback.
   */
  export interface ILaw {
    /** A named calibration-mm site from the same resolved inputs. */
    (site: string): ISiteLaw;
    /** Retained intermediate shape names; the public SITES remain separately identifiable. */
    intermediate?: readonly string[];
  }

  /** One site's law, calibration mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One site's law, calibration mm.
   * @evidence contracts/development/design.md#principled-representation `height`: Height of the site over the floor. `edges`: The box's edges from the bone's axis: anterior, toward +Z (lateral on the left leg, medial on the right), posterior (negative), toward -Z (negative). `girth`: The tape there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegLaws.laws, AutoMovieHumanLegLaws.found.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `height`, `edges`, `girth`; callers supply the complete record.
   */
  export interface ISiteLaw {
    /** Height of the site over the floor. */
    height: number;

    /** The box's edges from the bone's axis: anterior, toward +Z (lateral on the left leg, medial on the right), posterior (negative), toward -Z (negative). */
    edges: [number, number, number, number];

    /** The tape there. */
    girth: number;
  }

  /** The exact pre-loft leg and the source station of its shared ankle anchor.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The exact pre-loft leg and the source station of its shared ankle anchor.
   * @evidence contracts/development/design.md#principled-representation The exact pre-loft leg and the source station of its shared ankle anchor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegWalk.define, AutoMovieHumanLegWalk.reparent. Read by AutoMovieHumanFootInterim.prepare, AutoMovieHumanFootInterim.of, AutoMovieHumanFootInterim.toes. Also types AutoMovieHumanLegSourceFamily.initial, AutoMovieHumanLegSourceFamily.coupled.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyLaneInterim.side, AutoMovieHumanBodyLaneInterim.of, AutoMovieHumanFootInterim.prepare, AutoMovieHumanFootInterim.of for the exact pre-loft leg and the source station of its shared ankle anchor.
   */
  export type IDefinition = IAutoMovieHumanSourceDefinition & {
    /** Physical station of bone 2/share 1 in this identical source, mm. */
    ankleStation: number;
    /** Same actual parent contact used to author the unmeasured proximal source. */
    proximal?: IAutoMovieHumanLegProximal.IContact;
    /** Identical measured interval retained by the base, coupled trials/final and ankle consumer. */
    distal?: IAutoMovieHumanFootSource.IRegion;
  };
}
