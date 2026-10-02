import { IAutoMovieModelPart } from "@automovie/interface";

import { IPortraitSkinConstraint } from "../../anatomy/skin/structures/IPortraitSkinConstraint";
import { IControlMesh } from "../../mesh/structures/IControlMesh";
import { IPortraitFinalSurface } from "./IPortraitFinalSurface";
import { IPortraitInterior } from "./IPortraitInterior";
import { IPortraitRegionReplacement } from "./IPortraitRegionReplacement";

/**
 * An anatomical part fitted to one host. Its boundary constraints drive the
 * surrounding skin, and its attach stage shares the existing host vertex IDs.
 * Interior consumers can only be obtained after attachment, so they read the
 * actual refined boundary instead of guessing where subdivision will put it.
 * Native preparation is additive: existing direct finish callers still work.
 *
 * @evidence contracts/common.md#principled-implementation The plan separates what a part asks of the host before attachment (constraints and cut faces) from what it appends after (attach) and from what it builds from the refined skin (interiors, finish), so consumers can only be obtained after attachment and read the actual refined boundary.
 * @evidence contracts/common.md#clear-and-simple-design Two data members and one function whose result carries the optional stages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitComponentPlan carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the role of each stage, that native preparation is additive and that direct finish callers still work.
 * @evidence contracts/modeling.md#shared-boundaries A plan declares its constraints and cut faces against the shared host vertex identities and returns its openings, closures and replacements as resident boundaries, so every part meets the skin through one shared definition.
 * @evidenceExclude contracts/modeling.md#spatial-conventions IPortraitComponentPlan states no unit or frame beyond what its members document.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitComponentPlan carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitComponentPlan admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitComponentPlan defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitComponentPlan is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitComponentPlan defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitComponentPlan emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitComponentPlan owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitComponentPlan {
  /** Exact boundary/control positions requested before the host blends skin. */
  constraints: IPortraitSkinConstraint[];

  /** Triangle ordinals removed from the original host before this part attaches. */
  cutFaces: number[];

  /**
   * Attach common skin topology, then return the consumer of the refined mesh.
   *
   * @evidence contracts/common.md#principled-implementation Attaching appends shared topology to the cage using the blended source positions and a region registrar, and returns the openings and the consumers of the refined mesh, so a consumer can only be obtained after the skin is complete.
   * @evidence contracts/common.md#clear-and-simple-design One function with the cage, the adapted positions and the registrar as inputs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitComponentPlan.attach is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States that attachment shares the host vertex ids and returns the deliberate openings, closures, curves, replacements, final surface and interiors.
   * @evidence contracts/modeling.md#shared-boundaries Attachment appends faces to the shared cage on resident host vertex identities and reports every deliberately open rim as an opening, so the assembler can audit that no other seam is left open.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitComponentPlan.attach is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitComponentPlan.attach carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitComponentPlan.attach decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitComponentPlan.attach is a declaration and displays nothing itself; the parts built from it are observed by their owners.
   * @evidenceExclude contracts/modeling.md#spatial-conventions IPortraitComponentPlan.attach states no unit or frame beyond what its members document.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitComponentPlan.attach carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitComponentPlan.attach admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitComponentPlan.attach defines no input through which a caller shapes a human form.
   */
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
