/**
 * An unmodified engine refusal while reading actual source collider geometry.
 *
 * @author Samchon
 */
export interface IHumanSourceColliderQueryFailure {
  /** Resident source point ordinal; null means the query could not be constructed. */
  vertex: number | null;

  /** Engine diagnostic including any triangle, arithmetic and coordinate context. */
  error: string;
}
