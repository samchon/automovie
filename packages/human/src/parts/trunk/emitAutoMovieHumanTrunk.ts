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
 * The measured torso sweep uses its fixed row-index rectangles in the trunk chart, and upper curve patches continue that chart to the neck. Shoulder bridges end at longitudinal coordinate 0.3 and their tubes fill the rest. Direct hip bridges end at the existing collar's chart coordinate, and the straight supports continue to the shared ring at 1. Hip bridge and support meridians both turn half a turn so their shared boundary has one address; shoulder bridges retain their signed phase.
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
  function modelSample(k: number): IAutoMovieHumanCage.IVertex["position"] {
    return {
      x: AutoMovieHumanTrunkSweep.millimetres(sampled.targets[k]!),
      y: AutoMovieHumanTrunkSweep.millimetres(sampled.targets[k + 1]!),
      z: AutoMovieHumanTrunkSweep.millimetres(sampled.targets[k + 2]!),
    };
  }
  for (let k: number = 0; k < positions.length; k += 3) {
    const sample: IAutoMovieHumanCage.IVertex["position"] = modelSample(k);
    vertices.push({
      fitting: { sample, target: sampled.limitTargetMask[k / 3] ? { ...sample } : null, anchor: sampled.pinned[k / 3]! },
      position: {
        x: AutoMovieHumanTrunkSweep.millimetres(positions[k]!),
        y: AutoMovieHumanTrunkSweep.millimetres(positions[k + 1]!),
        z: AutoMovieHumanTrunkSweep.millimetres(positions[k + 2]!),
      },
    });
  }
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = network.value.patches;
  const faces: IAutoMovieHumanCage.IFace[] = sampled.cage.faces.map(
    (face: number[], f: number): IAutoMovieHumanCage.IFace => ({
      vertices: [face[0]!, face[1]!, face[2]!, face[3]!],
      fitting: /^(upper\.patch\.|(?:left|right)Shoulder|join(?:Left|Right)Shoulder)/.test(patches[sampled.corners[f]![0].patch]!.name) ? "upper" : undefined,
      coordinates: unwrap(
        sampled.corners[f]!.map(
          (
            c: IAutoMovieSurfaceCoordinate,
          ): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk"> =>
            addressOf(
              patches[c.patch]!,
              c.s,
              c.t,
              network.charts[patches[c.patch]!.name],
            ),
        ),
      ) as IAutoMovieHumanCage.IFace["coordinates"],
    }),
  );
  const rings: IAutoMovieHumanRing[] = network.shapes.map(
    ({ ring, shape }: IAutoMovieHumanTrunkNetwork["shapes"][number]): IAutoMovieHumanRing => ({
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
const branchOf: (name: string) => AutoMovieHumanBranch<"trunk"> | null = (name: string): AutoMovieHumanBranch<"trunk"> | null =>
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
const addressOf: (patch: IAutoMovieSurfaceNetwork.IPatch, s: number, t: number, chart: { u: [number, number]; v: [number, number] } | undefined) => IAutoMovieHumanSurfaceCoordinate.IOn<"trunk"> = (
  patch: IAutoMovieSurfaceNetwork.IPatch,
  s: number,
  t: number,
  chart: { u: [number, number]; v: [number, number] } | undefined,
): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk"> => {
  const lerp: (r: [number, number], x: number) => number = (r: [number, number], x: number): number =>
    r[0] + (r[1] - r[0]) * x;
  const wrap: (v: number) => number = (v: number): number => ((v % 1) + 1) % 1;
  const branch: AutoMovieHumanBranch<"trunk"> | null = branchOf(patch.name);
  if (chart !== undefined)
    return {
      part: "trunk",
      side: null,
      branch: null,
      u: lerp(chart.u, t),
      v: wrap(lerp(chart.v, s)),
    };
  if (patch.type === "coons")
    return { part: "trunk", side: null, branch: null, u: 0, v: wrap(s / 2) };
  if (patch.type !== "sweep" && patch.type !== "transition") {
    const phase: number =
      patch.name === "joinLeftShoulder"
        ? AutoMovieHumanTrunkSweep.SHOULDER_PHASE.left
        : patch.name === "joinRightShoulder"
          ? AutoMovieHumanTrunkSweep.SHOULDER_PHASE.right
          : 0;
    const hip: boolean = branch === "leftHip" || branch === "rightHip";
    const end: number = hip
      ? 0.3 + 0.7 * AutoMovieHumanTrunkSweep.COLLAR.thigh
      : 0.3;
    return {
      part: "trunk",
      side: null,
      branch,
      u: end * t,
      v: wrap(s + (hip ? -0.5 : phase)),
    };
  }
  if (branch === null)
    throw new Error("the trunk sweep patch has no declared chart rectangle");
  const hip: boolean = branch === "leftHip" || branch === "rightHip";
  const start: number = hip
    ? 0.3 + 0.7 * AutoMovieHumanTrunkSweep.COLLAR.thigh
    : 0.3;
  return {
    part: "trunk",
    side: null,
    branch,
    u: start + (1 - start) * lerp(patch.u, t),
    v: wrap(lerp(patch.v, s) - (hip ? 0.5 : 0)),
  };
};

/** Keep one face's corners within half a turn: a face across the wrap meridian writes 1 where it would write 0. */
const unwrap: (corners: IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">[]) => IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">[] = (
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
