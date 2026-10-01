import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

import type { IBodyPoseCensusIdentity } from "../../../scripts/body-basis/IBodyPoseCensusIdentity";
import type { runBodyPoseDefectCensus } from "../../../scripts/body-basis/runBodyPoseDefectCensus";

/**
 * A census coordinator's independent cube oracle and in-memory input reader.
 * The synthetic builder doubles all three lengths in the posed state, so area
 * and volume ratios are four and eight without relying on body skinning. The
 * fixture pins orchestration, correspondence and provenance, not human anatomy.
 */
export function bodyPoseCensusFixture(): {
  input: Parameters<typeof runBodyPoseDefectCensus>[0];
  documents: IAutoMovieHumanBodyBasisDocument[];
  progress: string[];
} {
  const identity: IBodyPoseCensusIdentity = {
    basis: { id: "analytic-census/1", sha256: "payload-A" },
    head: "revision-A",
    sourceSha256: "source-A",
  };
  const positions = [
    0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0,
    0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1,
  ];
  const documents: IAutoMovieHumanBodyBasisDocument[] = [];
  const progress: string[] = [];
  return {
    documents,
    progress,
    input: {
      identity,
      snapshot: () => structuredClone(identity),
      states: {
        base: { shape: { width: 2 }, pose: [] },
        double: {
          shape: {},
          pose: [{ bone: "spine", flexion: 90, abduction: null, twist: null }],
        },
      },
      shapes: ["base"],
      poses: ["double"],
      indices: [
        0, 3, 2, 0, 2, 1, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4,
        3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5,
      ],
      zoneOfVertex: () => "trunk",
      build: (document) => {
        documents.push(structuredClone(document));
        const scale = document.pose === undefined ? 1 : 2;
        return positions.map((value) => value * document.shape.width * scale);
      },
      progress: (shape, pose) => { progress.push(shape + "/" + pose); },
    },
  };
}
