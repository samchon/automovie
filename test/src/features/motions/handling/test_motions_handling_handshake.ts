import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanClasp
} from "../../../../../packages/motions/src/handling/internal/HumanClasp";
import {
  HumanClaspClearance
} from "../../../../../packages/motions/src/handling/internal/HumanClaspClearance";
import {
  HumanGrip
} from "../../../../../packages/motions/src/handling/internal/HumanGrip";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  handshakeOffer
} from "../../../../../packages/motions/src/handling/internal/handshakeOffer";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import {
  stand
} from "../../../../../packages/motions/src/actions/internal/stand";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Rounding of a square root and a bisection, metres and degrees. */
const ROUNDING: number = 1e-6;

/**
 * The `handshake` law's own logic, each piece without the arm planner:
 *
 * - `handshakeOffer.reach` is how far a palm lies from its shoulder with the
 *   elbow flexed 15 degrees: the law of cosines over the two segments.
 * - `handshakeOffer.shape` takes a difference in elbow height by turning both
 *   forearms one angle `t`, `h sin(s + t) - l sin(s - t) = drop` with the
 *   offering slope `s` of 15 degrees, the higher upper arm lowering only when
 *   its palm would leave its reach.
 * - `handshakeOffer.point` finds where two offering hands meet: for partners of
 *   one size midway between the acting shoulders, below them, the same in
 *   either order; partners too far apart are refused on `partner`.
 * - `HumanClasp.choose` turns both hands about their palms' normals to the clasp
 *   whose open hands stay clear of the other's forearm, and `HumanClasp.close`
 *   closes this person's digits on it; `HumanClaspClearance.bones` names what a
 *   clasp reads of one side.
 *
 * Scenarios:
 *
 * 1. Reaches: 0.3 m and 0.25 m segments reach `sqrt(0.09 + 0.0625 + 0.15 cos 15)`;
 *    equal 0.3 m segments `0.6 cos 7.5`.
 * 2. Shapes, 0.3 m segments: no drop, no turn; a 0.05 m drop turns `asin(0.05 /
 *    (0.6 cos 15))` without lowering; a 0.4 m drop lowers the higher upper arm
 *    by more than nothing and at most 30 degrees.
 * 3. Two average men facing 0.9 m apart: the meeting midway in the floor plan,
 *    below the shoulders, in either order; 3 m apart, refused on `partner`.
 * 4. Their right hands' clasp at that meeting leaves a positive clearance, and
 *    `a`'s closed hand moves only his right digits, flexing at least one
 *    joint.
 * 5. The right side's clasp bones: the right forearm and hand and each closing
 *    digit's three bones, nothing of the left, fresh on each call.
 *
 * The body is built whole (`humanFixtureBody`): the meeting reads the palm
 * socket, and the clasp fits the arms and curls the digits on the whole body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the rig reach, symmetric offer geometry, partner separation, digit closure and required bones for one side.
 * @evidence contracts/development/testing.md#behavioral-verification Calls geometry helpers on typed lengths and height offsets, then stages equal-size stored rigs for a meeting, clasp and too-distant partner.
 * @evidence contracts/development/testing.md#independent-expectations Law-of-cosines reach and the asin height relation establish geometry; symmetry gives the midpoint in either order. The close result may change only the requested side's digits.
 */
export async function test_motions_handling_handshake(): Promise<void> {
  // 1. Reaches.
  const cos15: number = Math.cos((15 * Math.PI) / 180);
  TestValidator.predicate(
    "the reaches",
    nclose(
      handshakeOffer.reach(0.3, 0.25),
      Math.sqrt(0.09 + 0.0625 + 0.15 * cos15),
      ROUNDING,
    ) &&
      nclose(
        handshakeOffer.reach(0.3, 0.3),
        0.6 * Math.cos((7.5 * Math.PI) / 180),
        ROUNDING,
      ),
  );

  // 2. Shapes.
  const dropped: handshakeOffer.IShape = handshakeOffer.shape(
    0.3,
    0.3,
    0.3,
    0.05,
    0,
  );
  const deep: handshakeOffer.IShape = handshakeOffer.shape(
    0.3,
    0.3,
    0.3,
    0.4,
    0,
  );
  TestValidator.predicate(
    "the shapes",
    handshakeOffer.shape(0.3, 0.3, 0.3, 0, 0).turn === 0 &&
      handshakeOffer.shape(0.3, 0.3, 0.3, 0, 0).lowered === 0 &&
      dropped.lowered === 0 &&
      nclose(
        dropped.turn,
        (Math.asin(0.05 / (0.6 * cos15)) * 180) / Math.PI,
        ROUNDING,
      ) &&
      deep.lowered > 0 &&
      deep.lowered <= 30,
  );

  // 3. The meeting.
  // Reads the palm socket of the hand (`HumanHand.offset`) and fits the clasp on the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture = (z: number, yaw: number): IAutoMovieMotionHumanPosture =>
    stand.posture(body, { x: 0, y: 0, z }, yaw);
  const shoulder = (of: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, of)).get("rightUpperArm")!
      .worldPosition;
  const mine: IAutoMovieMotionHumanPosture = posture(0, 0);
  const theirs: IAutoMovieMotionHumanPosture = posture(0.9, 180);
  const a: handshakeOffer.ISide = { body, shoulder: shoulder(mine) };
  const b: handshakeOffer.ISide = { body, shoulder: shoulder(theirs) };
  const met: handshakeOffer.IMeeting = handshakeOffer.point(a, b, "right", 0);
  const back: handshakeOffer.IMeeting = handshakeOffer.point(b, a, "right", 0);
  TestValidator.predicate(
    "midway, below the shoulders",
    Math.abs(met.point.x - (a.shoulder.x + b.shoulder.x) / 2) <= ROUNDING &&
      Math.abs(met.point.z - (a.shoulder.z + b.shoulder.z) / 2) <= ROUNDING &&
      met.point.y < a.shoulder.y &&
      AutoMovieEngineVector3.distance(met.point, back.point) <= ROUNDING,
  );
  let refused: boolean = false;
  try {
    handshakeOffer.point(
      a,
      { body, shoulder: shoulder(posture(3, 180)) },
      "right",
      0,
    );
  } catch (error: unknown) {
    refused = error instanceof AutoMovieMotionHumanRefusal && error.axis === "partner";
  }
  TestValidator.predicate("too far apart", refused);

  // 4. The clasp.
  const giving: HumanClasp.IHand = {
    subject: "a",
    body,
    posture: mine,
    palm: { x: 1, y: 0, z: 0 },
    fingers: met.fingers,
  };
  const taking: HumanClasp.IHand = {
    subject: "b",
    body,
    posture: theirs,
    palm: { x: -1, y: 0, z: 0 },
    fingers: AutoMovieEngineVector3.scale(met.fingers, -1),
  };
  const choice: HumanClasp.IChoice = HumanClasp.choose(
    "right",
    met.point,
    0.03,
    giving,
    taking,
  );
  const closed = HumanClasp.close("right", choice, giving, taking);
  const bones: string[] = Object.keys(closed);
  TestValidator.predicate(
    "the clasp",
    choice.clearance > 0 &&
      bones.length > 0 &&
      bones.every((bone: string): boolean => bone.startsWith("right")) &&
      Object.values(closed).some(
        (angles: readonly [number, number, number] | undefined): boolean =>
          angles !== undefined && angles[0] > 0,
      ),
  );

  // 5. The clasp's bones.
  const set: ReadonlySet<string> = HumanClaspClearance.bones("right");
  const digits: string[] = HumanGrip.CLOSING.power.flatMap((digit) =>
    HumanGrip.bones("right", digit),
  );
  TestValidator.predicate(
    "the right side's bones",
    set.has("rightLowerArm") &&
      set.has("rightHand") &&
      digits.every((bone: string): boolean => set.has(bone)) &&
      set.size === 2 + digits.length &&
      [...set].every((bone: string): boolean => bone.startsWith("right")) &&
      HumanClaspClearance.bones("right") !== set,
  );
}
