import {
  AutoMovieRenderCapture,
  AutoMovieRenderDraw,
  type IAutoMovieRenderDrawScene,
} from "@automovie/render";
import assert from "node:assert/strict";
import * as THREE from "three";

/**
 * Capture can request declared kinds that appear after an empty opening,
 * without changing the subject's time or fabricating initial geometry.
 *
 * Scenarios:
 *
 * 1. An empty first state declares joint and contact kinds; metadata admits them
 *    while preserving the existing measured kinds and avoiding seek.
 * 2. A kind supplied at zero remains available with no declaration, and a
 *    duplicate declared/supplied kind is listed once.
 * 3. Actual later marks retain their own time and position; declaring a kind does
 *    not manufacture a mark at zero.
 * 4. An authored route kind is accepted by the capture planner when the subject
 *    provides the source. Neither description nor planning samples the source.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Publishes declared late inspection kinds without seeking or creating opening marks.
 * @evidence contracts/development/testing.md#behavioral-verification Calls draw-scene description on empty-opening metadata, opening-only marks and mixed declarations with duplicates.
 * @evidence contracts/development/testing.md#independent-expectations The recorder must show one zero-time read and no seeks. Declared contact and joint kinds and supplied edge or curve kinds prove both ordinary sources of availability. The same explicit trail/route request is admitted with a registered motion source and refused without one.
 */
export function test_render_draw_describe_draw_scene(): void {
  const reads: number[] = [];
  let seeks: number = 0;
  const scene: IAutoMovieRenderDrawScene = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    durationSeconds: 3,
    fps: 30,
    width: 1280,
    height: 720,
    markKinds: ["joint", "contact", "joint"],
    marks: (seconds) => {
      reads.push(seconds);
      return seconds < 2
        ? []
        : [
            {
              path: "actor/knee",
              kind: "joint",
              label: "joint",
              color: 0xff7eb6,
              shape: { type: "points", points: [1, 2, 3] },
              flagged: false,
              anchor: null,
            },
          ];
    },
    seek: async () => {
      seeks++;
    },
    dispose: () => {},
  };
  const late: ReturnType<
    typeof AutoMovieRenderDraw.describeAutoMovieDrawScene
  > = AutoMovieRenderDraw.describeAutoMovieDrawScene("late", scene);
  assert.equal(late.marks.filter((kind) => kind === "joint").length, 1);
  assert.ok(late.marks.includes("contact") && late.marks.includes("edge"));
  assert.equal(seeks, 0);
  assert.deepEqual(reads, [0]);
  assert.deepEqual(scene.marks!(0), []);
  assert.equal(scene.marks!(2)[0]?.kind, "joint");
  const initial: IAutoMovieRenderDrawScene = {
    ...scene,
    marks: () => [
      {
        path: "curve",
        kind: "curve",
        label: "curve",
        color: 0x00ff00,
        shape: { type: "points", points: [0, 0, 0] },
        flagged: false,
        anchor: null,
      },
    ],
  };
  delete initial.markKinds;
  const legacy = AutoMovieRenderDraw.describeAutoMovieDrawScene(
    "legacy",
    initial,
  );
  assert.ok(legacy.marks.includes("curve"));
  const mixed: ReturnType<
    typeof AutoMovieRenderDraw.describeAutoMovieDrawScene
  > = AutoMovieRenderDraw.describeAutoMovieDrawScene("mixed", {
    ...initial,
    markKinds: ["curve", "joint"],
  });
  assert.equal(mixed.marks.filter((kind) => kind === "curve").length, 1);
  assert.ok(mixed.marks.includes("joint"));

  let sourceReads: number = 0;
  const authored = AutoMovieRenderDraw.describeAutoMovieDrawScene("authored", {
    ...initial,
    inspectMotionTrail: {
      read: () => {
        ++sourceReads;
        return undefined;
      },
    },
  });
  assert.deepEqual(
    authored.marks.filter((kind) => kind !== "trail/route"),
    legacy.marks,
  );
  assert.equal(
    authored.marks.filter((kind) => kind === "trail/route").length,
    1,
  );
  const request = AutoMovieRenderCapture.parsePlanRequest(
    new URLSearchParams("at=1&trail=actor&marks=trail/route"),
  );
  assert.equal(
    AutoMovieRenderCapture.plan({ request, subject: authored, cuts: [] }).cells
      .length,
    1,
  );
  assert.throws(
    () => AutoMovieRenderCapture.plan({ request, subject: legacy, cuts: [] }),
    /Mark pattern "trail\/route"/u,
  );
  assert.deepEqual([seeks, sourceReads], [0, 0]);
}
