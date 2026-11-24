import { resolveBeatSnapshot } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieResolveBeatProps,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { keyframe, makeMotion, makePose } from "../../../internal/fixtures";

/**
 * 1. Index two distinct motions at a beat snapshot with no performing nodes.
 * 2. Repeat the first identity at the third position and inspect both source locations.
 */
export function test_unit_engine_film_film_motion_snapshot_identity(): void {
  const first: IAutoMovieMotion = {
    ...makeMotion([keyframe(0, makePose([]))], 1),
    id: "first",
  };
  const second: IAutoMovieMotion = { ...first, id: "second" };
  const props: IAutoMovieResolveBeatProps = {
    beat: "cut",
    scene: { id: "studio", name: null, nodes: [], cameras: [], lights: [] },
    shot: {
      id: "shot",
      name: null,
      scene: "studio",
      camera: "camera",
      cameraMotion: null,
      performances: [],
      objectMotions: [],
      duration: 1,
    },
    motions: [first, second],
  };
  assert.doesNotThrow(() => resolveBeatSnapshot(props, 0));
  assert.throws(
    () =>
      resolveBeatSnapshot(
        {
          ...props,
          motions: [first, second, { ...first, duration: 2 }],
        },
        0,
      ),
    (error: unknown): boolean =>
      error instanceof Error &&
      error.message.includes('motion "first" is duplicated') &&
      error.message.includes("props.motions[2].id") &&
      error.message.includes("props.motions[0].id"),
  );
}
