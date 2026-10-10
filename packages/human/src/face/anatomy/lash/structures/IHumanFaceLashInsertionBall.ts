/**
 * One shaft's insertion region measured from its emitted Float32 root ring.
 * The closed ball permits insertion only at crossing points within it; the
 * remaining original triangles and all witnesses outside it remain measured.
 *
 * @author Samchon
 */
export interface IHumanFaceLashInsertionBall {
  /** Mean of the eight distinct root ring vertices, in head-frame metres. */
  centre: readonly number[];

  /** Maximum emitted root-ring vertex distance from the centre, in metres. */
  radius: number;
}
