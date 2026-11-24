import {
  measureAutoMovieMeshCrossings,
  measureAutoMovieMeshPieces,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyLane,
  IAutoMovieMesh,
} from "@automovie/interface";

import { AutoMovieHumanConstructionView } from "../generation/limb/AutoMovieHumanConstructionView";
import { inspectHumanArmscyeBoundary } from "./inspectHumanArmscyeBoundary";

/** Read both shoulder guides on the actual realized body atlas. */
export function inspectHumanArmscyeAssembly(
  lane: Pick<
    IAutoMovieHumanBodyLane.IDefinition,
    "root" | "sourceParts" | "loopSources" | "diagnostics"
  > & {
    limits: Pick<IAutoMovieHumanBodyLane.IDefinition["limits"], "gap">;
  },
) {
  if (lane.root === null)
    throw new Error("The armscye inspection needs the actual body source tree");
  const began = performance.now();
  const result = realizeAutoMovieConstruction(
    { name: "neutral.guided.armscye", root: lane.root },
    {
      chord: lane.limits.gap * AutoMovieHumanConstructionView.METRES,
      sources: lane.sourceParts,
      loopSources: lane.loopSources,
    },
  );
  const milliseconds = performance.now() - began;
  const { positions, indices, coordinates, owners } = result.mesh;
  const mesh: IAutoMovieMesh = {
    positions,
    indices,
    normals: null,
    skin: null,
    uvs: null,
  };
  const triangleOwner = (triangle: number): string[] =>
    indices
      .slice(3 * triangle, 3 * triangle + 3)
      .map((vertex) => owners[coordinates[3 * vertex]!]!);
  const guides = (["left", "right"] as const).flatMap((side) => {
    const arm = lane.sourceParts.get(`arm.${side}`);
    const surface = result.surfaces.find(
      ({ name }) => name === `blend.arm.${side}.trunk`,
    );
    if (arm === undefined || surface?.domain === undefined) return [];
    const start = surface.domain[0];
    const period = surface.period ?? 2 * Math.PI;
    const guide: AutoMovieVector3Tuple[] = Array.from(
      { length: arm.samples },
      (_, i): AutoMovieVector3Tuple => [
        ...surface.jet(start, (period * i) / arm.samples).p,
      ],
    );
    return [{ side, guide }];
  });
  return {
    milliseconds,
    guides,
    boundaries: guides.map(({ side }) => ({
      side,
      joins: inspectHumanArmscyeBoundary(result, side),
    })),
    diagnostics: [...lane.diagnostics, ...result.diagnostics],
    faces: result.body.faces.map(({ chain }) => chain),
    skin: {
      positions,
      indices,
      pieces: measureAutoMovieMeshPieces(mesh).map(
        ({ boundaryLoops, genus, manifold, consistentlyWound }) => ({
          boundaryLoops,
          genus,
          manifold,
          consistentlyWound,
        }),
      ),
      crossings: measureAutoMovieMeshCrossings(mesh, mesh).map((item) => ({
        ...item,
        firstOwners: triangleOwner(item.triangle),
        otherOwners: triangleOwner(item.other),
      })),
    },
  };
}
