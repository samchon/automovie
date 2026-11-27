import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../core";
import type { createScenicContainer } from "./internal/createScenicContainer";

/** Middle Kingdom basket with a fitted lid, used as a silhouette reference. */
const COIL: string =
  "Illustrative set sizes after the Met Cylindrical Coil Basket and Lid (https://www.metmuseum.org/art/collection/search/556720).";

/**
 * Excavated medieval willow basket, whose surviving mounted components are not
 * whole-object measurements.
 */
const WILLOW: string =
  "Illustrative set sizes after the Museum Wales medieval wooden fish basket (https://museum.wales/collections/online/object/28afeeb4-7349-3a1b-94ef-55f8eb09a72d/Medieval-wooden-fish-basket/).";

/** Excavated Tudor chest described by the Mary Rose Museum. */
const COFFER: string =
  "Illustrative set sizes after the Mary Rose carpenter's lidded chest (https://maryrose.org/meet-the-crew/the-carpenter/).";

/**
 * A modern molded dairy crate, the collection example about 0.34 m square and
 * 0.28 m high.
 */
const CRATE: string =
  "Illustrative sizes around The Henry Ford's 13.25 in square, 11 in tall milk crate (https://www.thehenryford.org/collections/explore/artifact/269409).";

/** An original science-fiction container with authorable size. */
const POD: string = "Speculative sizes for an original fictional cargo pod.";

/** The mass figures are illustrative props' masses. */
const MASS: string = "Estimated prop mass for scene use.";

/**
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
    width: AutoMovieArchetypeBand.metres(0.24, 0.4, COIL, true),
    depth: AutoMovieArchetypeBand.metres(0.24, 0.4, COIL, true),
    height: AutoMovieArchetypeBand.metres(0.15, 0.27, COIL, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.25, 0.7, MASS, true),
  },
  woodenFishBasket: {
    width: AutoMovieArchetypeBand.metres(0.4, 0.62, WILLOW, true),
    depth: AutoMovieArchetypeBand.metres(0.31, 0.48, WILLOW, true),
    height: AutoMovieArchetypeBand.metres(0.35, 0.56, WILLOW, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.7, 2.3, MASS, true),
  },
  plankCoffer: {
    width: AutoMovieArchetypeBand.metres(0.58, 0.94, COFFER, true),
    depth: AutoMovieArchetypeBand.metres(0.33, 0.53, COFFER, true),
    height: AutoMovieArchetypeBand.metres(0.32, 0.54, COFFER, true),
    mass: AutoMovieArchetypeBand.of("kg", 6, 14, MASS, true),
  },
  moldedCrate: {
    width: AutoMovieArchetypeBand.metres(0.31, 0.39, CRATE, true),
    depth: AutoMovieArchetypeBand.metres(0.31, 0.39, CRATE, true),
    height: AutoMovieArchetypeBand.metres(0.25, 0.31, CRATE, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.65, 1.4, MASS, true),
  },
  cargoPod: {
    width: AutoMovieArchetypeBand.metres(0.68, 1.14, POD, true),
    depth: AutoMovieArchetypeBand.metres(0.44, 0.76, POD, true),
    height: AutoMovieArchetypeBand.metres(0.42, 0.7, POD, true),
    mass: AutoMovieArchetypeBand.of("kg", 8, 20, MASS, true),
  },
};
