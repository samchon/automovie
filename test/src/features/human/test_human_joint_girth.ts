import type { IAutoMovieLoftChain } from "@automovie/engine";
import {
  AutoMovieHumanJointCentres,
  type AutoMovieHumanSkeletonLaw,
  type IAutoMovieHumanBodyCalibration,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * The chest and the digits take their own segment's girth.
 *
 * Scenarios:
 * 1. A trunk of circular sections, 150 mm in radius from the lumbar station to
 *    100 mm below the neck seat and 60 mm at the seat itself, gives the chest
 *    the girth at its segment's middle, the 150 mm thorax, not the 60 mm seat.
 * 2. An arm chain whose distal end narrows to a 2 mm cap stands in for the
 *    hand while the fingers have no chain of their own; every finger phalanx
 *    then takes the stature girth of a finger, 0.03 S / 2π, instead of the
 *    host's palm-wide or needle-thin ring.
 * 3. The hand itself, inside the arm chain, keeps the arm's ring around it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanJointCentres.derive` on a small made calibration and reads the radius it reports per joint; the old rules returned the 60 mm neck seat for the chest and the 2 mm cap for a distal phalanx.
 * @evidence contracts/development/testing.md#independent-expectations A circle's perimeter over 2π is its radius, so a trunk section built at 150 mm must read 150 mm within the 96-gon chord shortfall (r (1 - sin(π/96)/(π/96)) < 0.03 mm); the finger girth is the documented 0.03-of-stature circumference; the hand sits on a 40 mm arm ring.
 * @evidence contracts/development/testing.md#distinguishing-cases The chest reads a station between equal 150 mm layers, so any interpolation gives 150 mm, while the 60 mm seat lies one segment-half above; a phalanx near the cap and one near the palm both change under the old rule, and the hand inside the arm must not change.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit over in-memory chains: no Human is generated, calibrated or lofted, and it runs well under one second.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios with their inputs and the behaviour each pins.
 */
export function test_human_joint_girth(): void {
  const S: number = 1800;
  const bone = (
    name: string,
    parent: string | null,
    position: [number, number, number],
    toward: [number, number, number],
    tip: [number, number, number] | null = null,
  ): AutoMovieHumanSkeletonLaw.IBone => ({
    bone: name,
    parent,
    position,
    toward,
    tip,
  });
  const calibration: IAutoMovieHumanBodyCalibration = {
    stature: S,
    chains: [
      tube(
        "trunk",
        [0, 0],
        [
          [800, 150],
          [1100, 150],
          [1300, 150],
          [1400, 150],
          [1500, 60],
        ],
      ),
      tube(
        "arm.left",
        [0, 250],
        [
          [600, 2],
          [700, 40],
          [1400, 50],
        ],
      ),
    ],
    events: [],
    poles: [],
    apertures: [],
    eyes: [],
    skeleton: [
      bone("hips", null, [0, 930, 0], [0, 1100, 0]),
      bone("spine", "hips", [0, 1100, 0], [0, 1300, 0]),
      bone("chest", "spine", [0, 1300, 0], [0, 1500, 0]),
      bone("neck", "chest", [0, 1500, 0], [0, 1600, 0]),
      bone("head", "neck", [0, 1600, 0], [0, 1750, 0], [0, 1750, 0]),
      bone("leftHand", "chest", [0, 720, 250], [0, 700, 250]),
      bone("leftIndexProximal", "leftHand", [0, 690, 250], [0, 660, 250]),
      bone(
        "leftIndexDistal",
        "leftIndexProximal",
        [0, 630, 250],
        [0, 600, 250],
        [0, 600, 250],
      ),
    ],
  } as unknown as IAutoMovieHumanBodyCalibration;
  const joints: Map<string, number> = new Map(
    AutoMovieHumanJointCentres.derive(calibration).map(
      (j: AutoMovieHumanJointCentres.IJoint): [string, number] => [
        j.bone,
        j.radius,
      ],
    ),
  );
  const finger: number = (0.03 * S) / (2 * Math.PI);
  TestValidator.predicate(
    `chest takes the thorax girth at its middle (${joints.get("chest")})`,
    Math.abs(joints.get("chest")! - 150) < 0.05,
  );
  for (const phalanx of ["leftIndexProximal", "leftIndexDistal"])
    TestValidator.predicate(
      `${phalanx} takes a finger girth (${joints.get(phalanx)} vs ${finger})`,
      Math.abs(joints.get(phalanx)! - finger) < 1e-9,
    );
  TestValidator.predicate(
    `hand keeps the arm ring around it (${joints.get("leftHand")})`,
    Math.abs(joints.get("leftHand")! - 40) < 1,
  );
}

/** A vertical chain of circular horizontal sections at (x, z), each `[height, radius]` in mm. */
function tube(
  name: string,
  centre: [number, number],
  rings: [number, number][],
): IAutoMovieLoftChain {
  return {
    name,
    order: 1,
    rule: "polar",
    samples: 32,
    layers: rings.map(
      ([y, r]: [number, number]): IAutoMovieLoftChain.ILayer => ({
        y,
        coefficients: [centre[0], r, 0, centre[1], 0, r],
        slopes: [0, 0, 0, 0, 0, 0],
      }),
    ),
  };
}
