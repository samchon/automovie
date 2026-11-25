import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPropOutcome } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * How far a resting point may stand from its closed form, metres: a speed's
 * square root and a quotient of centimetre values, far above their rounding.
 */
const REST: number = 1e-12;

/**
 * `HumanPropOutcome.drag` reads the quadratic drag a prop's body declares with
 * its mass, and `rest` the point a flight comes to rest at a contact: a body
 * that embeds carried its depth on along its velocity, any other at the
 * contact.
 *
 * Scenarios:
 *
 * 1. A ball declaring a 0.47 drag coefficient over 0.01 m² with its 0.4 kg flies
 *    with them; a body declaring none, or no body, flies without drag.
 * 2. An arrow embedding 5 cm, arriving at (1, 1, 0) at (3, 0, 4) m/s, rests at
 *    (1.03, 1, 0.04): its contact plus 0.05 / 5 of its velocity.
 * 3. At rest, it stays at the contact; a bouncing ball, or a prop with no body,
 *    rests at the contact.
 */
export function test_unit_motions_perform_prop_outcome_rest(): void {
  const frame = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const ball: IAutoMovieMotionHumanProp = {
    subject: "ball",
    frame,
    points: {},
    body: {
      mass: 0.4,
      centerOfMass: null,
      friction: 0.5,
      restitution: 0.6,
      drag: { coefficient: 0.47, area: 0.01 },
    },
    shapes: [
      { id: "ball", kind: "sphere", radius: 0.1, material: "rubber", transform: frame },
    ],
  };
  const arrow: IAutoMovieMotionHumanProp = {
    subject: "arrow",
    frame,
    points: {},
    body: { mass: 0.02, centerOfMass: null, contact: { embed: 0.05 } },
  };
  const bare: IAutoMovieMotionHumanProp = { subject: "rock", frame, points: {} };

  // 1. Drag.
  TestValidator.equals("a declared drag", HumanPropOutcome.drag(ball), {
    coefficient: 0.47,
    area: 0.01,
    mass: 0.4,
  });
  TestValidator.predicate(
    "no declared drag",
    HumanPropOutcome.drag(arrow) === undefined &&
      HumanPropOutcome.drag(bare) === undefined,
  );

  // 2. Embedded.
  const contact: IAutoMovieVector3 = { x: 1, y: 1, z: 0 };
  const state = (velocity: IAutoMovieVector3) => ({
    position: contact,
    velocity,
  });
  const ground: IAutoMovieMotionHumanPropFlight.Struck = { kind: "ground" };
  TestValidator.predicate(
    "an embedded arrow",
    near(
      HumanPropOutcome.rest(arrow, ground, state({ x: 3, y: 0, z: 4 })),
      { x: 1.03, y: 1, z: 0.04 },
    ),
  );

  // 3. At the contact.
  TestValidator.predicate(
    "resting at the contact",
    HumanPropOutcome.rest(arrow, ground, state({ x: 0, y: 0, z: 0 })) ===
      contact &&
      HumanPropOutcome.rest(ball, ground, state({ x: 3, y: 0, z: 4 })) ===
        contact &&
      HumanPropOutcome.rest(bare, ground, state({ x: 3, y: 0, z: 4 })) ===
        contact,
  );
}

/** Whether two points agree within the rest bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= REST &&
    Math.abs(a.y - b.y) <= REST &&
    Math.abs(a.z - b.z) <= REST
  );
}
