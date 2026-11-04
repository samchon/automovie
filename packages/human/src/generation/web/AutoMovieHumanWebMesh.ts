import type { IAutoMovieHumanConstructionPath } from "../IAutoMovieHumanConstructionPath";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";
import type { IAutoMovieHumanWebColumns } from "./IAutoMovieHumanWebColumns";
import type { IAutoMovieHumanWebCrests } from "./IAutoMovieHumanWebCrests";
import type { IAutoMovieHumanWebInput } from "./IAutoMovieHumanWebInput";
import type { IAutoMovieHumanWebResult } from "./IAutoMovieHumanWebResult";
import type { IAutoMovieHumanWebSurface } from "./IAutoMovieHumanWebSurface";
import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus: add, scale, smooth }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

/**
 * The last stage of a web's build: the surface's vertices and cells in the
 * body's mesh. The lips and crest of every web are vertices shared by its two
 * children; each child's columns follow, each column's rows from the parent's
 * ring to the child's section, blended from the saddle's chart to the plain
 * column over a few margin radii; the cells run between neighbouring columns,
 * none between a web's two pinch columns, which part above the crest and are
 * one below it.
 */
export namespace AutoMovieHumanWebMesh {
  /** Margin radii from a pinch over which a column leaves the saddle's chart. */
  const FADE: number = 3;

  /** Write the vertices and cells into the body's mesh.
   *
   * @param input What the web needs from the surface being built.
   * @param crests The first stage's webs.
   * @param columns The second stage's children and rows.
   * @param surface The third stage's laws. */
  export function of(
    input: IAutoMovieHumanWebInput,
    crests: IAutoMovieHumanWebCrests,
    columns: IAutoMovieHumanWebColumns,
    surface: IAutoMovieHumanWebSurface,
  ): IAutoMovieHumanWebResult {
    const { mesh, down } = input;
    const { webs } = crests;
    const { children, rows, crestRow } = columns;
    const { levelOf, lip, chart, plainAt } = surface;

    // Vertices: the lips and crest of every web, shared by its two children.
    const vertex = (p: Vec3, coordinates: [number, number, number] = [NaN, NaN, NaN]): number => {
      input.coordinates.push(...coordinates);
      return AutoMovieHumanLoftMesh.vertices(mesh, [p])[0]!;
    };
    const construction: IAutoMovieHumanConstructionPath[] = [];
    for (const web of webs.values()) {
      web.crest = vertex(web.S);
      // A lip is the margin's quarter round, its rows at even depths, so they
      // close on the crest as the chart's square root.
      for (const [pinch, P, toward] of [
        [web.first, web.A, -1],
        [web.second, web.B, 1],
      ] as const) {
        const ids: number[] = [pinch];
        const points: Vec3[] = [P];
        for (let r: number = 1; r < crestRow; r++) {
          const p: Vec3 = lip(web, toward, 1 - (1 - r / crestRow) ** 2);
          points.push(p);
          ids.push(vertex(p));
        }
        ids.push(web.crest);
        points.push(web.S);
        web.lips.set(pinch, ids);
        construction.push({ id: `${input.parent.name}/web-${pinch}`, points, closed: false });
      }
    }

    // Each child's columns as vertices, its own web columns after its crests.
    const rings: Map<string, number[]> = new Map();
    for (const c of children) {
      const index: number = input.index(c.name);
      for (const web of webs.values()) {
        const own: IAutoMovieHumanWebChild | undefined = web.children.get(c.name);
        if (own === undefined) continue;
        const ids: number[] = [web.crest];
        const points: Vec3[] = [web.S];
        for (let r: number = crestRow + 1; r <= rows; r++) {
          const p: Vec3 = r === rows ? own.q : own.own(web.rho * levelOf(r, own, web));
          points.push(p);
          ids.push(r === rows ? vertex(p, [index, c.station, own.phi]) : vertex(p));
        }
        own.rows = ids;
        construction.push({ id: `${c.name}/web-${web.crest}`, points, closed: false });
      }
      const lists: number[][] = c.columns.map((col: IAutoMovieHumanWebColumn): number[] => {
        if (col.kind === "pinch") return [...col.web.lips.get(col.v)!, ...col.web.children.get(c.name)!.rows.slice(1)];
        const ids: number[] = [col.v];
        const own: IAutoMovieHumanWebChild = col.web.children.get(c.name)!;
        const plain: (r: number) => Vec3 = plainAt(col);

        // The chart serves its own half of the arc: a column is drawn to it
        // over at most FADE margin radii and never past the arc's middle,
        // where the column passes to the next web and that web's chart
        // begins, so the weight is zero where the column changes web. A
        // hand's web spans the palm's thickness, so its margin's radius is a
        // large share of a finger's arc, and over FADE radii the chart's end
        // correction dragged every column of the arc toward its own arrival
        // across its neighbours, and changed web with the weight still high.
        const beside: IAutoMovieHumanWebChild.IBeside | undefined = own.beside.find(
          (b: IAutoMovieHumanWebChild.IBeside): boolean => b.side === col.side,
        );
        const fade: number = Math.min(FADE, beside === undefined ? FADE : beside.reach);
        const w: number = 1 - smooth(Math.abs(col.y) / fade);

        // The blend of the saddle's chart and the plain column law, drawn to
        // the chart near the pinch. The seam patches
        // (`AutoMovieHumanWebSaddleField`) take these points over once their
        // sides read the owners' jets in closed form: read by finite
        // differences of this surface, whose depth inverse steps where a
        // column's depth is not monotone, their jets are unbounded.
        // Each column is published as a construction path, and where the
        // chart weighs in also its two laws apart, so a frame shows which
        // law carries a column where.
        const path: Vec3[] = [col.p];
        const plainPath: Vec3[] = [col.p];
        const chartPath: Vec3[] = [col.p];
        for (let r: number = 1; r < rows; r++) {
          const a: Vec3 = plain(r);
          const b: Vec3 | null = w === 0 ? null : chart(col, own, r);
          const p: Vec3 = b === null ? a : add(a, scale(sub(b, a), w));
          ids.push(vertex(p));
          path.push(p);
          plainPath.push(a);
          if (b !== null) chartPath.push(b);
        }
        ids.push(vertex(col.q, [index, c.station, col.phi]));
        for (const list of [path, plainPath, chartPath]) list.push(col.q);
        construction.push({ id: `${c.name}/web-column-${col.v}`, points: path, closed: false });
        if (w > 0) {
          construction.push({ id: `${c.name}/web-plain-${col.v}`, points: plainPath, closed: false });
          construction.push({ id: `${c.name}/web-chart-${col.v}`, points: chartPath, closed: false });
        }
        return ids;
      });

      // Cells between neighbouring columns; none between a web's two pinch
      // columns, which part above the crest and are one below it.
      AutoMovieHumanLoftMesh.group(mesh, `${c.name}/${down ? c.chain.layers.length - 2 : 0}`);
      const n: number = lists.length;
      for (let i: number = 0; i < n; i++) {
        const X: IAutoMovieHumanWebColumn = c.columns[i]!;
        const Y: IAutoMovieHumanWebColumn = c.columns[(i + 1) % n]!;
        if (X.kind === "pinch" && Y.kind === "pinch" && X.web === Y.web) continue;
        const x: number[] = lists[i]!;
        const y: number[] = lists[(i + 1) % n]!;
        for (let r: number = 0; r < rows; r++) {
          const tri = (a: number, b: number, d: number): void => {
            if (a === b || b === d || a === d) return;
            if (down) mesh.indices.push(a, b, d);
            else mesh.indices.push(a, d, b);
          };
          tri(x[r + 1]!, x[r]!, y[r + 1]!);
          tri(y[r + 1]!, x[r]!, y[r]!);
        }
      }

      // The child's end: the last row, each web's own column once.
      const ring: number[] = [];
      lists.forEach((ids: number[]): void => {
        const v: number = ids[rows]!;
        if (ring[ring.length - 1] !== v) ring.push(v);
      });
      if (ring.length > 1 && ring[0] === ring[ring.length - 1]) ring.pop();
      rings.set(c.name, ring);
    }
    return { rings, construction };
  }
}
