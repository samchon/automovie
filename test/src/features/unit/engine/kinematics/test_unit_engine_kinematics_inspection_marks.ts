import {
  markAutoMovieBalance,
  markAutoMovieRomOvershoot,
} from "@automovie/engine";
import type { IAutoMovieMark } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * Kinematic inspection marks: `markAutoMovieRomOvershoot(entries)` flags each
 * joint past its range at `<path>/rom`; `markAutoMovieBalance(props)` draws the
 * centre at `<path>/com`, flagged when it lies outside the base of support, and
 * that base, the XZ convex hull of the support points, at `<path>/support`.
 *
 * Scenarios:
 *
 * 1. Overshoots 0, 5 and Infinity: marks for the second and third only, kind
 *    "rom", label "range overshoot", colour 0x556b2f, flagged, at the joint.
 * 2. Overshoots -1 and NaN are refused.
 * 3. Support on (0,0,0), (1,0,0), (0,0,1) and a fourth point inside: the base is a
 *    closed polyline of the three hull points; the centre (0.2, 1, 0.2) is
 *    unflagged, (2, 1, 2) flagged.
 * 4. One support point draws a point and two a segment; none is refused.
 */
export function test_unit_engine_kinematics_inspection_marks(): void {
  const at = { x: 1, y: 2, z: 3 };

  // 1.
  const marks: IAutoMovieMark[] = markAutoMovieRomOvershoot([
    { path: "a", at, overshoot: 0 },
    { path: "b", at, overshoot: 5 },
    { path: "c", at, overshoot: Infinity },
  ]);
  TestValidator.equals(
    "paths",
    marks.map((m: IAutoMovieMark): string => m.path),
    ["b/rom", "c/rom"],
  );
  TestValidator.equals("mark", marks[0], {
    path: "b/rom",
    kind: "rom",
    label: "range overshoot",
    color: 0x556b2f,
    shape: { type: "points", points: [1, 2, 3] },
    flagged: true,
    anchor: null,
  });

  // 2.
  for (const overshoot of [-1, NaN])
    TestValidator.predicate(
      `${overshoot}`,
      throwsError(
        (): unknown =>
          markAutoMovieRomOvershoot([{ path: "a", at, overshoot }]),
        "markAutoMovieRomOvershoot",
      ),
    );

  // 3.
  const support = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0.1, y: 0, z: 0.1 },
  ];
  const inside: IAutoMovieMark[] = markAutoMovieBalance({
    path: "body",
    centre: { x: 0.2, y: 1, z: 0.2 },
    support,
  });
  TestValidator.equals(
    "com",
    [inside[0]!.path, inside[0]!.kind, inside[0]!.color, inside[0]!.flagged],
    ["body/com", "com", 0x6b8e23, false],
  );
  const base = inside[1]!.shape;
  TestValidator.predicate(
    "base",
    inside[1]!.path === "body/support" &&
      base.type === "polyline" &&
      base.closed === true &&
      base.points.length === 9,
  );
  TestValidator.equals(
    "outside",
    markAutoMovieBalance({
      path: "body",
      centre: { x: 2, y: 1, z: 2 },
      support,
    })[0]!.flagged,
    true,
  );

  // 4.
  TestValidator.equals(
    "one and two",
    [
      markAutoMovieBalance({
        path: "b",
        centre: at,
        support: support.slice(0, 1),
      })[1]!.shape.type,
      markAutoMovieBalance({
        path: "b",
        centre: at,
        support: support.slice(0, 2),
      })[1]!.shape.type,
    ],
    ["points", "segments"],
  );
  TestValidator.predicate(
    "none",
    throwsError(
      (): unknown =>
        markAutoMovieBalance({ path: "b", centre: at, support: [] }),
      "no support point",
    ),
  );
}
