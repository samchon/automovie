import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanPersonHairContactProps } from "../structures/IHumanPersonHairContactProps";

/**
 * Apply two sampled station-translation passes against the complete posed body, using each generated hair layout's metre clearance or the legacy ribbon gap.
 *
 * The engine's open-sheet query admits complete original body incidence and uses nearest-feature pseudonormal side; rim hits leave the station alone. Embedded outward-oriented geometry and meaningful sheet reach remain caller premises. Every pass selects the largest sampled vertex push at one station and translates the whole station. Clear sampled stations stay unchanged and empty hair allocates no query.
 *
 * Supplied layouts must partition actual referenced vertices once and retain a singleton radius-zero/arcLength-zero root. A root requiring a push refuses. Only legacy ribbons derive numbered pairs from connected triangle components. Translation preserves station width/calibre but changes centreline lengths and does not certify full-face clearance, global collisions or biological contact. Inputs remain unchanged in the common person metre frame; copied position arrays are owned by the caller.
 *
 * @evidence contracts/common.md#principled-implementation Complete open-body incidence supplies actual nearest features; geometry-owned station partitions and gaps route two largest-sampled-push whole-station translations while native roots remain fixed or refuse.
 * @evidence contracts/common.md#clear-and-simple-design Engine query owns signed nearest geometry, supplied layouts own station identity, and this person relation owns only posed-body pushes; legacy numbering is confined to its fallback helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Body crops and guessed native station membership are absent, rim side remains unresolved, and two passes do not claim complete clearance, fixed strand length or clinical contact.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre gaps/frame, actual root/layout admission, sheet reach premises and owned output limitations.
 * @evidence contracts/performance.md#efficient-algorithms One full-body query compilation pays topology/hierarchy costs; two sampled vertex passes use nearest-first queries with O(body triangles) worst-case per point. Layout checks visit hair indices and station vertices. Legacy grouping has unbalanced parent-chain walks, with O(T*V) worst-case work for T hair triangles and V referenced vertices, followed by per-component sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work One immutable body query serves all selected hair parts and both passes; station arrays compile once per part and already-clear coordinates retain their bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copied body/query and station/seen maps are invocation-local; only copied hair position arrays escape, with no persistent query cache, timer or running task.
 */
export function keepHumanPersonHairClear(
  props: IHumanPersonHairContactProps,
): number[][] {
  const { positions, hair, clearance }: IHumanPersonHairContactProps = props;
  if (!(clearance >= 0) || !Number.isFinite(clearance))
    throw new Error("Hair clearance must be a nonnegative finite length.");
  if (hair.every((part: IHumanPersonHairContactProps["hair"][number]): boolean => part.positions.length === 0))
    return hair.map((part: IHumanPersonHairContactProps["hair"][number]): number[] => part.positions.slice());
  const mesh: IAutoMovieMesh = {
    positions: positions.slice(),
    normals: null,
    uvs: null,
    indices: [...props.indices],
    skin: null,
  };
  const query: ReturnType<typeof createAutoMovieSignedMeshQuery> = createAutoMovieSignedMeshQuery(mesh, { boundary: "open" });
  return hair.map(({ positions: part, indices: triangles, layout }: IHumanPersonHairContactProps["hair"][number]): number[] => {
    const output: number[] = part.slice();
    const gap: number = layout?.clearance ?? clearance;
    if (!Number.isFinite(gap) || gap < 0)
      throw new Error("Hair part clearance must be a nonnegative finite length.");
    const strands: number[][][] = layout === undefined ? humanRibbonStations(triangles) :
      layout.curves.map((curve: NonNullable<typeof layout>["curves"][number]): number[][] => curve.stations.map((station: typeof curve.stations[number]): number[] => Array.from(station.vertices)));
    if (layout !== undefined) {
      const referenced: Set<number> = new Set(triangles);
      const seen: Set<number> = new Set<number>();
      for (const [curveIndex, curve] of layout.curves.entries()) {
        if (curve.stations.length === 0 || curve.stations[0].radius !== 0 ||
            curve.stations[0].arcLength !== 0 || curve.stations[0].vertices.length !== 1)
          throw new Error("Hair layout lacks its canonical attached root station: " + curveIndex);
        for (const station of curve.stations) {
          if (station.vertices.length === 0 || !Number.isFinite(station.radius) || station.radius < 0 ||
              !Number.isFinite(station.arcLength) || station.arcLength < 0)
            throw new Error("Hair layout station lacks finite geometry-owned radius and arc length.");
          for (const vertex of station.vertices) {
            if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex * 3 + 2 >= part.length ||
                !referenced.has(vertex) || seen.has(vertex))
              throw new Error("Hair layout must partition actual referenced station vertices exactly.");
            seen.add(vertex);
          }
        }
      }
      if (seen.size !== referenced.size)
        throw new Error("Hair layout omits actual referenced geometry.");
    }
    // Produced layouts define complete rings or ribbon pairs. The legacy
    // fallback retains only the original ribbon numbering contract.
    for (const strand of strands)
      for (let pass: number = 0; pass < 2; pass++)
        for (const [stationIndex, station] of strand.entries()) {
          let push: number[] | null = null;
          let most: number = 0;
          for (const vertex of station) {
            const p: number[] = [
              output[vertex * 3],
              output[vertex * 3 + 1],
              output[vertex * 3 + 2],
            ];
            const found: ReturnType<typeof query> = query(p);
            if (found.boundary || found.signedDistance >= gap) continue;
            const need: number[] = [0, 1, 2].map(
              (axis: number): number =>
                found.point[axis] + found.normal[axis] * gap - p[axis],
            );
            const size: number = Math.hypot(need[0], need[1], need[2]);
            if (size > most) {
              most = size;
              push = need;
            }
          }
          if (push !== null && layout !== undefined && stationIndex === 0)
            throw new Error("Attached native hair root conflicts with the body's requested clearance.");
          if (push !== null)
            for (const vertex of station)
              for (let axis: number = 0; axis < 3; axis++)
                output[vertex * 3 + axis] += push[axis];
        }
    return output;
  });
}

/**
 * Group legacy ribbon triangles by connected vertex components, sort each component's numeric IDs and interpret its first vertex as root followed by numbered pairs. This is the original legacy numbering premise, not native shaft reconstruction or topology validation; an unmatched last vertex has no station pair.
 *
 * Union/root map operations follow actual triangle links without a global mesh cache; root lookup compresses only the queried vertex and does not balance trees. T triangles and V referenced vertices can therefore require O(T*V) parent-chain work before O(V log V) component sorting. Temporary maps and returned station arrays live only within the contact call, and caller triangles remain unchanged.
 */
function humanRibbonStations(triangles: readonly number[]): number[][][] {
  const parent: Map<number, number> = new Map<number, number>();
  const find: (vertex: number) => number = (vertex: number): number => {
    let root: number = vertex;
    while ((parent.get(root) ?? root) !== root) root = parent.get(root)!;
    parent.set(vertex, root);
    return root;
  };
  for (let at: number = 0; at < triangles.length; at += 3)
    for (let k: number = 1; k < 3; k++)
      parent.set(find(triangles[at + k]), find(triangles[at]));
  const strands: Map<number, number[]> = new Map<number, number[]>();
  for (const vertex of new Set(triangles)) {
    const root: number = find(vertex);
    let list: number[] | undefined = strands.get(root);
    if (list === undefined) {
      list = [];
      strands.set(root, list);
    }
    list.push(vertex);
  }
  return [...strands.values()].map((vertices: number[]): number[][] => {
    const ordered: number[] = vertices.sort((a: number, b: number): number => a - b);
    const stations: number[][] = [[ordered[0]]];
    for (let k: number = 1; k + 1 < ordered.length; k += 2)
      stations.push([ordered[k], ordered[k + 1]]);
    return stations;
  });
}
