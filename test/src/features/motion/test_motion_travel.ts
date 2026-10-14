import { travelMotion } from "@automovie/engine";
import type {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/**
 * Observe repeated-cycle root travel, facing composition, seam metadata, fallback ownership and arithmetic refusal. Velocity times global seconds determines queried root offsets; the unit does not render a gliding figure or establish continuous-time foot contact.
 *
 * Scenarios:
 *
 * 1. A two-keyframe, 1 s in-place base (root null) travelled at 0.5 m/s in +Z over
 *    3 cycles → a 3 s non-looping clip whose seam keyframes are dropped (4
 *    keyframes, not 6) and whose root Z is exactly velocity·time at every
 *    keyframe, strictly increasing and continuous across the seams.
 * 2. A base that already carries a root transform (a vertical bob + a yaw) has the
 *    travel added on top: its own translation and rotation are preserved.
 * 3. Travel is purely a function of global time, so the duplicate-seam frame of
 *    cycle n and the first frame of cycle n+1 would have landed at the same
 *    place, confirming continuity (no per-cycle reset / snap-back).
 * 4. A `facing` rotation composes onto the base root rotation: travelling the
 *    45°-yaw base with a further 90° yaw lands the root at 135° yaw.
 * 5. Mutating a returned fallback root leaves other frames and later bakes
 *    unchanged, and unsafe cycle counts refuse before looping.
 * 6. Derived duration, clock and root-position overflow refuse rather than
 *    returning nonfinite or repeated keyframe quantities.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls travelMotion and inspects actual times, root transforms, seam easing and refusal; returned-root mutations catch private identity leakage across frames and later invocations.
 * @evidence contracts/testing.md#independent-expectations Velocity times global seconds and quaternion yaw addition determine literal root expectations independently; three one-second cycles require four unique endpoints, and a fresh fallback identity must remain unit-valued after another output is mutated. Facing is checked through the existing W component and X/Z sway values rather than full quaternion equality; original tolerances and diagnostic fragments are preserved.
 * @evidence contracts/testing.md#distinguishing-cases Covers null and authored roots, facing and no facing, incoming seam easing, invalid cycle/vector inputs, fallback ownership, unsafe repetition and finite-input arithmetic overflow; locomotion sizing and path corners belong to their owning tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_motion_travel function is a synchronous portable unit case calling engine arithmetic; it installs no asset consumer and starts no browser, renderer, native build or external host.
 */
export function test_motion_travel(): void {
  // 1. in-place base (root null) → linear travel, seams dropped
  const base: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftUpperLeg", { flexion: -30 })])),
      keyframe(1, makePose([joint("leftUpperLeg", { flexion: 30 })])),
    ],
    1,
    true,
  );
  const travelled: IAutoMovieMotion = travelMotion("stroll", base, 3, {
    x: 0,
    y: 0,
    z: 0.5,
  });

  TestValidator.equals(
    "3 cycles, seams dropped → 4 keyframes",
    travelled.keyframes.length,
    4,
  );
  TestValidator.predicate(
    "duration = cycles × base",
    nclose(travelled.duration, 3),
  );
  TestValidator.equals("result no longer loops", travelled.loop, false);
  TestValidator.equals(
    "skeleton carried over",
    travelled.skeleton,
    base.skeleton,
  );

  // times are 0, 1, 2, 3 and root Z = 0.5 × time at each
  const times: number[] = travelled.keyframes.map(
    (k: IAutoMovieKeyframe): number => k.time,
  );
  TestValidator.predicate(
    "times are 0,1,2,3",
    times.every((t: number, i: number): boolean => nclose(t, i)),
  );
  TestValidator.predicate(
    "root Z = velocity × time at every keyframe",
    travelled.keyframes.every((k: IAutoMovieKeyframe): boolean =>
      nclose(k.pose.root!.translation.z, 0.5 * k.time),
    ),
  );
  TestValidator.predicate(
    "no travel on unused axes",
    travelled.keyframes.every(
      (k: IAutoMovieKeyframe): boolean =>
        nclose(k.pose.root!.translation.x, 0) &&
        nclose(k.pose.root!.translation.y, 0),
    ),
  );

  // 2. base root preserved, travel added on top
  const bob: IAutoMovieTransform = {
    translation: { x: 0, y: 0.1, z: 0 },
    rotation: { x: 0, y: 0.3826834, z: 0, w: 0.9238795 }, // ~45° yaw
    scale: { x: 1, y: 1, z: 1 },
  };
  const withRoot: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftUpperLeg", { flexion: 0 })], bob)),
      keyframe(1, makePose([joint("leftUpperLeg", { flexion: 0 })], bob)),
    ],
    1,
    true,
  );
  const t2: IAutoMovieMotion = travelMotion("hopAcross", withRoot, 2, {
    x: 1,
    y: 0,
    z: 0,
  });
  const k1: IAutoMovieKeyframe = t2.keyframes[1]!; // at global time 1
  TestValidator.predicate(
    "base bob Y preserved",
    nclose(k1.pose.root!.translation.y, 0.1),
  );
  TestValidator.predicate(
    "travel added to X (1 m/s × 1 s)",
    nclose(k1.pose.root!.translation.x, 1),
  );
  TestValidator.predicate(
    "base yaw preserved",
    nclose(k1.pose.root!.rotation.w, 0.9238795),
  );

  // 3. continuity: the last frame of one cycle and the (dropped) seam of the
  //    next would coincide: root advances monotonically, never resets
  TestValidator.predicate(
    "root Z strictly increasing across seams",
    travelled.keyframes.every(
      (k: IAutoMovieKeyframe, i: number): boolean =>
        i === 0 ||
        k.pose.root!.translation.z >
          travelled.keyframes[i - 1]!.pose.root!.translation.z,
    ),
  );

  // 4. facing composes onto the base root rotation (45° yaw + 90° yaw = 135°)
  const yaw90: { x: number; y: number; z: number; w: number } = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };
  const faced: IAutoMovieMotion = travelMotion(
    "turn",
    withRoot,
    2,
    { x: 1, y: 0, z: 0 },
    yaw90,
  );
  TestValidator.predicate(
    "facing ∘ base yaw = 135° (w = cos 67.5°)",
    nclose(
      faced.keyframes[1]!.pose.root!.rotation.w,
      Math.cos((67.5 * Math.PI) / 180),
    ),
  );
  // 5. invalid travel inputs reject before producing malformed clips
  const invalidCycles: number[] = [Number.NaN, 0, -1, 1.5];
  for (const cycles of invalidCycles)
    TestValidator.predicate(
      `rejects invalid cycles ${cycles}`,
      throwsError((): void => {
        travelMotion("badCycles", base, cycles, { x: 0, y: 0, z: 1 });
      }),
    );

  const invalidVelocities: { x: number; y: number; z: number }[] = [
    { x: Number.NaN, y: 0, z: 1 },
    { x: 0, y: Infinity, z: 1 },
    { x: 0, y: 0, z: -Infinity },
  ];
  for (const velocity of invalidVelocities)
    TestValidator.predicate(
      "rejects non-finite velocity",
      throwsError((): void => {
        travelMotion("badVelocity", base, 1, velocity);
      }),
    );

  const invalidFacings: { x: number; y: number; z: number; w: number }[] = [
    { x: Number.NaN, y: 0, z: 0, w: 1 },
    { x: 0, y: Infinity, z: 0, w: 1 },
    { x: 0, y: 0, z: -Infinity, w: 1 },
    { x: 0, y: 0, z: 0, w: Number.NaN },
  ];
  for (const facing of invalidFacings)
    TestValidator.predicate(
      "rejects non-finite facing",
      throwsError((): void => {
        travelMotion("badFacing", base, 1, { x: 0, y: 0, z: 1 }, facing);
      }),
    );

  // 5. a model-frame lateral sway rotates with the facing before travel adds
  const yaw90b: { x: number; y: number; z: number; w: number } = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };
  const swayRoot: IAutoMovieTransform = {
    translation: { x: 0.1, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const swaying: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([], swayRoot), "easeIn"),
      keyframe(1, makePose([], swayRoot), "step"),
    ],
    1,
    true,
  );
  const swayFaced: IAutoMovieMotion = travelMotion(
    "sway",
    swaying,
    2,
    { x: 1, y: 0, z: 0 },
    yaw90b,
  );
  TestValidator.equals(
    "model X sway lands on world −Z under a 90° facing",
    namedFacts([
      [
        "ncloseSwayFacedKeyframes",
        (): boolean =>
          nclose(swayFaced.keyframes[1]!.pose.root!.translation.z, -0.1),
      ],
      [
        "ncloseSwayFacedKeyframes2",
        (): boolean =>
          nclose(swayFaced.keyframes[1]!.pose.root!.translation.x, 1),
      ],
    ]),
    { ncloseSwayFacedKeyframes: true, ncloseSwayFacedKeyframes2: true },
  );

  // 6. the seam keyframe carries the incoming cycle's first-segment easing
  TestValidator.equals(
    "travel seam easing is the incoming cycle's first",
    swayFaced.keyframes[1]!.easing,
    "easeIn",
  );
  TestValidator.equals(
    "the authored final easing survives",
    swayFaced.keyframes[2]!.easing,
    "step",
  );
  travelled.keyframes[0]!.pose.root!.rotation.w = 0;
  travelled.keyframes[0]!.pose.root!.scale.x = 9;
  const fresh: IAutoMovieMotion = travelMotion("fresh", base, 1, {
    x: 0,
    y: 0,
    z: 0.5,
  });
  TestValidator.predicate(
    "fallback identity is isolated between frames and invocations",
    nclose(travelled.keyframes[1]!.pose.root!.rotation.w, 1) &&
      nclose(travelled.keyframes[1]!.pose.root!.scale.x, 1) &&
      nclose(fresh.keyframes[0]!.pose.root!.rotation.w, 1) &&
      nclose(fresh.keyframes[0]!.pose.root!.scale.x, 1),
  );
  TestValidator.predicate(
    "unsafe integer cycle count refuses before repetition",
    throwsError(
      (): IAutoMovieMotion =>
        travelMotion("unsafe", base, Number.MAX_SAFE_INTEGER + 1, {
          x: 0,
          y: 0,
          z: 0,
        }),
      "travel cycles",
    ),
  );
  const huge: IAutoMovieMotion = makeMotion(
    [keyframe(0, makePose([])), keyframe(1e308, makePose([]))],
    1e308,
  );
  TestValidator.predicate(
    "finite base duration refuses overflowing composite duration",
    throwsError(
      (): IAutoMovieMotion =>
        travelMotion("durationOverflow", huge, 2, { x: 0, y: 0, z: 0 }),
      "travel duration",
    ),
  );
  TestValidator.predicate(
    "finite velocity and time refuse overflowing root coordinates",
    throwsError(
      (): IAutoMovieMotion =>
        travelMotion("positionOverflow", huge, 1, { x: 2, y: 0, z: 0 }),
      "travel root translation",
    ),
  );
  const dense: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([])),
      keyframe(1, makePose([])),
      keyframe(1e16, makePose([])),
    ],
    1e16,
  );
  TestValidator.predicate(
    "finite cycle offsets refuse a lost interior clock increment",
    throwsError(
      (): IAutoMovieMotion =>
        travelMotion("lostIncrement", dense, 2, { x: 0, y: 0, z: 0 }),
      "travel keyframe times",
    ),
  );
}
