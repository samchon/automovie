import {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
  IAutoMovieSurfaceNetwork,
} from "@automovie/engine";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRing } from "../../junction/IAutoMovieHumanRing";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkNetwork } from "./IAutoMovieHumanTrunkNetwork";

/**
 * Turn the sampled trunk network into the trunk cage: positions in millimetres, each face corner's chart address and the junction rings.
 *
 * A point of the trunk sweep is addressed on the trunk's main chart by its sweep coordinates. A point of a shoulder or hip tube, or of the bridge that joins it to the trunk, is addressed on that branch's chart: the bridge fills `u` from 0 to 0.3 and the tube the rest, and a hip tube's `v` is turned half a turn so its anterior direction lies at the chart's 0 like the trunk's.
 *
 * @param network The network the cage was sampled from
 * @param sampled The sampled cage
 * @returns The trunk cage in millimetres with its rings
 */
export function emitAutoMovieHumanTrunk(
  network: IAutoMovieHumanTrunkNetwork,
  sampled: IAutoMovieSurfaceCage,
): IAutoMovieHumanCage {
  const positions: number[] = sampled.cage.positions;
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  for (let k: number = 0; k < positions.length; k += 3)
    vertices.push({
      position: {
        x: AutoMovieHumanTrunkSweep.millimetres(positions[k]!),
        y: AutoMovieHumanTrunkSweep.millimetres(positions[k + 1]!),
        z: AutoMovieHumanTrunkSweep.millimetres(positions[k + 2]!),
      },
    });
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = network.value.patches;
  const faces: IAutoMovieHumanCage.IFace[] = sampled.cage.faces.map(
    (face: number[], f: number): IAutoMovieHumanCage.IFace => ({
      vertices: [face[0]!, face[1]!, face[2]!, face[3]!],
      coordinates: unwrap(
        sampled.corners[f]!.map(
          (
            c: IAutoMovieSurfaceCoordinate,
          ): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk"> =>
            addressOf(patches[c.patch]!, c.s, c.t),
        ),
      ) as IAutoMovieHumanCage.IFace["coordinates"],
    }),
  );
  const rings: IAutoMovieHumanRing[] = network.shapes.map(
    ({ ring, shape }): IAutoMovieHumanRing => ({
      site: shape.site,
      side: shape.side,
      vertices: sampled.rings[ring]!,
      start: shape.start,
      frame: shape.frame,
    }),
  );
  return { vertices, faces, creases: [], rings };
}

/** The branch a patch belongs to, by its name, or none for the trunk's own sweep patches. */
const branchOf = (name: string): AutoMovieHumanBranch<"trunk"> | null =>
  name.startsWith("leftShoulder") || name === "joinLeftShoulder"
    ? "leftShoulder"
    : name.startsWith("rightShoulder") || name === "joinRightShoulder"
      ? "rightShoulder"
      : name.startsWith("leftHip") || name === "joinLeftHip"
        ? "leftHip"
        : name.startsWith("rightHip") || name === "joinRightHip"
          ? "rightHip"
          : null;

/** The chart address of a patch point: the trunk's main chart, or the branch chart of a shoulder or hip tube and its bridge. */
const addressOf = (
  patch: IAutoMovieSurfaceNetwork.IPatch,
  s: number,
  t: number,
): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk"> => {
  const lerp = (r: [number, number], x: number): number =>
    r[0] + (r[1] - r[0]) * x;
  const wrap = (v: number): number => ((v % 1) + 1) % 1;
  const branch: AutoMovieHumanBranch<"trunk"> | null = branchOf(patch.name);
  if (patch.type !== "sweep")
    return { part: "trunk", side: null, branch, u: 0.3 * t, v: wrap(s) };
  if (branch === null)
    return {
      part: "trunk",
      side: null,
      branch: null,
      u: lerp(patch.u, t),
      v: wrap(lerp(patch.v, s)),
    };
  const hip: boolean = branch === "leftHip" || branch === "rightHip";
  return {
    part: "trunk",
    side: null,
    branch,
    u: 0.3 + 0.7 * lerp(patch.u, t),
    v: wrap(lerp(patch.v, s) - (hip ? 0.5 : 0)),
  };
};

/** Keep one face's corners within half a turn: a face across the wrap meridian writes 1 where it would write 0. */
const unwrap = (
  corners: IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">[],
): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">[] => {
  const vs: number[] = corners.map(
    (c: IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">): number => c.v,
  );
  if (Math.max(...vs) - Math.min(...vs) <= 0.5) return corners;
  return corners.map(
    (
      c: IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">,
    ): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk"> =>
      c.v < 0.5 ? { ...c, v: Math.min(1, c.v + 1) } : c,
  );
};
