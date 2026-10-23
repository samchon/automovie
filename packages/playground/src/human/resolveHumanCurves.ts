import type { IHumanViewerPage } from "./IHumanViewerPage";
import { humanCurveColour } from "./humanCurveColour";

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
 * names contain dots. Selected curves keep pattern order (model order within
 * one glob) and take colours from {@link humanCurveColour} by that order.
 *
 * @param curves Canonical pattern list; empty selects nothing.
 * @param curveIds Curve ids of the model (construction part ids without `human.construction.`).
 * @param skinIds Skin interval ids of the model (skin part ids without `human.skin.`).
 * @returns The canonical value, the selected curve ids in selection order with their colours, and the shaped skin ids with the colour of the first curve shaping each.
 *
 * @evidence contracts/common.md#principled-implementation Glob-to-regex conversion escapes every other metacharacter, and the shaping rule is the Hermite endpoint relation of the lofting chains; unmatched patterns throw.
 * @evidence contracts/common.md#clear-and-simple-design A pure function of ids, separate from the closure that turns the result into display styles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No chain or curve name is special-cased; only the generator's `<chain>/<k|axis>` grammar is read.
 * @evidence contracts/common.md#meaningful-documentation States the glob meaning, failure rule, shaping rule and id separator.
 * @evidence contracts/performance.md#efficient-algorithms O(P x C) pattern tests over C curve ids, O(S) per selected axis over S skin ids; results keep insertion order, so nothing is sorted.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller keeps the result for every style application of the same selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates only the result arrays, bounded by the model's curve and skin counts.
 */
export function resolveHumanCurves(
  curves: string,
  curveIds: readonly string[],
  skinIds: readonly string[],
): IHumanViewerPage.ISelection {
  const empty: IHumanViewerPage.ISelection = {
    curves,
    selected: [],
    colours: [],
    shaped: [],
    shapedColours: [],
  };
  if (curves === "") return empty;

  // Pattern order first, model order within one glob; the first match wins.
  const selected: Set<string> = new Set();
  for (const pattern of curves.split(",")) {
    const expression: RegExp = resolveHumanCurves.glob(pattern);
    const matched: string[] = curveIds.filter((id: string): boolean =>
      expression.test(id),
    );
    if (matched.length === 0)
      throw new Error("Human curve pattern matches no curve: " + pattern);
    for (const id of matched) selected.add(id);
  }

  // Apply the lofting rule from each selected curve to skin interval ids; an
  // interval shaped by several curves takes the first curve's colour.
  const skin: Set<string> = new Set(skinIds);
  const shaped: Map<string, string> = new Map();
  [...selected].forEach((id: string, index: number): void => {
    const slash: number = id.lastIndexOf("/");
    const chain: string = id.slice(0, slash);
    const layer: string = id.slice(slash + 1);
    const intervals: string[] =
      layer === "axis"
        ? skinIds.filter(
            (interval: string): boolean =>
              interval.slice(0, interval.lastIndexOf("/")) === chain,
          )
        : [Number(layer) - 1, Number(layer)]
            .map((k: number): string => chain + "/" + k)
            .filter((interval: string): boolean => skin.has(interval));
    for (const interval of intervals)
      if (!shaped.has(interval)) shaped.set(interval, humanCurveColour(index));
  });
  return {
    curves,
    selected: [...selected],
    colours: [...selected].map((_: string, index: number): string =>
      humanCurveColour(index),
    ),
    shaped: [...shaped.keys()],
    shapedColours: [...shaped.values()],
  };
}

/**
 * Pattern helpers of the curve selection.
 *
 * @evidence contracts/common.md#principled-implementation Escapes every regular-expression metacharacter except the glob star.
 * @evidence contracts/common.md#clear-and-simple-design Shared by the 3D resolution and the 2D diagram expansion so both read globs alike.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Anchored at both ends, so a pattern never matches a substring.
 * @evidence contracts/common.md#meaningful-documentation States the glob meaning.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the pattern length.
 * @evidence contracts/performance.md#reuse-equivalent-work One expression per pattern per resolution.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace resolveHumanCurves {
  /**
   * Anchored regular expression of one glob pattern; `*` matches any characters.
   *
   * @param pattern Curve id pattern.
   */
  export function glob(pattern: string): RegExp {
    return new RegExp(
      "^" +
        pattern
          .split("*")
          .map((text: string): string =>
            text.replace(/[.\\^$+?()[\]{}|/-]/g, "\\$&"),
          )
          .join(".*") +
        "$",
    );
  }
}
