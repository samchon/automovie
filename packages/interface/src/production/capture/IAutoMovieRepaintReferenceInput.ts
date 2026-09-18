import { AutoMovieRepaintReferenceRole } from "./AutoMovieRepaintReferenceRole";

/**
 * One fixed, role-specific reference consumed by repaint.
 *
 * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `IAutoMovieRepaintReferenceInput` as the portable data boundary for the repaint reference roles requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `IAutoMovieRepaintReferenceInput` for the asset spec repaint controls references system contract.
 */
export interface IAutoMovieRepaintReferenceInput {
  /**
   * How the adapter must use this reference.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `role` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `role` for the asset spec repaint controls references system contract.
   */
  role: AutoMovieRepaintReferenceRole;
  /**
   * Exact project-relative asset-manifest path.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `path` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `path` for the asset spec repaint controls references system contract.
   */
  path: string;
}
