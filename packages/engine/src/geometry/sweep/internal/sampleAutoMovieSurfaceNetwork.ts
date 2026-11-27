import type {
  IAutoMovieSampleSurfaceNetwork,
  IAutoMovieSurfaceCage,
} from "@automovie/interface";

import { rigAutoMovieSurfaceNetwork } from "./rigAutoMovieSurfaceNetwork";

/*
 * Sample a surface network into a quad control cage at one tier.
 *
 * This is the rest cage of `rigAutoMovieSurfaceNetwork` without bindings, which
 * states every fill rule, the welding identity, the topology guarantee, the
 * limit fit and which vertices it holds, the UV default and every refusal. A
 * caller that poses the network every frame compiles the rig once and calls its
 * `pose` instead of sampling a posed network again.
 * Parameter props.network: The network, only read.
 * Parameter props.tier: The tier to sample.
 * Parameter props.fit: Whether to fit controls to the limit surface; omitted, true.
 * Returns: The cage, its targets, coordinates, patch grids and rings.
 * Error as `rigAutoMovieSurfaceNetwork` documents.
 */
export const sampleAutoMovieSurfaceNetwork: (
  props: IAutoMovieSampleSurfaceNetwork.IProps,
) => IAutoMovieSurfaceCage = (
  props: IAutoMovieSampleSurfaceNetwork.IProps,
): IAutoMovieSurfaceCage => rigAutoMovieSurfaceNetwork(props).cage;
