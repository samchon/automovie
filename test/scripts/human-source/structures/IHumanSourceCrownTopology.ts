/**
 * Registered crown incidence shared by candidates of one immutable source.
 * Coordinates and their acceleration structures are deliberately absent: a
 * new candidate must rebuild those from its actual dental positions.
 *
 * @author Samchon
 */
export interface IHumanSourceCrownTopology {
  /** Immutable native ISO identity. */
  id: string;

  /** Mandibular ownership from the registered source. */
  mandibular: boolean;

  /** Original dental vertex ordinals, in registration order. */
  vertices: readonly number[];

  /** Original component plus its existing collider closure, in source order. */
  indices: readonly number[];

  /** Unique undirected source edges, ordered by their two vertex ordinals. */
  edges: readonly (readonly [number, number])[];
}
