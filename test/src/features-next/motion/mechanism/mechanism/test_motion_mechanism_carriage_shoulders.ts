import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { carriageScene } from "../../../internal/carriageScene";
import { motionActionUnit } from "../../../internal/motionActionUnit";

/** The child's seat lies on the yoke within this, read level, metres. */
const SEAT: number = 0.15;

/** A carrier's hand holds the child's shin within this, metres. */
const SHIN: number = 0.2;

/**
 * A child carried on the shoulders, on its own: the shoulders scene of
 * `test_motion_mechanism_carriage`, moved here whole since it is one coupled
 * action of each partner (the carrier's `bearing` and the child's `borne`), the
 * small woman riding the average man and the small woman, as the original.
 *
 * Scenarios, as the original reads them:
 *
 * 1. The carrier's yoke region faces up, within 45 degrees of the vertical, and
 *    lies behind the neck, read on the carrier standing before the ride.
 * 2. At the ride's middle the child's seat lies on the yoke: the hips within 150
 *    mm of it read level, and above it.
 * 3. At the ride's middle each carrier's hand holds the child's shin of its side,
 *    within 200 mm.
 * 4. The take passes the shipped verdicts, and the `bearing` and the `borne` keep
 *    the shipped bounds over their own spans.
 *
 * The original's scene, unchanged but for its bounds named, so its verdict and
 * checks are this unit's and the integration spec no longer plays it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original scene it moves, the partners and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > bearing with a rider's stand > borne and reads the displayed yoke region, the rider's hips and shins and the carrier's hands, with the whole verdict and each partner's action bounds; a yoke facing away, a seat off the yoke, a hand off the shin or a finding fails.
 * @evidence contracts/development/testing.md#independent-expectations The yoke is the body's own region (`body.surfaces.regions.yoke`); the 150 and 200 mm bounds are the original's.
 * @evidence contracts/development/testing.md#distinguishing-cases A man and a woman carrying the same child; the other carriages are the other `test_motion_mechanism_carriage_*`.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_shoulders`.
 */
export function test_motion_mechanism_carriage_shoulders(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} shoulders`;
    try {
      shoulders(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("a child rides the shoulders, seated on the yoke");
}

/** A body region's world point and outward normal. */
interface IYoke {
  /** World metres. */
  point: IAutoMovieVector3;

  /** Outward unit normal. */
  normal: IAutoMovieVector3;
}

/** One carrier's ride and its checks. */
function shoulders(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const rider: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const take: HumanPerformance = carriageScene.perform(
    `${label} shoulders`,
    body,
    [],
    HumanChain.subject("actor")
      .stand({ hold: 0.3 })
      .registered("bearing", { carry: "shoulders", hold: 3 }),
    [
      {
        subject: "rider",
        body: rider,
        at: { x: 0, y: 0, z: -0.35 },
        yaw: 0,
        chain: HumanChain.subject("rider")
          .stand({ hold: 0.3 })
          .registered("borne", {
            partner: "actor",
            carry: "shoulders",
            hold: 3,
          }),
      },
    ],
  );
  try {
    everydayTake.clean(label, take);
  } catch (error: unknown) {
    checks.check(`${label}: ${everydayTake.describe(error)}`, false);
  }
  const borne: IAutoMovieMotionHumanSegment = carriageScene.named(
    take,
    "borne",
    "rider",
  )[0]!;
  const middle: number = (borne.start + borne.end) / 2;
  // The yoke region, read on the carrier's displayed bone.
  const yoke: (t: number) => IYoke = (t: number): IYoke => {
    const region: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions.yoke;
    const bone: IAutoMovieResolvedBone = take
      .bones("actor", t)
      .get(region.bone)!;
    return {
      point: Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, region.point),
      ),
      normal: Quaternion.rotateVector(bone.worldRotation, region.normal),
    };
  };
  const rest: IYoke = yoke(0.1);
  checks.check(
    `${label}: the carrier's yoke faces up and lies behind the neck`,
    rest.normal.y > Math.SQRT1_2 &&
      rest.point.z < take.bones("actor", 0.1).get("neck")!.worldPosition.z,
  );
  const seat: IAutoMovieVector3 = take
    .bones("rider", middle)
    .get("hips")!.worldPosition;
  const on: IAutoMovieVector3 = yoke(middle).point;
  checks.check(
    `${label}: the child's seat is on the carrier's yoke`,
    Vector3.distance({ ...seat, y: 0 }, { ...on, y: 0 }) <= SEAT &&
      seat.y > on.y,
  );
  for (const side of ["left", "right"] as const) {
    const hand: IAutoMovieVector3 = take
      .bones("actor", middle)
      .get(`${side}Hand`)!.worldPosition;
    const shin: IAutoMovieVector3 = take
      .bones("rider", middle)
      .get(`${side}LowerLeg`)!.worldPosition;
    checks.check(
      `${label}: the carrier's ${side} hand holds the child's shin`,
      Vector3.distance(hand, shin) <= SHIN,
    );
  }
  motionActionUnit.bounds(
    checks,
    label,
    take,
    "actor",
    carriageScene.named(take, "bearing")[0]!,
  );
  motionActionUnit.bounds(checks, label, take, "rider", borne);
}
