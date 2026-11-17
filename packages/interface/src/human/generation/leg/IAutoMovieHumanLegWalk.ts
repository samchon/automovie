import type { IAutoMovieHumanFootSource } from "../foot/IAutoMovieHumanFootSource";
import type { IAutoMovieHumanSiteViewPart } from "../limb/IAutoMovieHumanSiteViewPart";
import type { IAutoMovieHumanLegProximal } from "./IAutoMovieHumanLegProximal";

/** Type contracts exchanged by AutoMovieHumanLegWalk; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegWalk {
  /**
   * Public tape laws and optional retained shape rows of the same source.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the five public sites distinct from normalized profile rows that author their intervening shape.
   * @evidence contracts/common.md#clear-and-simple-design A callable lookup and optional names preserve existing callers without a parallel curve owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Intermediate names do not become new measurements or sampled mesh readback.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes published site identities from retained placement/shape proxies.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callable data contract executes no interpolation.
   * @evidence contracts/performance.md#reuse-equivalent-work One law supplies public and intermediate sites to the same construction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the lookup and its finite list for one source definition.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Public tape laws and optional retained shape rows of the same source.
   * @evidence contracts/development/design.md#principled-representation `intermediate`: Retained intermediate shape names; the public SITES remain separately identifiable.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegLaws.of. Read by AutoMovieHumanLegWalk.define, AutoMovieHumanLegWalk.create, AutoMovieHumanLegWalk.source. Also types AutoMovieHumanLegLaws.resolve, AutoMovieHumanLegSources.legLaw.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `intermediate`: Retained intermediate shape names; the public SITES remain separately identifiable.
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
  export type IDefinition = IAutoMovieHumanSiteViewPart.IDefinition & {
    /** Physical station of bone 2/share 1 in this identical source, mm. */
    ankleStation: number;
    /** Same actual parent contact used to author the unmeasured proximal source. */
    proximal?: IAutoMovieHumanLegProximal.IContact;
    /** Identical measured interval retained by the base, coupled trials/final and ankle consumer. */
    distal?: IAutoMovieHumanFootSource.IRegion;
  };
}
