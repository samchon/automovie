import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOral } from "@automovie/human/face/structures/IAutoMovieHumanFaceOral";

import { createHumanSourceTongueRestProblem } from "./createHumanSourceTongueRestProblem.ts";
import { evaluateHumanSourceTongueRestPositions } from "./evaluateHumanSourceTongueRestPositions.ts";
import { defineHumanSourceTongueAttachmentLoop } from "./defineHumanSourceTongueAttachmentLoop.ts";
import { searchHumanSourceTongueRest } from "./searchHumanSourceTongueRest.ts";
import type { IHumanSourceTongueRestAuthoring } from "./structures/IHumanSourceTongueRestAuthoring.ts";

/**
 * Author source tongue neutral and endpoints after occlusion, before binding.
 * The fixed material weighting supplies A_v=I+(s-1)w_v ll^T for each vertex;
 * retraction and dorsal lift are neutral translations, so every endpoint
 * difference follows A_v without adding those translations a second time.
 * Original indices, UVs, attachments and root material remain unchanged.
 * A native ventral patch boundary is then registered on the same candidate.
 * Sampled lining success is not whole-surface or clinical admission: the full
 * generation must regenerate binding, ports, normals and normal contact.
 */
export function authorHumanSourceTongueRest(face: IAutoMovieHumanFaceBasis, oral: IAutoMovieHumanFaceOral, maximumEvaluations: number): IHumanSourceTongueRestAuthoring {
  const problem = createHumanSourceTongueRestProblem(face, oral);
  const search = searchHumanSourceTongueRest(problem, maximumEvaluations);
  if (!search.evaluation.sampledFeasible) throw new Error("Source tongue authoring found no sampled feasible candidate: " + JSON.stringify(search));
  const tongue = face.surfaces.find((surface) => surface.id === "Human.tongue01")!;
  const positions = evaluateHumanSourceTongueRestPositions(problem, search.parameters);
  const loop = defineHumanSourceTongueAttachmentLoop(problem, positions);
  const targets: Record<string, number[]> = {}, editedEndpointVertices: Record<string, number[]> = {};
  for (const [name, rows] of Object.entries(tongue.targets)) {
    const output = [...rows], changed: number[] = [];
    for (let at = 0; at < rows.length; at += 4) {
      const vertex = rows[at], v = problem.coordinateV[vertex];
      if (v <= problem.rootEndV) continue;
      const t = (v - problem.rootEndV) / (problem.maximumV - problem.rootEndV), weight = t * t * (3 - 2 * t);
      const projected = problem.upper.lateral.reduce((sum, value, axis) => sum + value * rows[at + 1 + axis], 0);
      let moved = false;
      for (let axis = 0; axis < 3; axis++) {
        output[at + 1 + axis] += (search.parameters.widthScale - 1) * weight * projected * problem.upper.lateral[axis];
        moved ||= output[at + 1 + axis] !== rows[at + 1 + axis];
      }
      if (moved) changed.push(vertex);
    }
    targets[name] = output; if (changed.length !== 0) editedEndpointVertices[name] = changed;
  }
  return { face: { ...face, surfaces: face.surfaces.map((surface) => surface !== tongue ? surface : { ...tongue, positions, targets }) }, search, loop,
    editedVertices: Array.from({ length: positions.length / 3 }, (_, vertex) => vertex).filter((vertex) => [0, 1, 2].some((axis) => positions[3 * vertex + axis] !== tongue.positions[3 * vertex + axis])),
    editedEndpointVertices,
    qualification: "Pre-binding source neutral and material-consistent endpoint candidate. Native ventral loop is authored, not a clinical frenulum/hyoid. Full curved-surface contact, same-generation loop consumer, Float32/export/GPU and clinical acceptance remain open." };
}
