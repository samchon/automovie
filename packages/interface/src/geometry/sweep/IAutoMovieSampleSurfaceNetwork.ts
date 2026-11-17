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
   *
   * @evidence contracts/development/design.md#principled-representation The authored model-metre network and tier determine quad topology and controls; the delegated rig compiler owns count, geometry and fit admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface sampleAutoMovieSurfaceNetwork needs only the network, tier and fit choice because it requests no bone bindings or construction snapshot.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Rest sampling shares the full rig construction path; fit=false changes control interpretation explicitly without bypassing ring pins or girth constraints.
   * @evidence contracts/development/common.md#meaningful-documentation States delegation, unit/frame, tier failures and the true default and effects of fit.
   */
  export type IProps = {
    /** Rest network in model metres. The sampler delegates admission and topology construction to rigAutoMovieSurfaceNetwork and returns its newly constructed cage. */
    network: IAutoMovieSurfaceNetwork;

    /** Tier key selecting authored patch and edge sampling counts. Missing, unsafe or nonpositive counts are rejected by network rig compilation. */
    tier: AutoMovieSurfaceTier;

    /** Omitted means true: inverse-fit free control positions to limit targets. False keeps geometric samples as controls and reports zero residual; ring pins and rest girth constraints still apply. */
    fit?: boolean;
  };
}
