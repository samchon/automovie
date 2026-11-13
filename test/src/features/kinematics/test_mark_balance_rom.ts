import {
  type IAutoMovieMark,
  markAutoMovieBalance,
  markAutoMovieRomOvershoot,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A body's balance becomes a centre point flagged outside its base of support and the base's outline, and joints past their range of motion become flagged points.
 *
 * Scenarios:
 *
 * 1. A centre above the middle of a one-metre square of four support points is an unflagged `com` point, and the base is a closed `support` polyline through the four corners.
 * 2. A centre 0.2 m outside that square is flagged; a centre on its edge is not.
 * 3. One support point is drawn as a point and two as a segment; no support point is refused.
 * 4. Of three joints with overshoots of 0, 4 and Infinity degrees, the last two become flagged `rom` points at their positions and the first draws nothing; a negative or NaN overshoot and a non-finite position are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the two engine producers on centres, supports and joint entries the test writes and reads the returned marks' kinds, paths, shapes and flags.
 * @evidence contracts/development/testing.md#independent-expectations Inside and outside are decided by hand from the square's authored corners, the hull of four corners is those corners, and the marked joints follow from the documented rule that a positive or unmeasurable overshoot is marked.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a centre inside, on the edge of and outside the base, one, two and four support points, and zero, finite and unmeasurable overshoots against refused ones. The margin and overshoot measures themselves belong to their own tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit writes its own inputs and starts no solver, browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A centre above the middle of a one-metre square of four support points is an unflagged com point).
 */
export function test_mark_balance_rom(): void {
  const square = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 0, z: 1 },
    { x: 0, y: 0, z: 1 },
  ];

  // 1. Inside.
  const inside: IAutoMovieMark[] = markAutoMovieBalance({
    path: "hero",
    centre: { x: 0.5, y: 1, z: 0.5 },
    support: square,
  });
  TestValidator.equals(
    "an unflagged centre and a closed base",
    inside.map((mark: IAutoMovieMark) => [
      mark.path,
      mark.kind,
      mark.flagged,
      mark.shape.type,
    ]),
    [
      ["hero/com", "com", false, "points"],
      ["hero/support", "support", false, "polyline"],
    ],
  );
  const base: IAutoMovieMark.IPolyline = inside[1]!
    .shape as IAutoMovieMark.IPolyline;
  const corners: string[] = [];
  for (let i: number = 0; i < base.points.length; i += 3)
    corners.push(
      `${base.points[i]},${base.points[i + 1]},${base.points[i + 2]}`,
    );
  TestValidator.equals(
    "the base runs through the four corners",
    [
      base.closed,
      [...corners].sort((a: string, b: string): number => a.localeCompare(b)),
    ],
    [true, ["0,0,0", "0,0,1", "1,0,0", "1,0,1"]],
  );

  // 2. Outside and on the edge.
  TestValidator.equals(
    "outside is flagged, the edge is not",
    [
      markAutoMovieBalance({
        path: "hero",
        centre: { x: 1.2, y: 1, z: 0.5 },
        support: square,
      })[0]!.flagged,
      markAutoMovieBalance({
        path: "hero",
        centre: { x: 1, y: 1, z: 0.5 },
        support: square,
      })[0]!.flagged,
    ],
    [true, false],
  );

  // 3. Small supports.
  TestValidator.equals(
    "one support point is a point and two a segment",
    [
      markAutoMovieBalance({
        path: "hero",
        centre: { x: 0, y: 1, z: 0 },
        support: [square[0]!],
      })[1]!.shape.type,
      markAutoMovieBalance({
        path: "hero",
        centre: { x: 0, y: 1, z: 0 },
        support: square.slice(0, 2),
      })[1]!.shape.type,
    ],
    ["points", "segments"],
  );
  TestValidator.error("no support point is refused", (): void => {
    markAutoMovieBalance({
      path: "hero",
      centre: { x: 0, y: 1, z: 0 },
      support: [],
    });
  });

  // 4. Range overshoot.
  const rom: IAutoMovieMark[] = markAutoMovieRomOvershoot([
    { path: "hero/leftKnee", at: { x: 0, y: 0.5, z: 0 }, overshoot: 0 },
    { path: "hero/rightKnee", at: { x: 0.2, y: 0.5, z: 0 }, overshoot: 4 },
    {
      path: "hero/neck",
      at: { x: 0, y: 1.5, z: 0 },
      overshoot: Number.POSITIVE_INFINITY,
    },
  ]);
  TestValidator.equals(
    "joints past their range are flagged points",
    rom.map((mark: IAutoMovieMark) => [
      mark.path,
      mark.kind,
      mark.flagged,
      mark.shape,
    ]),
    [
      [
        "hero/rightKnee/rom",
        "rom",
        true,
        { type: "points", points: [0.2, 0.5, 0] },
      ],
      ["hero/neck/rom", "rom", true, { type: "points", points: [0, 1.5, 0] }],
    ],
  );
  for (const [title, entry] of [
    [
      "a negative overshoot",
      { path: "j", at: { x: 0, y: 0, z: 0 }, overshoot: -1 },
    ],
    [
      "a NaN overshoot",
      { path: "j", at: { x: 0, y: 0, z: 0 }, overshoot: Number.NaN },
    ],
    [
      "a non-finite position",
      { path: "j", at: { x: Number.NaN, y: 0, z: 0 }, overshoot: 1 },
    ],
  ] as const)
    TestValidator.error(`${title} is refused`, (): void => {
      markAutoMovieRomOvershoot([entry]);
    });
}
