import type {
  IAutoMovieClip,
  IAutoMoviePerformedShot,
  IAutoMovieSceneNode,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { createDoorPropSpec } from "../../../internal/createDoorPropSpec";
import { IDENTITY_TRANSFORM } from "../../../internal/fixtures";
import { performMarkerMotion } from "../../../internal/performMarkerMotion";
import { swingClip } from "../../../internal/swingClip";

/**
 * 1. A tracking marker attached to a keeper contributes its baked clip without any authored clip.
 * 2. Two registered transforms reach the shot beside that same baked marker, including the door's lowered hinge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two public shot handoffs and the addressed joint.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual performed shot's ordered object clips and their full authored payloads.
 * @evidence contracts/development/testing.md#independent-expectations The attach verb supplies the tag identity; caller-authored records fix both additional channels and keys.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts empty registration with a lowered prop joint and a rigid staged panel together.
 * @evidence contracts/development/testing.md#execution-ownership Uses the first public engine operation that returns the finished clips without compiling a screenplay.
 */
export function test_unit_engine_film_motion_clip_handoff(): void {
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
