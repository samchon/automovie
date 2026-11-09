import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { harryPotter } from "../../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../../src/entities/cast/student/Student";
import { BodyFrame } from "../../../../src/laws/body/BodyFrame";
import type { IBodyPosture } from "../../../../src/laws/body/IBodyPosture";
import { IBodyState } from "../../../../src/laws/body/IBodyState";
import { PostureFrame } from "../../../../src/laws/body/PostureFrame";
import { BendShape } from "../../../../src/laws/everyday/BendShape";
import { EverydayLaw } from "../../../../src/laws/everyday/EverydayLaw";
import { FaceTouchShape } from "../../../../src/laws/everyday/FaceTouchShape";
import { GiveRoomShape } from "../../../../src/laws/everyday/GiveRoomShape";
import { ReachShape } from "../../../../src/laws/everyday/ReachShape";
import { SitShape } from "../../../../src/laws/everyday/SitShape";
import { StudentPose } from "../../../../src/interactions/staging/StudentPose";

/**
 * The everyday shape laws against their studies' measurable targets:
 * give-room palms stand in front of the chest with the elbows below the
 * hands, facing forward, and rise only once the step back begins; a sit
 * keeps the feet planted, peaks its forward lean at 0.45 rad and lands the
 * pelvis on the seat; a reach is at its point exactly at the contact, a floor
 * pick-up hinges 0.95 rad and drops the pelvis 0.22 m there, and a pull tugs
 * 5 cm back; named bend depths and a deeper bend's lower hand; a forehead
 * touch puts the fingertips on the forehead at full reach and leaves the
 * posture untouched at its start and end, so nothing pops.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates each shape at its defining seconds and shares.
 * @evidence contracts/development/testing.md#independent-expectations Values from the handover, sitting and walking studies.
 * @evidence contracts/development/testing.md#distinguishing-cases Before and after each threshold; standing and seated; stay and return.
 * @evidence contracts/development/testing.md#execution-ownership Pure functions only.
 */
export function test_everyday_shapes(): void {
  const harry: Student = new Student(harryPotter);
  const m = harry.measure;
  const none = Object.assign((): undefined => undefined, {});
  const at = (state: IBodyState): IBodyPosture => StudentPose.of(state, m, none, 0, 0);
  const standing: IBodyPosture = at(IBodyState.standing({ x: 0, y: 0, z: 0 }, 0));
  const near = (a: IAutoMovieVector3, b: IAutoMovieVector3, tolerance: number): boolean => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= tolerance;

  // Give-room palms: in front of the chest, elbows low, facing forward; up only as the step back begins.
  for (const side of ["left", "right"] as const) {
    const palm = GiveRoomShape.palm(standing, side, m);
    const forward: number = palm.point.z - standing.pelvis.z;
    TestValidator.predicate(`the ${side} palm is in front of the chest (${forward.toFixed(2)} m)`, forward >= 0.25);
    TestValidator.predicate(`the ${side} elbow is below its hand`, palm.elbow.y < palm.point.y);
    TestValidator.predicate(`the ${side} palm faces forward`, palm.palm.z > 0.9);
  }
  TestValidator.equals("the palms are down before the step back", GiveRoomShape.raised(GiveRoomShape.STEP_BEGINS), 0);
  TestValidator.equals("the palms are up 0.4 s into the step", GiveRoomShape.raised(GiveRoomShape.STEP_BEGINS + GiveRoomShape.PALMS_RISE), 1);

  // Sitting: planted feet, the lean's peak, the pelvis on the seat.
  const seated: IBodyPosture = at({ ...IBodyState.standing({ x: 0, y: 0, z: 0 }, 0), support: "seat", seat: 0.45 });
  let peak: number = 0;
  for (let k = 0; k <= 100; k++) {
    const p: IBodyPosture = SitShape.posture(standing, seated, k / 100);
    TestValidator.predicate(`the feet stay planted at ${k}%`, near(p.feet.left.point, standing.feet.left.point, 1e-9) && near(p.feet.right.point, standing.feet.right.point, 1e-9));
    peak = Math.max(peak, p.lean - PostureFrame.blend(standing, seated, PostureFrame.smooth((k / 100 - 0.25) / 0.6)).lean);
  }
  TestValidator.predicate(`the forward lean peaks at 0.45 rad (${peak.toFixed(3)})`, Math.abs(peak - SitShape.LEAN) < 0.01);
  TestValidator.predicate("the pelvis lands on the seat", Math.abs(SitShape.posture(standing, seated, 1).pelvis.y - (0.45 + EverydayLaw.HIP_ABOVE_SEAT)) < 1e-9);

  // Reaching: at the point at the contact; the floor hinge; the pull.
  const point: IAutoMovieVector3 = { x: -0.1, y: 1.0, z: 0.45 };
  const reach = (own: number, extra: Partial<ReachShape.IInput> = {}): IBodyPosture =>
    ReachShape.posture({ from: standing, to: standing, side: "right", point, contact: 0.7, natural: 0.7, own, after: "stay", ...extra });
  TestValidator.predicate("the hand is at the point at the contact", near(reach(0.7).hands.right.point, point, 1e-9));
  TestValidator.predicate("the hand starts where it was", near(reach(0).hands.right.point, standing.hands.right.point, 1e-9));
  const floor: IBodyPosture = reach(0.7, { floor: { lean: standing.lean, pelvis: standing.pelvis.y }, point: { x: 0, y: 0.03, z: 0.35 } });
  const bent: IBodyPosture = ReachShape.posture({ from: { ...standing, lean: standing.lean + 0.9 }, to: { ...standing, lean: standing.lean + 0.9 }, side: "right", point: { x: 0, y: 0.03, z: 0.35 }, contact: 0.7, natural: 0.7, own: 0.7, after: "stay", floor: { lean: standing.lean, pelvis: standing.pelvis.y } });
  TestValidator.predicate("a body already bent only completes the hinge", Math.abs(bent.lean - standing.lean - ReachShape.FLOOR_HINGE) < 1e-9);
  TestValidator.predicate("a floor pick-up drops the pelvis 0.22 m at the contact", Math.abs(standing.pelvis.y - floor.pelvis.y - ReachShape.FLOOR_DROP) < 1e-9);
  TestValidator.predicate("a floor pick-up hinges 0.95 rad at the contact", Math.abs(floor.lean - standing.lean - ReachShape.FLOOR_HINGE) < 1e-9);
  const pulled: IBodyPosture = ReachShape.posture({ from: standing, to: standing, side: "right", point, contact: 0.3, natural: 1.0, own: 0.55, after: "stay", pull: BodyFrame.forward(0) });
  TestValidator.predicate("a pull tugs 5 cm back after 0.25 s", Math.abs(point.z - pulled.hands.right.point.z - 0.05) < 1e-9);

  // Bending: named depths, and a deeper bend reaches lower.
  TestValidator.equals("the named depths", [BendShape.depth("lean"), BendShape.depth("half"), BendShape.depth("full")], [0.45, 0.6, 1]);
  const floorPoint: IAutoMovieVector3 = { x: 0, y: 0, z: 0.5 };
  TestValidator.predicate("a full bend's hand reaches lower than a lean's", BendShape.hand(standing, floorPoint, 1, 1).y < BendShape.hand(standing, floorPoint, 0.45, 1).y);

  // A forehead touch: on the forehead at full reach; untouched at its start and end.
  const natural: number = EverydayLaw.TIMES.touchForehead.duration;
  const touched: IBodyPosture = FaceTouchShape.posture(standing, "touchForehead", "left", natural / 2, natural, m);
  TestValidator.predicate("the fingertips are on the forehead", near(touched.hands.left.point, FaceTouchShape.goal(standing, "touchForehead", "left", m).point, 1e-9));
  TestValidator.predicate("the elbow is out at the side", touched.hands.left.elbow.x > standing.pelvis.x + m.shoulderHalfWidth);
  for (const own of [0, natural])
    TestValidator.predicate(`no pop at ${own} s`, near(FaceTouchShape.posture(standing, "touchForehead", "left", own, natural, m).hands.left.point, standing.hands.left.point, 1e-9));
}
