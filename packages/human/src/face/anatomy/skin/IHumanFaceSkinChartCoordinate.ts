import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

/**
 * Coordinates in one publisher-registered native material disk. These are dimensionless material coordinates, not texture UVs, anatomical measurements or a personal curve input. Exact values preserve shared native corners through triangle-domain and edge-event comparisons.
 *
 * @evidence contracts/common.md#principled-implementation Exact represented dimensionless coordinates identify one material chart location.
 * @evidence contracts/common.md#clear-and-simple-design Chart registration and offset operations share this two-coordinate language.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These are neither texture UVs nor a personally supplied anatomical curve or measured distance.
 * @evidence contracts/common.md#meaningful-documentation Rational coefficients preserve represented material coordinates across exact native walks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fraction arithmetic and physical lifting execute in chart owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same chart location can be reused through current host shape changes subject to chart recompilation premises.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only small fraction records are retained; the erased coordinate schema owns no geometry.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartCoordinate {
  /** First coordinate of the registered material disk. */
  x: IHumanExactFraction;

  /** Second coordinate of that same registered material disk. */
  y: IHumanExactFraction;
}
