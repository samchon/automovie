/**
 * A generated closed anatomical solid with a volumetric interior.
 *
 * Positions are XYZ metres in the common right-handed Y-up, Z-forward body
 * frame. Four ordinals per tetrahedron index one connected material region;
 * three oriented ordinals per boundary face enclose that region. Bone, muscle
 * and adipose solids own separate interiors so attachment and sliding rules
 * can distinguish their tissue interface. A body editor never accepts these
 * arrays as authored parameters or a repackaged CT asset. A generator creates
 * them from named anatomy and a validator checks positive orientation,
 * manifold boundary, volume agreement and inter-part contact. Interior mesh
 * density follows geometry and contact error, not a fixed triangle count per
 * guessed part; render LOD is a separate projection. The shared exterior
 * skin is a separate connected result.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGeneratedSolid {
  /** Flat XYZ triples in the shared Y-up, Z-forward body frame. */
  readonly positionsMetres: readonly number[];
  /** Flat groups of four vertex ordinals with positive signed orientation. */
  readonly tetrahedra: readonly number[];
  /** Flat oriented triples enclosing the same tetrahedral interior. */
  readonly boundaryTriangles: readonly number[];
  /** Signed tetrahedron sum made positive by the validated orientation. */
  readonly volumeCubicMetres: number;
}
