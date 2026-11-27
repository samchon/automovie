import { AutoMovieArchetypeBand, AutoMovieArchetypeUnits } from "../../core";
import type { AutoMovieArchetypeBag } from "../AutoMovieArchetypeBag";
import { BagBandsData } from "./internal/BagBandsData";

/*
 * The band of each free dimension of `createBag`, by kind, with the sources
 * they are read at: kept apart from the producer so each file stays within its
 * size.
 */
export const BAG_BANDS: typeof AutoMovieArchetypeBag.BANDS = {
  tote: {
    width: AutoMovieArchetypeBand.metres(
      9.5 * AutoMovieArchetypeUnits.INCH,
      17 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.TOTE,
      true,
    ),
    height: AutoMovieArchetypeBand.metres(
      10.5 * AutoMovieArchetypeUnits.INCH,
      15 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.TOTE,
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      5 * AutoMovieArchetypeUnits.INCH,
      7.5 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.TOTE,
      true,
    ),
    handleDrop: AutoMovieArchetypeBand.metres(
      6 * AutoMovieArchetypeUnits.INCH,
      8 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.TOTE,
      true,
    ),
    strapDrop: AutoMovieArchetypeBand.metres(
      21.75 * AutoMovieArchetypeUnits.INCH,
      25 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.STRAP,
      true,
    ),
    handleDiameter: BagBandsData.NIOSH_WEBBING,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.4,
      0.9,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  backpack: {
    width: AutoMovieArchetypeBand.metres(
      0.27,
      13 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.BACKPACK,
      true,
    ),
    height: AutoMovieArchetypeBand.metres(
      0.38,
      16.7 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.BACKPACK,
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.13,
      8.5 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.BACKPACK,
      true,
    ),
    handleDiameter: BagBandsData.NIOSH_WEBBING,
    mass: AutoMovieArchetypeBand.of("kg", 0.3, 0.3, BagBandsData.BACKPACK, true),
  },
  suitcase: {
    handleDiameter: BagBandsData.NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      3.2,
      4.3,
      "Rimowa Essential and Classic Cabin, 3.2 and 4.3 kg, product pages seen only in search results",
      true,
    ),
  },
  briefcase: {
    width: AutoMovieArchetypeBand.metres(0.415, 0.452, BagBandsData.ATTACHE, true),
    height: AutoMovieArchetypeBand.metres(0.35, 0.394, BagBandsData.ATTACHE, true),
    depth: AutoMovieArchetypeBand.metres(0.085, 0.147, BagBandsData.ATTACHE, true),
    handleDiameter: BagBandsData.NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of("kg", 2.3, 2.95, BagBandsData.ATTACHE, true),
  },
  toolbox: {
    width: AutoMovieArchetypeBand.metres(0.482, 0.482, BagBandsData.TOOLBOX),
    height: AutoMovieArchetypeBand.metres(0.25, 0.25, BagBandsData.TOOLBOX),
    depth: AutoMovieArchetypeBand.metres(0.254, 0.254, BagBandsData.TOOLBOX),
    handleDiameter: BagBandsData.NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of("kg", 1.5, 1.5, BagBandsData.TOOLBOX, true),
  },
  handbag: {
    width: AutoMovieArchetypeBand.metres(0.3, 0.3, BagBandsData.HANDBAG),
    height: AutoMovieArchetypeBand.metres(0.28, 0.28, BagBandsData.HANDBAG),
    depth: AutoMovieArchetypeBand.metres(0.2, 0.2, BagBandsData.HANDBAG),
    handleDrop: AutoMovieArchetypeBand.metres(0.11, 0.12, BagBandsData.HANDBAG, true),
    handleDiameter: BagBandsData.NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of("kg", 0.24, 0.24, BagBandsData.HANDBAG, true),
  },
  duffel: {
    width: AutoMovieArchetypeBand.metres(
      25 * AutoMovieArchetypeUnits.INCH,
      25 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.DUFFEL,
      true,
    ),
    height: AutoMovieArchetypeBand.metres(
      14 * AutoMovieArchetypeUnits.INCH,
      14 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.DUFFEL,
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      14 * AutoMovieArchetypeUnits.INCH,
      14 * AutoMovieArchetypeUnits.INCH,
      BagBandsData.DUFFEL,
      true,
    ),
    handleDiameter: BagBandsData.NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of("kg", 1.62, 1.62, BagBandsData.DUFFEL, true),
  },
};
