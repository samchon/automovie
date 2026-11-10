import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type IHumanBody,
  createHumanBody,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";

/**
 * On polygon men of different statures and proportions, sitting brings the
 * seat socket onto the seat, rising stands the body up over its feet, a
 * shift slides the socket along the seat, and the feet never slide.
 *
 * Scenarios, on the small woman, the tall man, the long-armed man and the
 * short-legged man, each sitting on a backless seat at 0.85 and 1.0 of the
 * body's popliteal height whose front edge stands 0.1 m behind the ankles:
 * 1. At `seatContact` and seated, the body's lowest bearing point (the seat
 *    socket or the thighs' undersides at the hips) lies on the seat's
 *    surface within 10 mm, and the socket between the front edge and the
 *    seat's depth.
 * 2. Each planted foot's rolling contact stays within 5 mm in every plant
 *    window of the sit, the shift and the rise (the rise may draw the feet
 *    back between its windows).
 * 3. A shift of 0.1 m to the left moves the socket 0.1 m along the seat
 *    within 10 mm and sets it back on the surface.
 * 4. After the rise the hip joints stand within 3 % of their rest height
 *    and the trunk is upright within 3 degrees.
 * 5. Seats at 0.6 and 1.4 of the popliteal height are refused, a seat the
 *    performer faces is refused, and leaning back on a backless seat is
 *    refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs sit, shift and rise performances and reads posed sockets, joints and sole points; a socket off the seat, a sliding foot, a rise that does not stand up or a missing refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations The seat's surface and edges are the scene's own geometry; 10 mm, 5 mm and the popliteal-ratio band are the campaign's acceptance values; standing height is the body's rest measure.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers four bodies, two seat heights, the three seat actions in sequence and four refusals; the seat arithmetic alone has no CI test because it needs a body.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares polygon men, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_human_motion_everyday_seat(): void {
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  for (const name of ["f-small", "m-tall", "m-long-armed", "m-short-legged"]) {
    const man = MotionBodies.population(name);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const ankle: number = body.rest.get("leftFoot")!.z;
    const performer = {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    };
    for (const share of [0.85, 1.0]) {
      const seat: seated.ISeat = {
        at: { x: 0, y: share * seated.popliteal(body), z: ankle - 0.1 },
        yaw: 0,
        depth: 0.45,
      };
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: `seat-${name}-${share}`,
          performers: [performer],
          composition: HumanChain.subject("a")
            .sit({ seat, seconds: 0.5 })
            .shift({ by: 0.1 })
            .rise().node,
        });
      } catch (error) {
        check(
          `${name} ${share} sit, shift and rise refused: ${(error as Error).message}`,
          false,
        );
        continue;
      }
      const [sitting, shifting, rising] = performance.segments("a");
      const socket = (t: number): IAutoMovieVector3 => {
        const frame = body.surfaces.sockets.seat;
        return resolveAutoMovieHumanoidSurfaces.place(
          frame,
          performance.bones("a", t).get(frame.bone)!,
        ).point;
      };
      const contact: number =
        sitting!.start +
        sitting!.plan.events.find((e) => e.name === "seatContact")!.share *
          sitting!.plan.duration;
      const atContact: IAutoMovieVector3 = socket(contact);
      const bearing = (t: number): number => {
        const b = performance.bones("a", t);
        const hips: number =
          Math.min(
            b.get("leftUpperLeg")!.worldPosition.y,
            b.get("rightUpperLeg")!.worldPosition.y,
          ) - body.measure.thighRadius;
        return Math.min(socket(t).y, hips) - seat.at.y;
      };
      check(
        `${name} ${share} seated bearing ${(bearing(contact) * 1000).toFixed(1)} mm`,
        Math.abs(bearing(contact)) <= 0.01 &&
          Math.abs(bearing(sitting!.end)) <= 0.01,
      );
      check(
        `${name} ${share} socket on the seat (z ${atContact.z.toFixed(3)})`,
        atContact.z <= seat.at.z && atContact.z >= seat.at.z - seat.depth!,
      );
      const before: IAutoMovieVector3 = socket(shifting!.entryTime);
      const after: IAutoMovieVector3 = socket(shifting!.end);
      check(
        `${name} ${share} shift ${((after.x - before.x) * 1000).toFixed(1)} mm`,
        Math.abs(after.x - before.x - 0.1) <= 0.01 &&
          Math.abs(after.y - seat.at.y) <= 0.01,
      );
      check(
        `${name} ${share} slip ${slip(performance, body).toFixed(4)}`,
        slip(performance, body) <= 0.005,
      );
      const end = performance.bones("a", rising!.end);
      const hip: number =
        (end.get("leftUpperLeg")!.worldPosition.y +
          end.get("rightUpperLeg")!.worldPosition.y) /
        2;
      check(
        `${name} ${share} stands up (${hip.toFixed(3)} of ${body.measure.hipHeight.toFixed(3)})`,
        Math.abs(hip / body.measure.hipHeight - 1) <= 0.03,
      );
      const up: IAutoMovieVector3 = Quaternion.rotateVector(
        end.get("hips")!.worldRotation,
        { x: 0, y: 1, z: 0 },
      );
      check(
        `${name} ${share} upright`,
        (Math.acos(Math.min(1, up.y)) * 180) / Math.PI <= 3,
      );
    }
    const refuse = (label: string, seat: seated.ISeat, back?: "lean"): void =>
      TestValidator.error(
        `${name} ${label}`,
        (): unknown =>
          new HumanPerformance({
            seed: "r",
            performers: [performer],
            composition: HumanChain.subject("a").sit({
              seat,
              ...(back === undefined ? {} : { back }),
            }).node,
          }),
      );
    const knee: number = seated.popliteal(body);
    refuse("low seat", { at: { x: 0, y: 0.6 * knee, z: ankle - 0.1 }, yaw: 0 });
    refuse("high seat", {
      at: { x: 0, y: 1.4 * knee, z: ankle - 0.1 },
      yaw: 0,
    });
    refuse("seat faced", { at: { x: 0, y: knee, z: ankle - 0.1 }, yaw: 180 });
    refuse(
      "lean on no back",
      { at: { x: 0, y: knee, z: ankle - 0.1 }, yaw: 0 },
      "lean",
    );
  }
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}

/**
 * The largest slip of a planted foot: within each plant window of the
 * person's actions, the drift of the foot's lowest sole socket (its rolling
 * contact) from where it first became the contact in the window.
 */
function slip(performance: HumanPerformance, body: IHumanBody): number {
  let worst: number = 0;
  for (const segment of performance.segments("a"))
    for (const contact of segment.plan.contacts) {
      if (
        contact.kind !== "plant" ||
        (contact.part !== "leftFoot" && contact.part !== "rightFoot")
      )
        continue;
      const side: "Left" | "Right" =
        contact.part === "leftFoot" ? "Left" : "Right";
      const anchors: Map<string, IAutoMovieVector3> = new Map();
      for (
        let t: number = Math.max(
          segment.entryTime,
          segment.start + contact.from * segment.plan.duration,
        );
        t <=
        Math.min(
          segment.end,
          segment.start + contact.to * segment.plan.duration,
        ) +
          1e-9;
        t += 1 / 24
      ) {
        const bones = performance.bones("a", t);
        let lowest: [string, IAutoMovieVector3] | undefined;
        for (const name of ["heel", "ball", "toe"] as const) {
          const frame = body.surfaces.sockets[`${name}${side}`];
          const p: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
            frame,
            bones.get(frame.bone)!,
          ).point;
          if (lowest === undefined || p.y < lowest[1].y - 1e-6)
            lowest = [name, p];
        }
        const [name, p] = lowest!;
        const anchor: IAutoMovieVector3 = anchors.get(name) ?? p;
        anchors.set(name, anchor);
        worst = Math.max(
          worst,
          Vector3.length({ x: p.x - anchor.x, y: 0, z: p.z - anchor.z }),
        );
      }
    }
  return worst;
}
