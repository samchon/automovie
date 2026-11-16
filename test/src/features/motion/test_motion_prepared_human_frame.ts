import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanFrame } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/vclose";

/**
 * Prepared person-frame transforms distinguish copied fixed geometry from
 * each current point/origin and return independent mutable vectors.
 *
 * Scenarios:
 * 1. At headings0,90,-90,180 and30 degrees, literal rotated coordinates
 *    specify forward points, inverse points and translation-free directions.
 *    The oblique case uses cos30=sqrt(3)/2 and sin30=1/2.
 * 2. Editing the source frame's three origin coordinates and heading leaves
 *    the prepared frame unchanged, while the ordinary public point reader
 *    observes that edited frame. A supplied current origin changes only that
 *    point's translation and cannot replace the prepared inverse origin.
 * 3. A fixed-point preparation copies its local numeric inputs, while the
 *    frame preparation still reads every current local point. Earlier point,
 *    inverse and direction output edits cannot affect repeated A/B/A reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines local left/up/forward metre coordinates, cardinal/oblique reference geometry, fixed frame versus fixed point ownership, live origin override and three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public HumanFrame.prepare/preparePoint and the ordinary point reader, checks literal rigid coordinates and inverse, then mutates owned source/output records and supplies different point/origin inputs to distinguish snapshot reuse from stale answers or borrowed output.
 * @evidence contracts/development/testing.md#independent-expectations Right-handed Y quarter turns map(x,y,z) to(z,y,-x); half turns negate x/z and negative quarter turns map to(-z,y,x). The30-degree unit-circle values give the oblique literal vector. Translation adds the independent origin and the transpose reverses rotation; all comparisons allow1e-12m for trigonometric binary64 roundoff without using the cold transform as an oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers zero/positive/negative/half/oblique headings, forward/inverse/direction, live versus copied source, moving-origin override versus fixed inverse origin, fixed versus changing local points and independent mutable outputs. Actual Human contact/fitting and nonfinite admission retain their owning units.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable coordinate unit owns literal finite frames/vectors and invokes only existing public transform APIs. It introduces no body imitation, internal import, test-only export, foreign replacement, renderer, process or compiler.
 */
export function test_motion_prepared_human_frame(): void {
  for (const [yaw, direction] of [
    [0, { x: 2, y: -4, z: 7 }], [90, { x: 7, y: -4, z: -2 }],
    [-90, { x: -7, y: -4, z: 2 }], [180, { x: -2, y: -4, z: -7 }],
    [30, { x: Math.sqrt(3) + 3.5, y: -4, z: -1 + 7 * Math.sqrt(3) / 2 }],
  ] as const) {
    const local: IAutoMovieVector3 = { x: 2, y: -4, z: 7 };
    const frame: HumanFrame.IFrame = { origin: { x: 3, y: 5, z: -2 }, yaw };
    const prepared: HumanFrame.IPrepared = HumanFrame.prepare(frame);
    const fixed: ReturnType<typeof HumanFrame.preparePoint> = HumanFrame.preparePoint(yaw, local);
    const expected: IAutoMovieVector3 = { x: direction.x + 3, y: 1, z: direction.z - 2 };
    const point: IAutoMovieVector3 = prepared.point(local);
    const inverse: IAutoMovieVector3 = prepared.local(expected);
    const turned: IAutoMovieVector3 = prepared.direction(local);
    TestValidator.predicate(`literal person-frame transforms at heading=${yaw}`,
      vclose(point, expected, 1e-12) && vclose(inverse, local, 1e-12) &&
      vclose(turned, direction, 1e-12) && vclose(fixed(frame.origin), expected, 1e-12),
    );
    frame.origin.x = 100;
    frame.origin.y = 200;
    frame.origin.z = 300;
    frame.yaw = yaw + 180;
    TestValidator.predicate("explicit frame preparation keeps the copied original scalar frame",
      vclose(prepared.point(local), expected, 1e-12) &&
      vclose(prepared.local(expected), local, 1e-12) &&
      vclose(prepared.direction(local), direction, 1e-12),
    );
    TestValidator.predicate("ordinary point conversion still reads the edited current frame",
      vclose(HumanFrame.point(frame, local),
        { x: 100 - direction.x, y: 196, z: 300 - direction.z }, 1e-12),
    );
    const moving: IAutoMovieVector3 = { x: -2, y: 9, z: 4 };
    const moved: IAutoMovieVector3 = { x: direction.x - 2, y: 5, z: direction.z + 4 };
    TestValidator.predicate("current point origin changes only its actual translation",
      vclose(prepared.point(local, moving), moved, 1e-12) &&
      vclose(fixed(moving), moved, 1e-12) && vclose(prepared.local(expected), local, 1e-12),
    );
    point.x = 123;
    inverse.y = 456;
    turned.z = 789;
    const fresh: IAutoMovieVector3 = prepared.point(local);
    TestValidator.predicate("caller output edits do not become prepared transform state",
      vclose(fresh, expected, 1e-12) && fresh !== point && point.x === 123 &&
      inverse.y === 456 && turned.z === 789 &&
      vclose(prepared.local(expected), local, 1e-12) &&
      vclose(prepared.direction(local), direction, 1e-12),
    );
    local.x = 0;
    local.y = 2;
    local.z = 0;
    TestValidator.predicate("fixed point snapshots its old source while frame reads the new current point",
      vclose(fixed(moving), moved, 1e-12) &&
      vclose(prepared.point(local), { x: 3, y: 7, z: -2 }, 1e-12) &&
      vclose(prepared.direction(local), { x: 0, y: 2, z: 0 }, 1e-12),
    );
    TestValidator.predicate("returning to the original coordinates restores only that current answer",
      vclose(prepared.point({ x: 2, y: -4, z: 7 }), expected, 1e-12),
    );
  }
}
