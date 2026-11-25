import type {
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanObstacle,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObstacle } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { testAffordance } from "../../../internal/fixtures/testAffordance";

/**
 * How far a placed corner, opening or height may stand from its closed form,
 * metres: a quarter turn of decimetre offsets, far above its rounding.
 */
const PLACE: number = 1e-12;

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/**
 * `HumanObstacle.apertures` places an object's openings, and `object` makes a
 * placed object an obstacle from its colliders: the floor-plan hull of their
 * outlines, their least and greatest heights, and its openings.
 *
 * Scenarios:
 *
 * 1. An `aperture` 0.9 m wide and 2 m high at (0, 1, 0) on an object at (1, 0, 0)
 *    turned 90 degrees opens at (1, 1, 0) across `-Z`; an aperture without a
 *    width or a height, another kind of affordance, and an aperture whose
 *    width runs straight up are not openings.
 * 2. A 1 × 0.8 × 0.5 m box standing on the floor at (2, 0, 0) covers the
 *    rectangle from (1.5, -0.25) to (2.5, 0.25), from 0 to 0.8 m; turned 90
 *    degrees it covers (1.75, -0.5) to (2.25, 0.5).
 * 3. A ball of 0.1 m covers the regular 23-gon whose edges touch its disc: every
 *    corner lies between 0.1 and 0.101 m from its centre, the most sides need
 *    for corners within `ROUND`, π / acos(0.1 / 0.101) rounded up.
 * 4. A capsule covers the hull of its two end discs: its corners reach its end
 *    centres' radius along its length.
 * 5. An object with openings carries them.
 * 6. An object without colliders, or with colliders that cover no area of the
 *    floor plan, is refused.
 */
export function test_unit_motions_perform_obstacle_object(): void {
  // 1. Openings.
  const wall: IAutoMovieMotionHumanObject.IModel = {
    affordances: [
      testAffordance("door", "aperture", P(0, 1, 0), IDENTITY, {
        width: 0.9,
        height: 2,
      }),
      testAffordance("hatch", "aperture", P(0, 2, 0), IDENTITY, { width: 1 }),
      testAffordance("knob", "knob", P(0, 1, 0), IDENTITY, {
        width: 0.1,
        height: 0.1,
      }),
      testAffordance(
        "chute",
        "aperture",
        P(0, 1, 0),
        { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
        { width: 0.5, height: 0.5 },
      ),
    ],
  };
  const openings = HumanObstacle.apertures(wall, { at: P(1, 0, 0), yaw: 90 });
  TestValidator.predicate(
    "placed openings",
    openings.length === 1 &&
      openings[0]!.id === "door" &&
      near(openings[0]!.at, P(1, 1, 0)) &&
      near(openings[0]!.across, P(0, 0, -1)) &&
      openings[0]!.width === 0.9 &&
      openings[0]!.height === 2,
  );

  // 2. A box.
  const box: IAutoMoviePhysicalShape = {
    id: "body",
    material: "wood",
    kind: "box",
    halfExtents: P(0.5, 0.4, 0.25),
    transform: { position: P(0, 0.4, 0), rotation: IDENTITY },
  };
  const crate = (yaw: number): IAutoMovieMotionHumanObstacle =>
    HumanObstacle.object("crate", { shapes: () => [box] }, {
      at: P(2, 0, 0),
      yaw,
    });
  TestValidator.predicate(
    "a box's footprint",
    rectangle(crate(0), 1.5, 2.5, -0.25, 0.25) &&
      Math.abs(crate(0).bottom) <= PLACE &&
      Math.abs(crate(0).top - 0.8) <= PLACE &&
      crate(0).apertures === undefined &&
      rectangle(crate(90), 1.75, 2.25, -0.5, 0.5),
  );

  // 3. A ball.
  const ball = HumanObstacle.object(
    "ball",
    {
      shapes: () => [
        {
          id: "ball",
          material: "rubber",
          kind: "sphere",
          radius: 0.1,
          transform: { position: P(0, 0.1, 0), rotation: IDENTITY },
        },
      ],
    },
    { at: P(0, 0, 0), yaw: 0 },
  );
  const sides: number = Math.ceil(
    Math.PI / Math.acos(0.1 / (0.1 + HumanObstacle.ROUND)),
  );
  TestValidator.predicate(
    "a ball's tangent polygon",
    sides === 23 &&
      ball.footprint.length === sides &&
      ball.footprint.every((corner: IAutoMovieVector3): boolean => {
        const r: number = Math.hypot(corner.x, corner.z);
        return r >= 0.1 - PLACE && r <= 0.1 + HumanObstacle.ROUND + PLACE;
      }) &&
      Math.abs(ball.top - 0.2) <= PLACE,
  );

  // 4. A capsule lying along `+X`.
  const capsule = HumanObstacle.object(
    "log",
    {
      shapes: () => [
        {
          id: "log",
          material: "wood",
          kind: "capsule",
          radius: 0.1,
          halfLength: 0.5,
          transform: {
            position: P(0, 0.1, 0),
            rotation: { x: 0, y: 0, z: -Math.SQRT1_2, w: Math.SQRT1_2 },
          },
        },
      ],
    },
    { at: P(0, 0, 0), yaw: 0 },
  );
  const xs: number[] = capsule.footprint.map((p) => p.x);
  TestValidator.predicate(
    "a capsule's hull",
    Math.max(...xs) >= 0.6 - PLACE &&
      Math.max(...xs) <= 0.6 + HumanObstacle.ROUND + PLACE &&
      Math.min(...xs) <= -0.6 + PLACE &&
      capsule.footprint.every(
        (p: IAutoMovieVector3): boolean =>
          Math.abs(p.z) <= 0.1 + HumanObstacle.ROUND + PLACE,
      ),
  );

  // 5. Openings carried.
  TestValidator.predicate(
    "an object with openings",
    HumanObstacle.object(
      "frame",
      { ...wall, shapes: () => [box] },
      { at: P(1, 0, 0), yaw: 90 },
    ).apertures?.[0]?.id === "door",
  );

  // 6. Refusals.
  const flat: IAutoMoviePhysicalShape = {
    ...box,
    halfExtents: P(0.5, 0.4, 0),
  };
  TestValidator.predicate(
    "objects that stand nowhere",
    throws(() =>
      HumanObstacle.object("ghost", { shapes: () => [] }, {
        at: P(0, 0, 0),
        yaw: 0,
      }),
    ) &&
      throws(() =>
        HumanObstacle.object("sheet", { shapes: () => [flat] }, {
          at: P(0, 0, 0),
          yaw: 0,
        }),
      ),
  );
}

/** Whether a footprint is the given floor-plan rectangle's four corners. */
function rectangle(
  obstacle: IAutoMovieMotionHumanObstacle,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
): boolean {
  const corners: IAutoMovieVector3[] = [
    P(x0, 0, z0),
    P(x1, 0, z0),
    P(x1, 0, z1),
    P(x0, 0, z1),
  ];
  return (
    obstacle.footprint.length === 4 &&
    corners.every((corner) =>
      obstacle.footprint.some((p: IAutoMovieVector3): boolean =>
        near(p, corner),
      ),
    )
  );
}

/** Whether two points agree within the placement bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= PLACE &&
    Math.abs(a.y - b.y) <= PLACE &&
    Math.abs(a.z - b.z) <= PLACE
  );
}

/** Whether a task throws. */
function throws(task: () => unknown): boolean {
  try {
    task();
    return false;
  } catch {
    return true;
  }
}
