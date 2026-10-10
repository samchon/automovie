/**
 * The final connected skin before surface detail. Positions use construction
 * millimetres and normals are unit vectors. Bindings retain original vertex
 * identities after subdivision, while newly inserted vertices resolve detail.
 *
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
