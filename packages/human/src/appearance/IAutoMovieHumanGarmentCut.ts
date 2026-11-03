/** Skin clipped to a garment's region. */
export interface IAutoMovieHumanGarmentCut {
  /** Flat skin points of the garment vertices. */
  base: number[];

  /** Skin vertex nearest each garment vertex's skin point. */
  source: number[];

  /** Flat unit skin normals of the garment vertices. */
  normal: number[];

  /** Flat triangle indices, counter-clockwise from outside. */
  triangles: number[];
}

