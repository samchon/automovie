import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
} from "@automovie/interface";
import { StrikingLimb } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";

/** The scenarios of `test_unit_motions_executable_striking_limb_leg`. */
namespace ScenarioStrikingLimbLeg {
  /** The four end joints a strike can carry. */
  const LIMBS: StrikingLimb.End[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ];

  /**
   * `StrikingLimb.leg` tells a striking foot from a hand.
   *
   * Scenarios:
   *
   * 1. The feet are legs; the hands are not.
   */
  export function test_unit_motions_executable_striking_limb_leg(): void {
    TestValidator.equals(
      "the feet only",
      LIMBS.map((limb: StrikingLimb.End): boolean => StrikingLimb.leg(limb)),
      [false, false, true, true],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_striking_limb_length`. */
namespace ScenarioStrikingLimbLength {
  /**
   * `StrikingLimb.length` bounds a bare limb's reach from its root joint by the
   * body's own segments: the upper arm, the forearm and the hand for a punch, the
   * thigh, the shank and the foot for a kick, and the thigh and its radius for a
   * knee.
   *
   * Scenarios:
   *
   * 1. The average man's hand reaches his arm's three segments.
   * 2. His foot reaches his leg's three segments.
   * 3. His knee reaches his thigh and its radius, whichever foot strikes.
   */
  export async function test_unit_motions_executable_striking_limb_length(): Promise<void> {
    const m: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
    const body: { measure: IAutoMovieBodyMeasure } = { measure: m };
    TestValidator.predicate(
      "the bare limbs' lengths",
      nclose(
        StrikingLimb.length(body, "rightHand", false),
        m.upperArm + m.forearm + m.hand,
        1e-12,
      ) &&
        nclose(
          StrikingLimb.length(body, "leftFoot", false),
          m.thigh + m.shank + m.footLength,
          1e-12,
        ) &&
        nclose(
          StrikingLimb.length(body, "rightFoot", true),
          m.thigh + m.thighRadius,
          1e-12,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_executable_striking_limb_root`. */
namespace ScenarioStrikingLimbRoot {
  /** The four end joints a strike can carry. */
  const LIMBS: StrikingLimb.End[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ];

  /**
   * `StrikingLimb.root` names the joint a striking limb hangs from: the upper arm
   * at the shoulder, or the upper leg at the hip, on the limb's side.
   *
   * Scenarios:
   *
   * 1. Each hand hangs from its upper arm, each foot from its upper leg.
   */
  export function test_unit_motions_executable_striking_limb_root(): void {
    TestValidator.equals(
      "each limb's root",
      LIMBS.map(
        (limb: StrikingLimb.End): AutoMovieHumanoidBone =>
          StrikingLimb.root(limb),
      ),
      ["leftUpperArm", "rightUpperArm", "leftUpperLeg", "rightUpperLeg"],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_striking_limb_side`. */
namespace ScenarioStrikingLimbSide {
  /** The four end joints a strike can carry. */
  const LIMBS: StrikingLimb.End[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ];

  /**
   * `StrikingLimb.side` names the side of a striking hand or foot.
   *
   * Scenarios:
   *
   * 1. Each of the four end joints gives its own side.
   */
  export function test_unit_motions_executable_striking_limb_side(): void {
    TestValidator.equals(
      "each end joint's side",
      LIMBS.map(
        (limb: StrikingLimb.End): AutoMovieHumanSide => StrikingLimb.side(limb),
      ),
      ["left", "right", "left", "right"],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_striking_limb_surface`. */
namespace ScenarioStrikingLimbSurface {
  /** How near a signed distance comes to its closed form, metres. */
  const EXACT: number = 1e-12;

  /**
   * `StrikingLimb.surface` is the signed distance from a point to a tapered
   * capsule. For a cone of radius `r0` at `a` growing by `k` per metre, a point
   * `s` along the axis and `h` from it whose nearest axis point falls inside the
   * axis lies `h sqrt(1 - k^2) - r0 - k s` from the surface.
   *
   * Scenarios:
   *
   * 1. A uniform capsule of radius 0.1 m along x from 0 to 1 m: a point 0.3 m off
   *    its middle lies 0.2 m out, one on its axis 0.1 m inside, and one 2 m along
   *    the axis 0.9 m past its end cap.
   * 2. A capsule tapering from 0.1 to 0.2 m: a point 1 m off its middle lies
   *    `sqrt(0.99) - 0.1 - 0.05` m out.
   * 3. A capsule whose radius changes by its length or more reads its larger end
   *    sphere.
   * 4. A capsule of no length is a sphere.
   */
  export function test_unit_motions_executable_striking_limb_surface(): void {
    const uniform: StrikingLimb.ICapsule = {
      name: "uniform",
      a: { x: 0, y: 0, z: 0 },
      b: { x: 1, y: 0, z: 0 },
      radius: 0.1,
      tail: 0.1,
    };

    // 1. The uniform capsule.
    TestValidator.predicate(
      "off the side, inside and past the cap",
      nclose(
        StrikingLimb.surface({ x: 0.5, y: 0.3, z: 0 }, uniform),
        0.2,
        EXACT,
      ) &&
        nclose(
          StrikingLimb.surface({ x: 0.5, y: 0, z: 0 }, uniform),
          -0.1,
          EXACT,
        ) &&
        nclose(StrikingLimb.surface({ x: 2, y: 0, z: 0 }, uniform), 0.9, EXACT),
    );

    // 2. The taper.
    TestValidator.predicate(
      "the cone's closed form",
      nclose(
        StrikingLimb.surface(
          { x: 0.5, y: 0, z: 1 },
          { ...uniform, name: "taper", tail: 0.2 },
        ),
        Math.sqrt(0.99) - 0.1 - 0.05,
        EXACT,
      ),
    );

    // 3. A radius change past the length.
    TestValidator.predicate(
      "the larger end sphere",
      nclose(
        StrikingLimb.surface(
          { x: 1, y: 2, z: 0 },
          { ...uniform, name: "bulb", tail: 1.5 },
        ),
        2 - 1.5,
        EXACT,
      ),
    );

    // 4. No length.
    TestValidator.predicate(
      "a sphere",
      nclose(
        StrikingLimb.surface(
          { x: 0, y: 0.5, z: 0 },
          { ...uniform, name: "ball", b: { x: 0, y: 0, z: 0 } },
        ),
        0.4,
        EXACT,
      ),
    );
  }
}

/**
 * The `striking_limb` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export async function test_unit_motions_executable_striking_limb(): Promise<void> {
  ScenarioStrikingLimbLeg.test_unit_motions_executable_striking_limb_leg();
  await ScenarioStrikingLimbLength.test_unit_motions_executable_striking_limb_length();
  ScenarioStrikingLimbRoot.test_unit_motions_executable_striking_limb_root();
  ScenarioStrikingLimbSide.test_unit_motions_executable_striking_limb_side();
  ScenarioStrikingLimbSurface.test_unit_motions_executable_striking_limb_surface();
}
