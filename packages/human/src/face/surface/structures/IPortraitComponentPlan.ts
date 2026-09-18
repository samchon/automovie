import { IPortraitSkinConstraint } from "../../anatomy/skin/structures/IPortraitSkinConstraint";
import { IControlMesh } from "../../mesh/structures/IControlMesh";
import { IPortraitFinalSurface } from "./IPortraitFinalSurface";
import { IPortraitInterior } from "./IPortraitInterior";
import { IPortraitRegionReplacement } from "./IPortraitRegionReplacement";
import { IAutoMovieModelPart } from "@automovie/interface";

/**
 * An anatomical part fitted to one host. Its boundary constraints drive the
 * surrounding skin, and its attach stage shares the existing host vertex IDs.
 * Interior consumers can only be obtained after attachment, so they read the
 * actual refined boundary instead of guessing where subdivision will put it.
 * Native preparation is additive: existing direct finish callers still work.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Sequences fitted constraints, cut ownership, shared attachment and refined interior construction.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Carries declared rims, curve constraints, replacements, final surface proposals and the finisher obtained only after attachment.
 */
export interface IPortraitComponentPlan {
  /** Exact boundary/control positions requested before the host blends skin. */
  constraints: IPortraitSkinConstraint[];

  /** Triangle ordinals removed from the original host before this part attaches. */
  cutFaces: number[];

  /** Attach common skin topology, then return the consumer of the refined mesh. */
  attach: (
    cage: IControlMesh,
    adapted: number[][],
    region: (id: string, material: string) => number,
  ) => {
    /** Deliberately open skin rims, such as the inner eyelid, in boundary order. */
    openings: number[][];

    /** Seeds of fully coincident free rims to weld after refinement; omission keeps deliberate openings. */
    closures?: readonly number[];

    /** Optional closed anatomical curves with their own shared subdivision rule. */
    curves?: readonly (readonly number[])[];

    /** Replace reserved skin after host refinement, retaining a prebuilt source surface. */
    replacements?: readonly IPortraitRegionReplacement[];

    /** Propose shared final positions from the immutable post-layer surface. */
    finalSurface?: IPortraitFinalSurface;

    /**
     * Read the sealed refined skin and return owned head-millimetre interiors.
     * The head calls all selected providers before packing any material region.
     * An empty result is authoritative. When present, this replaces finish for
     * that head build; the consumer never generates the same interior twice.
     */
    prepareInteriors?: (refined: IControlMesh) => IPortraitInterior[];

    /**
     * Compatibility construction in model metres. Direct callers may use it;
     * the head uses it only when native preparation is absent. It reads the
     * same final surface without changing its coordinates or connectivity.
     */
    finish: (refined: IControlMesh) => IAutoMovieModelPart[];
  };
}
