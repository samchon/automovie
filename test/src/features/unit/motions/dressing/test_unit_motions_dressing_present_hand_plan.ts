import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanHand, presentHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** The touch contract's placement bound, metres: 10 mm. */
const GRIP: number = 0.01;

/** Samples of the held presentation. */
const HELD: number = 24;

/**
 * `presentHand`'s plan holds a hand out where the arm reaches with the upper
 * arm hanging and the forearm level ahead, inward of the shoulder's half
 * width, from `ready` to `relax`.
 *
 * Scenarios, the small woman's left hand and the average man's right, facing
 * -Z (yaw 180), read on the displayed arm at `ready`:
 *
 * 1. The elbow lies the upper arm's length below the shoulder, within 10 mm.
 * 2. The palm lies at the elbow's height, within 10 mm.
 * 3. Read level, the palm lies ahead of the elbow by the forearm and the palm
 *    socket's reach along the fingers, within 10 mm.
 * 4. The palm lies between the midline and the shoulder on its own side.
 * 5. The palm holds within 10 mm from `ready` to `relax`.
 */
export async function test_unit_motions_dressing_present_hand_plan(): Promise<void> {
  for (const [name, hand] of [
    ["f-small", "left"],
    ["m-average", "right"],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    const plan: IAutoMovieMotionHumanActionPlan = presentHand.plan(
      motionActionContext(body, { side: hand, hold: 8 }, { yaw: 180 }),
    );
    const ready: number = R.event(plan, "ready")!;
    const relax: number = R.event(plan, "relax")!;
    const label: string = `${name} ${hand}`;
    const forward: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
    const outward: IAutoMovieVector3 = { x: hand === "left" ? -1 : 1, y: 0, z: 0 };
    const palm = (t: number): IAutoMovieVector3 =>
      HumanHand.frame(body, R.bones(body, plan, t), hand as AutoMovieHumanSide, "palm", "flat").point;
    const bones: ReturnType<typeof R.bones> = R.bones(body, plan, ready);
    const shoulder: IAutoMovieVector3 = bones.get(`${hand}UpperArm`)!.worldPosition;
    const elbow: IAutoMovieVector3 = bones.get(`${hand}LowerArm`)!.worldPosition;
    const hips: IAutoMovieVector3 = bones.get("hips")!.worldPosition;
    const at: IAutoMovieVector3 = palm(ready);

    TestValidator.predicate(
      `${label}: the upper arm hangs`,
      Math.abs(shoulder.y - elbow.y - body.measure.upperArm) <= GRIP,
    );
    TestValidator.predicate(
      `${label}: the forearm lies level`,
      Math.abs(at.y - elbow.y) <= GRIP,
    );
    const socket: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.sockets[hand === "left" ? "palmLeft" : "palmRight"];
    const expected: number =
      body.measure.forearm + Vector3.dot(socket.point, socket.forward!);
    const level: IAutoMovieVector3 = { ...Vector3.subtract(at, elbow), y: 0 };
    TestValidator.predicate(
      `${label}: the palm a forearm and its socket's reach ahead`,
      Math.abs(Vector3.length(level) - expected) <= GRIP &&
        Vector3.dot(level, forward) > 0,
    );
    const out: number = Vector3.dot(Vector3.subtract(at, hips), outward);
    TestValidator.predicate(
      `${label}: inward of the shoulder`,
      out >= -GRIP && out <= body.measure.shoulderHalfWidth + GRIP,
    );
    let moved: number = 0;
    for (let i: number = 1; i <= HELD; ++i)
      moved = Math.max(
        moved,
        Vector3.distance(palm(ready + ((relax - ready) * i) / HELD), at),
      );
    TestValidator.predicate(`${label}: held (${moved} m)`, moved <= GRIP);
  }
}
