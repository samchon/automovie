import { measureAutoMoviePlacedContact } from "@automovie/engine";
import type {
  IAutoMoviePlacedContact,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const QUARTER_TURN: IAutoMovieQuaternion = {
  x: 0,
  y: 0,
  z: Math.SQRT1_2,
  w: Math.SQRT1_2,
};
const CARRIER: IAutoMovieRigidTransform = {
  position: { x: 10, y: 2, z: 4 },
  rotation: QUARTER_TURN,
};

/**
 * Measure contact in the current moving frame, including independently
 * declared targets for an active rolling point and intentional in-hand motion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the moving reference and authored alternatives. The assertions describe every measured or refused outcome.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the public placed check with analytic quarter-turn targets, relative offsets, distinct normal/tangent and positional/angular failures, and absent or malformed evidence.
 * @evidence contracts/development/testing.md#independent-expectations World points are written directly from the rotation's axis mapping. nclose checks expected SI measures independently of the engine's transform implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers moving and stationary support, the selected rolling point and grip target, independent threshold breaches and malformed or absent evidence. Scene-level selection belongs to the adapter tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable Engine unit runs only explicit, in-memory placed inputs and starts no renderer, clock or stateful pose producer.
 */
export const test_unit_engine_validation_placed_contact = (): void => {
  const support = {
    kind: "support",
    path: "actors.rook.support",
    maxGap: 0.05,
    maxSlip: 0.1,
  } as const;
  const supportSample: IAutoMoviePlacedContact.ISupportSample = {
    point: { x: 10, y: 4, z: 5 },
    frame: CARRIER,
    anchor: { x: 2, y: 0, z: 1 },
  };
  const resting = measureAutoMoviePlacedContact({
    ...support,
    sample: {
      point: supportSample.anchor,
      frame: { position: { x: 0, y: 0, z: 0 }, rotation: IDENTITY },
      anchor: supportSample.anchor,
    },
  });
  const carried = measureAutoMoviePlacedContact({
    ...support,
    sample: supportSample,
  });
  const rolling = measureAutoMoviePlacedContact({
    ...support,
    sample: {
      ...supportSample,
      point: { x: 10, y: 4.5, z: 5 },
      anchor: { x: 2.5, y: 0, z: 1 },
    },
  });
  TestValidator.predicate(
    "moving deck and active rolling point preserve contact",
    () =>
      [resting, carried, rolling].every(
        (result) =>
          result.status === "checked" &&
          result.kind === "support" &&
          nclose(result.gap, 0) &&
          nclose(result.slip, 0) &&
          result.violations.length === 0,
      ),
  );

  const drifting = measureAutoMoviePlacedContact({
    ...support,
    sample: { ...supportSample, point: { x: 9.875, y: 4.25, z: 5 } },
  });
  TestValidator.predicate(
    "lift and tangential drift have independent metre findings",
    () =>
      drifting.status === "checked" &&
      drifting.kind === "support" &&
      nclose(drifting.gap, 0.125) &&
      nclose(drifting.slip, 0.25) &&
      drifting.violations.length === 2 &&
      drifting.violations.some(
        ({ path }) => path === "actors.rook.support.gap",
      ) &&
      drifting.violations.some(
        ({ path }) => path === "actors.rook.support.slip",
      ),
  );

  const penetrating = measureAutoMoviePlacedContact({
    ...support,
    sample: { ...supportSample, point: { x: 10.125, y: 4, z: 5 } },
  });
  TestValidator.predicate(
    "penetration has negative normal gap and no slip",
    () =>
      penetrating.status === "checked" &&
      penetrating.kind === "support" &&
      nclose(penetrating.gap, -0.125) &&
      nclose(penetrating.slip, 0) &&
      penetrating.violations.length === 1 &&
      penetrating.violations[0]?.path === "actors.rook.support.gap",
  );

  const grip = {
    kind: "grip",
    path: "props.lantern.grip",
    maxDistance: 0.05,
    maxAngle: 0.1,
  } as const;
  const gripSample: IAutoMoviePlacedContact.IGripSample = {
    hand: CARRIER,
    prop: { position: { x: 10, y: 2.25, z: 4 }, rotation: QUARTER_TURN },
    expected: { position: { x: 0.25, y: 0, z: 0 }, rotation: IDENTITY },
  };
  const firm = measureAutoMoviePlacedContact({ ...grip, sample: gripSample });
  const intentionalTurn = measureAutoMoviePlacedContact({
    ...grip,
    sample: {
      ...gripSample,
      prop: { ...gripSample.prop, rotation: IDENTITY },
      expected: {
        ...gripSample.expected,
        rotation: { x: 0, y: 0, z: -Math.SQRT1_2, w: Math.SQRT1_2 },
      },
    },
  });
  TestValidator.predicate(
    "grip tracks the hand and honors declared in-hand turn",
    () =>
      [firm, intentionalTurn].every(
        (result) =>
          result.status === "checked" &&
          result.kind === "grip" &&
          nclose(result.distance, 0) &&
          nclose(result.angle, 0) &&
          result.violations.length === 0,
      ),
  );

  const loose = measureAutoMoviePlacedContact({
    ...grip,
    sample: {
      ...gripSample,
      prop: { position: { x: 10, y: 2.5, z: 4 }, rotation: IDENTITY },
    },
  });
  TestValidator.predicate(
    "grip distance and angular failures are both observable",
    () =>
      loose.status === "checked" &&
      loose.kind === "grip" &&
      nclose(loose.distance, 0.25) &&
      nclose(loose.angle, Math.PI / 2) &&
      loose.violations.length === 2 &&
      loose.violations.some(
        ({ path }) => path === "props.lantern.grip.distance",
      ) &&
      loose.violations.some(({ path }) => path === "props.lantern.grip.angle"),
  );

  const malformed = measureAutoMoviePlacedContact({
    ...support,
    maxGap: -1,
    sample: {
      ...supportSample,
      frame: { ...CARRIER, rotation: { ...IDENTITY, w: 0 } },
    },
  });
  TestValidator.predicate(
    "missing sample and malformed support have different outcomes",
    () =>
      measureAutoMoviePlacedContact(support).status === "unsupported" &&
      malformed.status === "invalid" &&
      malformed.violations.length === 2 &&
      malformed.violations.some(
        ({ path }) => path === "actors.rook.support.frame.rotation",
      ) &&
      malformed.violations.some(
        ({ path }) => path === "actors.rook.support.maxGap",
      ),
  );
};
