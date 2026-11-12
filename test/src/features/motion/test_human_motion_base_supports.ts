import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditBalance,
  HumanChain,
  HumanPerformance,
  HumanSignature,
  IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  type IHumanContactWindow,
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
 * @evidence contracts/development/testing.md#behavioral-verification Performs the chains on real bodies and reads the placed plans' declared contacts, displayed joints and the balance audit's own reading of which instants stand; an act that drops the seat, slides on it or is judged as standing fails.
 * @evidence contracts/development/testing.md#independent-expectations What a seated person rests on is the seat and the feet, by what sitting is; the 10 mm and 5 mm are the campaign's support and slip bounds, not readings of the law.
 * @evidence contracts/development/testing.md#distinguishing-cases The same act on two bases, a second act on the seated base, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men, so it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds.
 */
export function test_human_motion_base_supports(): void {
  const complaints: string[] = [];
  const whole = (
    contacts: readonly IHumanContactWindow[],
    part: IHumanContactWindow["part"],
  ): boolean =>
    contacts.some(
      (c: IHumanContactWindow): boolean =>
        c.part === part && c.from <= 1e-9 && c.to >= 1 - 1e-9,
    );
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const chair: seated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(body),
        z: body.rest.get("leftFoot")!.z - 0.1,
      },
      yaw: 0,
      depth: 0.45,
    };
    const perform = (chain: HumanChain): HumanPerformance =>
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
    const sitting = (): HumanChain =>
      HumanChain.subject("a").sit({ seat: chair, seconds: 0.5 });

    // 1. Standing: the feet, no seat.
    const stood = perform(
      HumanChain.subject("a").handToFace({ task: "drink", seconds: 0.3 }),
    ).segments("a")[0]!.plan.contacts;
    if (
      !whole(stood, "leftFoot") ||
      !whole(stood, "rightFoot") ||
      stood.some((c: IHumanContactWindow): boolean => c.part === "seat")
    )
      complaints.push(
        `${name}: a standing drink declares ${stood.map((c) => c.part).join(", ")}, both feet and no seat expected`,
      );

    // 2 and 5. Seated: the feet and the seat, for a drink and for a pat.
    const drinking: HumanPerformance = perform(
      sitting().handToFace({ task: "drink", seconds: 0.3 }),
    );
    const patting: HumanPerformance = perform(
      sitting().touch({
        target: { kind: "self", region: "sternum" },
        kind: "pat",
        count: 1,
      }),
    );
    for (const [label, performance] of [
      ["drink", drinking],
      ["pat", patting],
    ] as const) {
      const contacts = performance.segments("a")[1]!.plan.contacts;
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
    const drink = drinking.segments("a")[1]!;
    const reader: HumanSignature.IReader = HumanSignature.of(
      drinking,
      "a",
      body,
      0,
    );
    const moved = (
      read: (t: number) => IAutoMovieVector3,
    ): { metres: number; seconds: number } => {
      const origin: IAutoMovieVector3 = read(drink.entryTime);
      let worst: { metres: number; seconds: number } = {
        metres: 0,
        seconds: drink.entryTime,
      };
      for (let t: number = drink.entryTime; t <= drink.end; t += 0.1) {
        const at: IAutoMovieVector3 = read(t);
        const metres: number = Math.hypot(
          at.x - origin.x,
          at.y - origin.y,
          at.z - origin.z,
        );
        if (metres > worst.metres) worst = { metres, seconds: t };
      }
      return worst;
    };
    const seat = moved(
      (t: number): IAutoMovieVector3 =>
        HumanSignature.region(reader, "seat", t),
    );
    if (seat.metres > 0.01)
      complaints.push(
        `${name}: the seat region moves ${(seat.metres * 1000).toFixed(1)} mm during the seated drink (at ${seat.seconds.toFixed(2)} s), within 10 mm expected`,
      );
    for (const side of ["left", "right"] as const) {
      const ankle = moved(
        (t: number): IAutoMovieVector3 =>
          HumanSignature.joint(reader, t, `${side}Foot`),
      );
      if (ankle.metres > 0.005)
        complaints.push(
          `${name}: the ${side} ankle moves ${(ankle.metres * 1000).toFixed(1)} mm during the seated drink, within 5 mm expected`,
        );
    }

    // 4. A seated body is not judged as standing: at no instant of the drink
    // do the feet alone bear it.
    const windows = IAutoMovieMotionHumanAuditMotion.windows(drinking, "a");
    for (let t: number = drink.entryTime; t <= drink.end; t += 0.1)
      if (AutoMovieMotionHumanAuditBalance.standing(windows, t)) {
        complaints.push(
          `${name}: at ${t.toFixed(2)} s the seated drink is read as a body standing on its feet alone`,
        );
        break;
      }
  }
  TestValidator.equals("an act keeps its base's supports", complaints, []);
}
