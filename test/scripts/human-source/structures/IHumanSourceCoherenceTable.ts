/**
 * One published coordinate table as the coherence reading consumes it: a
 * surface or a landmark table reduced to its neutral, triangles and rows.
 *
 * @author Samchon
 */
export interface IHumanSourceCoherenceTable {
  /** Which person view holds the table. */
  view: "head" | "body";

  /** Surface ID, or `landmarks`. */
  surface: string;

  /** Flat neutral XYZ. */
  positions: readonly number[];

  /** Flat triangle indices, or null for a landmark table. */
  indices: readonly number[] | null;

  /** Sparse `[vertex, dx, dy, dz]` rows by endpoint name. */
  targets: Readonly<Record<string, readonly number[]>>;
}
