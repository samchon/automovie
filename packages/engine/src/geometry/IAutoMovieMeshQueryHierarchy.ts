/**
 * A median box hierarchy over resident entries, built by
 * `buildAutoMovieMeshQueryHierarchy` and walked by the signed and separation
 * mesh queries, `collectAutoMovieSpatialQueryCandidates` and the human body's
 * nearest-centre envelope.
 *
 * Every node carries the componentwise XYZ extrema of every entry below it, in
 * the entries' shared metre frame, so a node's box distance is a lower bound
 * for every descendant and a walker may skip a node its query cannot reach.
 * A leaf holds the entries themselves, by reference and in partition order; a
 * branch holds two disjoint halves. Callers tell the variants apart with
 * `"triangles" in node`.
 *
 * @evidence contracts/common.md#principled-implementation A bounding-volume hierarchy whose node extrema are taken from the entry boxes, so the enclosure that makes pruning sound is a property of the stored numbers rather than of how the tree was split.
 * @evidence contracts/common.md#clear-and-simple-design One exported node type replaces the `ReturnType<typeof buildAutoMovieMeshQueryHierarchy<T>>` spelling every walker used to reconstruct, and the leaf keeps the field name `triangles` its existing walkers test for.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tree stores entries as given and never pads a node box, so a walker can prune only what the entry boxes themselves exclude.
 * @evidence contracts/common.md#meaningful-documentation States the builder and walkers, the frame, why a node box is a lower bound, how leaves hold entries, and how to discriminate the two variants.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type; the partition cost is answered on `buildAutoMovieMeshQueryHierarchy` and each walk on its query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A query compiles one tree per resident surface and every later call walks that same tree.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A tree of n > 12 entries holds at most n/3 nodes, since every leaf keeps at least six entries, each with two three-number arrays, plus references to the caller's entries; it lives as long as the compiled query or envelope that built it.
 * @author Samchon
 */
export type IAutoMovieMeshQueryHierarchy<
  T extends IAutoMovieMeshQueryHierarchy.IEntry,
> =
  | IAutoMovieMeshQueryHierarchy.ILeaf<T>
  | IAutoMovieMeshQueryHierarchy.IBranch<T>;

export namespace IAutoMovieMeshQueryHierarchy {
  /**
   * What the hierarchy reads from an entry: its actual enclosing box and the
   * centre that orders it for the median split.
   *
   * @evidence contracts/common.md#principled-implementation Node boxes are unions of `low` and `high`, so those must enclose the entry's geometry; `centre` only orders entries along the split axis and never widens or replaces the box.
   * @evidence contracts/common.md#clear-and-simple-design The structural minimum the builder needs, so triangle records, lash capsules and envelope centres all qualify without a shared base class.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A caller may not shrink the box to speed pruning; a box smaller than its geometry would let a walker skip a real nearest feature.
   * @evidence contracts/common.md#meaningful-documentation States what each field must enclose or represent and that the centre never stands in for geometry.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A structural constraint with no runtime code.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each entry is created once by the compiling query and reused by every walk of its tree.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Entries are the caller's records; the tree only references them.
   */
  export interface IEntry {
    /** Componentwise XYZ minimum of the entry's actual geometry, in metres. */
    low: number[];

    /** Componentwise XYZ maximum of the entry's actual geometry, in metres. */
    high: number[];

    /** Finite XYZ point ordering the entry along a split axis. */
    centre: number[];
  }

  /**
   * A terminal node holding at most twelve entries, or every entry when the
   * input had no more than twelve.
   *
   * @evidence contracts/common.md#principled-implementation `low` and `high` are the componentwise extrema of the held entries' boxes, so they enclose every entry; an empty leaf keeps the empty-union sentinels positive and negative infinity.
   * @evidence contracts/common.md#clear-and-simple-design A box plus the entries themselves, so a walker tests the leaf box once and then each entry's own box without another lookup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Entries are kept by reference with no copy or rounding, so a walker reads the same geometry the caller compiled.
   * @evidence contracts/common.md#meaningful-documentation States the leaf size limit, the infinite sentinels of an empty leaf, and that entries are held by reference.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; leaf size is chosen by the builder.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per tree and read by every walk.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owns two three-number arrays and one array of at most twelve references, except the single leaf of an input of twelve or fewer, which keeps the caller's own array.
   */
  export interface ILeaf<T extends IEntry> {
    /** Componentwise XYZ minimum over the held entries; Infinity when empty. */
    low: number[];

    /** Componentwise XYZ maximum over the held entries; -Infinity when empty. */
    high: number[];

    /** The held entries, by reference, ordered by the last split's centres. */
    triangles: T[];
  }

  /**
   * An interior node whose two children split its entries at the median
   * centre of its widest box axis.
   *
   * @evidence contracts/common.md#principled-implementation The node box is the union of both children's entries, so a walker that skips the branch skips nothing its box could not contain.
   * @evidence contracts/common.md#clear-and-simple-design Two children and the enclosing box, with no stored split axis, because no walker needs it once the boxes exist.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Both children are always nonempty, so no walker needs a guard for a hollow branch.
   * @evidence contracts/common.md#meaningful-documentation States how children are split and that the box encloses both.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; the split is chosen by the builder.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Interior nodes are created during the single build and only traversed afterwards.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns its box arrays and its two child nodes; it is released with the tree's root.
   */
  export interface IBranch<T extends IEntry> {
    /** Componentwise XYZ minimum over every descendant entry. */
    low: number[];

    /** Componentwise XYZ maximum over every descendant entry. */
    high: number[];

    /** Entries before the median along the widest axis. */
    left: IAutoMovieMeshQueryHierarchy<T>;

    /** Entries from the median on along the widest axis. */
    right: IAutoMovieMeshQueryHierarchy<T>;
  }
}
