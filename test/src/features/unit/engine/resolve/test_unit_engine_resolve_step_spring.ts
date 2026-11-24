import { Matrix4, createSpringState, stepSpring } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieSpringDriver,
  IAutoMovieSpringState,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of one normalization. */
const ROUNDING: number = 1e-12;

/** The identity orientation. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A world matrix at a place. */
const at: (position: IAutoMovieVector3) => number[] = (
  position: IAutoMovieVector3,
): number[] => Matrix4.compose(position, IDENTITY, { x: 1, y: 1, z: 1 });

/** A pendulum: root "a" at the origin and joint "b" one metre below it. */
const world: () => Map<string, number[]> = (): Map<string, number[]> =>
  new Map([
    ["a", at({ x: 0, y: 0, z: 0 })],
    ["b", at({ x: 0, y: -1, z: 0 })],
  ]);

/** The local transform of the joint, one metre below its parent. */
const LOCAL: Map<string, IAutoMovieTransform> = new Map([
  [
    "b",
    {
      translation: { x: 0, y: -1, z: 0 },
      rotation: IDENTITY,
      scale: { x: 1, y: 1, z: 1 },
    },
  ],
]);

/** A spring driver with no pull, no drag and no gravity unless given. */
const driver: (
  change: Partial<IAutoMovieSpringDriver>,
) => IAutoMovieSpringDriver = (
  change: Partial<IAutoMovieSpringDriver>,
): IAutoMovieSpringDriver => ({
  type: "spring",
  chain: ["a", "b"],
  stiffness: 0,
  drag: 0,
  gravityPower: 0,
  gravityDir: { x: 1, y: 0, z: 0 },
  hitRadius: 0.1,
  center: null,
  ...change,
});

/**
 * `stepSpring` advances a chain of spring joints by one Verlet step: inertia
 * from the previous place, gravity, a stiffness pull to the rest place, then a
 * hard bone-length constraint and the collider push-out.
 *
 * Scenarios, on a joint one metre below its parent at rest:
 *
 * 1. With no gravity and no stiffness it stays: (0, -1, 0).
 * 2. Gravity power 1 along +X over a step of 1 s moves it to (1, -1, 0), which the
 *    length constraint turns to (sin 45, -cos 45, 0).
 * 3. Add stiffness 0.5: the pull to rest (0, -1, 0) halves the gravity offset to
 *    (0.5, -1, 0), and the constraint gives (1, -2, 0) / sqrt(5).
 * 4. The joint records its previous place, and the world matrix its new one.
 * 5. A sphere of radius 0.4 centred at (0, -1, 0) with the joint's hit radius 0.1
 *    pushes that place out to 0.5 from the centre, along the direction from
 *    it.
 */
export function test_unit_engine_resolve_step_spring(): void {
  const rest: IAutoMovieSpringState = createSpringState();
  const still: Map<string, number[]> = world();
  stepSpring(driver({}), still, rest, 1, LOCAL);
  TestValidator.predicate(
    "no gravity, no pull",
    vclose(Matrix4.position(still.get("b")!), { x: 0, y: -1, z: 0 }, ROUNDING),
  );
  const swung: Map<string, number[]> = world();
  const state: IAutoMovieSpringState = createSpringState();
  stepSpring(driver({ gravityPower: 1 }), swung, state, 1, LOCAL);
  TestValidator.predicate(
    "gravity along X",
    vclose(
      Matrix4.position(swung.get("b")!),
      { x: Math.SQRT1_2, y: -Math.SQRT1_2, z: 0 },
      ROUNDING,
    ),
  );
  const pulled: Map<string, number[]> = world();
  const pulledState: IAutoMovieSpringState = createSpringState();
  stepSpring(
    driver({ gravityPower: 1, stiffness: 0.5 }),
    pulled,
    pulledState,
    1,
    LOCAL,
  );
  const root5: number = Math.sqrt(5);
  TestValidator.predicate(
    "gravity against a stiffness pull",
    vclose(
      Matrix4.position(pulled.get("b")!),
      { x: 1 / root5, y: -2 / root5, z: 0 },
      ROUNDING,
    ) &&
      vclose(pulledState.prev.get("b")!, { x: 0, y: -1, z: 0 }, ROUNDING) &&
      vclose(
        pulledState.sprung.get("b")!,
        { x: 1 / root5, y: -2 / root5, z: 0 },
        ROUNDING,
      ),
  );
  const hit: Map<string, number[]> = world();
  stepSpring(
    driver({ gravityPower: 1, stiffness: 0.5 }),
    hit,
    createSpringState(),
    1,
    LOCAL,
    [{ center: { x: 0, y: -1, z: 0 }, radius: 0.4 }],
  );
  const place: IAutoMovieVector3 = Matrix4.position(hit.get("b")!);
  TestValidator.predicate(
    "pushed out to the surface of the sphere",
    nclose(Math.hypot(place.x, place.y + 1, place.z), 0.5, ROUNDING) &&
      place.x > 0,
  );
}
