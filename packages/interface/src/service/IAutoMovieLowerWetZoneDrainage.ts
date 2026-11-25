import type { IAutoMovieFluidDomain } from "../fluid/IAutoMovieFluidDomain";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/**
 * A wet zone and existing fluid domain to which plumbing sources and waste
 * drains are appended.
 */
export namespace IAutoMovieLowerWetZoneDrainage {
  /**
   * A wet zone and existing fluid domain to which plumbing sources and waste
   * drains are appended.
   *
   * This is the seam that keeps one model of moving water. The service graph
   * states where water is delivered and where it is taken away; the
   * shallow-water domain states how it then moves. Rather than inventing a
   * second, weaker account of flow inside the building record, the zone's
   * supply ports become the domain's declared sources and its drains become the
   * domain's declared drains, at the lattice cells they actually stand over. A
   * basin that fills, overflows and empties is then the fluid solver's ordinary
   * business, and its mass ledger is the same one every other domain is checked
   * with.
   *
   * The sill of a derived drain is the bed elevation of its own cell, which is
   * what a plain floor gully is: it opens the moment water stands on the floor
   * above it. A weir with a raised sill is a different fixture and is authored
   * on the domain directly.
   *
   * Every supply inlet in the room becomes a source, including the inlet of a
   * fitting that merely passes the medium on. That is not a double count: such
   * a fitting declares `0`, so it lowers to a source that delivers nothing, and
   * the water is counted once where it is actually drawn. Dropping those inlets
   * by node kind would instead make `kind` decide a hydraulic quantity the
   * port's own `demand` already states.
   *
   * The network is expected to have been validated already; this lowering
   * answers only for the placement it performs, not for the graph it reads.
   *
   * Refuses rather than repairs. An unknown zone, an unknown drain node, a node
   * standing off the lattice and a derived id that collides with an authored
   * one each raise, because every one of them would otherwise produce a domain
   * that silently conserves the wrong amount of water. The returned domain
   * shares unchanged grid, bed and authored entry records; only source/drain
   * arrays and derived entries are new. There is currently no production caller
   * for this composition, only service drainage tests.
   */
  export type IProps = {
    /**
     * Borrowed previously admitted graph. Selected plumbing inlet system/port
     * units are checked for cubic-meter-per-second; admitted waste-water
     * outlets already use that unit. No conversion is performed and medium
     * other remains allowed with volumetric demand.
     */
    network: IAutoMovieServiceNetwork;

    /**
     * Exact wet-zone id in network.zones; an unknown id throws. Its space
     * selects supply nodes and its drains list selects drainage nodes.
     */
    zone: string;

    /**
     * Borrowed admitted fluid domain whose world X/Z grid locates nodes. The
     * result copies source/drain arrays and shares unchanged grid, bed and
     * authored entries.
     */
    domain: IAutoMovieFluidDomain;
  };
}
