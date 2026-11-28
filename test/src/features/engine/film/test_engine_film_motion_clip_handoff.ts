import type {
  IAutoMovieClip,
  IAutoMoviePerformedShot,
  IAutoMovieSceneNode,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { createDoorPropSpec } from "../../internal/createDoorPropSpec";
import { IDENTITY_TRANSFORM } from "../../internal/fixtures";
import { performMarkerMotion } from "../../internal/performMarkerMotion";
import { swingClip } from "../../internal/swingClip";

/**
 * A realized shot retains baked attachments and its registered object clips.
 *
 * Scenarios:
 *
 * 1. A tracking marker attached to a keeper contributes its baked clip without any
 *    authored clip.
 * 2. Two registered transforms reach the shot beside that same baked marker,
 *    including the door's lowered hinge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The numbered cases name the generated marker attachment clip and the two registered object transforms that must share the compiled shot.
 * @evidence contracts/development/testing.md#behavioral-verification The test compiles prepared shot actions, reads its clip payload and compares the marker's baked track and registered door transform with the authored track requests.
 * @evidence contracts/development/testing.md#independent-expectations The declaration supplies an attached marker without a separate clip, so it needs a baked contribution. Each explicitly registered transform remains present beside that clip, and the authored door hinge determines its lowered part identity.
 */
export function test_engine_film_motion_clip_handoff(): void {
  const nodes: IAutoMovieSceneNode[] = ["doorway", "panel"].map(
    (id: string): IAutoMovieSceneNode => ({
      id,
      model: id === "doorway" ? "door" : id,
      transform: IDENTITY_TRANSFORM,
      motion: null,
      pose: null,
    }),
  );
  const clips: IAutoMovieClip[] = [
    swingClip("hinge", "doorway/hinge", 90),
    swingClip("panel", "panel", 45),
  ];
  for (const registered of [[], clips]) {
    const result: IAutoMoviePerformedShot = performMarkerMotion(
      nodes,
      registered,
      [createDoorPropSpec()],
    );
    if (!result.success) assert.fail(JSON.stringify(result.violations));
    const [baked, ...authored]: IAutoMovieClip[] = result.shot.objectMotions;
    assert.equal(baked?.id, "attach:tag");
    assert.deepEqual(
      baked.tracks.map(
        (
          track: IAutoMovieClip["tracks"][number],
        ): IAutoMovieClip["tracks"][number]["channel"] => track.channel,
      ),
      [
        { kind: "node", node: "tag", path: "translation" },
        { kind: "node", node: "tag", path: "rotation" },
      ],
    );
    assert.deepEqual(authored, registered);
  }
}
