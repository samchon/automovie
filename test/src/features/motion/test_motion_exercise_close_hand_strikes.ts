import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPunch,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanColliders, HumanSignature } from "@automovie/motions";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/** A close hand strike and the travel its surface must arrive with. */
interface IStrike {
  /** The technique. */
  technique: Extract<
    IAutoMovieMotionHumanPunch.Technique,
    "palmHeel" | "backfist" | "hammerfist"
  >;

  /** The elbow's flexion band at contact, degrees. */
  band: readonly [number, number];
}

/** The three close hand strikes with their coached elbow bands. */
const STRIKES: readonly IStrike[] = [
  { technique: "palmHeel", band: [5, 25] },
  { technique: "backfist", band: [10, 45] },
  { technique: "hammerfist", band: [30, 90] },
];

/** The punch signature spec's read-back resolution of an elbow band, degrees. */
const TOLERANCE: number = 10;

/** A struck surface lies within this of the other body's colliders at contact, metres: the blade strokes spec's bound. */
const TOUCH: number = 0.015;

/** One film frame at 240 Hz, the step the arrival direction is read over, seconds. */
const STEP: number = 1 / 240;

/**
 * The punch law's close hand strikes land their own surface of the hand on
 * the other body: the palm heel along the line, the back of the fist swung
 * out across it, the fist's little-finger edge brought down.
 *
 * Scenarios:
 * 1. On two bodies, each strike is thrown at a guarded face from the
 *    striking captures' 1.3 arm lengths. At its impact the struck surface,
 *    read on the displayed hand, lies on the first surface of the other body
 *    it meets, the guard or the face.
 * 2. The surface arrives the way the technique travels: the palm heel and
 *    the backfist forward, the backfist outward across the line, the
 *    hammerfist downward.
 * 3. The elbow lands within the technique's band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three strikes, the surfaces, the directions, and the bands; the feint is pinned by the stage-fight rows in the close strike spec.
 * @evidence contracts/development/testing.md#behavioral-verification Stages each row through the law sweep's striking stage and reads the displayed hand, its surface and the other body's colliders at the impact event and one 240 Hz frame before it.
 * @evidence contracts/development/testing.md#independent-expectations The surfaces are the body's own palm socket, back-of-hand region and little-finger knuckle; the bands are the coached ones the law states with the punch signature spec's 10 degree read-back; a touch is the blade strokes spec's 15 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Three surfaces and three arrival directions on a small and an average body and a guarded target whose guard may be met first. Spinning variants and the elbows belong to the close strike spec.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory performances through the shared law staging, with no host or capture.
 */
export function test_motion_exercise_close_hand_strikes(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const partner: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (const name of ["f-small", "m-average"] as const)
    for (const { technique, band } of STRIKES) {
      const cell: string = `${name} ${technique}`;
      try {
        const s: M.IStaged = M.stage("punch", `technique=${technique}`, name);
        assertTakeClean(cell, s.film);
        const impact: number | undefined = M.event(s, "impact");
        if (impact === undefined) {
          complaints.list.push(`${cell}: no impact`);
          continue;
        }
        const side: AutoMovieHumanSide = punching(s, impact);
        const at = (seconds: number): IAutoMovieVector3 =>
          surface(
            s.body,
            side,
            technique,
            M.bones(s, seconds).get(`${side}Hand`)!,
          );
        const point: IAutoMovieVector3 = at(impact);
        const gap: number = HumanColliders.distance(
          partner,
          HumanSignature.bones(
            HumanSignature.of(s.film, "b", partner, s.yaw),
            impact,
          ),
          point,
        ).distance;
        complaints.check(
          `${cell}: the surface lies ${gap} m from the other body at impact`,
          gap <= TOUCH,
        );

        // The arrival direction over the last frame.
        const travel: IAutoMovieVector3 = Vector3.subtract(
          point,
          at(impact - STEP),
        );
        const forward: IAutoMovieVector3 = M.forward(s.yaw);
        const up: number = travel.y;
        const ahead: number = Vector3.dot(travel, forward);
        const shoulder: IAutoMovieVector3 = M.joint(
          s,
          impact,
          `${side}UpperArm`,
        );
        const chest: IAutoMovieVector3 = M.joint(s, impact, "chest");
        const outward: IAutoMovieVector3 = Vector3.normalize({
          x: shoulder.x - chest.x,
          y: 0,
          z: shoulder.z - chest.z,
        });
        const out: number = Vector3.dot(travel, outward);
        complaints.check(
          `${cell}: arrives ${JSON.stringify({ ahead, out, up })} m over the last frame`,
          technique === "palmHeel"
            ? ahead > Math.abs(up)
            : technique === "backfist"
              ? out > 0
              : up < 0 && -up > Math.abs(out),
        );

        const elbow: number = M.flexion(
          M.joint(s, impact, `${side}UpperArm`),
          M.joint(s, impact, `${side}LowerArm`),
          M.joint(s, impact, `${side}Hand`),
        );
        complaints.check(
          `${cell}: elbow flexion ${elbow} deg at impact, ${band.join(" to ")} expected within ${TOLERANCE}`,
          elbow >= band[0] - TOLERANCE && elbow <= band[1] + TOLERANCE,
        );
      } catch (error) {
        complaints.list.push(`${cell}: ${String(error)}`);
      }
    }

  complaints.assert("Close hand strikes");
}

/** The hand that travels farther toward the impact is the striking one. */
function punching(s: M.IStaged, impact: number): AutoMovieHumanSide {
  const launch: number = M.event(s, "launch") ?? 0;
  const moved = (side: AutoMovieHumanSide): number =>
    Vector3.distance(
      M.joint(s, launch, `${side}Hand`),
      M.joint(s, impact, `${side}Hand`),
    );
  return moved("left") > moved("right") ? "left" : "right";
}

/** The technique's striking surface on the displayed hand, world metres. */
function surface(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  technique: IStrike["technique"],
  hand: IAutoMovieResolvedBone,
): IAutoMovieVector3 {
  if (technique === "backfist")
    return resolveAutoMovieHumanoidSurfaces.place(
      body.surfaces.regions[side === "left" ? "handBackLeft" : "handBackRight"],
      hand,
    ).point;
  const local: IAutoMovieVector3 =
    technique === "palmHeel"
      ? body.surfaces.sockets[side === "left" ? "palmLeft" : "palmRight"].point
      : Vector3.scale(
          Vector3.subtract(
            body.rest.get(`${side}LittleProximal`)!,
            body.rest.get(`${side}Hand`)!,
          ),
          0.5,
        );
  return Vector3.add(
    hand.worldPosition,
    Quaternion.rotateVector(hand.worldRotation, local),
  );
}
