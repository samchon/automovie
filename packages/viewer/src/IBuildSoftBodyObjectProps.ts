import type {
  AutoMovieSoftAnalysisStatus,
  IAutoMovieSoftBodySurface,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Canonical surface and its actual analysis outcome for one cloth projection.
 *
 * @evidence contracts/common.md#principled-implementation Requires Engine-derived surface data and its actual closed analysis status, with an optional borrowed material rather than a viewer-authored simulation result.
 * @evidence contracts/common.md#clear-and-simple-design Construction inputs are separate from the returned mutable projection and its update/disposal owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A default status cannot fabricate a solved cloth; supplied surface admission and anatomical/physical validity remain with the Engine producer, not this type declaration.
 * @evidence contracts/common.md#meaningful-documentation Fields name canonical surface, optional material ownership and the required outcome without implying hardware or solve proof from their presence.
 * @evidence contracts/performance.md#efficient-algorithms The input holds surface/material references and a status tag; actual attribute copying and native projection cost belongs to buildSoftBodyObject.
 * @evidence contracts/performance.md#reuse-equivalent-work Separate projections may borrow the same canonical surface/material while each owns its geometry lifetime; equal status or domain text is not surface equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This type acquires no resource; the builder owns generated geometry/default material and never disposes a supplied material.
 *
 * @author Samchon
 */
export interface IBuildSoftBodyObjectProps {
  /** Surface emitted by the Engine, including its drawn-panel bounds. */
  surface: IAutoMovieSoftBodySurface;

  /** Borrowed material; absent input creates the existing double-sided default. */
  material?: THREE.Material;

  /** Actual producer outcome, required without a solved-state default. */
  status: AutoMovieSoftAnalysisStatus;
}
