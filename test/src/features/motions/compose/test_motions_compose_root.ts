import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRoot
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanRoot";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { linearMotionClock } from "../../internal/synthetic/linearMotionClock";
import { vclose } from "../../internal/vclose";

/** Rounding of one product and one sum per component, metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.excursion` displaces the root by the clock's
 * envelope share of a displacement, rising over one window and falling over a
 * later one, and writes the root from the rise's first instant to the fall's
 * last.
 *
 * The clock is synthetic and linear (`linearMotionClock`), 2 s with `peak` at 1
 * s, so the envelope of a rise from `start` to `peak` and a fall from `peak` to
 * `end` is a triangle: 0, 0.5, 1, 0.5 and 0 at 0, 0.5, 1, 1.5 and 2 s. The
 * displacement is a quarter-metre dip, so the expected root follows from the
 * triangle alone.
 *
 * Scenarios:
 *
 * 1. The primitive's window is the rise's start to the fall's end.
 * 2. The root dips by the envelope share of 0.25 m at each sample, the full dip at
 *    the peak, and rejoins the entry at both ends.
 * 3. A sample outside the windows (2.5 s) adds nothing.
 */
function scenario_test_motions_compose_root_excursion(): void {
  const clock: IAutoMovieMotionClock = linearMotionClock(2, [
    { name: "peak", seconds: 1 },
  ]);
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.excursion(
      clock,
      ["start", "peak"],
      ["peak", "end"],
      { point: { x: 0, y: -0.25, z: 0 }, yaw: 0 },
    );
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: 3 },
    yaw: 90,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };

  TestValidator.equals(
    "written from the rise's start to the fall's end",
    [primitive.from, primitive.to],
    [0, 2],
  );
  for (const [t, share] of [
    [0, 0],
    [0.5, 0.5],
    [1, 1],
    [1.5, 0.5],
    [2, 0],
    [2.5, 0],
  ] as const)
    TestValidator.predicate(
      `at ${t} s the root dips ${share} of a quarter metre`,
      vclose(
        primitive.write(entry, t).root,
        { x: 2, y: -0.25 * share, z: 3 },
        ROUNDING,
      ),
    );
}

/** Rounding of one product and one sum, degrees or metres. */
const ROUNDING_ROOT_FACE: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.face` turns the heading by an angle on the clock's
 * progress over a window and holds the turn until the action's end, leaving the
 * root where it was.
 *
 * The clock is synthetic and linear (`linearMotionClock`), 2 s with `peak` at 1
 * s, so the progress from `start` to `peak` is the elapsed share of that
 * second.
 *
 * Scenarios:
 *
 * 1. The primitive runs from the window's first instant to the clock's end.
 * 2. A 45° turn from heading 90 reaches 112.5° halfway, 135° at the peak and holds
 *    135° at the end.
 * 3. The root never moves while turning.
 * 4. A turn of 0° keeps the entry heading throughout.
 */
function scenario_test_motions_compose_root_face(): void {
  const clock: IAutoMovieMotionClock = linearMotionClock(2, [
    { name: "peak", seconds: 1 },
  ]);
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: 3 },
    yaw: 90,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const turn: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanRoot.face(
    clock,
    ["start", "peak"],
    45,
  );
  const none: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanRoot.face(
    clock,
    ["start", "peak"],
    0,
  );

  TestValidator.equals(
    "runs from the window's start to the clock's end",
    [turn.from, turn.to],
    [0, 2],
  );
  for (const [t, yaw] of [
    [0, 90],
    [0.5, 112.5],
    [1, 135],
    [2, 135],
  ] as const) {
    const posed: IAutoMovieMotionHumanPosture = turn.write(entry, t);
    TestValidator.predicate(
      `at ${t} s the heading is ${yaw}° and the root stays`,
      nclose(posed.yaw, yaw, ROUNDING_ROOT_FACE) &&
        vclose(posed.root, entry.root, ROUNDING_ROOT_FACE),
    );
    TestValidator.predicate(
      `a turn of 0° keeps heading 90 at ${t} s`,
      nclose(none.write(entry, t).yaw, 90, ROUNDING_ROOT_FACE),
    );
  }
}

/** Rounding of one rotation and one sum per component, metres. */
const ROUNDING_ROOT_PLACE: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.place` moves a posture's root by an offset given in
 * the posture's own floor frame, then turns its heading.
 *
 * The frame is the performer's: `x` left, `y` up, `z` forward, rotated about +Y
 * by the posture's yaw in degrees, so a right-handed quarter turn carries local
 * +Z onto world +X and local +X onto world -Z. The yaw adds.
 *
 * Scenarios:
 *
 * 1. At heading 0 the local offset is the world offset.
 * 2. At heading 90 local forward becomes world +X, local left world -Z and up
 *    stays up; the heading becomes 90 plus the turn.
 * 3. A zero offset returns the root and heading unchanged.
 * 4. The pitch, roll, joints and limbs pass through untouched.
 */
function scenario_test_motions_compose_root_place(): void {
  const posture: (yaw: number) => IAutoMovieMotionHumanPosture = (
    yaw: number,
  ): IAutoMovieMotionHumanPosture => ({
    root: { x: 2, y: 0.9, z: 3 },
    yaw,
    pitch: 4,
    roll: -2,
    joints: { leftLowerLeg: [10, 0, 0] },
    limbs: {},
  });
  const offset: IAutoMovieVector3 = { x: 0.3, y: 0.1, z: 0.5 };

  // 1. Heading 0: the frames agree.
  const straight: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanRoot.place(
    posture(0),
    { point: offset, yaw: 15 },
  );
  TestValidator.predicate(
    "heading 0 moves by the offset itself",
    vclose(straight.root, { x: 2.3, y: 1, z: 3.5 }, ROUNDING_ROOT_PLACE) &&
      straight.yaw === 15,
  );

  // 2. Heading 90: forward to +X, left to -Z.
  const turned: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanRoot.place(
    posture(90),
    { point: offset, yaw: 15 },
  );
  TestValidator.predicate(
    "heading 90 rotates the offset a quarter turn about +Y",
    vclose(
      turned.root,
      { x: 2 + 0.5, y: 1, z: 3 - 0.3 },
      ROUNDING_ROOT_PLACE,
    ) && nclose(turned.yaw, 105, ROUNDING_ROOT_PLACE),
  );

  // 3. A zero offset.
  const still: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanRoot.place(
    posture(90),
    { point: { x: 0, y: 0, z: 0 }, yaw: 0 },
  );
  TestValidator.predicate(
    "a zero offset keeps the root and heading",
    vclose(still.root, posture(90).root, ROUNDING_ROOT_PLACE) &&
      still.yaw === 90,
  );

  // 4. Every other channel passes through.
  TestValidator.equals(
    "pitch, roll, joints and limbs are untouched",
    [turned.pitch, turned.roll, turned.joints, turned.limbs],
    [4, -2, { leftLowerLeg: [10, 0, 0] }, {}],
  );
}

/** Rounding of one product, metres or degrees. */
const ROUNDING_ROOT_SCALE: number = 1e-15;

/**
 * `AutoMovieMotionHumanRoot.scale` takes a share of a root displacement: the
 * move's three components and the turn, each multiplied by the share.
 *
 * Scenarios:
 *
 * 1. Share 0 gives no move and no turn.
 * 2. Share 1 gives the displacement itself.
 * 3. Share 0.25 gives a quarter of every component and of the turn, so a function
 *    that scaled only the move or only the turn fails.
 * 4. The input displacement is left as it was.
 */
function scenario_test_motions_compose_root_scale(): void {
  const offset: IAutoMovieMotionHumanRoot.IOffset = {
    point: { x: 0.4, y: -0.8, z: 2 },
    yaw: 60,
  };
  const is: (
    share: number,
    expected: IAutoMovieMotionHumanRoot.IOffset,
  ) => boolean = (
    share: number,
    expected: IAutoMovieMotionHumanRoot.IOffset,
  ): boolean => {
    const scaled: IAutoMovieMotionHumanRoot.IOffset =
      AutoMovieMotionHumanRoot.scale(offset, share);
    return (
      vclose(scaled.point, expected.point, ROUNDING_ROOT_SCALE) &&
      nclose(scaled.yaw, expected.yaw, ROUNDING_ROOT_SCALE)
    );
  };

  TestValidator.predicate(
    "share 0",
    is(0, { point: { x: 0, y: 0, z: 0 }, yaw: 0 }),
  );
  TestValidator.predicate("share 1", is(1, offset));
  TestValidator.predicate(
    "share 0.25",
    is(0.25, { point: { x: 0.1, y: -0.2, z: 0.5 }, yaw: 15 }),
  );
  TestValidator.predicate(
    "the input is unchanged",
    vclose(offset.point, { x: 0.4, y: -0.8, z: 2 }, 0) && offset.yaw === 60,
  );
}

/** Rounding of one rotation, one product and one sum per component, metres. */
const ROUNDING_ROOT_SHIFT: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.shift` moves the root by a displacement in the
 * body's own floor frame on the clock's progress over a window, and holds it
 * there until the action's end.
 *
 * The clock is synthetic and linear (`linearMotionClock`), 2 s with `peak` at 1
 * s, so the progress from `start` to `peak` is the elapsed share of that
 * second. The entry faces heading 90, which carries local forward onto world
 * +X.
 *
 * Scenarios:
 *
 * 1. The primitive runs from the window's first instant to the clock's end.
 * 2. A half-metre forward shift moves the root along world +X by the progress
 *    share: none at 0 s, a quarter metre at 0.5 s, all of it at 1 s.
 * 3. After the window the root holds the whole shift (2 s).
 */
function scenario_test_motions_compose_root_shift(): void {
  const clock: IAutoMovieMotionClock = linearMotionClock(2, [
    { name: "peak", seconds: 1 },
  ]);
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.shift(clock, ["start", "peak"], {
      x: 0,
      y: 0,
      z: 0.5,
    });
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: 3 },
    yaw: 90,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };

  TestValidator.equals(
    "runs from the window's start to the clock's end",
    [primitive.from, primitive.to],
    [0, 2],
  );
  for (const [t, moved] of [
    [0, 0],
    [0.5, 0.25],
    [1, 0.5],
    [2, 0.5],
  ] as const)
    TestValidator.predicate(
      `at ${t} s the root is ${moved} m along world +X`,
      vclose(
        primitive.write(entry, t).root,
        { x: 2 + moved, y: 0, z: 3 },
        ROUNDING_ROOT_SHIFT,
      ),
    );
}

/** Rounding of one rotation and one sum per component, metres. */
const ROUNDING_ROOT_TRAVEL: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.travel` is a root primitive over a window whose
 * write displaces the entry posture by the offset it is given at that second,
 * in the posture's own floor frame.
 *
 * The offset here is a quadratic forward travel, `z = t^2` metres at `t`
 * seconds, so one second gives one metre and two seconds four metres.
 *
 * Scenarios:
 *
 * 1. The primitive claims and reads only the root over the given window.
 * 2. At heading 0 the forward travel moves the root along world +Z.
 * 3. At heading 90 the same travel moves it along world +X, so a write that
 *    ignored the heading fails.
 * 4. At 0 seconds the offset is zero and the root stays.
 */
function scenario_test_motions_compose_root_travel(): void {
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.travel({
      from: 0.5,
      to: 2,
      offset: (seconds: number): IAutoMovieMotionHumanRoot.IOffset => ({
        point: { x: 0, y: 0, z: seconds * seconds },
        yaw: 0,
      }),
    });
  const entry: (yaw: number) => IAutoMovieMotionHumanPosture = (
    yaw: number,
  ): IAutoMovieMotionHumanPosture => ({
    root: { x: 2, y: 0, z: 3 },
    yaw,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });

  // 1. The window and the channels.
  TestValidator.equals(
    "a root primitive over its window",
    [primitive.channels, primitive.reads, primitive.from, primitive.to],
    [["root"], ["root"], 0.5, 2],
  );

  // 2 to 4. The displacement in each heading.
  for (const yaw of [0, 90])
    for (const t of [0, 1, 2]) {
      const forward: number = t * t;
      TestValidator.predicate(
        `heading ${yaw} at ${t} s travels ${forward} m forward`,
        vclose(
          primitive.write(entry(yaw), t).root,
          {
            x: 2 + (yaw === 90 ? forward : 0),
            y: 0,
            z: 3 + (yaw === 0 ? forward : 0),
          },
          ROUNDING_ROOT_TRAVEL,
        ),
      );
    }
}

/**
 * AutoMovieMotionHumanRoot, the root channels a law composes: each one's own
 * scenario below (excursion, face, place, scale, shift and travel).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names six root primitives, their windows, headings, unit-scale endpoints and the remaining carried posture fields.
 * @evidence contracts/development/testing.md#behavioral-verification Builds authored excursion, face, place, scale, shift and travel primitives, then samples their root and heading values over explicit clocks or at fixed weights.
 * @evidence contracts/development/testing.md#independent-expectations The quarter-metre excursion follows the prescribed weights, and a 90-degree heading maps local +Z to world +X. Scaling the offset by one quarter gives point (0.1, -0.2, 0.5) and yaw 15. Explicit samples of shift and travel provide world-position expectations.
 */
export function test_motions_compose_root(): void {
  scenario_test_motions_compose_root_excursion();
  scenario_test_motions_compose_root_face();
  scenario_test_motions_compose_root_place();
  scenario_test_motions_compose_root_scale();
  scenario_test_motions_compose_root_shift();
  scenario_test_motions_compose_root_travel();
}
