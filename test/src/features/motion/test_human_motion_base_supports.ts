import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditBalance,
  AutoMovieMotionHumanAuditMotion,
  HumanChain,
  HumanPerformance,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An act performed in the posture a person is already in keeps what that
 * posture rests on: a drink taken seated stays on the seat, declares the
 * seat, and is not judged as a body standing on its feet.
 *
 * Sitting down changes what carries the body; drinking does not. So an act
 * that leaves the root and the legs alone takes the supports of the state it
 * is entered from, whatever they are, instead of assuming two feet on the
 * ground.
 *
 * Scenarios, on the average man and the small woman, with a chair as high
 * as the body's popliteal height:
 * 1. Standing, a drink declares both feet planted on the ground for its
 *    whole length and no seat.
 * 2. Seated (after `sit`), the same drink declares both feet and the seat
 *    for its whole length.
 * 3. Through the seated drink, sampled ten times a second, the body's seat
 *    region stays within 10 mm of where it rested when the drink began, and
 *    each ankle within 5 mm: the base holds.
 * 4. At no instant of the seated drink does the standing balance bound read
 *    the body as borne by its feet alone: a seated body is not a standing
 *    one.
 * 5. A pat on the own chest taken seated declares the seat as well: the
 *    rule is the base's, not one action's.
 *
 * The seated drink and the pat share one film, sit, drink, pat, so the sit
 * is performed once for both. The pat is then entered from the seated drink
 * rather than straight from the sit; both entries are the seated base, which
 * a drink keeps by scenario 2, so the pat still reads what an act taken
 * seated declares, and it also shows the seat passed on through an act that
 * keeps it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the chains on real bodies and reads the placed plans' declared contacts, displayed joints and the balance audit's own reading of which instants stand; an act that drops the seat, slides on it or is judged as standing fails.
 * @evidence contracts/development/testing.md#independent-expectations What a seated person rests on is the seat and the feet, by what sitting is; the 10 mm and 5 mm are the campaign's support and slip bounds, not readings of the law.
 * @evidence contracts/development/testing.md#distinguishing-cases The same act on two bases, a second act on the seated base, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men, so it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds.
 */
export function test_human_motion_base_supports(): void {
  const complaints: string[] = [];
  const whole = (
    contacts: readonly IAutoMovieMotionHumanContactWindow[],
    part: IAutoMovieMotionHumanContactWindow["part"],
  ): boolean =>
    contacts.some(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.part === part && c.from <= 1e-9 && c.to >= 1 - 1e-9,
    );
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const chair: IAutoMovieMotionHumanSeated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(body),
        z: body.rest.get("leftFoot")!.z - 0.1,
      },
      yaw: 0,
      depth: 0.45,
    };
    const perform = (
      chain: IAutoMovieMotionHumanChain,
    ): IAutoMovieMotionHumanPerformance =>
      new HumanPerformance({
        seed: "base",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: chain.node,
      });

    // 1. Standing: the feet, no seat.
    const stood: readonly IAutoMovieMotionHumanContactWindow[] = perform(
      HumanChain.subject("a").handToFace({ task: "drink", seconds: 0.3 }),
    ).segments("a")[0]!.plan.contacts;
    if (
      !whole(stood, "leftFoot") ||
      !whole(stood, "rightFoot") ||
      stood.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean => c.part === "seat",
      )
    )
      complaints.push(
        `${name}: a standing drink declares ${stood.map((c) => c.part).join(", ")}, both feet and no seat expected`,
      );

    // 2 and 5. Seated: the feet and the seat, for a drink and for a pat, one
    // film after one sit.
    const drinking: IAutoMovieMotionHumanPerformance = perform(
      HumanChain.subject("a")
        .sit({ seat: chair, seconds: 0.5 })
        .handToFace({ task: "drink", seconds: 0.3 })
        .touch({
          target: { kind: "self", region: "sternum" },
          kind: "pat",
          count: 1,
        }),
    );
    for (const [label, index] of [
      ["drink", 1],
      ["pat", 2],
    ] as const) {
      const contacts: readonly IAutoMovieMotionHumanContactWindow[] =
        drinking.segments("a")[index]!.plan.contacts;
      if (
        !whole(contacts, "leftFoot") ||
        !whole(contacts, "rightFoot") ||
        !whole(contacts, "seat")
      )
        complaints.push(
          `${name}: a seated ${label} declares ${contacts.map((c) => c.part).join(", ")}, both feet and the seat expected`,
        );
    }

    // 3. The base holds through the drink.
    const drink: IAutoMovieMotionHumanSegment = drinking.segments("a")[1]!;
    const windows: ReturnType<typeof AutoMovieMotionHumanAuditMotion.windows> =
      AutoMovieMotionHumanAuditMotion.windows(drinking, "a");
    const seat: typeof body.surfaces.regions.seat = body.surfaces.regions.seat;
    const entry: ReturnType<typeof drinking.bones> = drinking.bones("a", drink.entryTime);
    const origins: readonly IAutoMovieVector3[] = [
      resolveAutoMovieHumanoidSurfaces.place(seat, entry.get(seat.bone)!).point,
      entry.get("leftFoot")!.worldPosition,
      entry.get("rightFoot")!.worldPosition,
    ];
    // Read all three supports from one displayed skeleton per instant. The
    // final interval can be shorter than 100 ms, so include its endpoint.
    for (let i: number = 0; i <= Math.ceil((drink.end - drink.entryTime) * 10); i++) {
      const t: number = Math.min(drink.end, drink.entryTime + i / 10);
      const bones: typeof entry = i === 0 ? entry : drinking.bones("a", t);
      const positions: readonly IAutoMovieVector3[] = [
        resolveAutoMovieHumanoidSurfaces.place(seat, bones.get(seat.bone)!).point,
        bones.get("leftFoot")!.worldPosition,
        bones.get("rightFoot")!.worldPosition,
      ];
      for (const [index, label] of ["seat", "left ankle", "right ankle"].entries()) {
        const limit: number = index === 0 ? 0.01 : 0.005;
        const drift: number = Vector3.distance(origins[index]!, positions[index]!);
        if (!(drift <= limit))
          complaints.push(`${name}: ${label} moves ${drift * 1000} mm at ${t} s, limit ${limit * 1000} mm`);
      }
      if (AutoMovieMotionHumanAuditBalance.standing(windows, t))
        complaints.push(`${name}: feet alone bear the seated drink at ${t} s`);
    }
  }
  TestValidator.equals("an act keeps its base's supports", complaints, []);
}
