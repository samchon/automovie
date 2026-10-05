import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinLandmark } from "@automovie/human/body/structures/surface/IAutoMovieHumanBodySkinLandmark";

import { HUMAN_SOURCE_SKIN_LANDMARKS } from "./HUMAN_SOURCE_SKIN_LANDMARKS.ts";
import { humanSourcePositionTolerance } from "./humanSourcePositionTolerance.ts";
import type { IHumanSourceCut } from "./structures/IHumanSourceCut.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";

/**
 * Address each named skin point on the body view. A published-body vertex is
 * carried by its exact source twin (`cut.r16ToSource`); a source sample is
 * used as it is. The sample must appear exactly once among the body view's
 * vertices, and the view vertex must sit where the named vertex sits at
 * neutral (a published vertex within float storage of its twin), or the
 * point is refused by name rather than replaced by a nearest vertex.
 */
export function defineHumanSourceSkinLandmarks(
  published: IAutoMovieHumanBodyBasis,
  generation: IHumanSourceGeneration,
  cut: IHumanSourceCut,
): Record<string, IAutoMovieHumanBodySkinLandmark> {
  const out: Record<string, IAutoMovieHumanBodySkinLandmark> = {};
  for (const landmark of HUMAN_SOURCE_SKIN_LANDMARKS) {
    const sample = landmark.from.kind === "source-sample" ? landmark.from.sample : cut.r16ToSource[landmark.from.vertex];
    if (sample === undefined || sample < 0) throw new Error(`Skin landmark ${landmark.name} has no source sample.`);
    const vertices: number[] = [];
    cut.p1BodyToG1.forEach((g, j) => {
      if (g === sample) vertices.push(j);
    });
    if (vertices.length !== 1) throw new Error(`Skin landmark ${landmark.name}: source sample ${sample} appears ${vertices.length} times on the body view.`);
    if (landmark.from.kind === "published-body-vertex") {
      const p = published.surfaces[0].positions;
      const q = generation.skin.positions;
      const v = landmark.from.vertex;
      const gap = Math.hypot(p[3 * v] - q[3 * sample], p[3 * v + 1] - q[3 * sample + 1], p[3 * v + 2] - q[3 * sample + 2]);
      if (!(gap <= humanSourcePositionTolerance)) throw new Error(`Skin landmark ${landmark.name}: published vertex ${v} is ${gap} m from its source twin.`);
    }
    out[landmark.name] = { surface: 0, vertex: vertices[0] };
  }
  return out;
}
