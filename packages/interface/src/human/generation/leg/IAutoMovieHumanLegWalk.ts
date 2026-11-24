import type { IAutoMovieHumanFootSource } from "../foot/IAutoMovieHumanFootSource";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanLegProximal } from "./IAutoMovieHumanLegProximal";

/**
 * Public and intermediate leg-site laws and the actual pre-loft ankle/proximal
 * connections. Runtime construction and admission remain with
 * AutoMovieHumanLegWalk in Human.
 */
export namespace IAutoMovieHumanLegWalk {
  /**
   * Public tape laws and optional retained shape rows of the same source.
   *
   * One law supplies public and intermediate sites to the same construction.
   * The caller owns the lookup and its finite list for one source definition.
   */
  export interface ILaw {
    /** A named calibration-mm site from the same resolved inputs. */
    (site: string): ISiteLaw;
    /**
     * Retained intermediate shape names; the public SITES remain separately
     * identifiable.
     */
    intermediate?: readonly string[];
  }

  /** One site's law, calibration mm. */
  export interface ISiteLaw {
    /** Height of the site over the floor. */
    height: number;

    /**
     * The box's edges from the bone's axis: anterior, toward +Z (lateral on the
     * left leg, medial on the right), posterior (negative), toward -Z
     * (negative).
     */
    edges: [number, number, number, number];

    /** The tape there. */
    girth: number;
  }

  /** The exact pre-loft leg and the source station of its shared ankle anchor. */
  export type IDefinition = IAutoMovieHumanSourceDefinition & {
    /** Physical station of bone 2/share 1 in this identical source, mm. */
    ankleStation: number;
    /** Same actual lateral parent contact used to author the proximal source. */
    proximal?: IAutoMovieHumanLegProximal.IContact;
    /** Actual anterior parent contact on that same part and named hip plane. */
    proximalAnterior?: IAutoMovieHumanLegProximal.IContact;
    /**
     * Identical measured interval retained by the base, coupled trials/final
     * and ankle consumer.
     */
    distal?: IAutoMovieHumanFootSource.IRegion;
  };
}
