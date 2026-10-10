import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

/**
 * Coordinates in one publisher-registered native material disk.
 * These are dimensionless material coordinates, not texture UVs, anatomical
 * measurements or a personal curve input. Exact values preserve shared
 * native corners through triangle-domain and edge-event comparisons.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartCoordinate {
  /** First coordinate of the registered material disk. */
  x: IHumanExactFraction;

  /** Second coordinate of that same registered material disk. */
  y: IHumanExactFraction;
}
