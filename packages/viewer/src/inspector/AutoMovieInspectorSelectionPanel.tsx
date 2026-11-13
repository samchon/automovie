import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionRequest,
} from "@automovie/render";
import { type ChangeEvent, type JSX, useMemo, useState } from "react";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";
import type { IAutoMovieInspectorPathNode } from "./IAutoMovieInspectorPathNode.js";
import { buildAutoMovieInspectorPathTree } from "./buildAutoMovieInspectorPathTree.js";

/** The width of each of the three checkbox columns and the colour column, pixels. */
const COLUMN: number = 22;

/**
 * Selection: the subject's identity paths as a tree, with select, hide, label and colour per path.
 *
 * A header names the four columns. Each node edits the request by its pattern, the one that selects the node and its subtree: a checkbox puts the pattern in or takes it out of `parts`, `hide` or `label`, and the colour input gives it a `color` pair, which the clear button takes back. A node is checked when its own pattern is in the list, so a pattern typed in the address that matches several nodes checks none of them, and stays in the request. The empty path has no pattern and only a name.
 *
 * A node with children is folded until opened, with the number of paths under it, so a figure's dozens of bones do not fill the panel. The filter keeps the nodes whose path contains the typed text, with their ancestors, and opens them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the header, what each control edits, when a node is checked, what happens to typed patterns and the empty path, and how folding and the filter work.
 * @evidence contracts/development/implementation.md#principled-implementation The tree and each node's pattern come from `buildAutoMovieInspectorPathTree`, and every edit is a reducer action through the grammar, so the panel restates no path rule; folding uses the platform's `details` element.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One memoized tree, one filter, and one recursive row per node.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A checked state is read from the request, never kept in the panel; the filter hides rows and changes no request.
 * @evidence contracts/development/implementation.md#efficient-algorithms The tree is rebuilt only when the path list changes; a render is linear in the nodes times the lists' lengths, and a folded subtree is not rendered.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work `useMemo` keeps the tree while the path list is the same array, which the mount reports once per instance.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the memoized tree and the filter text only while mounted.
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
    (): IAutoMovieInspectorPathNode[] =>
      buildAutoMovieInspectorPathTree(props.paths),
    [props.paths],
  );
  const [filter, setFilter] = useState<string>("");
  const needle: string = filter.trim().toLowerCase();
  return (
    <div>
      <input
        type="search"
        aria-label="Filter paths"
        placeholder="Filter paths"
        value={filter}
        style={{ width: "100%", boxSizing: "border-box", marginBottom: 6 }}
        onChange={(event: ChangeEvent<HTMLInputElement>): void =>
          setFilter(event.target.value)
        }
      />
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          fontSize: 11,
          color: "#555",
          borderBottom: "1px solid #ccc",
          marginBottom: 2,
        }}
      >
        {["Select", "Hide", "Label", "Colour"].map(
          (name: string): JSX.Element => (
            <span
              key={name}
              title={name}
              style={{
                width: COLUMN,
                overflow: "hidden",
                textAlign: "center",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                height: 40,
              }}
            >
              {name}
            </span>
          ),
        )}
        <span style={{ alignSelf: "flex-end", paddingLeft: 6 }}>Path</span>
      </div>
      <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
        {tree.map(
          (node: IAutoMovieInspectorPathNode): JSX.Element | null =>
            shown(node, needle) ? (
              <Row
                key={node.path}
                node={node}
                needle={needle}
                inspection={props.request.inspection}
                dispatch={props.dispatch}
              />
            ) : null,
        )}
      </ul>
    </div>
  );
}

/** Whether a node or any node under it matches the filter. */
function shown(node: IAutoMovieInspectorPathNode, needle: string): boolean {
  return (
    needle === "" ||
    node.path.toLowerCase().includes(needle) ||
    node.children.some((child: IAutoMovieInspectorPathNode): boolean =>
      shown(child, needle),
    )
  );
}

/** The number of paths under a node. */
function count(node: IAutoMovieInspectorPathNode): number {
  return node.children.reduce(
    (sum: number, child: IAutoMovieInspectorPathNode): number =>
      sum + 1 + count(child),
    0,
  );
}

/** One node with its controls and, folded until opened, its children. */
function Row(props: {
  node: IAutoMovieInspectorPathNode;
  needle: string;
  inspection: IAutoMovieInspectionRequest;
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const { node, needle, inspection, dispatch } = props;
  const [open, setOpen] = useState<boolean>(false);
  const pattern: string | null = node.pattern;
  const color: IAutoMovieInspectionRequest.IColor | undefined =
    pattern === null
      ? undefined
      : inspection.color.find(
          (entry: IAutoMovieInspectionRequest.IColor): boolean =>
            entry.pattern === pattern,
        );
  const label: string = node.name === "" ? "(unnamed)" : node.name;
  const toggle = (
    type: IAutoMovieInspectorAction.IToggle["type"],
    list: readonly string[],
  ): JSX.Element => (
    <input
      type="checkbox"
      aria-label={`${type} ${label}`}
      disabled={pattern === null}
      checked={pattern !== null && list.includes(pattern)}
      style={{ width: COLUMN - 8, margin: "0 4px" }}
      onChange={(event: ChangeEvent<HTMLInputElement>): void => {
        if (pattern !== null)
          dispatch({ type, pattern, on: event.target.checked });
      }}
    />
  );
  const controls: JSX.Element = (
    <span style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}>
      {toggle("select", inspection.parts)}
      {toggle("hide", inspection.hide)}
      {toggle("label", inspection.label)}
      <input
        type="color"
        aria-label={`colour ${label}`}
        disabled={pattern === null}
        value={`#${(color?.color ?? 0x808080).toString(16).padStart(6, "0")}`}
        style={{ width: COLUMN - 4, height: 16, padding: 0, border: 0 }}
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
          aria-label={`clear the colour of ${label}`}
          onClick={(): void => dispatch({ type: "color", pattern, color: null })}
        >
          x
        </button>
      )}{" "}
      <span style={{ fontWeight: node.drawn ? "normal" : "bold" }}>{label}</span>
    </span>
  );
  if (node.children.length === 0) return <li>{controls}</li>;

  // A filter opens every node it keeps, so the matches are seen.
  const expanded: boolean = open || needle !== "";
  return (
    <li>
      <details
        open={expanded}
        onToggle={(event): void =>
          setOpen((event.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary style={{ cursor: "pointer" }}>
          {controls}
          <span style={{ color: "#666", fontSize: 11 }}> {count(node)}</span>
        </summary>
        {expanded ? (
          <ul style={{ listStyle: "none", paddingLeft: 14, margin: 0 }}>
            {node.children.map(
              (child: IAutoMovieInspectorPathNode): JSX.Element | null =>
                shown(child, needle) ? (
                  <Row
                    key={child.path}
                    node={child}
                    needle={needle}
                    inspection={inspection}
                    dispatch={dispatch}
                  />
                ) : null,
            )}
          </ul>
        ) : null}
      </details>
    </li>
  );
}
