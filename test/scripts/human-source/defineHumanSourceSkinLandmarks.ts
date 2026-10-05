import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import { HUMAN_SOURCE_BODY_CONVENTION } from "./HUMAN_SOURCE_BODY_CONVENTION.ts";
import { HUMAN_SOURCE_SKIN_LANDMARKS } from "./HUMAN_SOURCE_SKIN_LANDMARKS.ts";
import { humanSourcePositionTolerance } from "./humanSourcePositionTolerance.ts";
import type { IHumanSourceBodyLandmarks } from "./structures/IHumanSourceBodyLandmarks.ts";
import type { IHumanSourceCut } from "./structures/IHumanSourceCut.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";

/**
 * Address each named skin point on the body view and record how it was
 * determined. A published-body vertex is carried by its exact source twin
 * (`cut.r16ToSource`); a source sample is used as it is. A point that names a
 * left twin gets the body view sample at its neutral position reflected in x,
 * within storage. Every sample must appear exactly once among the body view's
 * vertices and a published vertex must sit on its twin, or the point is
 * refused by name rather than replaced by a nearest vertex.
 */
export function defineHumanSourceSkinLandmarks(published: IAutoMovieHumanBodyBasis, generation: IHumanSourceGeneration, cut: IHumanSourceCut): IHumanSourceBodyLandmarks {
  const q = generation.skin.positions;
  const at = (s: number): number[] => [q[3 * s], q[3 * s + 1], q[3 * s + 2]];
  const viewOf = (name: string, sample: number): number => {
    const vertices: number[] = [];
    cut.p1BodyToG1.forEach((g, j) => {
      if (g === sample) vertices.push(j);
    });
    if (vertices.length !== 1) throw new Error(`Skin landmark ${name}: source sample ${sample} appears ${vertices.length} times on the body view.`);
    return vertices[0];
  };
  const out: IHumanSourceBodyLandmarks = { skinLandmarks: {}, records: [] };
  for (const landmark of HUMAN_SOURCE_SKIN_LANDMARKS) {
    const sample = landmark.from.kind === "source-sample" ? landmark.from.sample : cut.r16ToSource[landmark.from.vertex];
    if (sample === undefined || sample < 0) throw new Error(`Skin landmark ${landmark.name} has no source sample.`);
    if (landmark.from.kind === "published-body-vertex") {
      const p = published.surfaces[0].positions;
      const v = landmark.from.vertex;
      const gap = Math.hypot(p[3 * v] - q[3 * sample], p[3 * v + 1] - q[3 * sample + 1], p[3 * v + 2] - q[3 * sample + 2]);
      if (!(gap <= humanSourcePositionTolerance)) throw new Error(`Skin landmark ${landmark.name}: published vertex ${v} is ${gap} m from its source twin.`);
    }
    const record = (name: string, s: number, status: string, neighbours: readonly number[], definition: string, ambiguity: string | null): void => {
      const viewVertex = viewOf(name, s);
      out.skinLandmarks[name] = { surface: 0, vertex: viewVertex };
      out.records.push({
        name,
        definition,
        citation: landmark.citation,
        status,
        sample: s,
        viewVertex,
        position: at(s),
        neighbours: neighbours.map((n) => ({ sample: n, position: at(n) })),
        limit: landmark.limit,
        ambiguity,
        convention: HUMAN_SOURCE_BODY_CONVENTION,
      });
    };
    record(landmark.name, sample, landmark.status, landmark.neighbours, landmark.definition, landmark.ambiguity);
    if (landmark.mirror !== undefined) {
      const [x, y, z] = at(sample);
      let twin = -1;
      for (const g of cut.p1BodyToG1)
        if (Math.hypot(q[3 * g] + x, q[3 * g + 1] - y, q[3 * g + 2] - z) <= humanSourcePositionTolerance) {
          if (twin >= 0 && twin !== g) throw new Error(`Skin landmark ${landmark.mirror}: more than one mirror twin of sample ${sample}.`);
          twin = g;
        }
      if (twin < 0) throw new Error(`Skin landmark ${landmark.mirror}: sample ${sample} has no exact mirror twin on the body view.`);
      // The twin is built, not read: its compared neighbours are the read side's, recorded there.
      record(
        landmark.mirror,
        twin,
        `${landmark.status}; exact position mirror of ${landmark.name}`,
        [],
        landmark.mirrorDefinition ?? landmark.definition,
        landmark.ambiguity === null ? null : `Exact mirror twin of ${landmark.name}; the reading's ambiguity is recorded there.`,
      );
    }
  }
  return out;
}
