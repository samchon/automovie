/**
 * A box hierarchy over resident entries, initially median-partitioned by
 * buildAutoMovieMeshQueryHierarchy and optionally given fresh entries/bounds by
 * refitAutoMovieMeshQueryHierarchy while preserving that partition. Signed and
 * separation queries, collectAutoMovieSpatialQueryCandidates and the human
 * nearest-centre envelope walk the same node representation.
 *
 * Every node carries the componentwise XYZ extrema of every entry below it, in
 * the entries' shared metre frame, so a node's box distance is a lower bound
 * for every descendant and a walker may skip a node its query cannot reach. A
 * leaf holds the entries themselves, by reference and in partition order; a
 * branch holds two disjoint halves. Callers tell the variants apart with
 * `"triangles" in node`.
 */
export type IAutoMovieMeshQueryHierarchy<
  T extends IAutoMovieMeshQueryHierarchy.IEntry,
> =
  | IAutoMovieMeshQueryHierarchy.ILeaf<T>
  | IAutoMovieMeshQueryHierarchy.IBranch<T>;

/** Data and callback contracts shared by the MeshQueryHierarchy operations. */
export namespace IAutoMovieMeshQueryHierarchy {
  /**
   * What the hierarchy reads from an entry: its actual enclosing box and the
   * centre that orders it for the initial median split. A refit replaces the
   * entry and its bounds while keeping the original partition membership.
   */
  export interface IEntry {
    /** Componentwise XYZ minimum of the entry's actual geometry, in metres. */
    low: number[];

    /** Componentwise XYZ maximum of the entry's actual geometry, in metres. */
    high: number[];

    /** Finite XYZ point used for partitioning when a new hierarchy is built. */
    centre: number[];
  }

  /**
   * A terminal node holding at most twelve entries, or every entry when the
   * input had no more than twelve.
   */
  export interface ILeaf<T extends IAutoMovieMeshQueryHierarchy.IEntry> {
    /** Componentwise XYZ minimum over the held entries; Infinity when empty. */
    low: number[];

    /** Componentwise XYZ maximum over the held entries; -Infinity when empty. */
    high: number[];

    /** Current entries by reference, in the original partition's leaf order. */
    triangles: T[];
  }

  /**
   * An interior node whose two children preserve the original median split. A
   * refit updates all bounds without repartitioning by the current centres.
   */
  export interface IBranch<T extends IAutoMovieMeshQueryHierarchy.IEntry> {
    /** Componentwise XYZ minimum over every descendant entry. */
    low: number[];

    /** Componentwise XYZ maximum over every descendant entry. */
    high: number[];

    /** Current replacements for the original lower median half. */
    left: IAutoMovieMeshQueryHierarchy<T>;

    /** Current replacements for the original upper median half. */
    right: IAutoMovieMeshQueryHierarchy<T>;
  }
}
