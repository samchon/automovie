import { createHorse, createMotorcycle } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanFrame,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanContactWindow,
  type seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * People get astride the saddles roads and stables have and get off them
 * again: a motorcycle's seat, a bicycle's saddle and a horse's saddle,
 * with a foot on each peg, pedal or stirrup, or hanging where there is
 * none.
 *
 * The seat region comes to rest on the saddle at the saddle's own height.
 * Getting off ends in a quiet stance on the floor. While a foot is
 * declared planted, on the floor or on a rest, it does not slip. The seats
 * sat with the legs ahead are `test_human_motion_base_seat_heights`'s.
 *
 * Scenarios, with mid-band archetypes (motorcycle 0.795 m, horse saddle
 * 1.645 m), each body standing 0.6 m to the left of the saddle, sitting
 * astride and getting off to the left: the small woman on the motorcycle,
 * the average man on the horse and the large man on the horse's saddle
 * without its stirrups. Three pairs are what the claim needs: the lowest
 * and the highest saddle with their rests, the highest once without, and
 * all three statures; a bicycle's saddle lies between them and is mounted
 * with its pedals by `test_human_motion_ride_pedals`.
 * 1. Each pair plans.
 * 2. Seated, the body's seat region rests within 10 mm of the saddle's
 *    height (the campaign's contact bound through a hold).
 * 3. Seated with no rest, both soles hang at least 20 mm clear of the
 *    floor; a foot declared planted on a rest has the ball of the foot
 *    within 15 mm of the rest's tread.
 * 4. Through every plant window the sitting and the getting off declare,
 *    read at four instants spread over it (its two ends and two between,
 *    where a planted foot that follows the moving pelvis shows), the
 *    foot's ball moves at most 5 mm (the campaign's slip bound).
 * 5. After getting off, both feet bear on the floor, both knees are within
 *    15 degrees of straight and the hip joints stand within 20 mm of their
 *    height in the quiet stance the film began with.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds mounting and getting off through the public chain and reads the displayed seat region, soles, knees and hips; a refused saddle, a body hovering over or sunk into it, a foot through the floor, a sliding plant or a body left crouched fails.
 * @evidence contracts/development/testing.md#independent-expectations That adults ride these is what they are made for; the heights are the archetypes' cited bands, the 5, 10 and 15 mm are the campaign's slip and contact bounds, and a quiet stance is the film's own first posture. The 15 degree knee, the 20 mm clearance and the 20 mm on the hips' height are provisional reading margins. Limitation: it reads where the body ends and whether its plants hold, not how a person really climbs onto a saddle, which no cited measurement here describes.
 * @evidence contracts/development/testing.md#distinguishing-cases Two saddle heights up to four times the popliteal height, with and without rests, by three statures.
 * @evidence contracts/development/testing.md#execution-ownership Prepares three polygon men and builds 3 short performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds and sources.
 */
export function test_human_motion_base_saddle_heights(): void {
  const complaints: string[] = [];
  const where: HumanObject.Placement = {
    at: { x: 0, y: 0, z: -0.6 },
    yaw: 0,
  };
  const horse: HumanObject.IModel = createHorse({});

  // A saddle with its rests removed is one whose feet must hang.
  const bare = (model: HumanObject.IModel): seated.ISeat => {
    const { footrests: _rests, ...seat }: seated.ISeat = HumanObject.seat(
      model,
      where,
    );
    return seat;
  };
  const pairs: readonly (readonly [
    "f-small" | "m-average" | "m-large",
    string,
    seated.ISeat,
  ])[] = [
    [
      "f-small",
      "a motorcycle",
      HumanObject.seat(createMotorcycle({ kind: "motorcycle" }), where),
    ],
    ["m-average", "a horse", HumanObject.seat(horse, where)],
    ["m-large", "a horse's saddle without its stirrups", bare(horse)],
  ];
  for (const [name, kind, seat] of pairs) {
    const body: IHumanBody = motionHumanBody(name);
    const label: string = `${name} on ${kind}`;
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "seats",
        performers: [
          {
            subject: "a",
            body,
            at: HumanFrame.point(
              { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
              { x: 0.6, y: 0, z: -0.2 },
            ),
            yaw: seat.yaw,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").sit({ seat, seconds: 1 }).rise()
          .node,
      });
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      seat.yaw,
    );
    const [sitting, rising]: readonly (HumanSegment.ISegment | undefined)[] =
      performance.segments("a");
    if (sitting === undefined || rising === undefined) {
      complaints.push(
        `${label}: the sitting or the getting off was not placed`,
      );
      continue;
    }
    const ball = (side: "left" | "right", t: number): IAutoMovieVector3 =>
      HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
        (s: HumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point;

    // 2. The seat region rests at the saddle's height.
    const seatedAt: number = sitting.end - 0.05;
    const rests: number = HumanSignature.region(reader, "seat", seatedAt).y;
    if (Math.abs(rests - seat.at.y) > 0.01)
      complaints.push(
        `${label}: the seat region rests at ${rests.toFixed(3)} m, within 10 mm of the saddle's ${seat.at.y.toFixed(3)} m expected`,
      );

    // 3. Off the floor: on a rest, or hanging clear.
    for (const side of ["left", "right"] as const) {
      const planted: boolean = sitting.plan.contacts.some(
        (c: IHumanContactWindow): boolean =>
          c.part === `${side}Foot` && c.kind === "plant" && c.to >= 1 - 1e-9,
      );
      const tread: IAutoMovieVector3 | undefined = seat.footrests?.[side];
      if (planted && tread !== undefined) {
        const at: IAutoMovieVector3 = ball(side, seatedAt);
        const off: number = Math.hypot(
          at.x - tread.x,
          at.y - tread.y,
          at.z - tread.z,
        );
        if (off > 0.015)
          complaints.push(
            `${label}: the ${side} foot's ball rests ${(off * 1000).toFixed(1)} mm from its rest, within 15 mm expected`,
          );
      } else if (!planted && tread === undefined) {
        const sole: number = HumanSignature.sole(reader, seatedAt, side).y;
        if (sole < 0.02)
          complaints.push(
            `${label}: the hanging ${side} sole is at ${(sole * 1000).toFixed(1)} mm, at least 20 mm clear of the floor expected`,
          );
      }
    }

    // 4. No declared plant slips.
    for (const segment of [sitting, rising])
      for (const c of segment.plan.contacts) {
        if (c.kind !== "plant" || !c.part.endsWith("Foot")) continue;
        const side: "left" | "right" = c.part === "leftFoot" ? "left" : "right";
        const from: number = Math.max(
          segment.entryTime,
          segment.start + c.from * segment.plan.duration,
        );
        const to: number = Math.min(
          segment.end,
          segment.start + c.to * segment.plan.duration,
        );
        if (to - from < 0.1) continue;
        const first: IAutoMovieVector3 = ball(side, from + 0.02);
        let slip: number = 0;
        for (const t of HumanSignature.times(
          from + 0.02,
          to - 0.02,
          3 / (to - from - 0.04),
        )) {
          const now: IAutoMovieVector3 = ball(side, t);
          slip = Math.max(
            slip,
            Math.hypot(now.x - first.x, now.y - first.y, now.z - first.z),
          );
        }
        if (slip > 0.005)
          complaints.push(
            `${label}: the ${side} foot's ball moves ${(slip * 1000).toFixed(1)} mm while planted from ${from.toFixed(2)} to ${to.toFixed(2)} s of ${segment.name}, within 5 mm expected`,
          );
      }

    // 5. Got off, the body stands as it stood.
    const end: number = rising.end;
    const hips = (t: number): number =>
      (HumanSignature.joint(reader, t, "leftUpperLeg").y +
        HumanSignature.joint(reader, t, "rightUpperLeg").y) /
      2;
    for (const side of ["left", "right"] as const) {
      if (!HumanSignature.bears(reader, end, side))
        complaints.push(
          `${label}: after getting off the ${side} foot does not bear on the floor`,
        );
      const knee: number = HumanSignature.knee(reader, end, side);
      if (knee > 15)
        complaints.push(
          `${label}: after getting off the ${side} knee is flexed ${knee.toFixed(1)} degrees, within 15 of straight expected`,
        );
    }
    if (Math.abs(hips(end) - hips(0)) > 0.02)
      complaints.push(
        `${label}: after getting off the hips stand at ${hips(end).toFixed(3)} m, within 20 mm of the quiet stance's ${hips(0).toFixed(3)} m expected`,
      );
  }
  TestValidator.equals("people mount saddles and get off", complaints, []);
}
