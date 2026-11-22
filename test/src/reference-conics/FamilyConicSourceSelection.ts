/** PNG selection only; complete original numeric/control evidence is always retained. */
export namespace FamilyConicSourceSelection {
  /**
   * Requested axes and the actual declared original identities chosen for images.
   *
   *
   * @evidence contracts/development/design.md#principled-representation Exact original ids and supported physical view names define PNG axes; null requested lists preserve absent-option semantics.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SourceCapture consumes these axes for image scopes and exact scalar owner selection; full original metadata is outside the selection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Failed declared factories stay selectable and unavailable rather than disappearing from offered identities.
   * @evidence contracts/development/common.md#meaningful-documentation Members state explicit versus absent input and PNG-only scope.
   */
  export interface IPlan {
    /** Null means the existing full plan; explicit order is preserved. */
    requested: { sources: string[] | null; views: string[] | null };
    /** Exact original ids or figure; failed factories remain selectable. */
    sources: string[];
    /** Supported native camera directions. */
    views: string[];
  }
  /** Parse one unambiguous list against actual offered identities, without modifying them. */
  function axis(
    args: readonly string[],
    key: string,
    offered: readonly string[],
  ): string[] | null {
    const found: string[] = args.filter(
      (arg: string): boolean => arg === key || arg.startsWith(key + "="),
    );
    if (found.length === 0) return null;
    if (found.length !== 1 || found[0] === key)
      throw new Error(key + " requires one explicit comma-separated list");
    const values: string[] = found[0]!.slice(key.length + 1).split(",");
    const seen: Set<string> = new Set();
    for (const value of values) {
      if (value.length === 0 || !offered.includes(value) || seen.has(value))
        throw new Error(
          "Unknown, empty or duplicate " + key + " value: " + value,
        );
      seen.add(value);
    }
    return values;
  }
  /**
   * Absent flags retain full output; explicit ids restrict only PNGs, never metadata.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact membership and uniqueness define unambiguous comma-separated PNG selections against declared originals and supported cameras.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Each axis is parsed once; absence copies the offered order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No substring match, unknown view, duplicate, empty value or repeated flag is admitted; metadata is not filtered.
   * @evidence contracts/development/implementation.md#efficient-algorithms Argument scans and requested-membership checks scale with CLI text and the small offered catalog; outputs copy only selected lists.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same plan drives physical camera scopes and exact scalar.owner filtering.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Inputs remain unmodified; only the returned small plan escapes and no resource is retained.
   * @evidence contracts/development/common.md#meaningful-documentation The comment specifies full absent output and PNG-only restriction.
   */
  export function select(
    args: readonly string[],
    offeredSources: readonly string[],
    offeredViews: readonly string[],
  ): IPlan {
    const sources: string[] | null = axis(args, "--sources", offeredSources);
    const views: string[] | null = axis(args, "--views", offeredViews);
    return {
      requested: { sources, views },
      sources: sources ?? [...offeredSources],
      views: views ?? [...offeredViews],
    };
  }
}
