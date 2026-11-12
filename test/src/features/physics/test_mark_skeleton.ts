import {
  type AutoMoviePhysicsCache,
  type IAutoMovieMark,
  markAutoMovieSkeleton,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Articulated bodies at one cached instant become bone segments between joined segments and joint points at every segment, for any rig.
 *
 * Scenarios:
 *
 * 1. A two-bone chain of three segments, `root`, `mid` and `tip`, joined root to mid and mid to tip, gives two bone segments from parent to child position and three joint points at the segments' positions, at paths under the body and its bones, unanchored.
 * 2. Two bodies give each body's marks under its own id, body by body.
 * 3. A frame that lacks a segment the profile names is refused naming the body and the bone.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine producer on profiles and frames the test writes and reads the returned marks' paths, kinds, shapes and anchors.
 * @evidence contracts/development/testing.md#independent-expectations Expected ends and points are the positions written into the frame, and the expected paths follow the documented `<body>/<bone>/bone` and `<body>/<bone>/joint` forms.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts bones against joints, one body against two, and a complete frame against one missing a segment. Drawing the marks belongs to the inspection tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own profiles and frames and starts no solver, browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A two-bone chain of three segments, root, mid and tip, joined root to mid and mid to tip).
 */
export function test_mark_skeleton(): void {
  const profile = (bones: string[]): IAutoMoviePhysicalProfile =>
    ({
      segments: bones.map((bone: string) => ({ bone })),
      joints: bones
        .slice(1)
        .map((child: string, i: number) => ({ parent: bones[i]!, child })),
    }) as unknown as IAutoMoviePhysicalProfile;
  const frame = (
    bodies: Record<string, Record<string, [number, number, number]>>,
  ): AutoMoviePhysicsCache.IFrame =>
    ({
      seconds: 0,
      bodies: Object.fromEntries(
        Object.entries(bodies).map(([id, segments]) => [
          id,
          Object.fromEntries(
            Object.entries(segments).map(([bone, [x, y, z]]) => [
              bone,
              { position: { x, y, z }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
            ]),
          ),
        ]),
      ),
    }) as unknown as AutoMoviePhysicsCache.IFrame;
  const shape = (mark: IAutoMovieMark): unknown[] => [
    mark.path,
    mark.kind,
    mark.shape,
    mark.anchor,
  ];

  // 1. A two-bone chain.
  const chain: IAutoMovieMark[] = markAutoMovieSkeleton({
    bodies: [{ id: "arm", profile: profile(["root", "mid", "tip"]) }],
    frame: frame({ arm: { root: [0, 1, 0], mid: [0, 2, 0], tip: [1, 2, 0] } }),
  });
  TestValidator.equals("two bones and three joints", chain.map(shape), [
    [
      "arm/mid/bone",
      "bone",
      { type: "segments", points: [0, 1, 0, 0, 2, 0] },
      null,
    ],
    [
      "arm/tip/bone",
      "bone",
      { type: "segments", points: [0, 2, 0, 1, 2, 0] },
      null,
    ],
    ["arm/root/joint", "joint", { type: "points", points: [0, 1, 0] }, null],
    ["arm/mid/joint", "joint", { type: "points", points: [0, 2, 0] }, null],
    ["arm/tip/joint", "joint", { type: "points", points: [1, 2, 0] }, null],
  ]);

  // 2. Two bodies.
  TestValidator.equals(
    "each body's marks under its own id",
    markAutoMovieSkeleton({
      bodies: [
        { id: "a", profile: profile(["p", "q"]) },
        { id: "b", profile: profile(["p", "q"]) },
      ],
      frame: frame({
        a: { p: [0, 0, 0], q: [1, 0, 0] },
        b: { p: [5, 0, 0], q: [6, 0, 0] },
      }),
    }).map((mark: IAutoMovieMark): string => mark.path),
    [
      "a/q/bone",
      "a/p/joint",
      "a/q/joint",
      "b/q/bone",
      "b/p/joint",
      "b/q/joint",
    ],
  );

  // 3. A missing segment.
  try {
    markAutoMovieSkeleton({
      bodies: [{ id: "arm", profile: profile(["root", "mid"]) }],
      frame: frame({ arm: { root: [0, 0, 0] } }),
    });
    TestValidator.predicate("a missing segment is refused", false);
  } catch (error) {
    TestValidator.predicate(
      "a missing segment is refused naming it",
      error instanceof Error && error.message.includes("arm/mid"),
    );
  }
}
