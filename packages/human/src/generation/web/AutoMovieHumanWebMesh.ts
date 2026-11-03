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
import { AutoMovieHumanWebSaddleField } from "./AutoMovieHumanWebSaddleField";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";

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

    // Each child's saddle on each side of each of its webs, built once: the
    // seam patches its columns nearer the pinch than the fade column take
    // their points from.
    const saddles: Map<string, AutoMovieHumanWebSaddleField.ISaddle | null> = new Map();
    const saddleOf = (
      name: string,
      own: IAutoMovieHumanWebChild,
      web: IAutoMovieHumanWeb,
      side: number,
    ): AutoMovieHumanWebSaddleField.ISaddle | null => {
      const key: string = `${name}|${web.first}|${web.second}|${side}`;
      if (!saddles.has(key)) {
        const beside: IAutoMovieHumanWebChild.IBeside | undefined = own.beside.find(
          (b: IAutoMovieHumanWebChild.IBeside): boolean => b.side === side,
        );
        saddles.set(
          key,
          beside === undefined
            ? null
            : AutoMovieHumanWebSaddleField.of({
                name: `${name}.web-${web.first}-${web.second}.${side}`,
                web,
                own,
                law: beside.law,
                reach: beside.reach,
                surface,
                blend: FADE,
              }),
        );
      }

      return saddles.get(key)!;
    };

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
        const w: number = 1 - smooth(Math.abs(col.y) / FADE);
        const saddle: AutoMovieHumanWebSaddleField.ISaddle | null = saddleOf(c.name, own, col.web, col.side);
        const y: number = Math.abs(col.y);

        // Nearer the pinch than the saddle's fade column the column's points
        // are the seam patches'; past it the blend of the chart and the plain
        // law, which the patches' sides continue.
        for (let r: number = 1; r < rows; r++) {
          const a: Vec3 = plain(r);
          const p: Vec3 =
            saddle !== null && y < saddle.fade
              ? saddle.place(levelOf(r, own, col.web), y)
              : w === 0
                ? a
                : add(a, scale(sub(chart(col, own, r), a), w));
          ids.push(vertex(p));
        }
        ids.push(vertex(col.q, [index, c.station, col.phi]));
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
