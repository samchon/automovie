import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { createHumanSourceCrownAffineMatrix } from "./createHumanSourceCrownAffineMatrix.ts";
import { createHumanSourcePosteriorOcclusionProblem } from "./createHumanSourcePosteriorOcclusionProblem.ts";
import { evaluateHumanSourcePosteriorPositions } from "./evaluateHumanSourcePosteriorPositions.ts";
import { searchHumanSourcePosteriorOcclusion } from "./searchHumanSourcePosteriorOcclusion.ts";
import type { IHumanSourcePosteriorOcclusionAuthoring } from "./structures/IHumanSourcePosteriorOcclusionAuthoring.ts";

/**
 * Author a feasible source dentition before the shared skin binding stage.
 * One mandibular translation acts on neutral positions only. Each paired
 * source width/depth/height scale uses its immutable crown/arch frame;
 * every source endpoint vector follows the same positive-determinant affine
 * map. Thus target
 * differences and their transformed neutral share one affine source, rather
 * than retaining deltas from the original crown. Topology, UVs, attachments,
 * tooth identities remain unchanged. Anterior and posterior crowns both have
 * independent paired scales; neither population is held artificially fixed.
 *
 * Existing oral registration must be regenerated after this authoring; it is
 * never removed to conceal stale witnesses. The returned source deliberately
 * has no fresh admission claim until ports, source fingerprints, skin binding,
 * body-follow rows and normal contact/lining geometry are regenerated in the
 * same full generation. Source-axis height is not clinical gingival height.
 */
export function authorHumanSourcePosteriorOcclusion(
  face: IAutoMovieHumanFaceBasis,
  maximumEvaluations: number,
): IHumanSourcePosteriorOcclusionAuthoring {
  const problem = createHumanSourcePosteriorOcclusionProblem(face);
  const search = searchHumanSourcePosteriorOcclusion(
    problem,
    maximumEvaluations,
  );
  if (!search.evaluation.feasible)
    throw new Error(
      "Source occlusion authoring found no fully feasible candidate: " +
        JSON.stringify(search),
    );
  const dental = face.surfaces.find(
    (surface) => surface.id === "Human.teeth_base",
  )!;
  const frameOf = new Map(
    problem.frames.flatMap((frame) =>
      frame.vertices.map((vertex) => [vertex, frame] as const),
    ),
  );
  const matrices = new Map(
    problem.frames.map((frame) => [
      frame.crown,
      createHumanSourceCrownAffineMatrix(frame, search.scales),
    ]),
  );
  const targets: Record<string, number[]> = {};
  const editedEndpoints: string[] = [];
  const editedEndpointVertices: Record<string, number[]> = {};
  for (const [name, rows] of Object.entries(dental.targets)) {
    const output = [...rows];
    const changedVertices: number[] = [];
    for (let at = 0; at < rows.length; at += 4) {
      const vertex = rows[at],
        frame = frameOf.get(vertex);
      if (frame === undefined) continue;
      const matrix = matrices.get(frame.crown)!;
      for (let row = 0; row < 3; row++)
        output[at + 1 + row] = [0, 1, 2].reduce(
          (sum, column) =>
            sum + matrix[3 * row + column] * rows[at + 1 + column],
          0,
        );
      const changed = [0, 1, 2].some(
        (axis) => output[at + 1 + axis] !== rows[at + 1 + axis],
      );
      if (changed) changedVertices.push(vertex);
    }
    targets[name] = output;
    if (changedVertices.length !== 0) {
      editedEndpoints.push(name);
      editedEndpointVertices[name] = changedVertices;
    }
  }
  const positions = evaluateHumanSourcePosteriorPositions(
    problem,
    search.scales,
  );
  const editedVertices = Array.from(
    { length: positions.length / 3 },
    (_, vertex) => vertex,
  ).filter((vertex) =>
    [0, 1, 2].some(
      (axis) =>
        positions[3 * vertex + axis] !== dental.positions[3 * vertex + axis],
    ),
  );
  return {
    face: {
      ...face,
      surfaces: face.surfaces.map((surface) =>
        surface !== dental ? surface : { ...dental, positions, targets },
      ),
    },
    search,
    frames: problem.frames,
    editedVertices,
    editedEndpoints,
    editedEndpointVertices,
    invalidatedDerivatives: [
      "native oral fingerprint and cervical ports",
      "skin rigid binding and body-follow rows",
      "incisor relation and jaw-capacity reference",
      "oral lining and closed contact queries",
      "generated normals and Float32 export",
    ],
  };
}
