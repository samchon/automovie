/**
 * The final connected skin before surface detail. Positions use construction
 * millimetres and normals are unit vectors. Bindings retain original vertex
 * identities after subdivision, while newly inserted vertices resolve detail.
 *
 * @evidence contracts/common.md#principled-implementation The host is the final connected skin before surface detail: positions, oriented triangles and a normal buffer that layer factories read to resolve their metric fields.
 * @evidence contracts/common.md#clear-and-simple-design Three read-only fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitSurfaceHost carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States that it is read-only and what the bindings retain through subdivision.
 * @evidence contracts/modeling.md#spatial-conventions Positions are construction millimetres and normals are unit vectors.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitSurfaceHost is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitSurfaceHost carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitSurfaceHost decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitSurfaceHost constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitSurfaceHost is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitSurfaceHost carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitSurfaceHost admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitSurfaceHost defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export interface IPortraitSurfaceHost {
  /** Final shared skin positions; readers must not mutate them. */
  positions: readonly (readonly number[])[];

  /** Oriented shared triangle indices. */
  indices: readonly number[];

  /** Flat XYZ normal buffer over the complete shared surface. */
  normals: readonly number[];
}
