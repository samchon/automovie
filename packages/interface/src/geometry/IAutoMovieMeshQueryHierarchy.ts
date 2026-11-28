/**
 * A median box hierarchy shared by nearest-feature and candidate queries.
 *
 * Each node encloses its descendant geometry in one XYZ metre frame. Box
 * distance is a lower bound for its descendants. A leaf contains entries by
 * reference and a branch contains the two median partitions. Test for the
 * `triangles` property to distinguish a leaf.
 *
 * Building chooses the widest node axis, breaking width ties in XYZ order, then
 * sorts by centre. Equal centres retain their order entering that split.
 * Refitting creates new bounds and nodes with the same partition membership.
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
    /** XYZ minima over the entries, all positive infinity for an empty leaf. */
    low: number[];

    /** XYZ maxima over the entries, all negative infinity for an empty leaf. */
    high: number[];

    /** Current entries by reference, in the original leaf order after refit. */
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
