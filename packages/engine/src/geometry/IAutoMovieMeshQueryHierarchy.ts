/**
 * A box hierarchy over resident entries, initially median-partitioned by
 * buildAutoMovieMeshQueryHierarchy and optionally given fresh entries/bounds by
 * refitAutoMovieMeshQueryHierarchy while preserving that partition. Signed and
 * separation queries, collectAutoMovieSpatialQueryCandidates and the human
 * nearest-centre envelope walk the same node representation.
 *
 * Every node carries the componentwise XYZ extrema of every entry below it, in
 * the entries' shared metre frame, so a node's box distance is a lower bound
 * for every descendant and a walker may skip a node its query cannot reach.
 * A leaf holds the entries themselves, by reference and in partition order; a
 * branch holds two disjoint halves. Callers tell the variants apart with
 * `"triangles" in node`.
 *
 * @evidence contracts/development/design.md#principled-representation A bounding-volume hierarchy whose node extrema are taken from the entry boxes, so the enclosure that makes pruning sound is a property of the stored numbers rather than of how the tree was split.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One exported node type replaces the `ReturnType<typeof buildAutoMovieMeshQueryHierarchy<T>>` spelling every walker used to reconstruct, and the leaf keeps the field name `triangles` its existing walkers test for.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tree stores entries as given and never pads a node box, so a walker can prune only what the entry boxes themselves exclude.
 * @evidence contracts/development/common.md#meaningful-documentation States initial build versus fixed-partition refit, the walkers/frame, enclosure lower bounds, leaf ownership and variant discrimination.
 */
export type IAutoMovieMeshQueryHierarchy<
  T extends IAutoMovieMeshQueryHierarchy.IEntry,
> =
  | IAutoMovieMeshQueryHierarchy.ILeaf<T>
  | IAutoMovieMeshQueryHierarchy.IBranch<T>;

export namespace IAutoMovieMeshQueryHierarchy {
  /**
   * What the hierarchy reads from an entry: its actual enclosing box and the
   * centre that orders it for the initial median split. A refit replaces the
   * entry and its bounds while keeping the original partition membership.
   *
   * @evidence contracts/development/design.md#principled-representation Node boxes are unions of `low` and `high`, so those must enclose the entry's geometry; `centre` only orders entries along the split axis and never widens or replaces the box.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The structural minimum the builder needs, so triangle records, lash capsules and envelope centres all qualify without a shared base class.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A caller may not shrink the box to speed pruning; a box smaller than its geometry would let a walker skip a real nearest feature.
   * @evidence contracts/development/common.md#meaningful-documentation States what each field must enclose or represent and that the centre never stands in for geometry.
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
   *
   * @evidence contracts/development/design.md#principled-representation `low` and `high` are the componentwise extrema of the held entries' boxes, so they enclose every entry; an empty leaf keeps the empty-union sentinels positive and negative infinity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A box plus the entries themselves, so a walker tests the leaf box once and then each entry's own box without another lookup.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Entries are kept by reference with no copy or rounding, so a walker reads the same geometry the caller compiled.
   * @evidence contracts/development/common.md#meaningful-documentation States the leaf size limit, the infinite sentinels of an empty leaf, and that entries are held by reference.
   */
  export interface ILeaf<T extends IEntry> {
    /** Componentwise XYZ minimum over the held entries; Infinity when empty. */
    low: number[];

    /** Componentwise XYZ maximum over the held entries; -Infinity when empty. */
    high: number[];

    /** Current entries by reference, in the original partition's leaf order. */
    triangles: T[];
  }

  /**
   * An interior node whose two children preserve the original median split.
   * A refit updates all bounds without repartitioning by the current centres.
   *
   * @evidence contracts/development/design.md#principled-representation The node box is the union of both children's entries, so a walker that skips the branch skips nothing its box could not contain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two children and the enclosing box, with no stored split axis, because no walker needs it once the boxes exist.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both children are always nonempty, so no walker needs a guard for a hollow branch.
   * @evidence contracts/development/common.md#meaningful-documentation States original split preservation under refit and that current node bounds enclose both current children.
   */
  export interface IBranch<T extends IEntry> {
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
