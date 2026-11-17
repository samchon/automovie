import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanSegment } from "@automovie/interface";
import { createPlyoBox } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import { HumanChain, HumanFoot, HumanGymnastics, HumanObject, HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * A two-hand box vault (`HumanGymnastics.boxVault`, the squat vault law)
 * lays the hands on the box, flies over it and lands beyond it, on the
 * average man and the small woman.
 *
 * The box is a 30 inch plyometric box (`createPlyoBox`, its tallest common
 * height), stood with its near side half the arm's length ahead of the
 * quiet stance's toes, where a body standing at it lays its hands
 * (provisional placement). Its far edge is read from its own geometry: its
 * place along the heading plus half its declared depth.
 *
 * Scenarios, on each body:
 * 1. The vault plans and is placed under its row's name.
 * 2. No contact window is open strictly between the push-off (`tucked`)
 *    and `touchdown`: the body flies, borne by nothing.
 * 3. At `touchdown` both heels lie beyond the box's far edge along the
 *    heading: the feet land past the box, not on or before it.
 * 4. Both feet are planted from `touchdown` to the end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the vault through the public chain with a real archetype box and reads the plan's windows and events and the displayed feet; a vault that lands on or before the box, or that leans on something in flight, fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The far edge is the box's own placement and declared depth; the flight's emptiness and the landing beyond it are what a vault over a box is.
 * @evidence contracts/development/testing.md#distinguishing-cases The push-off, the flight and the landing, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one performance each in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the box and its placement, how the far edge is read and the 4 scenarios.
 */
export function test_human_motion_gymnastics_box_vault(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const box: ReturnType<typeof createPlyoBox> = createPlyoBox({
    height: 0.762,
  });
  const depth: number = box.dimensions.depth!;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stance = motionHumanStance(body);
    const toes: number = Math.max(
      stance.get("leftToes")!.worldPosition.z,
      stance.get("rightToes")!.worldPosition.z,
    );
    const middle: number =
      toes + (body.measure.upperArm + body.measure.forearm) / 2 + depth / 2;
    const far: number = middle + depth / 2;
    let film: IAutoMovieMotionHumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "box-vault",
        laws: [HumanGymnastics.boxVault],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("box", box, {
            position: { x: 0, y: 0, z: middle },
            rotation: Quaternion.identity(),
          }),
        ],
        composition: HumanChain.subject("a").registered("boxVault", {
          on: "box",
        }).node,
      });
      film.segments("a");
    } catch (error) {
      complaints.check(`${name}: refused, ${(error as Error).message}`, false);
      continue;
    }

    // 1. Placed under its name.
    const vault: IAutoMovieMotionHumanSegment.ISegment | undefined = film
      .segments("a")
      .find((s: IAutoMovieMotionHumanSegment.ISegment): boolean => s.name === "boxVault");
    complaints.check(`${name}: placed as boxVault`, vault !== undefined);
    if (vault === undefined) continue;
    const share = (event: string): number | undefined =>
      vault.plan.events.find(
        (e: { name: string; share: number }): boolean => e.name === event,
      )?.share;
    const push: number | undefined = share("tucked");
    const down: number | undefined = share("touchdown");
    complaints.check(
      `${name}: push-off at ${push?.toFixed(3)} before touchdown at ${down?.toFixed(3)}`,
      push !== undefined && down !== undefined && push < down,
    );
    if (push === undefined || down === undefined) continue;

    // 2. Nothing bears in flight.
    const bearing: string[] = vault.plan.contacts
      .filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.from < down - 1e-9 && w.to > push + 1e-9,
      )
      .map(
        (w: IAutoMovieMotionHumanContactWindow): string =>
          `${w.part} ${w.from.toFixed(3)}-${w.to.toFixed(3)}`,
      );
    complaints.check(
      `${name}: no support in flight, read ${bearing.join(", ") || "none"}`,
      bearing.length === 0,
    );

    // 3. The heels land beyond the far edge.
    const t: number = vault.start + down * vault.plan.duration;
    const bones = film.bones("a", t);
    for (const side of ["left", "right"] as const) {
      const heel: number = HumanFoot.sockets(body, bones, side)[0]!.point.z;
      complaints.check(
        `${name}: the ${side} heel lands at ${heel.toFixed(3)} m, beyond the far edge at ${far.toFixed(3)} m`,
        heel > far,
      );
    }

    // 4. Both feet planted from touchdown to the end.
    for (const part of ["leftFoot", "rightFoot"] as const)
      complaints.check(
        `${name}: the ${part} is planted from touchdown to the end`,
        vault.plan.contacts.some(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            w.part === part &&
            w.kind === "plant" &&
            Math.abs(w.from - down) < 1e-9 &&
            w.to >= 1 - 1e-9,
        ),
      );
  }
  complaints.assert("a box vault flies over its box and lands beyond it");
}
