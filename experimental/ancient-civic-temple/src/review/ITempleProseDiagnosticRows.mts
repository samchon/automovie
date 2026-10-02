/** Immutable measured rows consumed by formatTempleProseFailures. Each family
 * retains the fields used in its diagnostic; geometric producers own all other
 * fields and pass their results structurally without an adapter or mutation.
 * Lengths are metres, box/depth arrays are X/Y/Z, and pass is the producer's
 * verdict. These projections format decisions and do not recompute acceptance.
 *
 * @author Samchon
 */
export interface ITempleProseDiagnosticRows {
  /** Printed arithmetic and its independently calculated metre result. */
  equations: readonly { id: string; pass: boolean; expression: string; relation: string; stated: number; calculated: number }[];

  /** Directed local-axis interval whose finite nonzero extent was tested. */
  ranges: readonly { id: string; pass: boolean; axis: string; from: number; to: number }[];

  /** Dimensions compared with the model's declared occupancy box. */
  bounds: readonly { id: string; pass: boolean; kind: string; dimensions: readonly number[]; box: readonly number[] }[];

  /** Part union or unresolved axis; an unresolved row retains its part id. */
  unions: readonly { id: string; pass: boolean; kind: string; part: string; axis: string; union: number; box: number }[];

  /** Part back-plane distance from the authored wall datum. */
  wallContacts: readonly { id: string; pass: boolean; part: string; back: number }[];

  /** Measured tube contact or clearance with its construction relation. */
  tubeContacts: readonly { id: string; pass: boolean; kind: string; measured: number }[];

  /** Named part pair and the axis on which touching was evaluated. */
  partContacts: readonly { id: string; pass: boolean; parts: string; axis: string }[];

  /** Measured shape relation, optionally localized to a named part pair. */
  shapeRelations: readonly { id: string; pass: boolean; kind: string; parts?: string; measured: number }[];

  /** Undeclared AABB intersection depths in X/Y/Z order. */
  overlaps: readonly { id: string; pass: boolean; parts: string; depths: readonly number[] }[];
}
