import {
  AutoMovieViewerInspector,
  type IAutoMovieViewerInspectorPathNode,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerInspector.buildPathTree` nests slash-separated paths into a tree in
 * first-appearance order. A listed path is drawn, a prefix only is not; a
 * top-level node's pattern selects it and everything beneath (`name/**`), a
 * deeper node's pattern is its path, and the empty path has none.
 *
 * Scenarios:
 *
 * 1. ["hero/torso", "hero/torso/arm", "prop", "hero/torso", ""] gives roots hero,
 *    prop and "", the repeated path once.
 * 2. Hero is not drawn and patterns "hero/**"; hero/torso is drawn, patterns
 *    "hero/torso" and holds arm; "" has no pattern.
 * 3. An empty list gives an empty tree.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names tree order, selected paths, intermediate nodes and empty input.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the tree from a supplied path list and compares the entire nested result, then repeats with no paths.
 * @evidence contracts/development/testing.md#independent-expectations The slash-delimited hero, torso and arm spell their own ancestry. The fixed expected tree contains a distinct prop root and preserves the empty input.
 */
export function test_viewer_inspector_build_path_tree(): void {
  const node: (
    name: string,
    path: string,
    pattern: string | null,
    drawn: boolean,
    children?: IAutoMovieViewerInspectorPathNode[],
  ) => IAutoMovieViewerInspectorPathNode = (
    name: string,
    path: string,
    pattern: string | null,
    drawn: boolean,
    children: IAutoMovieViewerInspectorPathNode[] = [],
  ): IAutoMovieViewerInspectorPathNode => ({ name, path, pattern, drawn, children });
  TestValidator.equals(
    "the tree",
    AutoMovieViewerInspector.buildPathTree([
      "hero/torso",
      "hero/torso/arm",
      "prop",
      "hero/torso",
      "",
    ]),
    [
      node("hero", "hero", "hero/**", false, [
        node("torso", "hero/torso", "hero/torso", true, [
          node("arm", "hero/torso/arm", "hero/torso/arm", true),
        ]),
      ]),
      node("prop", "prop", "prop/**", true),
      node("", "", null, true),
    ],
  );
  TestValidator.equals("empty", AutoMovieViewerInspector.buildPathTree([]), []);
}
