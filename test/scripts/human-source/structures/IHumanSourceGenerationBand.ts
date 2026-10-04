/**
 * The body band of the one skin: where a channel that only one partition
 * defines is blended across the cut.
 *
 * The face owns the head partition's shape and the body carries it rigidly
 * with the head anchor, so no band lies on the head side. The band is the
 * body-partition vertices (cut samples excluded) whose depth below the cut
 * loop is in `[0, reachMetres)`. A vertex's loop parameter is its azimuth
 * `atan2(x - axis[0], z - axis[1])` about the vertical axis through the cut
 * samples' neutral centroid; the loop height and a cut row at that azimuth are
 * linear interpolations between the two azimuth-adjacent `loopSamples`.
 * `weights[i]` is `1 - smootherstep(depth / reachMetres)` for `vertices[i]`:
 * one on the cut, zero at the band end, C2 and monotone. `reachMetres` is an
 * authored rig convention (`convention` records how it was chosen), not an
 * anatomical measurement.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationBand {
  convention: string;
  reachMetres: number;
  axis: number[];
  loopSamples: number[];
  vertices: number[];
  weights: number[];
}
