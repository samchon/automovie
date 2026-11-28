import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMoviePlacedContact,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/** A check of one support contact. */
type ISupportCheck = Extract<
  IAutoMoviePlacedContact.IProps,
  { kind: "support" }
>;

/** A check of one grip contact. */
type IGripCheck = Extract<IAutoMoviePlacedContact.IProps, { kind: "grip" }>;

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
 * Measure contact in the current moving frame, including independently declared
 * targets for an active rolling point and intentional in-hand motion.
 *
 * Scenarios:
 *
 * 1. A resting, carried or rolling support stays on its declared target.
 * 2. Lift, tangential drift and penetration give independent metre findings.
 * 3. A carried grip follows its hand, including an authored in-hand turn.
 * 4. A loose grip reports unequivalent position and orientation.
 * 5. A missing sample is unsupported. Invalid limits, rotation or a nonfinite
 *    frame origin leave the measurement unavailable and report the input
 *    field.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers support, moving and rolling contact, hand-relative grip and separately missing or invalid facts.
 * @evidence contracts/development/testing.md#behavioral-verification Calls measurePlacedContact with explicit world observations and maintained target frames, including each failed support or grip component.
 * @evidence contracts/development/testing.md#independent-expectations Frame-relative offsets separate normal lift, tangential drift and negative penetration. Exact declared targets preserve resting, carried and rolling contact. A grip rotation compares to its declared in-hand target, and absent data differs from malformed input.
 */
export const test_engine_validation_placed_contact = (): void => {
  const support: ISupportCheck = {
    kind: "support",
    path: "actors.rook.support",
    maxGap: 0.05,
    maxSlip: 0.1,
  };
  const supportSample: IAutoMoviePlacedContact.ISupportSample = {
    point: { x: 10, y: 4, z: 5 },
    frame: CARRIER,
    anchor: { x: 2, y: 0, z: 1 },
  };
  const resting = AutoMovieEngineValidation.measurePlacedContact({
    ...support,
    sample: {
      point: supportSample.anchor,
      frame: { position: { x: 0, y: 0, z: 0 }, rotation: IDENTITY },
      anchor: supportSample.anchor,
    },
  });
  const carried = AutoMovieEngineValidation.measurePlacedContact({
    ...support,
    sample: supportSample,
  });
  const rolling = AutoMovieEngineValidation.measurePlacedContact({
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

  const drifting = AutoMovieEngineValidation.measurePlacedContact({
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

  const penetrating = AutoMovieEngineValidation.measurePlacedContact({
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

  const grip: IGripCheck = {
    kind: "grip",
    path: "props.lantern.grip",
    maxDistance: 0.05,
    maxAngle: 0.1,
  };
  const gripSample: IAutoMoviePlacedContact.IGripSample = {
    hand: CARRIER,
    prop: { position: { x: 10, y: 2.25, z: 4 }, rotation: QUARTER_TURN },
    expected: { position: { x: 0.25, y: 0, z: 0 }, rotation: IDENTITY },
  };
  const firm = AutoMovieEngineValidation.measurePlacedContact({ ...grip, sample: gripSample });
  const intentionalTurn = AutoMovieEngineValidation.measurePlacedContact({
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

  const loose = AutoMovieEngineValidation.measurePlacedContact({
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

  const malformed = AutoMovieEngineValidation.measurePlacedContact({
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
      AutoMovieEngineValidation.measurePlacedContact(support).status === "unsupported" &&
      malformed.status === "invalid" &&
      malformed.violations.length === 2 &&
      malformed.violations.some(
        ({ path }) => path === "actors.rook.support.frame.rotation",
      ) &&
      malformed.violations.some(
        ({ path }) => path === "actors.rook.support.maxGap",
      ),
  );

  const nonfiniteOrigin: IAutoMoviePlacedContact.IResult =
    AutoMovieEngineValidation.measurePlacedContact({
      ...support,
      sample: {
        ...supportSample,
        frame: {
          ...CARRIER,
          position: { ...CARRIER.position, x: NaN },
        },
      },
    });
  TestValidator.predicate(
    "a nonfinite origin makes the support observation invalid",
    () =>
      nonfiniteOrigin.status === "invalid" &&
      nonfiniteOrigin.violations.some(({ path }) =>
        path.startsWith("actors.rook.support.frame.position"),
      ),
  );
};
