/**
 * One evaluated skin and its rest-authored garment coverage samples.
 *
 * Triangle indices, positions, normals and field entries address the same native vertices. Positions are posed metres in one body frame; coverage comes from the matching rest skin. The cut reads these arrays without changing them, and the garment owner subsequently closes and lifts its result. Interpolated normals must have a nonzero length wherever retained.
 *
 * @evidence contracts/common.md#principled-implementation Matching native triangle/position/normal/coverage entries preserve the evaluated skin and rest-authored garment region for sign-based cutting.
 * @evidence contracts/common.md#clear-and-simple-design The cut receives one source-corresponding carrier while subsequent closing/lift remain garment-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage from another rest skin or zero-length retained normal cannot be treated as a valid cut garment.
 * @evidence contracts/common.md#meaningful-documentation Members give native indexing, posed meter positions, aligned directions and positive-field retention meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Cut-input typing performs no edge interpolation or retained-face triangulation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Common native incidence establishes operand correspondence without caching cut results across changing coverage.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The input acquires no cut buffers, shared-edge map or garment emitter resource.
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
