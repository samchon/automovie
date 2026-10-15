import { AutoMovieSurfaceTier } from "./AutoMovieSurfaceTier";
import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import { rigAutoMovieSurfaceNetwork } from "./rigAutoMovieSurfaceNetwork";

/**
 * Sample a surface network into a quad control cage at one tier.
 *
 * This is the rest cage of `rigAutoMovieSurfaceNetwork` without bindings,
 * which states every fill rule, the welding identity, the topology guarantee,
 * the limit fit and which vertices it holds, the UV default and every
 * refusal. A caller that poses the network every frame compiles the rig once
 * and calls its `pose` instead of sampling a posed network again.
 *
 * @param props.network The network, only read.
 * @param props.tier The tier to sample.
 * @param props.fit Whether to fit controls to the limit surface; omitted, true.
 * @returns The cage, its targets, coordinates, patch grids and rings.
 * @throws Error as `rigAutoMovieSurfaceNetwork` documents.
 *
 * @evidence contracts/common.md#principled-implementation The multi-block structured cage `rigAutoMovieSurfaceNetwork` builds, read at rest.
 * @evidence contracts/common.md#clear-and-simple-design One implementation of sampling: rest cages and posed cages run the same per-vertex writers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every refusal of the rig applies unchanged.
 * @evidence contracts/common.md#meaningful-documentation Names the rig as the owner of the rules and says when to use which.
 * @evidence contracts/performance.md#efficient-algorithms The rig's compile, O(V) for V vertices plus the sweeps' compiles and one fit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call samples one tier once; posing callers keep the rig instead.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the rig and its buffers are released on return and the cage arrays are transferred to the caller.
 */
export const sampleAutoMovieSurfaceNetwork: (props: {
  network: IAutoMovieSurfaceNetwork;
  tier: AutoMovieSurfaceTier;
  fit?: boolean;
}) => IAutoMovieSurfaceCage = (props: {
  network: IAutoMovieSurfaceNetwork;
  tier: AutoMovieSurfaceTier;
  fit?: boolean;
}): IAutoMovieSurfaceCage => rigAutoMovieSurfaceNetwork(props).cage;
