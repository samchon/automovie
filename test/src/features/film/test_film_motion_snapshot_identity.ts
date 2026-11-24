import { resolveBeatSnapshot } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieResolveBeatProps,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { keyframe, makeMotion, makePose } from "../internal/fixtures";

/**
 * 1. Index two distinct motions at a beat snapshot with no performing nodes.
 * 2. Repeat the first identity at the third position and inspect both source locations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the indexed inputs and their duplicate locations.
 * @evidence contracts/development/testing.md#behavioral-verification Calls resolveBeatSnapshot, the public boundary that indexes motions before visiting nodes.
 * @evidence contracts/development/testing.md#independent-expectations The authored array independently fixes which id is repeated and its first and third positions.
 * @evidence contracts/development/testing.md#distinguishing-cases Unique and colliding identities are exercised on the same empty stage.
 * @evidence contracts/development/testing.md#execution-ownership Runs one public beat boundary on an empty scene without staging or synthesis.
 */
export function test_film_motion_snapshot_identity(): void {
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
