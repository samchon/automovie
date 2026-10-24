import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanApertureEdge } from "./IAutoMovieHumanApertureEdge";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";

/** Construction paths read from the actual aperture columns, without another fit. */
export namespace AutoMovieHumanApertureConstruction {
  /**
   * Preserve cut order for transverse rings and sample up to 24 longitudinal
   * profiles for legibility. Selection changes only the drawing density;
   * every drawn point is an existing skin vertex in the same generation.
   *
   * @param mesh Generated skin in registered millimetres.
   * @param name Calibrated aperture identity.
   * @param edges Directed retained-skin boundary circuit.
   * @param columns Mesh vertex addresses from exterior to interior.
   * @returns Shared skin samples for the construction pass.
   */
  export function generate(
    mesh: AutoMovieHumanLoftMesh.IContext,
    name: string,
    edges: readonly IAutoMovieHumanApertureEdge[],
    columns: ReadonlyMap<number, readonly number[]>,
  ): IAutoMovieHumanConstructionPath[] {
    if (edges.length === 0) return [];
    const next: Map<number, number> = new Map(
      edges.map((edge: IAutoMovieHumanApertureEdge): [number, number] => [
        edge.u,
        edge.v,
      ]),
    );
    const order: number[] = [];
    let current: number = edges[0]!.u;
    do {
      if (order.includes(current))
        throw new Error(`Aperture boundary has a secondary cycle: ${name}`);
      order.push(current);
      const following: number | undefined = next.get(current);
      if (following === undefined)
        throw new Error(`Aperture boundary is open: ${name}`);
      current = following;
    } while (current !== order[0]);
    if (order.length !== edges.length)
      throw new Error(`Aperture has disconnected boundaries: ${name}`);

    /** Resolve the existing vertex; no projection or endpoint adjustment is applied. */
    const point: (index: number) => [number, number, number] = (
      index: number,
    ): [number, number, number] => [
      mesh.positions[3 * index]!,
      mesh.positions[3 * index + 1]!,
      mesh.positions[3 * index + 2]!,
    ];
    const out: IAutoMovieHumanConstructionPath[] = [];
    const stem: string = name.replaceAll(".", "_");
    const owners: Map<number, string> = new Map(
      edges.map((edge: IAutoMovieHumanApertureEdge): [number, string] => [
        edge.u,
        edge.name.slice(0, edge.name.lastIndexOf("/")),
      ]),
    );
    const stride: number = Math.max(1, Math.ceil(order.length / 24));
    for (let k: number = 0; k < order.length; k += stride)
      out.push({
        id: `${owners.get(order[k]!)!}/${stem}_profile${k}`,
        points: columns.get(order[k]!)!.map(point),
        closed: false,
      });
    const length: number = columns.get(order[0]!)!.length;
    for (let row: number = 0; row < length; row++) {
      const indices: number[] = order.map(
        (vertex: number): number => columns.get(vertex)![row]!,
      );
      // A nasal pole is one point rather than a degenerate closed tube.
      if (new Set(indices).size < 3) continue;
      const chains: string[] = order.map(
        (vertex: number): string => owners.get(vertex)!,
      );
      if (new Set(chains).size === 1) {
        out.push({
          id: `${chains[0]!}/${stem}_row${row}`,
          points: indices.map(point),
          closed: true,
        });
        continue;
      }
      // A transverse ring can cross a chain boundary. Split only the
      // drawing at that literal cut edge, retaining both shared endpoints;
      // ownership never comes from a nearest chain or anatomical name table.
      const first: number = chains.findIndex(
        (chain: string, k: number): boolean =>
          chain !== chains[(k + chains.length - 1) % chains.length],
      );
      let run: IAutoMovieHumanConstructionPath | undefined;
      for (let k: number = 0; k < order.length; k++) {
        const index: number = (first + k) % order.length;
        const chain: string = chains[index]!;
        if (
          k === 0 ||
          chain !== chains[(index + chains.length - 1) % chains.length]
        ) {
          run = {
            id: `${chain}/${stem}_row${row}_arc${k}`,
            points: [point(indices[index]!)],
            closed: false,
          };
          out.push(run);
        }
        run!.points.push(point(indices[(index + 1) % indices.length]!));
      }
    }
    return out;
  }
}
