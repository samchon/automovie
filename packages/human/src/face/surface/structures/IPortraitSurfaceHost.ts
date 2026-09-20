/**
 * The final connected skin before surface detail. Positions use construction
 * millimetres and normals are unit vectors. Bindings retain original vertex
 * identities after subdivision, while newly inserted vertices resolve detail.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Gives every replacing skin layer the same retained vertex and oriented triangle basis for its attachments.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Exposes read-only millimetre positions, triangle indices and unit normals without granting field factories mutation authority.
 */
export interface IPortraitSurfaceHost {
  /** Final shared skin positions; readers must not mutate them. */
  positions: readonly (readonly number[])[];

  /** Oriented shared triangle indices. */
  indices: readonly number[];

  /** Flat XYZ normal buffer over the complete shared surface. */
  normals: readonly number[];
}
