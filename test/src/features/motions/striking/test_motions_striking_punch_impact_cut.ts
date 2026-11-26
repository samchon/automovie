import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBody,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { motionActionUnit } from "../../internal/motionActionUnit";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * The existing jab and cross rows preserve the displayed branch on an impact
 * cut.
 *
 * Scenarios:
 *
 * 1. The jab ends and the cross enters at the jab's exact impact event.
 * 2. Feet and elbows stay continuous on both sides of the cut. The landed and
 *    airborne feet keep their rates and only the landed foot bears.
 * 3. Seeking to a time again yields the same placements.
 */
export async function test_motions_striking_punch_impact_cut(): Promise<void> {
  const fixture: Awaited<ReturnType<typeof humanFixture>> =
    await humanFixture("m-average");
  const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
    fixture.skeleton,
    fixture.profile,
  );
  const target: IAutoMovieMotionTarget = {
    kind: "point",
    frame: "world",
    at: { x: 0, y: 1.56, z: 0.62 },
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "straight cut",
    laws: HUMAN_LEXICON.strike!.filter(
      (law) => law.name === "jab" || law.name === "cross",
    ),
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .guard({ style: "boxing", duration: 0.5 })
      .registered("jab", { at: target }, "lead")
      .until({ type: "event", event: "impact" })
      .registered("cross", { at: target }, "rear").node,
  });
  const [, lead, rear]: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("a");
  const cut: number = motionActionUnit.event(lead!, "impact");
  TestValidator.predicate(
    "the transition starts at the exact impact cut",
    nclose(lead!.end, cut, 1e-12) &&
      nclose(rear!.entryTime, cut, 1e-12) &&
      rear!.transition?.kind === "inertialize",
  );
  TestValidator.predicate(
    "the cross keeps the touching rear foot and gives the airborne foot a landing",
    rear!.context.entry.feet.right.planted &&
      !rear!.context.entry.feet.left.planted &&
      rear!.plan.contacts.some(
        (contact) => contact.part === "leftFoot" && contact.from > 0,
      ) &&
      rear!.plan.contacts.every(
        (contact) => contact.part !== "leftFoot" || contact.from > 0,
      ),
  );
  const read = (
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    performance.bones("a", seconds);
  const step: number = 1e-7;
  const after: ReturnType<typeof read> = read(cut + step);
  const before: ReturnType<typeof read> = read(cut - step);
  const exact: ReturnType<typeof read> = read(cut);
  const replay: ReturnType<typeof read> = read(cut + step);
  for (const bone of [
    "leftFoot",
    "rightFoot",
    "leftLowerArm",
    "rightLowerArm",
  ] as const)
    TestValidator.predicate(
      `${bone} keeps its place through the cut`,
      vclose(
        before.get(bone)!.worldPosition,
        exact.get(bone)!.worldPosition,
        1e-4,
      ) &&
        vclose(
          after.get(bone)!.worldPosition,
          exact.get(bone)!.worldPosition,
          1e-4,
        ) &&
        vclose(
          after.get(bone)!.worldPosition,
          replay.get(bone)!.worldPosition,
          1e-12,
        ),
    );
  for (const bone of ["leftFoot", "rightFoot"] as const) {
    const a = before.get(bone)!.worldPosition;
    const b = exact.get(bone)!.worldPosition;
    const c = after.get(bone)!.worldPosition;
    TestValidator.predicate(
      `${bone} keeps its displayed rate through the cut`,
      Math.hypot(
        (c.x - 2 * b.x + a.x) / step,
        (c.y - 2 * b.y + a.y) / step,
        (c.z - 2 * b.z + a.z) / step,
      ) < 0.01,
    );
  }
}
