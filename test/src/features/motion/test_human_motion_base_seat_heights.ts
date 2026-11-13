import {
  createBicycle,
  createHorse,
  createMotorcycle,
  createSeat,
} from "@automovie/archetypes";
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
 * People sit on the seats rooms, roads and stables have, and get off them
 * again: a dining chair, with the feet short of the floor if the sitter is
 * small; a bar stool, with the feet on its bar; and a motorcycle's seat, a
 * bicycle's saddle and a horse's saddle, astride with a foot on each peg,
 * pedal or stirrup.
 *
 * A seat higher than a body's legs reach from is not sat on with the feet
 * on the floor. The feet leave it for the seat's rests, or hang, and the
 * seat region comes to rest on the seat at the seat's own height. Getting
 * off ends in a quiet stance on the floor. While a foot is declared
 * planted, on the floor or on a rest, it does not slip.
 *
 * Scenarios, on the small woman, the average man and the large man, with
 * mid-band archetypes (dining chair 0.444 m, bar stool 0.787 m, motorcycle
 * 0.795 m, bicycle saddle 0.954 m, horse saddle 1.645 m):
 * 1. Each sits with the legs ahead on the dining chair, on the bar stool
 *    with its bar left out, so the feet must hang, and on a scooter's seat
 *    with the feet on its floorboard, standing 0.2 m ahead of the front
 *    edge with the back to it, and gets off.
 * 2. Each sits on the bar stool with its foot bar, and astride the
 *    motorcycle, the bicycle and the horse, with their pegs, pedals and
 *    stirrups and, for the bicycle and the horse, also with them left out,
 *    standing 0.6 m to the left of the saddle, and gets off to the left.
 * 7. The bicycle's, the horse's and the motorcycle's seats read as sat
 *    astride and the chair's, the stool's and the scooter's as sat with the
 *    legs ahead: the object says which, and no test restates it.
 * The seats of scenario 1 and the stool of scenario 2 are performed here,
 * each once: the small woman on the dining chair, the large man on the
 * bare stool, the average man on the scooter and on the stool with its
 * bar. The saddles sat astride are performed by
 * `test_human_motion_base_saddle_heights`. Four pairs are enough because
 * every seat's geometry is read once and all three statures appear; the
 * other pairs would repeat a seat already read on another stature.
 * Scenarios 3 to 6 are read on each.
 * 3. Seated, the body's seat region rests within 10 mm of the seat's
 *    height (the campaign's contact bound through a hold).
 * 4. Seated on a seat above 1.2 of the body's popliteal height with no rest
 *    in reach, both soles hang at least 20 mm clear of the floor; a foot
 *    declared planted on a rest has the ball of the foot within 15 mm of
 *    the rest's tread.
 * 5. Through every plant window the sitting and the getting off declare,
 *    read at four instants spread over it (its two ends and two between,
 *    where a planted foot that follows the moving pelvis shows), the
 *    foot's ball moves at most 5 mm (the campaign's slip bound).
 * 6. After getting off, both feet bear on the floor, both knees are within
 *    15 degrees of straight and the hip joints stand within 20 mm of their
 *    height in the quiet stance the film began with.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds sitting and getting off through the public chain and reads the displayed seat region, soles, knees and hips; a refused seat, a body hovering over or sunk into the seat, a foot through the floor, a sliding plant or a body left crouched fails.
 * @evidence contracts/development/testing.md#independent-expectations That adults sit on these seats is what the seats are made for; the heights are the archetypes' cited bands, the 5, 10 and 15 mm are the campaign's slip and contact bounds, and a quiet stance is the film's own first posture, not a reading of the laws under test. The 15 degree knee, the 20 mm clearance and the 20 mm on the hips' height are provisional reading margins. Limitation: it reads where the body ends and whether its plants hold, not how a person really climbs onto a saddle, which no cited measurement here describes.
 * @evidence contracts/development/testing.md#distinguishing-cases Five seat heights from inside the band to four times the popliteal height, with and without rests, legs ahead and astride, by three statures.
 * @evidence contracts/development/testing.md#execution-ownership Prepares three polygon men and builds 4 short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 7 scenarios with their bounds and sources.
 */
export function test_human_motion_base_seat_heights(): void {
  const complaints: string[] = [];
  const where: HumanObject.Placement = {
    at: { x: 0, y: 0, z: -0.6 },
    yaw: 0,
  };
  const stool: HumanObject.IModel = createSeat({ kind: "barStool" });
  const motorcycle: HumanObject.IModel = createMotorcycle({
    kind: "motorcycle",
  });
  const bicycle: HumanObject.IModel = createBicycle({});
  const horse: HumanObject.IModel = createHorse({});
  const scooter: HumanObject.IModel = createMotorcycle({ kind: "scooter" });

  // A seat with its rests removed is one whose feet must hang.
  const bare = (model: HumanObject.IModel): seated.ISeat => {
    const { footrests: _rests, ...seat }: seated.ISeat = HumanObject.seat(
      model,
      where,
    );
    return seat;
  };
  const seats: readonly (readonly [string, seated.ISeat])[] = [
    ["a dining chair", HumanObject.seat(createSeat({ kind: "dining" }), where)],
    ["a bar stool without its bar", bare(stool)],
    ["a scooter's seat", HumanObject.seat(scooter, where)],
    ["a bicycle's saddle without its pedals", bare(bicycle)],
    ["a horse's saddle without its stirrups", bare(horse)],
    ["a bar stool with its bar", HumanObject.seat(stool, where)],
    ["a motorcycle astride", HumanObject.seat(motorcycle, where)],
    ["a bicycle astride", HumanObject.seat(bicycle, where)],
    ["a horse astride", HumanObject.seat(horse, where)],
  ];

  // 7. Which seats are sat astride is the object's own statement.
  for (const [kind, seat] of seats) {
    const saddle: boolean = /bicycle|horse|motorcycle/.test(kind);
    if ((seat.astride === true) !== saddle)
      complaints.push(
        `${kind} reads as ${seat.astride === true ? "sat astride" : "sat with the legs ahead"}, ${saddle ? "astride" : "the legs ahead"} expected`,
      );
  }
  const names: readonly ["f-small", "m-average", "m-large"] = [
    "f-small",
    "m-average",
    "m-large",
  ];
  for (let b: number = 0; b < names.length; ++b) {
    const name: "f-small" | "m-average" | "m-large" = names[b]!;
    const body: IHumanBody = motionHumanBody(name);
    for (let s: number = 0; s < seats.length; ++s) {
      const [kind, seat]: readonly [string, seated.ISeat] = seats[s]!;
      // Each seat sat with the legs ahead is performed once, on the body its place in the two lists gives it; the saddles are the saddle test's.
      const astride: boolean = seat.astride === true;
      if ((b + s) % 3 !== 0 || astride) continue;
      const label: string = `${name} on ${kind}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "seats",
          performers: [
            {
              subject: "a",
              body,

              // Ahead of the front edge, or beside the saddle on its left.
              at: HumanFrame.point(
                { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
                astride ? { x: 0.6, y: 0, z: -0.2 } : { x: 0, y: 0, z: 0.2 },
              ),
              yaw: seat.yaw,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .sit({ seat, seconds: 1 })
            .rise().node,
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

      // 3. The seat region rests at the seat's height.
      const seatedAt: number = sitting.end - 0.05;
      const rests: number = HumanSignature.region(reader, "seat", seatedAt).y;
      if (Math.abs(rests - seat.at.y) > 0.01)
        complaints.push(
          `${label}: the seat region rests at ${rests.toFixed(3)} m, within 10 mm of the seat's ${seat.at.y.toFixed(3)} m expected`,
        );

      // 4. Off the floor: on a rest, or hanging clear.
      const high: boolean =
        seat.at.y >
        1.2 *
          (body.measure.ankleHeight +
            body.measure.shank -
            body.measure.thighRadius);
      for (const side of ["left", "right"] as const) {
        const planted: boolean = sitting.plan.contacts.some(
          (c: IHumanContactWindow): boolean =>
            c.part === `${side}Foot` && c.kind === "plant" && c.to >= 1 - 1e-9,
        );
        const tread: IAutoMovieVector3 | undefined = seat.footrests?.[side];
        if (planted && tread !== undefined && high) {
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
        } else if (high && !planted) {
          const sole: number = HumanSignature.sole(reader, seatedAt, side).y;
          if (sole < 0.02)
            complaints.push(
              `${label}: the hanging ${side} sole is at ${(sole * 1000).toFixed(1)} mm, at least 20 mm clear of the floor expected`,
            );
        }
      }

      // 5. No declared plant slips.
      for (const segment of [sitting, rising])
        for (const c of segment.plan.contacts) {
          if (c.kind !== "plant" || !c.part.endsWith("Foot")) continue;
          const side: "left" | "right" =
            c.part === "leftFoot" ? "left" : "right";
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

      // 6. Got off, the body stands as it stood.
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
  }
  TestValidator.equals("people sit on high seats and get off", complaints, []);
}
