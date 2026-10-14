import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftCollider,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { simulateSoftBody, validateSoftBodyDomain } from "@automovie/engine";

import { hasViolation, namedFacts, nclose } from "../internal/predicates";
import { softPanel } from "../internal/softFixtures";

/** An unanchored strip dropped straight onto the declared colliders. */
const dropped: (
  colliders: IAutoMovieSoftCollider[],
) => IAutoMovieSoftBodyDomain = (
  colliders: IAutoMovieSoftCollider[],
): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns: 1,
    rows: 2,
    spacing: { u: 0.25, v: 0.25 },
    overrides: {
      id: "dropper",
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: { x: 0, y: -8, z: 0 },
        drag: 0,
        iterations: 2,
        stiffness: { structural: 1, shear: 1, bend: 1 },
        referenceSpeed: 4,
        maxSteps: 512,
      },
      colliders,
    },
  });

/** Verify discrete static plane, sphere and box contact geometry and reported coordinate-change counts.
 *
 * Scenarios:
 *
 * 1. A half-space with a **non-unit** normal `(0, 2, 0)` and offset `−0.5` holds
 *    the strip at exactly `y = −0.5`: the normal is normalized rather than used
 *    as a scale, and the final contact count is one for the lower particle.
 * 2. A tilted half-space is escaped along its own normal, not along `y`: the
 *    resting particle satisfies `n̂ · p = offset` to within a rounding
 *    tolerance while both of its coordinates moved.
 * 3. A ball projects the particle to exactly its radius from the centre.
 * 4. A particle exactly at a ball's centre has no radius to escape along and is
 *    stated to leave upward, at exactly `centre.y + radius`, rather than
 *    dividing by zero. The same authored panel is refused by the validator,
 *    which is why the case is degenerate rather than ordinary.
 * 5. A box is escaped by its least-penetrated face, on either side of it: a strip
 *    falling onto a crate leaves through the crate's top, a strip pressed
 *    upward against a beam leaves through the beam's underside rather than
 *    being pushed out the far side, and a strip that is nowhere near the box is
 *    not touched at all and reports zero contacts.

 *
 * @evidence contracts/testing.md#behavioral-verification Solver positions and final-step contact counts expose changed analytic escape, centre fallback or least-face policy; the untouched distant box distinguishes real projection from unconditional clamping, without tracing every intermediate contact or independently isolating collider order.
 * @evidence contracts/testing.md#independent-expectations Normalized plane equations, authored sphere radius and explicit box faces provide independent geometry expectations. The buried-centre fallback is intentionally also rejected by domain admission; tests do not certify continuous collision freedom.
 * @evidence contracts/testing.md#distinguishing-cases Preserve nonunit/tilted planes, radial and centre spheres, top/underside box faces and a missed box, with contact counts beside positions; moving capsules belong to wearable tests.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_soft_body_collision; domain admission and solver output are direct seams, without a browser, mock renderer or real contact host.
 */
export function test_soft_body_collision(): void {
  const floor: IAutoMovieSoftBodyState = simulateSoftBody(
    dropped([
      {
        kind: "plane",
        id: "floor",
        normal: { x: 0, y: 2, z: 0 },
        offset: -0.5,
      },
    ]),
    64,
  );
  TestValidator.equals(
    "a half-space with a non-unit normal still holds the panel at its offset",
    namedFacts([
      ["resting", (): boolean => Object.is(floor.positions[4], -0.5)],
      ["heldAbove", (): boolean => nclose(floor.positions[1], -0.25, 0.01)],
      ["contacts", (): boolean => floor.contacts === 1],
    ]),
    { resting: true, heldAbove: true, contacts: true },
  );

  const ramp: IAutoMovieSoftBodyState = simulateSoftBody(
    dropped([
      { kind: "plane", id: "ramp", normal: { x: 1, y: 1, z: 0 }, offset: -0.5 },
    ]),
    64,
  );
  const unit: number = Math.SQRT1_2;
  TestValidator.equals(
    "a tilted half-space is escaped along its own normal",
    namedFacts([
      [
        "onPlane",
        (): boolean =>
          nclose(unit * ramp.positions[0] + unit * ramp.positions[1], -0.5),
      ],
      ["slidX", (): boolean => ramp.positions[0] > 0],
      ["fell", (): boolean => ramp.positions[1] < 0],
    ]),
    { onPlane: true, slidX: true, fell: true },
  );

  const ball: IAutoMovieSoftBodyState = simulateSoftBody(
    dropped([
      {
        kind: "sphere",
        id: "bolster",
        center: { x: 0, y: -1, z: 0 },
        radius: 0.375,
      },
      { kind: "plane", id: "floor", normal: { x: 0, y: 1, z: 0 }, offset: -1 },
    ]),
    64,
  );
  TestValidator.equals(
    "a ball projects the resting particle to exactly its radius",
    namedFacts([
      [
        "onSurface",
        (): boolean =>
          nclose(
            Math.sqrt(
              ball.positions[3] * ball.positions[3] +
                (ball.positions[4] + 1) * (ball.positions[4] + 1) +
                ball.positions[5] * ball.positions[5],
            ),
            0.375,
          ),
      ],
      ["onTop", (): boolean => Object.is(ball.positions[4], -0.625)],
      ["contacts", (): boolean => ball.contacts === 1],
    ]),
    { onSurface: true, onTop: true, contacts: true },
  );

  const buried: IAutoMovieSoftBodyDomain = softPanel({
    columns: 1,
    rows: 2,
    overrides: {
      id: "buried",
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: { x: 0, y: 0, z: 0 },
        drag: 0,
        iterations: 1,
        stiffness: { structural: 1, shear: 1, bend: 1 },
        referenceSpeed: 4,
        maxSteps: 8,
      },
      colliders: [
        {
          kind: "sphere",
          id: "core",
          center: { x: 0, y: 0, z: 0 },
          radius: 0.5,
        },
      ],
    },
  });
  const escaped: IAutoMovieSoftBodyState = simulateSoftBody(buried, 1);
  TestValidator.equals(
    "a particle at a ball's centre leaves upward, and the authoring is refused",
    namedFacts([
      ["upward", (): boolean => Object.is(escaped.positions[1], 0.5)],
      [
        "refused",
        (): boolean =>
          hasViolation(
            validateSoftBodyDomain({ domain: buried }),
            "type",
            "colliders[0]",
          ),
      ],
    ]),
    { upward: true, refused: true },
  );

  const crate: IAutoMovieSoftBodyState = simulateSoftBody(
    dropped([
      {
        kind: "box",
        id: "crate",
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: -0.5, z: 1 },
      },
    ]),
    64,
  );
  TestValidator.equals(
    "a box is escaped by its least-penetrated face",
    namedFacts([
      ["restsOnTop", (): boolean => Object.is(crate.positions[4], -0.5)],
      ["notPushedSideways", (): boolean => Object.is(crate.positions[3], 0)],
      ["contacts", (): boolean => crate.contacts === 1],
    ]),
    { restsOnTop: true, notPushedSideways: true, contacts: true },
  );

  const canopy: IAutoMovieSoftBodyState = simulateSoftBody(
    softPanel({
      columns: 1,
      rows: 2,
      overrides: {
        id: "canopy",
        solver: {
          fixedStepSeconds: 0.015625,
          gravity: { x: 0, y: 8, z: 0 },
          drag: 0,
          iterations: 2,
          stiffness: { structural: 1, shear: 1, bend: 1 },
          referenceSpeed: 4,
          maxSteps: 512,
        },
        colliders: [
          {
            kind: "box",
            id: "beam",
            min: { x: -1, y: 0.5, z: -1 },
            max: { x: 1, y: 1.5, z: 1 },
          },
        ],
      },
    }),
    64,
  );
  TestValidator.equals(
    "a panel pressed up against a beam leaves by the face it entered",
    namedFacts([
      ["restsUnder", (): boolean => Object.is(canopy.positions[1], 0.5)],
      ["notPushedThrough", (): boolean => canopy.positions[1] < 1.5],
      ["contacts", (): boolean => canopy.contacts === 1],
    ]),
    { restsUnder: true, notPushedThrough: true, contacts: true },
  );

  const missed: IAutoMovieSoftBodyState = simulateSoftBody(
    dropped([
      {
        kind: "box",
        id: "elsewhere",
        min: { x: 4, y: 4, z: 4 },
        max: { x: 5, y: 5, z: 5 },
      },
    ]),
    8,
  );
  TestValidator.equals(
    "a box nowhere near the panel is never touched",
    {
      contacts: missed.contacts,
      moved: missed.positions[1] < 0,
    },
    { contacts: 0, moved: true },
  );
}
