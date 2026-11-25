import { Quaternion } from "@automovie/engine";
import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import { StrikingStepTransition } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** The left foot swinging over the first 0.45 of the beat, the right staying. */
const SWING: StrikingStepTransition.IFootwork = {
  windows: { left: [0, 0.45], right: undefined },
  pivot: undefined,
  airborne: undefined,
};

/**
 * A striking step's beats (`StrikingStepTransition`): a pivot turns a point
 * about an anchor keeping its height; a travel steps one chord along the
 * stance's direction (left along local +X); a foot moves rigidly with the root;
 * the first foot to step is the lead forward, the rear back and the named side
 * sideways; a swing runs on a minimum-jerk share of its window; a foot bears
 * outside its swing, or when it pivots, but not before its swing while still
 * landing; and the contacts book each foot's plants and pivots within the
 * beat.
 *
 * Scenarios:
 *
 * 1. Turned 90 degrees about the origin, (1, 5, 0) lands at (0, 5, -1).
 * 2. A 0.3 m chord forward heading 0 is (0, 0, 0.3); left it is (0.3, 0, 0); back
 *    heading 90 it is (-0.3, 0, 0).
 * 3. A foot at (1, 0, 0) carried from the origin to (0, 0, 1) turning 90 degrees
 *    lands at the origin, turned 90 degrees about +Y.
 * 4. Leading right, a forward step starts right, a back step left, a left step
 *    left.
 * 5. Over [0.2, 0.6] a swing is none, half and whole at 0.2, 0.4 and 0.6.
 * 6. The left bears at 0 and from 0.45, not at 0.2; still landing it does not bear
 *    at 0; pivoting it bears throughout; the right always bears.
 * 7. Booked as the second of two beats, the left plants from 0.725 and the right
 *    from 0.5; a pivoting left pivots from 0.5 to 0.725 first.
 */
export function test_unit_motions_striking_step_transition(): void {
  const o = { x: 0, y: 0, z: 0 };
  TestValidator.predicate(
    "a pivot and a chord",
    vclose(
      StrikingStepTransition.rotateAround({ x: 1, y: 5, z: 0 }, o, 90),
      { x: 0, y: 5, z: -1 },
      1e-12,
    ) &&
      vclose(
        StrikingStepTransition.travel(o, "forward", 0, 0.3),
        { x: 0, y: 0, z: 0.3 },
        1e-12,
      ) &&
      vclose(
        StrikingStepTransition.travel(o, "left", 0, 0.3),
        { x: 0.3, y: 0, z: 0 },
        1e-12,
      ) &&
      vclose(
        StrikingStepTransition.travel(o, "back", 90, 0.3),
        { x: -0.3, y: 0, z: 0 },
        1e-12,
      ),
  );
  const carried = StrikingStepTransition.moved(
    { ankle: { x: 1, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    o,
    { x: 0, y: 0, z: 1 },
    90,
  );
  TestValidator.predicate(
    "a carried foot",
    vclose(carried.ankle, o, 1e-12) &&
      qclose(
        carried.rotation,
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
        1e-12,
      ),
  );
  TestValidator.equals(
    "the first side",
    [
      StrikingStepTransition.firstSide("forward", "right"),
      StrikingStepTransition.firstSide("back", "right"),
      StrikingStepTransition.firstSide("left", "right"),
    ],
    ["right", "left", "left"],
  );
  TestValidator.predicate(
    "the swing",
    nclose(StrikingStepTransition.progress([0.2, 0.6], 0.2), 0, 1e-12) &&
      nclose(StrikingStepTransition.progress([0.2, 0.6], 0.4), 0.5, 1e-12) &&
      nclose(StrikingStepTransition.progress([0.2, 0.6], 0.6), 1, 1e-12),
  );
  const landing: StrikingStepTransition.IFootwork = {
    ...SWING,
    airborne: { left: { ankle: o, rotation: { x: 0, y: 0, z: 0, w: 1 } } },
  };
  const pivoting: StrikingStepTransition.IFootwork = {
    ...SWING,
    pivot: { side: "left" },
  };
  TestValidator.equals(
    "bearing",
    [
      StrikingStepTransition.bearingAt(SWING, "left", 0),
      StrikingStepTransition.bearingAt(SWING, "left", 0.2),
      StrikingStepTransition.bearingAt(SWING, "left", 0.45),
      StrikingStepTransition.bearingAt(landing, "left", 0),
      StrikingStepTransition.bearingAt(pivoting, "left", 0.2),
      StrikingStepTransition.bearingAt(SWING, "right", 0.2),
    ],
    [true, false, true, false, true, true],
  );
  const ground: IAutoMovieMotionHumanContactWindow["support"] = {
    kind: "ground",
  };
  const booked: IAutoMovieMotionHumanContactWindow[] = [];
  StrikingStepTransition.book(booked, SWING, "left", 1, 2);
  StrikingStepTransition.book(booked, SWING, "right", 1, 2);
  TestValidator.equals("booked", booked, [
    { part: "leftFoot", kind: "plant", from: 0.725, to: 1, support: ground },
    { part: "rightFoot", kind: "plant", from: 0.5, to: 1, support: ground },
  ]);
  const pivots: IAutoMovieMotionHumanContactWindow[] = [];
  StrikingStepTransition.book(pivots, pivoting, "left", 1, 2);
  TestValidator.equals(
    "a pivot booked",
    pivots,
    [
      { part: "leftFoot", kind: "plant", from: 0.5, to: 0.5, support: ground },
      {
        part: "leftFoot",
        kind: "pivot",
        from: 0.5,
        to: 0.725,
        support: ground,
      },
      { part: "leftFoot", kind: "plant", from: 0.725, to: 1, support: ground },
    ].filter((w) => w.from < w.to),
  );
}
