/**
 * Native incidence and source-authored row anchors for a movement annulus.
 * Intermediate edge vertices are discovered from incidence, never from a
 * distance threshold or the expanded material chart.
 *
 * @author Samchon
 */
export interface IHumanSourceLidDisplacementPatchInput {
  generation: string;
  surface: string;
  indices: readonly number[];
  samples: readonly number[];
  posteriorStations: readonly number[];
  preseptalStations: readonly number[];
  interiorStations: readonly number[];
}
