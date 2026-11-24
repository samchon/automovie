import {
  measureAutoMovieMeshCrossings,
  measureAutoMovieMeshPieces,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionPort,
  IAutoMovieHumanBodyLane,
  IAutoMovieMesh,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanConstructionView } from "../generation/limb/AutoMovieHumanConstructionView";

type Opening = {
  side: "left" | "right";
  port: IAutoMovieConstructionPort;
  guide: AutoMovieVector3Tuple[];
};

/**
 * Replay both source-supported shoulders in the actual neutral construction
 * tree.
 */
export function inspectHumanArmscyeAssembly(
  lane: IAutoMovieHumanBodyLane.IDefinition,
  torso: IAutoMovieViewPart,
  openings: readonly Opening[],
) {
  if (lane.root === null || openings.length !== 2)
    throw new Error(
      "The armscye assembly needs both ports and the body source tree",
    );
  const retained: Set<string> = new Set();
  const connect = (
    node: IAutoMovieConstructionNode,
  ): IAutoMovieConstructionNode => {
    if (
      node.type === "view" ||
      node.type === "source" ||
      node.type === "profile"
    )
      return node;
    const host = connect(node.host);
    if (node.type === "trim") return { ...node, host };
    if (node.type === "split") {
      const [first, second, ...rest] = node.children;
      const child = (item: typeof first): typeof first => ({
        ...item,
        part: connect(item.part),
      });
      return {
        ...node,
        host,
        children: [child(first), child(second), ...rest.map(child)],
      };
    }
    const part = connect(node.part);
    const opening =
      node.type === "join"
        ? openings.find(({ port }) => port.band === node.name)
        : undefined;
    if (opening === undefined) return { ...node, host, part };
    retained.add(opening.port.band);
    return { ...opening.port, host, part };
  };
  const root = connect(lane.root);
  if (retained.size !== 2)
    throw new Error(
      "The production tree does not own both candidate shoulder faces",
    );
  const began = performance.now();
  const result = realizeAutoMovieConstruction(
    { name: "neutral.guided.armscye", root },
    {
      chord: lane.limits.gap * AutoMovieHumanConstructionView.METRES,
      sources: new Map(lane.sourceParts).set(torso.name, torso),
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
  return {
    milliseconds,
    guides: openings.map(({ side, guide }) => ({ side, guide })),
    diagnostics: result.diagnostics,
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
