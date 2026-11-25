import type { AutoMovieSurfaceTier } from "./AutoMovieSurfaceTier";
import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";

/** Rest-only surface-network sampling through the shared network rig compiler. */
export namespace IAutoMovieSampleSurfaceNetwork {
  /**
   * Sample a surface network into a quad control cage at one tier.
   *
   * This is the rest cage of `rigAutoMovieSurfaceNetwork` without bindings,
   * which states every fill rule, the welding identity, the topology guarantee,
   * the limit fit and which vertices it holds, the UV default and every
   * refusal. A caller that poses the network every frame compiles the rig once
   * and calls its `pose` instead of sampling a posed network again.
   */
  export type IProps = {
    /**
     * Rest network in model metres. The sampler delegates admission and
     * topology construction to rigAutoMovieSurfaceNetwork and returns its newly
     * constructed cage.
     */
    network: IAutoMovieSurfaceNetwork;

    /**
     * Tier key selecting authored patch and edge sampling counts. Missing,
     * unsafe or nonpositive counts are rejected by network rig compilation.
     */
    tier: AutoMovieSurfaceTier;

    /**
     * Omitted means true: inverse-fit free control positions to limit targets.
     * False keeps geometric samples as controls and reports zero residual; ring
     * pins and rest girth constraints still apply.
     */
    fit?: boolean;
  };
}
