import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodySurfacePhases } from "./AutoMovieHumanBodySurfacePhases";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";
import { AutoMovieHumanBodyWeb } from "./AutoMovieHumanBodyWeb";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

const { chain, endHeight, ringVertices } = AutoMovieHumanBodySurfaceRead;
const { arcVertices, ownPhases } = AutoMovieHumanBodySurfacePhases;

/** Each parent's contact rings, evaluated once with their pinch phases and shared with the children by vertex index, the webs they carry and the vertices they pin. */
export namespace AutoMovieHumanBodySurfaceContact {
  /**
   * Generate an event's contact ring from its parent and hand out its arcs.
   *
   * The parent's end boundary becomes the whole ring; each child's adjacent
   * end becomes the vertices on its arcs, in ring order. Two children that part
   * at two pinches close across the same span between them, the crotch. Left
   * without vertices every band of both would fan onto its two ends, which
   * shades as a row of dents, so the span takes vertices at the ring's own
   * spacing, shared by both.
   *
   * An event marked as webs (`web`) does not hand out arcs: its children start
   * from their own sections past the webs, and the skin from the ring to those
   * sections, a saddle at every web, is built here by
   * {@link AutoMovieHumanBodyWeb}, each child's end being its own section's
   * vertices in ring order.
   */
  export function contact(
    context: IContext,
    event: IAutoMovieHumanBodyCalibration.IEvent,
  ): void {
    const parent: IAutoMovieHumanLoftChain = chain(context, event.parent);
    const parentEnd: "bottom" | "top" =
      event.direction === "down" ? "bottom" : "top";
    const childEnd: "bottom" | "top" =
      event.direction === "down" ? "top" : "bottom";

    const phases: number[] = ownPhases(context, parent);
    const ring: number[] = ringVertices(
      context,
      parent,
      endHeight(parent, parentEnd),
      phases,
    );
    context.boundaries.set(parent.name + ":" + parentEnd, {
      kind: "own",
      ring,
    });

    const children: { name: string; arcs: number[][] }[] = event.splits.map(
      (split: IAutoMovieHumanBodyCalibration.ISplit) => ({
        name: split.child,
        arcs: split.arcs.map((arc: [number, number]): number[] =>
          arcVertices(ring, phases, arc),
        ),
      }),
    );

    // Children that start apart from the ring meet it through the webs' own
    // surface, each from its own section.
    if (event.web === true) {
      const built: AutoMovieHumanBodyWeb.IResult = AutoMovieHumanBodyWeb.build({
        mesh: context.mesh,
        coordinates: context.coordinates,
        chain: (name: string): IAutoMovieHumanLoftChain => chain(context, name),
        index: (name: string): number => context.indices.get(name)!,
        parent,
        down: event.direction === "down",
        phase: new Map(ring.map((v: number, i: number): [number, number] => [v, phases[i]!])),
        shares: children,
      });
      for (const c of children)
        context.boundaries.set(c.name + ":" + childEnd, {
          kind: "inherited",
          ring: built.rings.get(c.name)!,
        });
      const paths: IAutoMovieHumanConstructionPath[] = WEBS.get(context.mesh) ?? [];
      paths.push(...built.construction);
      WEBS.set(context.mesh, paths);
      return;
    }
    const whole = (arcs: number[][]): boolean =>
      arcs.length === 1 && arcs[0]!.length === ring.length;
    const span = (arcs: number[][], k: number): [number, number] => [
      arcs[k]![arcs[k]!.length - 1]!,
      arcs[(k + 1) % arcs.length]![0]!,
    ];
    const spans: Set<string> = new Set(
      children.flatMap((c): string[] =>
        whole(c.arcs)
          ? []
          : c.arcs.map((_: number[], k: number): string =>
              span(c.arcs, k).join(":"),
            ),
      ),
    );
    const spacing: number =
      ring.reduce((sum: number, v: number, i: number): number => {
        const a: [number, number, number] = AutoMovieHumanLoftMesh.position(
          context.mesh,
          v,
        );
        const b: [number, number, number] = AutoMovieHumanLoftMesh.position(
          context.mesh,
          ring[(i + 1) % ring.length]!,
        );
        return sum + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      }, 0) / ring.length;
    const bridges: Map<string, number[]> = new Map();
    const bridge = (from: number, to: number): number[] => {
      if (!spans.has(`${to}:${from}`)) return [];
      const made: number[] | undefined = bridges.get(`${to}:${from}`);
      if (made !== undefined) return [...made].reverse();
      const a: [number, number, number] = AutoMovieHumanLoftMesh.position(
        context.mesh,
        from,
      );
      const b: [number, number, number] = AutoMovieHumanLoftMesh.position(
        context.mesh,
        to,
      );
      const inner: number =
        Math.round(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / spacing) -
        1;
      const points: [number, number, number][] = Array.from(
        { length: Math.max(0, inner) },
        (_: unknown, i: number): [number, number, number] => {
          const f: number = (i + 1) / (inner + 1);
          return [
            a[0] + f * (b[0] - a[0]),
            a[1] + f * (b[1] - a[1]),
            a[2] + f * (b[2] - a[2]),
          ];
        },
      );
      points.forEach((): void => {
        context.coordinates.push(NaN, NaN, NaN);
      });
      const vertices: number[] = AutoMovieHumanLoftMesh.vertices(
        context.mesh,
        points,
      );
      bridges.set(`${from}:${to}`, vertices);
      return vertices;
    };
    for (const c of children)
      context.boundaries.set(c.name + ":" + childEnd, {
        kind: "inherited",
        ring: whole(c.arcs)
          ? c.arcs[0]!
          : c.arcs.flatMap((arc: number[], k: number): number[] => [
              ...arc,
              ...bridge(...span(c.arcs, k)),
            ]),
      });

    // A pinch of a span left as a slit lies on the parent and on both
    // children at once, where the skin turns: its normal is its faces' own,
    // not the parent's surface it would otherwise take.
    const pinned: Set<number> = PINNED.get(context.mesh) ?? new Set();
    PINNED.set(context.mesh, pinned);
    for (const c of children)
      if (!whole(c.arcs))
        c.arcs.forEach((_: number[], k: number): void => {
          for (const v of span(c.arcs, k)) pinned.add(v);
        });
  }

  /** Each mesh's webs' rows and separatrices, as construction. */
  export const WEBS: WeakMap<AutoMovieHumanLoftMesh.IContext, IAutoMovieHumanConstructionPath[]> = new WeakMap();

  /** Each mesh's slit pinches, whose normal is their faces' own. */
  export const PINNED: WeakMap<AutoMovieHumanLoftMesh.IContext, Set<number>> = new WeakMap();

  /**
   * Normals with every slit pinch on its faces' own normal. A pinch lies on
   * the parent and on both children, where the skin turns, so the parent's
   * surface normal it would otherwise take stood up to 37 degrees off its
   * faces on f1 and m2 (the crotch's front 22 to 23). Applied after the ring
   * blend only: a neighbour on the smooth parent averaged with a pinch's
   * crease normal stood 38 degrees off its own surface behind the crotch.
   */
  export function held(
    mesh: AutoMovieHumanLoftMesh.IContext,
    faces: readonly number[],
    normals: number[],
  ): number[] {
    const out: number[] = [...normals];
    for (const v of PINNED.get(mesh) ?? []) {
      const l: number = Math.hypot(faces[3 * v]!, faces[3 * v + 1]!, faces[3 * v + 2]!);
      if (l > 1e-12) for (let k: number = 0; k < 3; k++) out[3 * v + k] = faces[3 * v + k]! / l;
    }
    return out;
  }
}
