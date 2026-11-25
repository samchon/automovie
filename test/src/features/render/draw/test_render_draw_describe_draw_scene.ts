import {
  type IAutoMovieDrawScene,
  describeAutoMovieDrawScene,
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
 */
export function test_render_draw_describe_draw_scene(): void {
  const reads: number[] = [];
  let seeks: number = 0;
  const scene: IAutoMovieDrawScene = {
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
  const late: ReturnType<typeof describeAutoMovieDrawScene> =
    describeAutoMovieDrawScene("late", scene);
  assert.equal(late.marks.filter((kind) => kind === "joint").length, 1);
  assert.ok(late.marks.includes("contact") && late.marks.includes("edge"));
  assert.equal(seeks, 0);
  assert.deepEqual(reads, [0]);
  assert.deepEqual(scene.marks!(0), []);
  assert.equal(scene.marks!(2)[0]?.kind, "joint");
  const initial: IAutoMovieDrawScene = {
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
  const legacy = describeAutoMovieDrawScene("legacy", initial);
  assert.ok(legacy.marks.includes("curve"));
  const mixed: ReturnType<typeof describeAutoMovieDrawScene> =
    describeAutoMovieDrawScene("mixed", {
      ...initial,
      markKinds: ["curve", "joint"],
    });
  assert.equal(mixed.marks.filter((kind) => kind === "curve").length, 1);
  assert.ok(mixed.marks.includes("joint"));
}
