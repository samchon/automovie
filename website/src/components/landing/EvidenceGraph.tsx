"use client";

import { type ReactElement, useState } from "react";

import type { ILandingFilm } from "../../landing/ILandingFilm";

/**
 * The landing page's evidence graph: the brief's decisions, the screenplay's
 * beats, the code's modules and the film, joined by the citations a
 * production writes. Pointing at a node lights everything it depends on and
 * everything that depends on it. A switch removes one module's citation of
 * the last beat, and the report beside the graph turns to the check's
 * failure, as `pnpm run evidence` reports it.
 *
 * @param props The film whose documents the graph joins.
 * @returns The figure.
 */
export function EvidenceGraph(props: { film: ILandingFilm }): ReactElement {
  const { film }: { film: ILandingFilm } = props;
  const [broken, setBroken] = useState<boolean>(false);
  const [focus, setFocus] = useState<string | null>(null);
  const last: string = film.beats.at(-1)!.anchor;

  // The first module realizes the first half of the beats, the second the rest.
  const half: number = Math.ceil(film.beats.length / 2);

  const nodes: INode[] = [
    { id: "brief-ren", column: 0, row: 0.5, label: "ren.md#stance" },
    { id: "brief-kai", column: 0, row: 1.5, label: "kai.md#guard" },
    { id: "brief-ring", column: 0, row: 2.5, label: "gym.md#ring" },
    ...film.beats.map(
      (beat: ILandingFilm.IBeat, row: number): INode => ({
        id: beat.anchor,
        column: 1,
        row,
        label: `#${beat.anchor}`,
      }),
    ),
    { id: "code-first", column: 2, row: (half - 1) / 2, label: "firstExchange.ts" },
    {
      id: "code-second",
      column: 2,
      row: (half + film.beats.length - 1) / 2,
      label: "secondExchange.ts",
    },
    { id: "film", column: 3, row: (film.beats.length - 1) / 2, label: "film.ts" },
  ];
  const edges: IEdge[] = [
    ...film.beats.flatMap((beat: ILandingFilm.IBeat, i: number): IEdge[] => [
      { from: beat.anchor, to: i % 2 === 0 ? "brief-ren" : "brief-kai" },
      { from: beat.anchor, to: "brief-ring" },
      ...(broken && beat.anchor === last
        ? []
        : [{ from: i < half ? "code-first" : "code-second", to: beat.anchor }]),
    ]),
    { from: "film", to: "code-first" },
    { from: "film", to: "code-second" },
  ];
  const lit: Set<string> = focus === null ? new Set() : reach(focus, edges);
  const x = (column: number): number => 24 + column * 196;
  const y = (row: number): number => 48 + row * 62;
  const find = (id: string): INode => nodes.find((n: INode): boolean => n.id === id)!;

  return (
    <div className="am-graph">
      <figure className="am-graph-figure">
        <svg viewBox={`0 0 760 ${y(Math.max(2, film.beats.length - 1)) + 28}`} role="img" aria-labelledby="am-graph-title am-graph-desc">
          <title id="am-graph-title">The evidence graph of one scene</title>
          <desc id="am-graph-desc">
            Each beat cites the brief decisions it uses, each module cites the
            beats it realizes, and the film orders the modules.
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
            const on: boolean = lit.has(edge.from) && lit.has(edge.to);
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={`M${x(a.column) - 6} ${y(a.row)} C ${x(a.column) - 90} ${y(a.row)}, ${x(b.column) + 90} ${y(b.row)}, ${x(b.column) + 6} ${y(b.row)}`}
                className="am-graph-edge"
                data-on={on}
              />
            );
          })}
          {nodes.map((node: INode): ReactElement => {
            const missing: boolean = broken && node.id === last;
            return (
              <g
                key={node.id}
                className="am-graph-node"
                data-on={lit.has(node.id)}
                data-missing={missing}
                tabIndex={0}
                role="button"
                aria-label={`${node.label}${missing ? ", cited by no module" : ""}`}
                onMouseEnter={(): void => setFocus(node.id)}
                onMouseLeave={(): void => setFocus(null)}
                onFocus={(): void => setFocus(node.id)}
                onBlur={(): void => setFocus(null)}
              >
                <circle cx={x(node.column)} cy={y(node.row)} r={7} />
                <text x={x(node.column) + 12} y={y(node.row) + 4}>
                  {node.label}
                </text>
              </g>
            );
          })}
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
          The report as <code>@wrtnlabs/evidence</code> prints it; the counts
          are this example production&apos;s.
        </p>
      </div>
    </div>
  );
}

/** One node of the graph. */
interface INode {
  id: string;
  column: number;
  row: number;
  label: string;
}

/** One citation: the citing node and the cited one. */
interface IEdge {
  from: string;
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
