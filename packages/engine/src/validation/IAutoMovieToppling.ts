import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A suggested topple: the support hull edge the object tips over (the pivot
 * axis) and the horizontal direction it falls, when its center of mass
 * overhangs the support.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `IAutoMovieToppling` identifies the support edge, fall direction, and overhang associated with one unstable subject.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `IAutoMovieToppling` bounds the suggested correction to the pivot geometry and measured excess discovered by the support check.
 * @author Samchon
 */
export interface IAutoMovieToppling {
  /**
   * One end of the pivot edge (the nearest support hull edge).
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `tipEdgeStart` records one endpoint of the nearest support-hull edge selected as the topple pivot.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `tipEdgeStart` preserves the first world-space point of the affected support relation.
   */
  tipEdgeStart: IAutoMovieVector3;
  /**
   * The other end of the pivot edge.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `tipEdgeEnd` records the other endpoint that completes the unstable subject's pivot axis.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `tipEdgeEnd` preserves the second world-space point needed to reconstruct the chosen hull edge.
   */
  tipEdgeEnd: IAutoMovieVector3;
  /**
   * Unit horizontal direction (XZ, y=0) the object falls toward.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `fallDirection` identifies the horizontal unit direction from the support edge toward the overhanging center of mass.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `fallDirection` carries the XZ correction direction without inventing a vertical component.
   */
  fallDirection: IAutoMovieVector3;
  /**
   * How far past the margin the COM overhangs, in meters.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `overshoot` measures in meters how far the center of mass exceeds the permitted support margin.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `overshoot` retains the correction magnitude separately from the hull points and direction.
   */
  overshoot: number;
}
