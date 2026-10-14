import {
  IAutoMovieSpringDriver,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Matrix4 } from "../../../../packages/engine/src/math/Matrix4";
import { createSpringState } from "../../../../packages/engine/src/resolve/createSpringState";
import { stepSpring } from "../../../../packages/engine/src/resolve/stepSpring";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

const W: (p: IAutoMovieVector3) => number[] = (
  p: IAutoMovieVector3,
): number[] =>
  Matrix4.compose(p, { x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 1, z: 1 });

const trs: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/** Weightless, force-free spring: the joint stays put unless a collider acts. */
const still: IAutoMovieSpringDriver = {
  type: "spring",
  chain: ["root", "j1"],
  stiffness: 0,
  drag: 0,
  gravityPower: 0,
  gravityDir: { x: 0, y: -1, z: 0 },
  hitRadius: 0.05,
  center: null,
};

const local: Map<string, IAutoMovieTransform> = new Map<
  string,
  IAutoMovieTransform
>([["j1", trs(1, 0, 0)]]);

const world: () => Map<string, number[]> = (): Map<string, number[]> =>
  new Map([
    ["root", W({ x: 0, y: 0, z: 0 })],
    ["j1", W({ x: 1, y: 0, z: 0 })],
  ]);

const at: (w: Map<string, number[]>, id: string) => IAutoMovieVector3 = (
  w: Map<string, number[]>,
  id: string,
): IAutoMovieVector3 => Matrix4.position(w.get(id)!);

/**
 * After the length constraint, spring sphere collisions push each joint to sphere radius plus hitRadius in array order, using an upward fallback at a coincident center.
 *
 * Scenarios:
 *
 * 1. A sphere the joint penetrates pushes it out to `radius + hitRadius` along the
 *    center→joint direction.
 * 2. A sphere it does not penetrate leaves the step identical to a collider-free
 *    run (the negative twin).
 * 3. A joint exactly on the sphere center takes the deterministic `+Y` fallback
 *    direction.
 * 4. Colliders apply in array order: a second sphere sees the first push's result.
 * 5. Non-positive and non-finite collider radii and a non-finite center reject
 *    before the integrator reads transforms.
 *
 * @evidence contracts/testing.md#behavioral-verification Steps actual force-free springs against authored spheres and checks pushout, unchanged nonpenetration, center-coincident upward fallback, sequential ordering and malformed collider refusals.
 * @evidence contracts/testing.md#independent-expectations Inflated radius is sphere radius plus hitRadius0.05, yielding1.25 or0.35 offsets; a second center at the first pushout produces the next0.25 upward displacement. These literal geometries independently fix the expected coordinates.
 * @evidence contracts/testing.md#distinguishing-cases Penetrating/nonpenetrating/center-coincident and ordered two-sphere neighbors accompany zero/negative/NaN radius and nonfinite center cases; collision projection may stretch the earlier length constraint and is not a general nonpenetration/convergence proof.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_spring_collision entry directly runs portable synchronous numeric spring/collider semantics on existing scene-node fixtures, without simulating new Human geometry or observing GPU contact.
 */
export function test_resolve_spring_collision(): void {
  // 1. push-out: sphere at the parent, min distance 1.2 + 0.05
  const w1: Map<string, number[]> = world();
  stepSpring(still, w1, createSpringState(), 1 / 60, local, [
    { center: { x: 0, y: 0, z: 0 }, radius: 1.2 },
  ]);
  TestValidator.predicate(
    "penetrated sphere pushes to surface + hitRadius",
    vclose(at(w1, "j1"), { x: 1.25, y: 0, z: 0 }, 1e-9),
  );

  // 2. negative twin: sphere too small to touch
  const w2: Map<string, number[]> = world();
  stepSpring(still, w2, createSpringState(), 1 / 60, local, [
    { center: { x: 0, y: 0, z: 0 }, radius: 0.5 },
  ]);
  TestValidator.predicate(
    "non-penetrated sphere leaves the joint at rest",
    vclose(at(w2, "j1"), { x: 1, y: 0, z: 0 }, 1e-9),
  );

  // 3. joint exactly on the center → deterministic +Y fallback
  const w3: Map<string, number[]> = world();
  stepSpring(still, w3, createSpringState(), 1 / 60, local, [
    { center: { x: 1, y: 0, z: 0 }, radius: 0.3 },
  ]);
  TestValidator.predicate(
    "center-coincident joint escapes along +Y",
    vclose(at(w3, "j1"), { x: 1, y: 0.35, z: 0 }, 1e-9),
  );

  // 4. array order: the second sphere sees the first push's result
  const w4: Map<string, number[]> = world();
  stepSpring(still, w4, createSpringState(), 1 / 60, local, [
    { center: { x: 1, y: 0, z: 0 }, radius: 0.3 },
    { center: { x: 1, y: 0.35, z: 0 }, radius: 0.2 },
  ]);
  TestValidator.predicate(
    "sequential spheres compound in order",
    vclose(at(w4, "j1"), { x: 1, y: 0.6, z: 0 }, 1e-9),
  );

  // 5. guards
  const invalid: (
    title: string,
    collider: { center: IAutoMovieVector3; radius: number },
    expected: string | string[],
  ) => void = (
    title: string,
    collider: { center: IAutoMovieVector3; radius: number },
    expected: string | string[],
  ): void =>
    TestValidator.predicate(
      title,
      throwsError(
        (): void =>
          stepSpring(still, world(), createSpringState(), 1 / 60, local, [
            collider,
          ]),
        expected,
      ),
    );
  invalid(
    "zero collider radius rejects",
    { center: { x: 0, y: 0, z: 0 }, radius: 0 },
    ["colliders[0].radius", "> 0"],
  );
  invalid(
    "negative collider radius rejects",
    { center: { x: 0, y: 0, z: 0 }, radius: -1 },
    ["colliders[0].radius", "> 0", "-1"],
  );
  invalid(
    "NaN collider radius rejects",
    { center: { x: 0, y: 0, z: 0 }, radius: Number.NaN },
    ["colliders[0].radius", "finite", "NaN"],
  );
  invalid(
    "non-finite collider center rejects",
    { center: { x: Number.NaN, y: 0, z: 0 }, radius: 1 },
    ["colliders[0].center.x", "finite", "NaN"],
  );
}
