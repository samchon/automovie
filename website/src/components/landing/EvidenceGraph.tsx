"use client";

import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";

import type { ILandingFilm } from "../../landing/ILandingFilm";

/**
 * The landing page's evidence graph, built from the film's own citations:
 * the brief decisions each beat cites, the beats each module cites, and the
 * film that orders the modules. Pointing at a node lights everything it
 * rests on and everything that rests on it. A switch deletes the last
 * module's citation of the last beat, and the report beside the graph turns
 * to the check's failure.
 *
 * The drawing is an image described in words, so its nodes take no focus;
 * the switch is the graph's one control.
 *
 * @param props The film whose documents the graph joins.
 * @returns The figure.
 */
export function EvidenceGraph(props: { film: ILandingFilm }): ReactElement {
  const { film }: { film: ILandingFilm } = props;
  const [broken, setBroken]: [boolean, Dispatch<SetStateAction<boolean>>] =
    useState<boolean>(false);
  const [focus, setFocus]: [
    string | null,
    Dispatch<SetStateAction<string | null>>,
  ] = useState<string | null>(null);
  const last: string = film.beats.at(-1)!.anchor;
  const owner: ILandingFilm["modules"][number] | undefined = film.modules.find(
    (m: ILandingFilm["modules"][number]): boolean => m.beats.includes(last),
  );

  // Columns of rows, each row's middle at an even spacing.
  const rows: number = Math.max(film.beats.length, film.decisions.length);
  const middle: (index: number, count: number) => number = (
    index: number,
    count: number,
  ): number => (rows - 1) / 2 + index - (count - 1) / 2;
  const nodes: INode[] = [
    ...film.decisions.map(
      (label: string, i: number): INode => ({
        id: `brief:${label}`,
        column: 0,
        row: middle(i, film.decisions.length),
        label,
      }),
    ),
    ...film.beats.map(
      (beat: ILandingFilm.IBeat, i: number): INode => ({
        id: beat.anchor,
        column: 1,
        row: middle(i, film.beats.length),
        label: `#${beat.anchor}`,
      }),
    ),
    ...film.modules.map(
      (module: ILandingFilm["modules"][number], i: number): INode => ({
        id: `code:${module.file}`,
        column: 2,
        row: middle(i * 2, film.modules.length * 2 - 1),
        label: module.file.split("/").at(-1)!,
      }),
    ),
    { id: "film", column: 3, row: (rows - 1) / 2, label: "film.ts" },
  ];
  const edges: IEdge[] = [
    ...film.beats.flatMap((beat: ILandingFilm.IBeat): IEdge[] =>
      beat.cites.map(
        (label: string): IEdge => ({ from: beat.anchor, to: `brief:${label}` }),
      ),
    ),
    ...film.modules.flatMap(
      (module: ILandingFilm["modules"][number]): IEdge[] =>
        module.beats
          .filter(
            (anchor: string): boolean =>
              !(broken && module === owner && anchor === last),
          )
          .map(
            (anchor: string): IEdge => ({
              from: `code:${module.file}`,
              to: anchor,
            }),
          ),
    ),
    ...film.modules.map(
      (module: ILandingFilm["modules"][number]): IEdge => ({
        from: "film",
        to: `code:${module.file}`,
      }),
    ),
  ];
  const lit: Set<string> =
    focus === null ? new Set<string>() : reach(focus, edges);
  const x: (column: number) => number = (column: number): number =>
    24 + column * 196;
  const y: (row: number) => number = (row: number): number => 48 + row * 56;
  const find: (id: string) => INode = (id: string): INode =>
    nodes.find((n: INode): boolean => n.id === id)!;

  return (
    <div className="am-graph">
      <figure className="am-graph-figure">
        <svg
          viewBox={`0 0 760 ${y(rows - 1) + 28}`}
          role="img"
          aria-labelledby="am-graph-title am-graph-desc"
        >
          <title id="am-graph-title">The evidence graph of one scene</title>
          <desc id="am-graph-desc">
            {film.beats
              .map(
                (beat: ILandingFilm.IBeat): string =>
                  `Beat ${beat.anchor} cites ${beat.cites.join(" and ")}.`,
              )
              .join(" ")}{" "}
            {film.modules
              .map(
                (module: ILandingFilm["modules"][number]): string =>
                  `${module.file} cites ${module.beats
                    .filter(
                      (a: string): boolean =>
                        !(broken && module === owner && a === last),
                    )
                    .join(", ")}.`,
              )
              .join(" ")}{" "}
            The film orders the modules.
            {broken ? ` The beat ${last} is cited by no module.` : ""}
          </desc>
          {["Brief", "Screenplay", "Code", "Film"].map(
            (name: string, column: number): ReactElement => (
              <text key={name} x={x(column)} y={14} className="am-graph-column">
                {name}
              </text>
            ),
          )}
          {edges.map((edge: IEdge): ReactElement => {
            const a: INode = find(edge.from);
            const b: INode = find(edge.to);
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={`M${x(a.column) - 6} ${y(a.row)} C ${x(a.column) - 90} ${y(a.row)}, ${x(b.column) + 90} ${y(b.row)}, ${x(b.column) + 6} ${y(b.row)}`}
                className="am-graph-edge"
                data-on={lit.has(edge.from) && lit.has(edge.to)}
              />
            );
          })}
          {nodes.map(
            (node: INode): ReactElement => (
              <g
                key={node.id}
                className="am-graph-node"
                data-on={lit.has(node.id)}
                data-missing={broken && node.id === last}
                onMouseEnter={(): void => setFocus(node.id)}
                onMouseLeave={(): void => setFocus(null)}
              >
                <circle cx={x(node.column)} cy={y(node.row)} r={7} />
                <text x={x(node.column) + 12} y={y(node.row) + 4}>
                  {node.label}
                </text>
              </g>
            ),
          )}
        </svg>
      </figure>
      <div className="am-graph-side">
        <button
          type="button"
          className="am-graph-switch"
          aria-pressed={broken}
          onClick={(): void => setBroken(!broken)}
        >
          {broken
            ? `Restore the citation of #${last}`
            : `Delete the citation of #${last}`}
        </button>
        <pre className="am-terminal" data-failed={broken} aria-live="polite">
          {(broken ? film.report.failing : film.report.passing).join("\n")}
          {"\n"}
          <span className="am-terminal-exit">exit {broken ? 1 : 0}</span>
        </pre>
        <p className="am-graph-note">
          An abridged report in the format <code>@wrtnlabs/evidence</code>{" "}
          prints; the counts are this example production&apos;s.
        </p>
      </div>
    </div>
  );
}

/** One node of the graph. */
interface INode {
  /** Its key among the nodes and edges. */
  id: string;

  /** Its column: brief, screenplay, code or film. */
  column: number;

  /** Its row, from the top; a fraction centres it. */
  row: number;

  /** What it shows. */
  label: string;
}

/** One citation: the citing node and the cited one. */
interface IEdge {
  /** The citing node's id. */
  from: string;

  /** The cited node's id. */
  to: string;
}

/** Every node a node depends on or is depended on by, itself included. */
function reach(start: string, edges: IEdge[]): Set<string> {
  const out: Set<string> = new Set<string>([start]);
  for (const direction of ["down", "up"] as const) {
    const queue: string[] = [start];
    while (queue.length !== 0) {
      const id: string = queue.pop()!;
      for (const edge of edges) {
        const next: string | null =
          direction === "down"
            ? edge.from === id
              ? edge.to
              : null
            : edge.to === id
              ? edge.from
              : null;
        if (next !== null && !out.has(next)) {
          out.add(next);
          queue.push(next);
        }
      }
    }
  }
  return out;
}
