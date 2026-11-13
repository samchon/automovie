import type { IAutoMovieInspectionRequest } from "../scene/inspection/IAutoMovieInspectionRequest.js";
import type { IAutoMovieInspectionView } from "../scene/inspection/IAutoMovieInspectionView.js";
import { matchAutoMovieInspectionPath } from "../scene/inspection/matchAutoMovieInspectionPath.js";
import { parseAutoMovieInspectionView } from "../scene/inspection/parseAutoMovieInspectionView.js";
import type { IAutoMovieCaptureResolution } from "./IAutoMovieCaptureResolution.js";

/**
 * Resolve every pattern a cell's request and view carry against the paths a drawn scene holds: the `parts`, `hide`, `label` and `color` patterns in that order and as written, then the view's focus pattern.
 *
 * `paths` are the scene's object paths and the paths of the marks it draws, in the scene's order; a repeated path counts once. Each pattern is matched by the inspection core's own rule, so it resolves exactly as the inspection applied it, and lists only its topmost matched paths, a path whose ancestor it also matched being counted but not listed.
 *
 * ```ts
 * resolveAutoMovieCapturePatterns({ paths: ["hero", "hero/arm", "lamp"], request, view: "front@focus=hero" });
 * // [{ role: "focus", pattern: "hero", paths: ["hero"], count: 2 }, ...]
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which patterns are resolved and in what order, what the paths are, the matching rule and what is listed.
 * @evidence contracts/development/implementation.md#principled-implementation `matchAutoMovieInspectionPath` is the rule the inspection selects, hides, labels, colours and focuses by, so a resolution reports what the picture drew; a pattern takes a matched path's subtree, so listing the topmost matches names every subtree without repeating its contents.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Gather the patterns by role, then one match and one ancestor filter per pattern.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pattern that matches nothing is listed with no path rather than left out, so the record shows it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Patterns times paths matches, plus one set lookup per ancestor of each matched path.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one cell's request, view and paths.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns names and counts only, bounded by the patterns times the distinct subtrees they reach.
 */
export function resolveAutoMovieCapturePatterns(props: {
  /** Object and mark paths of the drawn scene, in its order. */
  paths: readonly string[];

  /** The cell's inspection request. */
  request: IAutoMovieInspectionRequest;

  /** The cell's view text. */
  view: string;
}): IAutoMovieCaptureResolution[] {
  const paths: string[] = [...new Set(props.paths)];
  const view: IAutoMovieInspectionView = parseAutoMovieInspectionView(
    props.view,
  );
  const patterns: [IAutoMovieCaptureResolution["role"], string][] = [
    ...props.request.parts.map((pattern: string): ["parts", string] => [
      "parts",
      pattern,
    ]),
    ...props.request.hide.map((pattern: string): ["hide", string] => [
      "hide",
      pattern,
    ]),
    ...props.request.label.map((pattern: string): ["label", string] => [
      "label",
      pattern,
    ]),
    ...props.request.color.map(
      (entry: IAutoMovieInspectionRequest.IColor): ["color", string] => [
        "color",
        entry.pattern,
      ],
    ),
    ...(view.type === "named" && view.focus?.type === "pattern"
      ? [["focus", view.focus.pattern] as ["focus", string]]
      : []),
  ];
  return patterns.map(
    ([role, pattern]: [
      IAutoMovieCaptureResolution["role"],
      string,
    ]): IAutoMovieCaptureResolution => {
      const matched: string[] = paths.filter((path: string): boolean =>
        matchAutoMovieInspectionPath(path, pattern),
      );
      const reached: Set<string> = new Set(matched);

      // A path is listed when none of its ancestors matched too.
      const topmost: string[] = matched.filter((path: string): boolean => {
        const names: string[] = path.split("/");
        for (let depth: number = 1; depth < names.length; depth++)
          if (reached.has(names.slice(0, depth).join("/"))) return false;
        return true;
      });
      return { role, pattern, paths: topmost, count: matched.length };
    },
  );
}
