/**
 * One evaluated skin and its rest-authored garment coverage samples.
 *
 * Triangle indices, positions, normals and field entries address the same
 * native vertices. Positions are posed metres in one body frame; coverage
 * comes from the matching rest skin. The cut reads these arrays without
 * changing them, and the garment owner subsequently closes and lifts its
 * result. Interpolated normals must have a nonzero length wherever retained.
 *
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceCutInput {
  /** Original triangle corners in native skin vertex order. */
  indices: readonly number[];

  /** Posed skin positions, one XYZ metre triple per native vertex. */
  positions: readonly number[];

  /** Posed outward normal directions, aligned with the skin positions. */
  normals: readonly number[];

  /** Rest coverage per native vertex; positive values retain the skin. */
  field: ArrayLike<number>;
}
