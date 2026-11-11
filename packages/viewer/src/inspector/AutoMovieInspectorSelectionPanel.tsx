import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionRequest,
} from "@automovie/render";
import { type ChangeEvent, type JSX, useMemo } from "react";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";
import type { IAutoMovieInspectorPathNode } from "./IAutoMovieInspectorPathNode.js";
import { buildAutoMovieInspectorPathTree } from "./buildAutoMovieInspectorPathTree.js";

/**
 * Selection: the subject's identity paths as a tree, with select, hide, label and colour per path.
 *
 * Each node edits the request by its pattern, the one that selects the node and its subtree: a checkbox puts the pattern in or takes it out of `parts`, `hide` or `label`, and the colour input gives it a `color` pair, which the clear button takes back. A node is checked when its own pattern is in the list, so a pattern typed in the address that matches several nodes checks none of them, and stays in the request. The empty path has no pattern and only a name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each control edits, when a node is checked, what happens to typed patterns and the empty path.
 * @evidence contracts/development/implementation.md#principled-implementation The tree and each node's pattern come from `buildAutoMovieInspectorPathTree`, and every edit is a reducer action through the grammar, so the panel restates no path rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One memoized tree and one recursive row per node.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A checked state is read from the request, never kept in the panel.
 * @evidence contracts/development/implementation.md#efficient-algorithms The tree is rebuilt only when the path list changes; a render is linear in the nodes times the lists' lengths.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work `useMemo` keeps the tree while the path list is the same array, which the mount reports once per instance.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the memoized tree only while mounted.
 */
export function AutoMovieInspectorSelectionPanel(props: {
  /** The request shown. */
  request: IAutoMovieCapturePlanRequest;

  /** The subject's identity paths in scene order. */
  paths: readonly string[];

  /** Where edits go. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const tree: IAutoMovieInspectorPathNode[] = useMemo(
    (): IAutoMovieInspectorPathNode[] => buildAutoMovieInspectorPathTree(props.paths),
    [props.paths],
  );
  return (
    <fieldset>
      <legend>Selection (select, hide, label, colour)</legend>
      <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
        {tree.map(
          (node: IAutoMovieInspectorPathNode): JSX.Element => (
            <Row
              key={node.path}
              node={node}
              inspection={props.request.inspection}
              dispatch={props.dispatch}
            />
          ),
        )}
      </ul>
    </fieldset>
  );
}

/** One node with its controls and its children. */
function Row(props: {
  node: IAutoMovieInspectorPathNode;
  inspection: IAutoMovieInspectionRequest;
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const { node, inspection, dispatch } = props;
  const pattern: string | null = node.pattern;
  const color: IAutoMovieInspectionRequest.IColor | undefined =
    pattern === null
      ? undefined
      : inspection.color.find(
          (entry: IAutoMovieInspectionRequest.IColor): boolean =>
            entry.pattern === pattern,
        );
  const toggle: (
    type: IAutoMovieInspectorAction.IToggle["type"],
    list: readonly string[],
  ) => JSX.Element = (
    type: IAutoMovieInspectorAction.IToggle["type"],
    list: readonly string[],
  ): JSX.Element => (
    <input
      type="checkbox"
      title={type}
      disabled={pattern === null}
      checked={pattern !== null && list.includes(pattern)}
      onChange={(event: ChangeEvent<HTMLInputElement>): void => {
        if (pattern !== null)
          dispatch({ type, pattern, on: event.target.checked });
      }}
    />
  );
  return (
    <li>
      <span style={{ whiteSpace: "nowrap" }}>
        {toggle("select", inspection.parts)}
        {toggle("hide", inspection.hide)}
        {toggle("label", inspection.label)}
        <input
          type="color"
          title="colour"
          disabled={pattern === null}
          value={`#${(color?.color ?? 0x808080).toString(16).padStart(6, "0")}`}
          onChange={(event: ChangeEvent<HTMLInputElement>): void => {
            if (pattern !== null)
              dispatch({
                type: "color",
                pattern,
                color: Number.parseInt(event.target.value.slice(1), 16),
              });
          }}
        />
        {color === undefined || pattern === null ? null : (
          <button
            type="button"
            title="clear colour"
            onClick={(): void => dispatch({ type: "color", pattern, color: null })}
          >
            x
          </button>
        )}{" "}
        <span style={{ fontWeight: node.drawn ? "normal" : "bold" }}>
          {node.name === "" ? "(unnamed)" : node.name}
        </span>
      </span>
      {node.children.length === 0 ? null : (
        <ul style={{ listStyle: "none", paddingLeft: 14, margin: 0 }}>
          {node.children.map(
            (child: IAutoMovieInspectorPathNode): JSX.Element => (
              <Row
                key={child.path}
                node={child}
                inspection={inspection}
                dispatch={dispatch}
              />
            ),
          )}
        </ul>
      )}
    </li>
  );
}
