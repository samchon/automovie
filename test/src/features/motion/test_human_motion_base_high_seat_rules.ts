import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanChain, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanObject, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanSeated, IAutoMovieMotionHumanSegment, IAutoMovieMotionHumanSignature, IAutoMovieVector3 } from "@automovie/interface";
import { createSeat } from "@automovie/archetypes";

import { HumanChain, HumanFrame, HumanObject, HumanPerformance, HumanRefusal, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A high seat is a base like any other: what a person does seated on a bar
 * stool rests on the stool, a higher stool seats the body higher by exactly
 * the difference, the same film twice is the same film, and what a body
 * cannot do on or with a high seat is refused with what would work.
 *
 * Scenarios, on the average man and the small woman, with a mid-band bar
 * stool read with its foot bar:
 * 1. A drink from the hand taken after sitting on the stool declares the
 *    seat for its whole length, and through it, sampled four times a second
 *    (the hand's way up, the sip and the way down each read, where a seat
 *    pulled by the reaching arm would show), the seat region stays within
 *    10 mm of where the drink began (the campaign's bound for a held
 *    support).
 * 2. The same stool raised 0.10 m seats the seat region 0.10 m higher
 *    within 10 mm: the seat's height is a target, not a posture.
 * 3. The same seed performed twice gives the same root and the same right
 *    ankle at five instants, to 1e-9 m.
 * 4. Refused, each as a `HumanRefusal` naming its axis: sitting on the
 *    stool from 1.5 m away (`reach` on `seat`, with the greatest distance
 *    it works from); a seat 0.10 m high (`reach` on `seat`, with the least
 *    height); a shift along the stool (`base`, offering `rise`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each composition through the public chain on real bodies and reads the placed plans' contacts, the displayed seat region and the refusals; a drink that drops the seat, a seat height ignored, a film that differs between runs or a silent acceptance fails.
 * @evidence contracts/development/testing.md#independent-expectations A raised seat raises the sitter by the same amount, and one seed gives one film, by what a target and a seed are; the 10 mm is the campaign's support bound; the refusals are the documented contract of the sitting actions.
 * @evidence contracts/development/testing.md#distinguishing-cases An act on the high base, a metamorphic pair, a determinism pair and three refusals on three axes, on two bodies of opposite build; the cuts are `test_human_motion_base_mount_cuts`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds eight short performances in memory; both builds, since the stool is a different share of each body's leg.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_base_high_seat_rules(): void {
  const complaints: string[] = [];
  const stool: IAutoMovieMotionHumanObject.IModel = createSeat({ kind: "barStool" });
  const at = (lift: number): IAutoMovieMotionHumanSeated.ISeat =>
    HumanObject.seat(stool, { at: { x: 0, y: lift, z: -0.6 }, yaw: 0 });
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const perform = (
      seat: IAutoMovieMotionHumanSeated.ISeat,
      then: (chain: IAutoMovieMotionHumanChain) => IAutoMovieMotionHumanChain,
      ahead: number = 0.2,
    ): IAutoMovieMotionHumanPerformance =>
      new HumanPerformance({
        seed: "high-seat",
        performers: [
          {
            subject: "a",
            body,
            at: HumanFrame.point(
              { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
              { x: 0, y: 0, z: ahead },
            ),
            yaw: seat.yaw,
            proficiency: { level: "trained" },
          },
        ],
        composition: then(HumanChain.subject("a").sit({ seat, seconds: 0.5 }))
          .node,
      });
    const reading = (performance: IAutoMovieMotionHumanPerformance): IAutoMovieMotionHumanSignature.IReader =>
      HumanSignature.of(performance, "a", body, 0);
    const attempt = <T>(label: string, run: () => T): T | undefined => {
      try {
        return run();
      } catch (error) {
        complaints.push(
          `${name} ${label}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return undefined;
      }
    };

    // 1. A drink taken on the stool rests on the stool.
    const drinking: IAutoMovieMotionHumanPerformance | undefined = attempt(
      "drinking on the stool",
      (): IAutoMovieMotionHumanPerformance =>
        perform(
          at(0),
          (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            chain.handToFace({ task: "drink" }),
        ),
    );
    if (drinking !== undefined) {
      const drink: IAutoMovieMotionHumanSegment.ISegment = drinking.segments("a")[1]!;
      if (
        !drink.plan.contacts.some(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.part === "seat" && c.from <= 1e-9 && c.to >= 1 - 1e-9,
        )
      )
        complaints.push(
          `${name}: a drink on the stool declares ${drink.plan.contacts.map((c: IAutoMovieMotionHumanContactWindow): string => c.part).join(", ")}, the seat for its whole length expected`,
        );
      const reader: IAutoMovieMotionHumanSignature.IReader = reading(drinking);
      const first: IAutoMovieVector3 = HumanSignature.region(
        reader,
        "seat",
        drink.entryTime,
      );
      let moved: number = 0;
      for (const t of HumanSignature.times(drink.entryTime, drink.end, 4)) {
        const now: IAutoMovieVector3 = HumanSignature.region(reader, "seat", t);
        moved = Math.max(
          moved,
          Math.hypot(now.x - first.x, now.y - first.y, now.z - first.z),
        );
      }
      if (moved > 0.01)
        complaints.push(
          `${name}: the seat region moves ${(moved * 1000).toFixed(1)} mm during a drink on the stool, within 10 mm expected`,
        );
    }

    // 2 and 3. A raised stool seats the body higher; one seed is one film.
    const sat = (lift: number): IAutoMovieMotionHumanPerformance | undefined =>
      attempt(
        `sitting on the stool raised ${lift} m`,
        (): IAutoMovieMotionHumanPerformance =>
          perform(at(lift), (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain => chain),
      );
    const low: IAutoMovieMotionHumanPerformance | undefined = sat(0);
    const raised: IAutoMovieMotionHumanPerformance | undefined = sat(0.1);
    const again: IAutoMovieMotionHumanPerformance | undefined = sat(0);
    if (low !== undefined && raised !== undefined) {
      const rise: number =
        HumanSignature.region(
          reading(raised),
          "seat",
          raised.segments("a")[0]!.end,
        ).y -
        HumanSignature.region(reading(low), "seat", low.segments("a")[0]!.end)
          .y;
      if (Math.abs(rise - 0.1) > 0.01)
        complaints.push(
          `${name}: a stool raised 0.100 m seats the body ${rise.toFixed(3)} m higher, 0.100 within 10 mm expected`,
        );
    }
    if (low !== undefined && again !== undefined) {
      const end: number = low.segments("a")[0]!.end;
      for (let k: number = 0; k <= 4; ++k) {
        const t: number = (k / 4) * end;
        const one: IAutoMovieVector3 = low.posture("a", t).root;
        const two: IAutoMovieVector3 = again.posture("a", t).root;
        const ankle = (performance: IAutoMovieMotionHumanPerformance): IAutoMovieVector3 =>
          HumanSignature.joint(reading(performance), t, "rightFoot");
        const off: number = Math.max(
          Math.hypot(one.x - two.x, one.y - two.y, one.z - two.z),
          Math.hypot(
            ankle(low).x - ankle(again).x,
            ankle(low).y - ankle(again).y,
            ankle(low).z - ankle(again).z,
          ),
        );
        if (off > 1e-9)
          complaints.push(
            `${name}: the same seed differs by ${off.toExponential(2)} m at ${t.toFixed(2)} s`,
          );
      }
    }

    // 4. Refusals.
    const refused = (
      label: string,
      kind: string,
      axis: string,
      run: () => IAutoMovieMotionHumanPerformance,
      offers?: string,
    ): void => {
      let thrown: unknown = null;
      try {
        run();
      } catch (error) {
        thrown = error;
      }
      if (
        !(
          thrown instanceof HumanRefusal &&
          thrown.kind === kind &&
          thrown.axis === axis &&
          thrown.feasible !== undefined &&
          thrown.feasible !== null &&
          (offers === undefined ||
            (thrown.feasible.kind === "alternatives" &&
              thrown.feasible.values.includes(offers)))
        )
      )
        complaints.push(
          `${name} ${label}: expected a ${kind} refusal on ${axis} with what is feasible, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
        );
    };
    refused("sitting on the stool from 1.5 m", "reach", "seat", () =>
      perform(at(0), (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain => chain, 1.5),
    );
    refused("sitting on a seat 0.10 m high", "reach", "seat", () =>
      perform(
        { at: { x: 0, y: 0.1, z: -0.6 }, yaw: 0 },
        (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain => chain,
      ),
    );
    refused(
      "shifting along the stool",
      "base",
      "base",
      () =>
        perform(
          at(0),
          (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain => chain.shift({ by: 0.1 }),
        ),
      "rise",
    );
  }
  TestValidator.equals("a high seat is a base with rules", complaints, []);
}
