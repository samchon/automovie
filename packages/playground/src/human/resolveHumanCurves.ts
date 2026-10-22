import type { IHumanViewerPage } from "./IHumanViewerPage";

/**
 * Resolve a canonical curve selection against one Human model's part ids.
 *
 * Each pattern from `normalizeHumanCurves` becomes an anchored regular
 * expression in which `*` matches any characters; a pattern that matches no
 * curve throws, so a typo never renders an unselected frame. The skin
 * intervals a curve shapes follow the lofting rule: section `<chain>/<k>` is
 * the shared Hermite endpoint of intervals `<chain>/<k-1>` and `<chain>/<k>`,
 * and `<chain>/axis` shapes every interval of exactly that chain, not of its
 * child chains. Only the last `/` separates chain and layer, because chain
 * names contain dots.
 *
 * @param curves Canonical pattern list; empty selects nothing.
 * @param curveIds Curve ids of the model (construction part ids without `human.construction.`).
 * @param skinIds Skin interval ids of the model (skin part ids without `human.skin.`).
 * @returns The canonical value with its sorted selected curve ids and shaped skin ids.
 *
 * @evidence contracts/common.md#principled-implementation Glob-to-regex conversion escapes every other metacharacter, and the shaping rule is the Hermite endpoint relation of the lofting chains; unmatched patterns throw.
 * @evidence contracts/common.md#clear-and-simple-design A pure function of ids, separate from the closure that turns the result into display styles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No chain or curve name is special-cased; only the generator's `<chain>/<k|axis>` grammar is read.
 * @evidence contracts/common.md#meaningful-documentation States the glob meaning, failure rule, shaping rule and id separator.
 * @evidence contracts/performance.md#efficient-algorithms O(P x C) pattern tests over C curve ids, O(S) per selected axis over S skin ids, and O(n log n) sorting of the results.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller keeps the result for every style application of the same selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates only the result arrays, bounded by the model's curve and skin counts.
 */
export function resolveHumanCurves(
  curves: string,
  curveIds: readonly string[],
  skinIds: readonly string[],
): IHumanViewerPage.ISelection {
  if (curves === "") return { curves, selected: [], shaped: [] };

  const selected: Set<string> = new Set();
  for (const pattern of curves.split(",")) {
    const expression: RegExp = new RegExp(
      "^" +
        pattern
          .split("*")
          .map((text: string): string =>
            text.replace(/[.\\^$+?()[\]{}|/-]/g, "\\$&"),
          )
          .join(".*") +
        "$",
    );
    const matched: string[] = curveIds.filter((id: string): boolean =>
      expression.test(id),
    );
    if (matched.length === 0)
      throw new Error("Human curve pattern matches no curve: " + pattern);
    for (const id of matched) selected.add(id);
  }

  // Apply the lofting rule from each selected curve to skin interval ids.
  const skin: Set<string> = new Set(skinIds);
  const shaped: Set<string> = new Set();
  for (const id of selected) {
    const slash: number = id.lastIndexOf("/");
    const chain: string = id.slice(0, slash);
    const layer: string = id.slice(slash + 1);
    if (layer === "axis") {
      for (const interval of skinIds)
        if (interval.slice(0, interval.lastIndexOf("/")) === chain)
          shaped.add(interval);
      continue;
    }
    for (const k of [Number(layer) - 1, Number(layer)])
      if (skin.has(chain + "/" + k)) shaped.add(chain + "/" + k);
  }
  return {
    curves,
    selected: [...selected].sort(compare),
    shaped: [...shaped].sort(compare),
  };
}

/** Code-unit order, the order `normalizeHumanCurves` also uses. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
