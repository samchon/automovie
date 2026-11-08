/**
 * Glob matching over part and curve ids.
 *
 * A pattern is a glob where `*` matches any run of characters, tested against the whole id and
 * against the id without its namespace prefix (`human.skin.` or `human.construction.`), so
 * `foot.left/*` and `human.skin.foot.left/*` name the same parts. Entry lists apply in order and
 * the last matching entry wins, so a broad pattern can be refined after it.
 */
export namespace HumanInspectionPattern {
  /**
   * The regular expression of one glob.
   *
   * @param glob Glob over letters, digits and `_ . - / *`.
   * @returns An anchored expression.
   */
  export function expression(glob: string): RegExp {
    return new RegExp(
      "^" +
        glob
          .split("*")
          .map((part: string): string =>
            part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"),
          )
          .join(".*") +
        "$",
    );
  }

  /**
   * Whether an id matches any pattern, with or without its namespace prefix.
   *
   * @param id Full part or curve id.
   * @param patterns Globs.
   * @param prefix Namespace prefix a pattern may leave out.
   * @returns True when one pattern matches.
   */
  export function matches(
    id: string,
    patterns: readonly string[],
    prefix: string,
  ): boolean {
    const short: string = id.startsWith(prefix) ? id.slice(prefix.length) : id;
    return patterns.some((pattern: string): boolean => {
      const compiled: RegExp = expression(pattern);
      return compiled.test(id) || compiled.test(short);
    });
  }

  /**
   * The last entry whose pattern matches an id.
   *
   * @param id Full id.
   * @param entries Entries in URL order.
   * @param prefix Namespace prefix a pattern may leave out.
   * @returns The entry, or undefined when none matches.
   */
  export function last<T extends { pattern: string }>(
    id: string,
    entries: readonly T[],
    prefix: string,
  ): T | undefined {
    for (let k: number = entries.length - 1; k >= 0; --k)
      if (matches(id, [entries[k]!.pattern], prefix)) return entries[k];
    return undefined;
  }
}
