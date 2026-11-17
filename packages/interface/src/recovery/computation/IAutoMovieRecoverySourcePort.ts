import type { IAutoMovieRecoverySourcePortReference } from "../../index";

/**
 * Declared source support for a boundary observation in a scalar slab.
 * The reference is a closed union of saved curve, contact or named-boundary addresses; side selects before, after or physical boundary. Faces and optional edges are borrowed original source indices admitted by the region observer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Declared source support for a boundary observation in a scalar slab. The reference is a closed union of saved curve, contact or named-boundary addresses; side selects before, after or physical boundary. Faces and optional edges are borrowed original source indices admitted by the region observer.
 * @evidence contracts/development/design.md#principled-representation The reference is a closed union of saved curve, contact or named-boundary addresses; side selects before, after or physical boundary. Faces and optional edges are borrowed original source indices admitted by the region observer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Source slab observation and atlas observation supply ports to RecoveryEventRegionPorts, which computes ownership from actual support.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted edge witnesses do not promise unique ownership, and equal coordinates do not identify source incidence.
 */
export interface IAutoMovieRecoverySourcePort {
  /** Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. */
  id: string;

  /** Saved observation address for this port; the discriminant separates closed/open curves, contacts and named boundaries. */
  reference: IAutoMovieRecoverySourcePortReference;

  /** Source-boundary role: before or after scalar plane, or an actual physical source boundary. */
  side: "before" | "after" | "physical";

  /** Exact cut-segment faces, rather than an unqualified endpoint-star superset. */
  faces: readonly number[];

  /** Original source endpoint addresses of physical boundary edges, when supplied. */
  edges?: readonly (readonly [number, number])[];
}
