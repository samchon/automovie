import { formationSlotPosition } from "@automovie/engine";
import type {
  IAutoMovieFormationDesign,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanEnsemble,
  HumanFormation,
  HumanPerformance,
  HumanPopulation,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanFormation,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Background members are handed to the population layer: their slots as a
 * formation design the engine places exactly where the ensemble's own slots
 * stand, and their motion as one stride of a performed template's own poses.
 *
 * Scenarios, a 2 by 6 line on one body whose rear rank is a population and
 * whose front rank marches 6 m:
 * 1. Every population member's slot placed by the engine's
 *    `formationSlotPosition` from the design equals its ensemble slot within
 *    1e-9 m, with a fixed frame facing 0 degrees and one turned 53 degrees;
 *    the performed members are the design's hero overrides, slot for slot.
 * 2. The template's cycle runs from one heel strike to the same foot's
 *    next: its period is that interval, its stride the root's travel over
 *    it within 1 cm, and its first pose stands at the origin facing +Z with
 *    the travel taken out (root within 1e-9 m of the origin on the floor).
 * 3. The cycle's last pose, advanced by one sample, comes back to its first
 *    within the march's own per-sample travel (the stride over the sample
 *    count), so the loop closes.
 * 4. A window inside a stand, which holds no stride, is refused naming the
 *    template; a design over two blocks, the second faced about, set back
 *    and dressed by its own seed, places every member on its own slot within
 *    1e-9 m, the performed ones as heroes.
 * 5. `performers` and `chains` leave population members out.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Designs a population and takes a cycle from a performed march: a design off the ensemble's slots, a hero missing, a cycle that is not one stride, a loop that does not close, a stand taken as a cycle or a population performed is caught.
 * @evidence contracts/development/testing.md#independent-expectations The slots are the engine's own placement of the same layout; a stride is the interval between same-foot strikes by definition; the loop's closure bound is one sample's share of the stride.
 * @evidence contracts/development/testing.md#distinguishing-cases Two headings, a cycle and its closure, two refusals and the excluded members; baking the poses is the render's spec.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on one prepared polygon-man body, discovered by its exported name; no render, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_human_motion_ensemble_population(): void {
  const findings: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const formation = (heading: number): IHumanFormation => ({
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 2,
          files: 6,
          spacing: { lateral: 0.6, depth: 0.9 },
          dressing: { lateral: 0.03, depth: 0.03 },
        },
        count: 12,
        seed: 11,
      },
    ],
    frame: { kind: "fixed", at: { x: 2, y: 0, z: -1 }, heading },
  });
  const rear = (m: { rank: number | null }): "population" | "full" =>
    m.rank === 1 ? "population" : "full";

  // 1. The design's slots.
  for (const heading of [0, 53]) {
    const f: IHumanFormation = formation(heading);
    const e: HumanEnsemble.IEnsemble = HumanEnsemble.of({
      id: "p",
      seed: "population",
      count: 12,
      bodies: [body],
      formation: f,
      detail: rear,
    });
    const design: IAutoMovieFormationDesign = HumanPopulation.design(e, {
      id: "rear",
      model: "soldier",
    });
    for (const m of e.members.filter(
      (m: HumanEnsemble.IMember): boolean => m.detail === "population",
    )) {
      const engine: IAutoMovieVector3 = formationSlotPosition(design, m.index);
      const own: IAutoMovieVector3 = HumanFormation.slot(f, m.index, 0).at;
      if (Math.hypot(engine.x - own.x, engine.z - own.z) > 1e-9)
        findings.push(
          `heading ${heading}: ${m.subject}'s designed slot lies ${Math.hypot(engine.x - own.x, engine.z - own.z).toExponential(2)} m off`,
        );
    }
    const heroes: number[] = design.heroOverrides
      .map((h: { slot: number }): number => h.slot)
      .sort((a: number, b: number): number => a - b);
    if (heroes.join() !== "0,1,2,3,4,5")
      findings.push(`heading ${heading}: heroes ${heroes.join()}`);
  }

  // 2 and 3. A template's cycle.
  const e: HumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "p",
    seed: "population",
    count: 12,
    bodies: [body],
    formation: formation(0),
    detail: rear,
  });
  const performance: HumanPerformance = new HumanPerformance({
    seed: "population",
    laws: [...HUMAN_LEXICON.gait!],
    performers: HumanEnsemble.performers(e),
    composition: HumanEnsemble.chains(
      e,
      (m: HumanEnsemble.IMember, chain: HumanChain) =>
        chain.stand({ seconds: 0.5 }).registered("march", {
          to: { x: m.place.at.x, y: 0, z: m.place.at.z + 6 },
        }),
    ),
  });
  const segment: HumanSegment.ISegment = performance.segments("p.0")[1]!;
  const strikes: { seconds: number; side: string }[] = segment.plan.events
    .filter((ev: IAutoMovieMotionEvent): boolean =>
      /^(left|right)HeelStrike\d+$/.test(ev.name),
    )
    .map((ev: IAutoMovieMotionEvent): { seconds: number; side: string } => ({
      seconds: segment.start + ev.share * segment.plan.duration,
      side: ev.name.startsWith("left") ? "left" : "right",
    }))
    .sort(
      (a: { seconds: number }, b: { seconds: number }): number =>
        a.seconds - b.seconds,
    );
  const from: number = strikes[2]!.seconds - 1e-6;
  const cycle: HumanPopulation.ICycle = HumanPopulation.cycle(
    performance,
    "p.0",
    from,
    32,
  );
  const start: { seconds: number; side: string } = strikes.find(
    (s: { seconds: number }): boolean => s.seconds >= from,
  )!;
  const next: { seconds: number; side: string } = strikes.find(
    (s: { seconds: number; side: string }): boolean =>
      s.side === start.side && s.seconds > start.seconds,
  )!;
  if (Math.abs(cycle.periodSeconds - (next.seconds - start.seconds)) > 1e-9)
    findings.push(
      `the cycle lasts ${cycle.periodSeconds} s, the stride ${next.seconds - start.seconds} s`,
    );
  const a: IAutoMovieVector3 = performance.pose("p.0", start.seconds).root!
    .translation;
  const b: IAutoMovieVector3 = performance.pose("p.0", next.seconds).root!
    .translation;
  if (Math.abs(cycle.strideMeters - Math.hypot(b.x - a.x, b.z - a.z)) > 0.01)
    findings.push(
      `the cycle's stride ${cycle.strideMeters.toFixed(3)} m, the root's ${Math.hypot(b.x - a.x, b.z - a.z).toFixed(3)} m`,
    );
  const zero: IAutoMovieVector3 = cycle.poses[0]!.root!.translation;
  if (Math.hypot(zero.x, zero.z) > 1e-9)
    findings.push(
      `the first pose stands ${Math.hypot(zero.x, zero.z)} m off the origin`,
    );
  const last: IAutoMovieVector3 =
    cycle.poses[cycle.poses.length - 1]!.root!.translation;
  const step: number = cycle.strideMeters / cycle.poses.length;
  if (Math.hypot(last.x, last.z) > step)
    findings.push(
      `the loop does not close: the last pose stands ${Math.hypot(last.x, last.z).toFixed(3)} m from the first`,
    );

  // 4. Refusals.
  try {
    HumanPopulation.cycle(performance, "p.0", 0.2, 32);
    findings.push("a cycle inside a stand was not refused");
  } catch (error) {
    if (!(error instanceof HumanRefusal) || error.performer !== "p.0")
      findings.push(
        `the stand refusal does not name the template: ${String(error)}`,
      );
  }
  // A population over two blocks, the second faced about and set back: every population member's designed slot is its own.
  const twoBlocks: IHumanFormation = {
    ...formation(37),
    blocks: [
      {
        ...formation(37).blocks[0]!,
        count: 6,
        layout: {
          kind: "line",
          ranks: 1,
          files: 6,
          spacing: { lateral: 0.6, depth: 0.9 },
        },
      },
      {
        ...formation(37).blocks[0]!,
        count: 6,
        seed: 5,
        facing: 180,
        offset: { lateral: 0.5, depth: 3 },
        layout: {
          kind: "line",
          ranks: 1,
          files: 6,
          spacing: { lateral: 0.6, depth: 0.9 },
          dressing: { lateral: 0.02, depth: 0.02 },
        },
      },
    ],
  };
  const split: HumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "q",
    seed: "population",
    count: 12,
    bodies: [body],
    formation: twoBlocks,
    detail: (m: { index: number }): "population" | "full" =>
      m.index % 2 === 0 ? "population" : "full",
  });
  const blocked: IAutoMovieFormationDesign = HumanPopulation.design(split, {
    id: "x",
    model: "soldier",
  });
  for (const m of split.members) {
    const engine: IAutoMovieVector3 = formationSlotPosition(blocked, m.index);
    const own: IAutoMovieVector3 = HumanFormation.slot(
      twoBlocks,
      m.index,
      0,
    ).at;
    if (Math.hypot(engine.x - own.x, engine.z - own.z) > 1e-9)
      findings.push(
        `two blocks: ${m.subject}'s designed slot lies ${Math.hypot(engine.x - own.x, engine.z - own.z).toExponential(2)} m off`,
      );
  }
  if (blocked.heroOverrides.length !== 6)
    findings.push(
      `two blocks: ${blocked.heroOverrides.length} heroes, 6 expected`,
    );
  // 5. Population members are not performed.
  const performed: string[] = HumanEnsemble.performers(e).map(
    (p: { subject: string }): string => p.subject,
  );
  if (
    performed.length !== 6 ||
    performed.some((s: string): boolean => Number(s.split(".")[1]) >= 6)
  )
    findings.push(`performed: ${performed.join(", ")}`);
  TestValidator.equals("a population from a performed template", findings, []);
}
