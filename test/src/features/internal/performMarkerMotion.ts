import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieAttachJob,
  IAutoMovieClip,
  IAutoMoviePerformedShot,
  IAutoMoviePropSpec,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { filmAttachSynthesizer } from "./filmAttachSynthesizer";
import { IDENTITY_TRANSFORM, createSkeleton } from "./fixtures";

/** Perform a neutral studio shot with an attached tracking marker and caller-supplied staged pieces. */
export function performMarkerMotion(
  nodes: IAutoMovieSceneNode[],
  clips: readonly IAutoMovieClip[],
  props: readonly IAutoMoviePropSpec[],
  attachment: IAutoMovieAttachJob["action"] = {
    verb: "attachTo",
    actor: "tag",
    parent: "keeper",
    bone: "leftHand",
    start: 0,
    duration: "auto",
  },
): IAutoMoviePerformedShot {
  const script: IAutoMovieScript = {
    logline: "A keeper wears a tracking marker.",
    theme: "Calibration",
    cast: [
      { node: "keeper", character: "keeper", modelRef: "figure" },
      { node: "tag", character: "marker", modelRef: null },
    ],
    beats: [
      {
        id: "calibration",
        name: "Calibration",
        summary: "Record the attached marker.",
        durationHint: 2,
      },
    ],
  };
  const cast: IAutoMovieSceneNode[] = script.cast.map(
    (actor: IAutoMovieScript["cast"][number]): IAutoMovieSceneNode => ({
      id: actor.node,
      model: actor.node,
      transform: IDENTITY_TRANSFORM,
      motion: null,
      pose: null,
    }),
  );
  return AutoMovieEngineFilm.performShot({
    script,
    staged: {
      success: true,
      mounts: [],
      scene: {
        id: "studio",
        name: "Studio",
        nodes: [...cast, ...nodes],
        lights: [],
        cameras: [
          {
            id: "camera",
            transform: {
              ...IDENTITY_TRANSFORM,
              translation: { x: 0, y: 1, z: 3 },
            },
            fovY: 45,
            near: 0.1,
            far: 100,
            depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 1 },
          },
        ],
      },
    },
    performance: {
      beat: "calibration",
      plan: "Keep the tag visible.",
      draft: [
        {
          verb: "gesture",
          actor: "keeper",
          start: 0,
          duration: 1,
          kind: "bow",
        },
        attachment,
        {
          verb: "frame",
          actor: "camera",
          start: 0,
          duration: "auto",
          framing: "full",
          move: "static",
          on: { kind: "node", node: "keeper" },
        },
      ],
      revise: { review: "The marker follows its keeper.", final: null },
      duration: 2,
    },
    synthesize: filmAttachSynthesizer,
    skeleton: (id: string): IAutoMovieSkeleton | null =>
      id === "keeper" ? createSkeleton() : null,
    props,
    objectMotions: clips,
  });
}
