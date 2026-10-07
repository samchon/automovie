import { evaluateHumanBodyShape } from "@automovie/human/body/basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "@automovie/human/body/basis/humanBodyBasisWeights";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import { buildHumanSourceP1BodyMesh } from "./buildHumanSourceP1BodyMesh.ts";
import { computeHumanSourceSymmetricNormals } from "./computeHumanSourceSymmetricNormals.ts";
import { createHumanSourceHeatDiffusion } from "./createHumanSourceHeatDiffusion.ts";
import { createHumanSourceUniformSmoother } from "./createHumanSourceUniformSmoother.ts";
import { defineHumanSourceSkinLandmarks } from "./defineHumanSourceSkinLandmarks.ts";
import { mirrorHumanSourceSurface } from "./mirrorHumanSourceSurface.ts";
import type { IHumanSourceBodyReproduction } from "./structures/IHumanSourceBodyReproduction.ts";
import type { IHumanSourceCut } from "./structures/IHumanSourceCut.ts";
import type { IHumanSourceFieldContext } from "./structures/IHumanSourceFieldContext.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";

/**
 * Prepare what the body field producers share on the body partition view's
 * surface. The shape evaluator is the package's own over a basis that is the
 * published body with the view's surface and the current view rows, so a
 * shape is built through this generation's basis; an endpoint still
 * unavailable refuses by name if a shape would activate it.
 */
export function createHumanSourceFieldContext(
  body: IAutoMovieHumanBodyBasis,
  generation: IHumanSourceGeneration,
  cut: IHumanSourceCut,
  bodyRows: IHumanSourceBodyReproduction,
): IHumanSourceFieldContext {
  const mesh = buildHumanSourceP1BodyMesh(generation, cut);
  const n = mesh.positions.length / 3;
  const twin = mirrorHumanSourceSurface(mesh.positions);
  const surface = body.surfaces[0];
  const basis: IAutoMovieHumanBodyBasis = {
    ...body,
    id: `${generation.id.slice(0, 12)}-field-producers`,
    ...(Object.keys(bodyRows.unavailable).length === 0
      ? {}
      : { unavailableTargets: Object.keys(bodyRows.unavailable) }),
    surfaces: [
      {
        ...surface,
        positions: Array.from(mesh.positions),
        indices: Array.from(mesh.indices),
        targets: bodyRows.p1Targets,
      },
    ],
  };
  const landmarks = defineHumanSourceSkinLandmarks(
    body,
    generation,
    cut,
  ).skinLandmarks;
  return {
    mesh,
    twin,
    normals: computeHumanSourceSymmetricNormals(mesh, twin),
    smooth: createHumanSourceUniformSmoother(mesh.indices, n),
    diffuse: createHumanSourceHeatDiffusion(mesh),
    evaluate: (shape) =>
      Float64Array.from(
        evaluateHumanBodyShape(basis, humanBodyBasisWeights(basis, { shape }))
          .surfaces[0],
      ),
    rows: (name) => {
      const out = new Float64Array(3 * n);
      const rows = bodyRows.p1Targets[name] ?? [];
      for (let i = 0; i < rows.length; i += 4)
        for (let c = 0; c < 3; c++) out[3 * rows[i] + c] = rows[i + 1 + c];
      return out;
    },
    landmark: (name) => {
      const found = landmarks[name];
      if (found === undefined)
        throw new Error(`The body view declares no skin landmark ${name}.`);
      return found.vertex;
    },
  };
}
