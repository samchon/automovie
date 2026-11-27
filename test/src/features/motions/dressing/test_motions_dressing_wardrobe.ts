import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  motionHumanTiming
} from "../../../../../packages/motions/src/compose/internal/motionHumanTiming";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  wardrobeHands
} from "../../../../../packages/motions/src/dressing/internal/wardrobeHands";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few rotations and polynomials, metres. */
const ROUNDING: number = 1e-12;

/** The shortest wardrobe transfer, seconds: a readable short phase on screen. */
const SHORTEST: number = 0.23;

/**
 * The wardrobe primitives admit the jacket and free hand, read the wearable's
 * contact geometry, and prepare the transfer between those contacts.
 *
 * Scenarios:
 *
 * 1. Threading at 0.12 m from the collar passes. Greater separation refuses
 *    on `prop`. A hand already holding something refuses on `side`.
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
 */
export function test_motions_dressing_wardrobe(): void {
  // 1. Preconditions.
  wardrobeHands.sleeveMount("coat", 0.12);
  wardrobeHands.closureHand("right", undefined);
  assert.throws(
    () => wardrobeHands.sleeveMount("coat", 0.121),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal && error.axis === "prop" && error.value === "coat",
  );
  assert.throws(
    () => wardrobeHands.closureHand("right", "coat"),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal && error.axis === "side" && error.value === "right",
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
      rotation: AutoMovieEngineQuaternion.identity(),
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  });
  const jacket: IAutoMovieMotionHumanProp = {
    subject: "jacket",
    frame: { position: { x: 0, y: 1, z: 0 }, rotation: AutoMovieEngineQuaternion.identity() },
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
      return error instanceof AutoMovieMotionHumanRefusal && error.axis === "opening";
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
    narrow = error instanceof AutoMovieMotionHumanRefusal && error.axis === "opening";
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
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const to: IAutoMovieRigidTransform = {
    position: { x: 1, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const half: IAutoMovieRigidTransform = wardrobeHands.path(from, to, 0.5);
  TestValidator.predicate(
    "the path",
    vclose(half.position, { x: 0.5, y: 0, z: 0 }, ROUNDING) &&
      qclose(
        half.rotation,
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 45),
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
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30),
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
      const r: AutoMovieMotionHumanRefusal = wardrobeHands.refusal(axis, 0.3, `no ${axis}`);
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
    rotation: AutoMovieEngineQuaternion.identity(),
  });
  TestValidator.equals(
    "the durations",
    [
      wardrobeHands.duration(at(0), at(1)),
      wardrobeHands.duration(at(0), at(0)),
    ],
    [
      Math.max(SHORTEST, motionHumanTiming.transport(1)),
      Math.max(SHORTEST, motionHumanTiming.transport(0)),
    ],
  );
}
