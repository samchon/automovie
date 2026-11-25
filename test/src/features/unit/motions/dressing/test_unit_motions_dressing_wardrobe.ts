import { createStageJacket } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanWardrobe,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  AutoMovieMotionHumanTiming,
  HumanRefusal,
  wardrobe,
  wardrobeHands,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few rotations and polynomials, metres. */
const ROUNDING: number = 1e-12;

/** The shortest wardrobe transfer, seconds: a readable short phase on screen. */
const SHORTEST: number = 0.23;

/**
 * The `wardrobe` law's own logic, each piece without the arm planner:
 *
 * - `wardrobe.plan` judges a mode's preconditions before any arm is moved: a
 *   sleeve is threaded only on a jacket seated on the wearer, its `wear`
 *   contact within 0.12 m of the collar point; the zip is worked only by a free
 *   hand.
 * - `wardrobeHands` reads the wearable's geometry and times its transfers: a
 *   contact found by id and kind or refused on `opening`; a contact's rigid
 *   frame; an aperture's middle half its height up its own +Y, refused without
 *   positive dimensions; a minimum-jerk path between two keys (Flash and Hogan
 *   1985), clamped; a translation that keeps the rotation; a grip window that
 *   carries or steadies; a refusal whose kind follows its axis; a transfer
 *   timed by the free-space transport of the distance, at least 0.23 s.
 *
 * Scenarios:
 *
 * 1. Preconditions, the average man at the origin and a stage jacket lying 1 m
 *    ahead: threading the right sleeve is refused on `prop`; closing the zip
 *    with the hand that holds the jacket is refused on `side`.
 * 2. Sites, a jacket declaring a `collar` handle and a `sleeve` aperture: both
 *    found, `collar` as an aperture and an undeclared `hood` refused.
 * 3. A collar at (0.1, 0.4, 0) turned a quarter about +Y reads that frame.
 * 4. A 0.2 m tall opening at (0, 1, 0): its middle at (0, 1.1, 0), at (0, 0.9, 0)
 *    turned a half turn about +Z; without a width refused on `opening`.
 * 5. A path from the origin unturned to (1, 0, 0) turned 90 degrees about +Y: half
 *    way at 0.5, 0.103515625 of the way at 0.25, on its ends past them.
 * 6. A frame at (0.1, 1, 0.2) moved by (0, -0.05, 0.1) lies at (0.1, 0.95, 0.3)
 *    with the same rotation.
 * 7. The left hand's grip on `coat` over 0.2 to 0.6 carries it; the right's over 0
 *    to 1, not carrying, steadies it.
 * 8. The axes `opening`, `reach`, `base` and `side` refuse as an affordance, a
 *    reach, a base and a parameter.
 * 9. Frames 1 m apart take the transport time of 1 m; in one place at least 0.23
 *    s.
 *
 * The body is built whole (`humanFixtureBody`) for the preconditions, which
 * read the body's shoulders for the collar.
 */
export async function test_unit_motions_dressing_wardrobe(): Promise<void> {
  // 1. Preconditions.
  // Reads the body's shoulders for the collar through the context of the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const lying: IAutoMovieMotionHumanProp = HumanObject.prop(
    "jacket",
    createStageJacket({
      id: "jacket",
      width: 0.39,
      depth: 0.3,
      sleeveWidth: 0.19,
      sleeveLength: 0.04,
      length: 0.48,
      zipTravel: 0.15,
    }),
    { position: { x: 0, y: 0, z: 1 }, rotation: Quaternion.identity() },
  );
  const refusal = (
    params: IAutoMovieMotionHumanWardrobe,
    holds: motionActionContext.IOptions["holds"],
  ): HumanRefusal | undefined => {
    try {
      wardrobe.plan(
        motionActionContext(body, params, { props: [lying], holds }),
      );
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error : undefined;
    }
  };
  TestValidator.predicate(
    "the preconditions",
    refusal({ kind: "sleeveIn", prop: "jacket", side: "right" }, {})?.axis ===
      "prop" &&
      refusal(
        { kind: "closeZip", prop: "jacket", side: "right" },
        { right: "jacket" },
      )?.axis === "side",
  );

  // 2. Sites.
  const point = (
    id: string,
    kind: IAutoMovieAffordance["kind"],
  ): IAutoMovieAffordance => ({
    id,
    kind,
    frame: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: Quaternion.identity(),
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  });
  const jacket: IAutoMovieMotionHumanProp = {
    subject: "jacket",
    frame: { position: { x: 0, y: 1, z: 0 }, rotation: Quaternion.identity() },
    points: {},
    affordances: [point("collar", "handle"), point("sleeve", "aperture")],
  };
  const unsited = (
    id: string,
    kind?: IAutoMovieAffordance["kind"],
  ): boolean => {
    try {
      wardrobeHands.site(jacket, id, kind);
      return false;
    } catch (error: unknown) {
      return error instanceof HumanRefusal && error.axis === "opening";
    }
  };
  TestValidator.predicate(
    "the sites",
    wardrobeHands.site(jacket, "collar").id === "collar" &&
      wardrobeHands.site(jacket, "sleeve", "aperture").kind === "aperture" &&
      unsited("collar", "aperture") &&
      unsited("hood"),
  );

  // 3. A contact's frame.
  const quarter = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  TestValidator.equals(
    "the frame",
    wardrobeHands.frame({
      id: "collar",
      kind: "handle",
      frame: {
        translation: { x: 0.1, y: 0.4, z: 0 },
        rotation: quarter,
        scale: { x: 2, y: 2, z: 2 },
      },
      extent: null,
    }),
    { position: { x: 0.1, y: 0.4, z: 0 }, rotation: quarter },
  );

  // 4. An aperture's middle.
  const opening = (
    rotation: IAutoMovieAffordance["frame"]["rotation"],
    width?: number,
  ): IAutoMovieAffordance => ({
    id: "sleeve",
    kind: "aperture",
    frame: {
      translation: { x: 0, y: 1, z: 0 },
      rotation,
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    height: 0.2,
    ...(width === undefined ? {} : { width }),
  });
  let narrow: boolean = false;
  try {
    wardrobeHands.middle(opening({ x: 0, y: 0, z: 0, w: 1 }));
  } catch (error: unknown) {
    narrow = error instanceof HumanRefusal && error.axis === "opening";
  }
  TestValidator.predicate(
    "the middles",
    vclose(
      wardrobeHands.middle(opening({ x: 0, y: 0, z: 0, w: 1 }, 0.1)).position,
      { x: 0, y: 1.1, z: 0 },
      ROUNDING,
    ) &&
      vclose(
        wardrobeHands.middle(opening({ x: 0, y: 0, z: 1, w: 0 }, 0.1)).position,
        { x: 0, y: 0.9, z: 0 },
        ROUNDING,
      ) &&
      narrow,
  );

  // 5. A path.
  const from: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const to: IAutoMovieRigidTransform = {
    position: { x: 1, y: 0, z: 0 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const half: IAutoMovieRigidTransform = wardrobeHands.path(from, to, 0.5);
  TestValidator.predicate(
    "the path",
    vclose(half.position, { x: 0.5, y: 0, z: 0 }, ROUNDING) &&
      qclose(
        half.rotation,
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 45),
        ROUNDING,
      ) &&
      vclose(
        wardrobeHands.path(from, to, 0.25).position,
        { x: 0.103515625, y: 0, z: 0 },
        ROUNDING,
      ) &&
      vclose(
        wardrobeHands.path(from, to, -1).position,
        from.position,
        ROUNDING,
      ) &&
      vclose(wardrobeHands.path(from, to, 2).position, to.position, ROUNDING),
  );

  // 6. A displacement.
  const turned: IAutoMovieRigidTransform = {
    position: { x: 0.1, y: 1, z: 0.2 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30),
  };
  const moved: IAutoMovieRigidTransform = wardrobeHands.displaced(turned, {
    x: 0,
    y: -0.05,
    z: 0.1,
  });
  TestValidator.predicate(
    "the displacement",
    vclose(moved.position, { x: 0.1, y: 0.95, z: 0.3 }, ROUNDING) &&
      moved.rotation === turned.rotation,
  );

  // 7. Grip windows.
  TestValidator.equals(
    "the grips",
    [
      wardrobeHands.contact("coat", "left", 0.2, 0.6),
      wardrobeHands.contact("coat", "right", 0, 1, false),
    ],
    [
      {
        part: "leftHand",
        kind: "grip",
        support: { kind: "prop", subject: "coat", carries: true },
        from: 0.2,
        to: 0.6,
      },
      {
        part: "rightHand",
        kind: "grip",
        support: { kind: "prop", subject: "coat", carries: false },
        from: 0,
        to: 1,
      },
    ],
  );

  // 8. Refusals.
  TestValidator.equals(
    "the refusals",
    ["opening", "reach", "base", "side"].map((axis: string) => {
      const r: HumanRefusal = wardrobeHands.refusal(axis, 0.3, `no ${axis}`);
      return [r.kind, r.axis, r.value, r.reason];
    }),
    [
      ["affordance", "opening", 0.3, "no opening"],
      ["reach", "reach", 0.3, "no reach"],
      ["base", "base", 0.3, "no base"],
      ["parameter", "side", 0.3, "no side"],
    ],
  );

  // 9. Durations.
  const at = (x: number): IAutoMovieRigidTransform => ({
    position: { x, y: 1, z: 0 },
    rotation: Quaternion.identity(),
  });
  TestValidator.equals(
    "the durations",
    [
      wardrobeHands.duration(at(0), at(1)),
      wardrobeHands.duration(at(0), at(0)),
    ],
    [
      Math.max(SHORTEST, AutoMovieMotionHumanTiming.transport(1)),
      Math.max(SHORTEST, AutoMovieMotionHumanTiming.transport(0)),
    ],
  );
}
