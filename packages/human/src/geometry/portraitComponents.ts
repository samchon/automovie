/**
 * Shared protocol between replaceable anatomy and the head assembler. Fit reads
 * the observed host, attach contributes shared skin, and interior preparation
 * reads the sealed final skin. All construction coordinates are head millimetres
 * (+Y up, +Z anterior, +X anatomical left); only final model packing uses metres.
 * Components own their returned buffers and never mutate a supplied host or
 * refined surface. Vertex identities belong to their native meshes; equal XYZ
 * coordinates alone establish neither a shared attachment nor collision policy.
 */
import { selectAutoMovieTriangleRegion } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { IPortraitFinalSurface } from "./portraitFinalSurface";
import type { IPortraitRegionReplacement } from "./portraitRegionReplacement";
import type { IControlMesh } from "./subdivideControlMesh";

/**
 * A part's exact skin attachment, in the host's millimetre coordinate frame.
 * The host spreads its displacement through neighbouring skin within reach.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Declares one exact component-to-skin attachment and its connected influence reach.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Binds a retained host vertex to a finite millimetre target and maximum skin-travel distance.
 */
export interface IPortraitSkinConstraint {
  /** Existing host vertex identity, retained through assembly and subdivision. */
  vertex: number;
  /** Requested XYZ position of that shared attachment vertex, in millimetres. */
  target: number[];
  /** Maximum distance along the original skin over which surrounding skin adapts. */
  reach: number;
}

/**
 * The substrate a replaceable anatomical component fits. Landmark identities
 * belong to the subject's socket binding, never to the generic host assembler.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Separates caller-owned anatomical landmark bindings from the generic component assembler.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Carries original control coordinates, removable face ordinals and the observed view direction used during fitting.
 */
export interface IPortraitComponentHost {
  /** Original measured control positions, including any non-skin gaze markers. */
  positions: number[][];
  /** Original oriented skin triangles; their ordinals identify removable faces. */
  indices: number[];
  /** Recorded image-depth direction used to preserve measured gaze placement. */
  viewRay: number[];
}

/**
 * An independent interior before metric model packing. Its producer transfers
 * newly owned mesh buffers in the shared head frame, retaining native indices
 * and normals valid for those positions. Changing positions invalidates derived
 * normals; this descriptor does not declare fixed/free tissue or seam aliases.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Carries a component-owned anatomical interior and its finish before model construction.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Keeps native interior geometry in head millimetres until the single metric model boundary.
 */
export interface IPortraitInterior {
  /** Stable model-part identity, retained when the mesh is finally packed. */
  id: string;
  /** Existing palette identity; preparation does not create a material. */
  material: string;
  /** Fresh, placed head-space mesh in millimetres, with its native connectivity. */
  mesh: IAutoMovieMesh;
}

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

/**
 * A swappable anatomical component. The assembler depends on this protocol,
 * rather than importing an eye or nose implementation. A new component can
 * supply different geometry while retaining the same attachment protocol.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Defines a swappable anatomical part through identity, optional finishes and a host-fitting operation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Lets separate left/right parts provide their own geometry while the assembler consumes one common attachment protocol.
 */
export interface IPortraitComponent {
  /** Optional component-owned finishes; scalar properties follow this part's dimensions. */
  materials?: IAutoMovieMaterial[];
  /** Stable instance identity, allowing separate left/right components. */
  id: string;
  /** Fit the component's numerical shape to this subject's declared socket. */
  fit: (host: IPortraitComponentHost) => IPortraitComponentPlan;
}

/**
 * Select the original patch bounded by the inward-oriented anatomical loop.
 * The engine owns the connectivity operation; no image-plane test is repeated
 * here, so changing a measured face cannot change which seam triangles it cuts.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Selects a component's host patch by anatomical boundary connectivity rather than image-plane containment.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Delegates the inward-oriented loop to the engine's triangle-region selector, preserving original removable face identities.
 */
export function portraitFacesInsideLoop(
  host: IPortraitComponentHost,
  loop: number[],
): number[] {
  return selectAutoMovieTriangleRegion({
    indices: host.indices,
    boundary: loop,
  });
}
