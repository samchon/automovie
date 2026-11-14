import type {
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanTouchForm } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The touch kinds' table, the length of one repetition and the tangent of a
 * region: what tells a tap from a rub and which way a stroke runs on a
 * surface.
 *
 * Scenarios:
 * 1. The table: a tap and a pat leave the surface and do not travel, the pat
 *    higher; a stroke, a rub and a scratch travel and do not lift; a press,
 *    a squeeze and a hold do neither; only the squeeze and the scratch curl
 *    the fingers; only the stroke has a speed, inside the pleasant-touch
 *    range of 1 to 10 cm/s (Loken et al. 2009).
 * 2. A stroke's repetition on a 190 mm hand: a sine of the table's
 *    amplitude with the returned period, differentiated numerically over a
 *    thousand steps, peaks at the table's 5 cm/s within 0.1 %; the period is
 *    twice as long on a hand twice as long and ignores the span's seconds.
 * 3. Every other kind's repetition is the span's seconds, whatever the hand.
 * 4. On a chest facing +Z of a performer heading +Z, `up` is +Y and `across`
 *    runs toward the body's other side: the performer's left, +X, for the
 *    right hand and their right, -X, for the left hand, so a left-hand
 *    stroke mirrors a right-hand one. The normal's length does not matter.
 * 5. On a surface leaning back by 30 degrees, normal `(0, sin 30, cos 30)`,
 *    `up` is the steepest ascent `(0, cos 30, -sin 30)`.
 * 6. On a surface facing up, `up` is the performer's heading for either
 *    hand: +Z heading 0, +X heading 90 degrees; `across` is their left for
 *    the right hand, +X heading 0 and -Z heading 90 degrees, and their right
 *    for the left hand, -X and +Z.
 * 7. On a surface facing the performer's left, `across` is their heading.
 * 8. The boundary: a normal 18 degrees off the world's up toward +Z has an
 *    upward part of `sin 18 = 0.309` across it, so `up` is the ascent
 *    `(0, sin 18, -cos 18)`; at 17 degrees (`sin 17 = 0.292`) the heading is
 *    taken instead, `(0, -sin 17, cos 17)`.
 * 9. Every tangent returned, over normals around the sphere, four headings,
 *    both names and both hands, is a unit vector perpendicular to the normal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public table, period and tangent; a stroke off its speed, a period that follows the span, a tangent off the surface or a fallback taken on the wrong side of the boundary fails.
 * @evidence contracts/development/testing.md#independent-expectations The peak speed is read by differentiating a sine numerically, the tangents are written from the geometry of each surface, and the range is the cited one.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind, two hand lengths, both acting hands, vertical, leaning and level surfaces, two headings, both sides of the 0.3 boundary and a sweep of the sphere.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on written numbers. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned and lists the 9 scenarios with their numbers.
 */
export function test_motion_compose_touch_form(): void {
  const FORMS = AutoMovieMotionHumanTouchForm.FORMS;
  const kinds: AutoMovieMotionHumanTouchForm.Kind[] = [
    "tap",
    "pat",
    "stroke",
    "rub",
    "press",
    "squeeze",
    "hold",
    "scratch",
  ];
  const near = (a: number, b: number, tolerance: number = 1e-9): boolean =>
    Math.abs(a - b) <= tolerance;
  const same = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    near(a.x, b.x) && near(a.y, b.y) && near(a.z, b.z);
  const rad = (degrees: number): number => (degrees * Math.PI) / 180;

  // 1. the table
  TestValidator.equals("the table has every kind", Object.keys(FORMS), kinds);
  TestValidator.equals(
    "the kinds that leave the surface",
    kinds.filter((k) => FORMS[k].lift > 0),
    ["tap", "pat"],
  );
  TestValidator.equals(
    "the kinds that travel",
    kinds.filter((k) => FORMS[k].travel > 0),
    ["stroke", "rub", "scratch"],
  );
  TestValidator.predicate(
    "a pat lifts higher than a tap",
    FORMS.pat.lift > FORMS.tap.lift,
  );
  TestValidator.equals(
    "the kinds that curl the fingers",
    kinds.filter((k) => FORMS[k].curl > 0),
    ["squeeze", "scratch"],
  );
  TestValidator.equals(
    "the kinds with a speed",
    kinds.filter((k) => FORMS[k].speed !== undefined),
    ["stroke"],
  );
  TestValidator.predicate(
    "a stroke moves at a pleasant-touch speed",
    FORMS.stroke.speed! >= 0.01 && FORMS.stroke.speed! <= 0.1,
  );

  // 2. a stroke's repetition
  const body = (hand: number): { measure: IAutoMovieBodyMeasure } => ({
    measure: { ...MEASURE, hand },
  });
  const period: number = AutoMovieMotionHumanTouchForm.period(
    body(0.19),
    "stroke",
    0.4,
  );
  const amplitude: number = FORMS.stroke.travel * 0.19;
  let peak: number = 0;
  for (let i: number = 0; i < 1000; i++) {
    const at = (step: number): number =>
      amplitude * Math.sin((2 * Math.PI * step) / 1000);
    peak = Math.max(peak, Math.abs(at(i + 1) - at(i)) / (period / 1000));
  }
  TestValidator.predicate(
    "a stroke of the returned period peaks at 5 cm/s",
    near(peak, 0.05, 0.05 * 1e-3),
  );
  TestValidator.predicate(
    "a stroke's period follows the hand's length",
    near(
      AutoMovieMotionHumanTouchForm.period(body(0.38), "stroke", 0.4),
      2 * period,
    ),
  );
  TestValidator.predicate(
    "a stroke's period ignores the span",
    near(AutoMovieMotionHumanTouchForm.period(body(0.19), "stroke", 9), period),
  );

  // 3. every other kind
  for (const kind of kinds.filter((k) => k !== "stroke"))
    for (const hand of [0.16, 0.19, 0.22])
      TestValidator.equals(
        `a ${kind}'s repetition is the span's seconds`,
        AutoMovieMotionHumanTouchForm.period(body(hand), kind, 0.37),
        0.37,
      );

  // 4. a chest
  for (const length of [1, 3]) {
    const chest: IAutoMovieVector3 = { x: 0, y: 0, z: length };
    TestValidator.predicate(
      "up a chest is the world's up",
      same(AutoMovieMotionHumanTouchForm.tangent(chest, 0, "up", "right"), {
        x: 0,
        y: 1,
        z: 0,
      }),
    );
    TestValidator.predicate(
      "across a chest is the performer's left for the right hand",
      same(AutoMovieMotionHumanTouchForm.tangent(chest, 0, "across", "right"), {
        x: 1,
        y: 0,
        z: 0,
      }),
    );
    TestValidator.predicate(
      "across a chest is the performer's right for the left hand",
      same(AutoMovieMotionHumanTouchForm.tangent(chest, 0, "across", "left"), {
        x: -1,
        y: 0,
        z: 0,
      }),
    );
  }

  // 5. a leaning surface
  TestValidator.predicate(
    "up a leaning surface is its steepest ascent",
    same(
      AutoMovieMotionHumanTouchForm.tangent(
        { x: 0, y: Math.sin(rad(30)), z: Math.cos(rad(30)) },
        0,
        "up",
        "right",
      ),
      { x: 0, y: Math.cos(rad(30)), z: -Math.sin(rad(30)) },
    ),
  );

  // 6. a surface facing up
  const top: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  for (const [yaw, tangent, side, expected] of [
    [0, "up", "right", { x: 0, y: 0, z: 1 }],
    [0, "up", "left", { x: 0, y: 0, z: 1 }],
    [90, "up", "right", { x: 1, y: 0, z: 0 }],
    [0, "across", "right", { x: 1, y: 0, z: 0 }],
    [0, "across", "left", { x: -1, y: 0, z: 0 }],
    [90, "across", "right", { x: 0, y: 0, z: -1 }],
    [90, "across", "left", { x: 0, y: 0, z: 1 }],
  ] as const)
    TestValidator.predicate(
      `${tangent} a level surface heading ${yaw} for the ${side} hand`,
      same(
        AutoMovieMotionHumanTouchForm.tangent(top, yaw, tangent, side),
        expected,
      ),
    );

  // 7. a surface facing the performer's left
  TestValidator.predicate(
    "across a surface facing left is the heading",
    same(
      AutoMovieMotionHumanTouchForm.tangent(
        { x: 1, y: 0, z: 0 },
        0,
        "across",
        "right",
      ),
      { x: 0, y: 0, z: 1 },
    ),
  );

  // 8. the boundary
  TestValidator.predicate(
    "18 degrees off level still has an ascent",
    same(
      AutoMovieMotionHumanTouchForm.tangent(
        { x: 0, y: Math.cos(rad(18)), z: Math.sin(rad(18)) },
        0,
        "up",
        "right",
      ),
      { x: 0, y: Math.sin(rad(18)), z: -Math.cos(rad(18)) },
    ),
  );
  TestValidator.predicate(
    "17 degrees off level takes the heading",
    same(
      AutoMovieMotionHumanTouchForm.tangent(
        { x: 0, y: Math.cos(rad(17)), z: Math.sin(rad(17)) },
        0,
        "up",
        "right",
      ),
      { x: 0, y: -Math.sin(rad(17)), z: Math.cos(rad(17)) },
    ),
  );

  // 9. the sweep
  let swept: number = 0;
  let wrong: number = 0;
  for (let polar: number = 0; polar <= 180; polar += 15)
    for (let around: number = 0; around < 360; around += 15)
      for (const yaw of [0, 45, 90, 200])
        for (const tangent of ["up", "across"] as const)
          for (const side of ["right", "left"] as const) {
            const normal: IAutoMovieVector3 = {
              x: Math.sin(rad(polar)) * Math.cos(rad(around)),
              y: Math.cos(rad(polar)),
              z: Math.sin(rad(polar)) * Math.sin(rad(around)),
            };
            const t: IAutoMovieVector3 = AutoMovieMotionHumanTouchForm.tangent(
              normal,
              yaw,
              tangent,
              side,
            );
            swept++;
            if (
              !near(Math.hypot(t.x, t.y, t.z), 1) ||
              !near(t.x * normal.x + t.y * normal.y + t.z * normal.z, 0)
            )
              wrong++;
          }
  TestValidator.equals(
    "the sweep covers the sphere",
    swept,
    13 * 24 * 4 * 2 * 2,
  );
  TestValidator.equals("every tangent lies on its surface", wrong, 0);
}

const MEASURE: IAutoMovieBodyMeasure = {
  stature: 1.756,
  mass: 78.5,
  hipHeight: 0.93,
  hipHalfWidth: 0.09,
  waistHeight: 1.06,
  chestHeight: 1.27,
  neckHeight: 1.5,
  headHeight: 1.6,
  eyeHeight: 1.64,
  headRadius: 0.1,
  shoulderHeight: 1.44,
  shoulderHalfWidth: 0.2,
  upperArm: 0.33,
  forearm: 0.27,
  hand: 0.19,
  thigh: 0.42,
  shank: 0.42,
  ankleHeight: 0.07,
  footLength: 0.27,
  heel: 0.06,
  footBreadth: 0.1,
  chestDepth: 0.24,
  chestBreadth: 0.32,
  upperArmRadius: 0.05,
  forearmRadius: 0.04,
  thighRadius: 0.08,
  shankRadius: 0.055,
};
