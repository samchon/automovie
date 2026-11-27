import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../../core";
import type { createScenicContainer } from "../internal/createScenicContainer";
import { ScenicContainerBandsData } from "./internal/ScenicContainerBandsData";

/*
 * All scenic container dimensions by kind. Historical entries cite the
 * silhouette references and mark each sizing band provisional. The cargo pod
 * ranges describe a fictional design. All mass bands are estimated prop masses
 * in kilograms.
 */
export const SCENIC_CONTAINER_BANDS: Readonly<
  Record<
    createScenicContainer.Kind,
    Readonly<Record<createScenicContainer.Dimension, IAutoMovieArchetypeBand>>
  >
> = {
  coilBasket: {
    width: AutoMovieArchetypeBand.metres(0.24, 0.4, ScenicContainerBandsData.COIL, true),
    depth: AutoMovieArchetypeBand.metres(0.24, 0.4, ScenicContainerBandsData.COIL, true),
    height: AutoMovieArchetypeBand.metres(0.15, 0.27, ScenicContainerBandsData.COIL, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.25, 0.7, ScenicContainerBandsData.MASS, true),
  },
  woodenFishBasket: {
    width: AutoMovieArchetypeBand.metres(0.4, 0.62, ScenicContainerBandsData.WILLOW, true),
    depth: AutoMovieArchetypeBand.metres(0.31, 0.48, ScenicContainerBandsData.WILLOW, true),
    height: AutoMovieArchetypeBand.metres(0.35, 0.56, ScenicContainerBandsData.WILLOW, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.7, 2.3, ScenicContainerBandsData.MASS, true),
  },
  plankCoffer: {
    width: AutoMovieArchetypeBand.metres(0.58, 0.94, ScenicContainerBandsData.COFFER, true),
    depth: AutoMovieArchetypeBand.metres(0.33, 0.53, ScenicContainerBandsData.COFFER, true),
    height: AutoMovieArchetypeBand.metres(0.32, 0.54, ScenicContainerBandsData.COFFER, true),
    mass: AutoMovieArchetypeBand.of("kg", 6, 14, ScenicContainerBandsData.MASS, true),
  },
  moldedCrate: {
    width: AutoMovieArchetypeBand.metres(0.31, 0.39, ScenicContainerBandsData.CRATE, true),
    depth: AutoMovieArchetypeBand.metres(0.31, 0.39, ScenicContainerBandsData.CRATE, true),
    height: AutoMovieArchetypeBand.metres(0.25, 0.31, ScenicContainerBandsData.CRATE, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.65, 1.4, ScenicContainerBandsData.MASS, true),
  },
  cargoPod: {
    width: AutoMovieArchetypeBand.metres(0.68, 1.14, ScenicContainerBandsData.POD, true),
    depth: AutoMovieArchetypeBand.metres(0.44, 0.76, ScenicContainerBandsData.POD, true),
    height: AutoMovieArchetypeBand.metres(0.42, 0.7, ScenicContainerBandsData.POD, true),
    mass: AutoMovieArchetypeBand.of("kg", 8, 20, ScenicContainerBandsData.MASS, true),
  },
};
