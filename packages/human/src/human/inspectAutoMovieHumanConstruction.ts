import {
  IAutoMovieSubdivisionSurface,
  IAutoMovieSurfaceConstruction,
  IAutoMovieSurfaceRig,
  rigAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";

/** Points per closed station, per spine or guide, per feature segment and per network curve. */
const SAMPLES: Record<"station" | "line" | "feature" | "curve", number> = {
  station: 96,
  line: 64,
  feature: 24,
  curve: 48,
};

/**
 * Read the construction net of every lofted part: each sweep's spine, stations, guides and features, the network's curves, the part's rings and its control cage, in the model frame, metres.
 *
 * Raw zero-cell sweep stations, guides and feature courses remain authored
 * construction. Network curves are the actual regenerated curves whose ends
 * use the registry-resolved geometric cells; pinned controls are separate.
 * When a generated surface is supplied, its completed fitting-domain controls
 * provide the cage for the same assembly and refinement level as the skin.
 * Source curves and geometric targets are not relabelled as fitted controls.
 *
 * @param cages Every part's cage, as `generateAutoMovieHumanCages` returns them
 * @returns One net per lofted part instance, in the order given
 */
export function inspectAutoMovieHumanConstruction(
  cages: Array<{
    part: AutoMovieHumanPart;
    side: AutoMovieHumanSide | null;
    cage: IAutoMovieHumanCage;
  }>,
  generated?: { cage: IAutoMovieHumanCage; surface: IAutoMovieSubdivisionSurface; levels?: number },
): IAutoMovieHumanConstructionNet[] {
  const nets: IAutoMovieHumanConstructionNet[] = [];
  for (const { part, side, cage } of cages) {
    const construction: IAutoMovieHumanCage.IConstruction | undefined =
      cage.construction;
    if (construction === undefined) continue;
    nets.push({
      part,
      side,
      curves: [
        ...networkCurves(construction),
        ...ringCurves(cage),
        ...(construction.relief ?? []).map(
          (
            r: IAutoMovieHumanCage.IRelief,
          ): IAutoMovieHumanConstructionNet.ICurve => ({
            kind: "relief",
            name: r.name,
            closed: r.closed,
            points: r.points.flatMap((p: IAutoMovieVector3): number[] => [
              p.x / 1000,
              p.y / 1000,
              p.z / 1000,
            ]),
          }),
        ),
      ],
      cage: generated === undefined ? cageEdges(cage) : generatingEdges(generated, part, side),
    });
  }
  return nets;
}

/** Every sweep's spine, stations, guides and features and every network curve, in the model frame, metres. */
function networkCurves(
  construction: IAutoMovieHumanCage.IConstruction,
): IAutoMovieHumanConstructionNet.ICurve[] {
  const rig: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    network: construction.network,
    tier: "medium",
    construction: SAMPLES,
  });
  function model(p: IAutoMovieVector3): number[] { return [
    (construction.origin.x +
      construction.x.x * p.x +
      construction.y.x * p.y +
      construction.z.x * p.z) /
      1000,
    (construction.origin.y +
      construction.x.y * p.x +
      construction.y.y * p.y +
      construction.z.y * p.z) /
      1000,
    (construction.origin.z +
      construction.x.z * p.x +
      construction.y.z * p.y +
      construction.z.z * p.z) /
      1000,
  ]; }
  return rig.construction.map(
    (
      curve: IAutoMovieSurfaceConstruction,
    ): IAutoMovieHumanConstructionNet.ICurve => ({
      kind: curve.kind,
      name: curve.name,
      closed: curve.closed,
      points: Array.from(
        { length: curve.points.length / 3 },
        (_: unknown, i: number): number[] =>
          model({
            x: curve.points[3 * i]!,
            y: curve.points[3 * i + 1]!,
            z: curve.points[3 * i + 2]!,
          }),
      ).flat(),
    }),
  );
}

/** The cage's open rings as closed polylines through their vertices, metres. */
function ringCurves(
  cage: IAutoMovieHumanCage,
): IAutoMovieHumanConstructionNet.ICurve[] {
  return cage.rings.map(
    (
      ring: IAutoMovieHumanCage["rings"][number],
    ): IAutoMovieHumanConstructionNet.ICurve => ({
      kind: "ring" as const,
      name: ring.side === null ? ring.site : `${ring.site}.${ring.side}`,
      closed: true,
      points: ring.vertices.flatMap((v: number): number[] => {
        const p: IAutoMovieVector3 = cage.vertices[v]!.position;
        return [p.x / 1000, p.y / 1000, p.z / 1000];
      }),
    }),
  );
}

/** The cage's vertices and its edges, each once, metres. */
function cageEdges(
  cage: IAutoMovieHumanCage,
): IAutoMovieHumanConstructionNet.ICage {
  const seen: Set<string> = new Set();
  const edges: number[] = [];
  for (const face of cage.faces)
    for (let k: number = 0; k < 4; ++k) {
      const a: number = face.vertices[k]!;
      const b: number = face.vertices[(k + 1) % 4]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(a, b);
    }
  return {
    positions: cage.vertices.flatMap(
      (v: IAutoMovieHumanCage.IVertex): number[] => [
        v.position.x / 1000,
        v.position.y / 1000,
        v.position.z / 1000,
      ],
    ),
    edges,
  };
}

/** The actual globally fitted generating controls belonging to one source part. */
function generatingEdges(
  generated: { cage: IAutoMovieHumanCage; surface: IAutoMovieSubdivisionSurface; levels?: number },
  part: AutoMovieHumanPart,
  side: AutoMovieHumanSide | null,
): IAutoMovieHumanConstructionNet.ICage {
  const positions: number[] = [];
  const edges: number[] = [];
  const vertices: Map<number, number> = new Map();
  const seen: Set<string> = new Set();
  const vertex: (v: number) => number = (v: number): number => {
    let found: number | undefined = vertices.get(v);
    if (found === undefined) {
      found = vertices.size;
      vertices.set(v, found);
      positions.push(...generated.surface.positions.slice(3 * v, 3 * v + 3));
    }
    return found;
  };
  for (let f: number = 0; f < generated.surface.faces.length / 4; f++) {
    const coordinate: IAutoMovieHumanCage.IFace["coordinates"][number] = generated.cage.faces[Math.floor(f / 4 ** (generated.levels ?? 2))]!.coordinates[0];
    if (coordinate.part !== part || coordinate.side !== side) continue;
    for (let k: number = 0; k < 4; k++) {
      const a: number = vertex(generated.surface.faces[4 * f + k]!);
      const b: number = vertex(generated.surface.faces[4 * f + (k + 1) % 4]!);
      const key: string = `${Math.min(a, b)},${Math.max(a, b)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(a, b);
    }
  }
  return { positions, edges };
}
