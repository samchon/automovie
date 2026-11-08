import type {
  AutoMovieSoftAnalysisStatus,
  IAutoMovieSoftBodySurface,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Canonical surface and its actual analysis outcome for one cloth projection.
 *
 * @evidence contracts/development/design.md#principled-representation Requires Engine-derived surface data and its actual closed analysis status, with an optional borrowed material rather than a viewer-authored simulation result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Construction inputs are separate from the returned mutable projection and its update/disposal owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A default status cannot fabricate a solved cloth; supplied surface admission and anatomical/physical validity remain with the Engine producer, not this type declaration.
 * @evidence contracts/development/common.md#meaningful-documentation Fields name canonical surface, optional material ownership and the required outcome without implying hardware or solve proof from their presence.
 */
export interface IBuildSoftBodyObjectProps {
  /** Surface emitted by the Engine, including its drawn-panel bounds. */
  surface: IAutoMovieSoftBodySurface;

  /** Borrowed material; absent input creates the existing double-sided default. */
  material?: THREE.Material;

  /** Actual producer outcome, required without a solved-state default. */
  status: AutoMovieSoftAnalysisStatus;
}
