import type {
  IAutoMovieCaptureResolution,
  IAutoMovieInspectionColorAssignment,
  IAutoMovieInspectionView,
  IAutoMovieResolveCapturePatternsProps,
} from "@automovie/interface";

import { matchAutoMovieInspectionPath } from "../scene/inspection/matchAutoMovieInspectionPath.js";
import { parseAutoMovieInspectionView } from "../scene/inspection/parseAutoMovieInspectionView.js";

/** The focus pattern a named view carries, as a one-entry list or none. */
function focusPatterns(view: IAutoMovieInspectionView): ["focus", string][] {
  if (view.type === "named" && view.focus?.type === "pattern")
    return [["focus", view.focus.pattern]];
  return [];
}

/**
 * Resolve every pattern a cell's request and view carry against the paths a
 * drawn scene holds: the `parts`, `hide`, `label` and `color` patterns in that
 * order and as written, then the view's focus pattern.
 *
 * `paths` are the scene's object paths and the paths of the marks it draws, in
 * the scene's order; a repeated path counts once. Each pattern is matched by
 * the inspection core's own rule, so it resolves exactly as the inspection
 * applied it, and lists only its topmost matched paths, a path whose ancestor
 * it also matched being counted but not listed.
 *
 * ```ts
 * resolveAutoMovieCapturePatterns({
 *   paths: ["hero", "hero/arm", "lamp"],
 *   request,
 *   view: "front@focus=hero",
 * });
 * // [{ role: "focus", pattern: "hero", paths: ["hero"], count: 2 }, ...]
 * ```
 */
export function resolveAutoMovieCapturePatterns(
  props: IAutoMovieResolveCapturePatternsProps,
): IAutoMovieCaptureResolution[] {
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
      (entry: IAutoMovieInspectionColorAssignment): ["color", string] => [
        "color",
        entry.pattern,
      ],
    ),
    ...focusPatterns(view),
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
