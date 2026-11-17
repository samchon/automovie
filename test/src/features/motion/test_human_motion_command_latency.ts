import { AutoMovieComposition } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  HumanCue,
  HumanEnsemble,
  HumanPerformance,
  HumanResponse,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A command is a cue track, and each member answers its word after a
 * latency of its own: tightly for drilled troops, loosely for a militia,
 * sooner when a preparatory word warned them, and never before a reaction
 * could start.
 *
 * Scenarios, 30 elite and 30 militia members on three bodies, each standing
 * and synced to "fire" with `latency: "reaction"`:
 * 1. No member starts before the word plus `HumanResponse.FLOOR` (0.1 s,
 *    the athletics false-start limit); the across-member standard deviation
 *    of the elite's latencies is smaller than the militia's; each lies
 *    between half the elite's and one and a half times the novice's
 *    ex-Gaussian spread, `sqrt(sigma^2 + tau^2)` of the orienting law (47 ms
 *    and 78 ms with its provisional constants), the slack covering the
 *    sampling error of 30 skewed draws.
 * 2. The same track without the preparatory word gives the elite a larger
 *    mean latency (the anticipation lead) and leaves a member without
 *    anticipation (the militia's lowest) unchanged within its lead's bound.
 * 3. The same seed gives bit-identical instants; adding a member, or a look
 *    before the synced action, leaves every other member's latency
 *    bit-identical.
 * 4. A synced action without a latency starts exactly on the word.
 * 5. `HumanCue.orders` refuses a preparatory word before the film and one
 *    at or before an earlier word of execution, naming the words.
 * 6. `HumanCue.instants` turns published instants (a ride's footfalls) into
 *    a cue track in time order, keeping only the labels asked, and every
 *    label when none is asked; `HumanCue.orders` names a warned word's
 *    preparatory instant `${word}Caution` before it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves performances and reads each synced action's placed start; a latency drawn before the floor, a spread that ignores skill, a lead that ignores the caution, a draw that moves with other members, or a sync that moves without a latency is caught.
 * @evidence contracts/development/testing.md#independent-expectations The floor is the athletics false-start rule; the spread band is the ex-Gaussian's own moments at the reaction axis's ends; elite against militia and warned against unwarned are relations the law must keep whatever its constants.
 * @evidence contracts/development/testing.md#distinguishing-cases Two presets, a warned and an unwarned track, an added member and an added action, a sync with no latency, and both refusals; the look, defence and strike draws are pinned by their own tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies, discovered by its exported name; schedules only, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_human_motion_command_latency(): void {
  const findings: string[] = [];
  const pool: IAutoMovieMotionHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("f-small"),
    motionHumanBody("m-tall"),
  ];
  const word: number = 3;
  const group = (
    id: string,
    preset: IAutoMovieMotionHumanEnsemble["preset"],
    count: number,
  ): IAutoMovieMotionHumanEnsemble.IEnsemble =>
    HumanEnsemble.of({
      id,
      seed: "volley",
      count,
      bodies: pool,
      ...(preset === undefined ? {} : { preset }),
      places: (index: number) => ({
        at: { x: (id === "e" ? 0 : 40) + 1.2 * index, y: 0, z: 0 },
        yaw: 0,
      }),
    });
  const starts = (
    ensembles: readonly IAutoMovieMotionHumanEnsemble.IEnsemble[],
    caution: boolean,
    latency: boolean = true,
    before: boolean = false,
  ): Map<string, number> => {
    const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "volley",
      performers: ensembles.flatMap(
        (e: IAutoMovieMotionHumanEnsemble.IEnsemble) =>
          HumanEnsemble.performers(e),
      ),
      cues: {
        orders: HumanCue.orders([
          { word: "fire", at: word, ...(caution ? { caution: 1.5 } : {}) },
        ]),
      },
      composition: AutoMovieComposition.parallel(
        ...ensembles.map((e: IAutoMovieMotionHumanEnsemble.IEnsemble) =>
          HumanEnsemble.chains(
            e,
            (
              _: IAutoMovieMotionHumanEnsemble.IMember,
              chain: IAutoMovieMotionHumanChain,
            ) =>
              (before
                ? chain.look({
                    target: {
                      kind: "point",
                      at: { x: 0, y: 1.6, z: 5 },
                      frame: "performer",
                    },
                    seconds: 0.8,
                  })
                : chain
              )
                .stand({ seconds: 0.5 })
                .sync({
                  of: "orders",
                  event: "fire",
                  ...(latency ? { latency: "reaction" as const } : {}),
                }),
          ),
        ),
      ),
    });
    const out: Map<string, number> = new Map();
    for (const e of ensembles)
      for (const m of e.members) {
        const segments: readonly IAutoMovieMotionHumanSegment[] =
          performance.segments(m.subject);
        out.set(m.subject, segments[segments.length - 1]!.entryTime - word);
      }
    return out;
  };
  const elite: IAutoMovieMotionHumanEnsemble.IEnsemble = group(
    "e",
    "elite",
    30,
  );
  const militia: IAutoMovieMotionHumanEnsemble.IEnsemble = group(
    "m",
    "militia",
    30,
  );
  const stats = (values: readonly number[]): { mean: number; sd: number } => {
    const mean: number =
      values.reduce((a: number, b: number): number => a + b, 0) / values.length;
    return {
      mean,
      sd: Math.sqrt(
        values.reduce(
          (a: number, b: number): number => a + (b - mean) ** 2,
          0,
        ) /
          (values.length - 1),
      ),
    };
  };
  const of = (
    map: Map<string, number>,
    e: IAutoMovieMotionHumanEnsemble.IEnsemble,
  ): number[] =>
    e.members.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember): number => map.get(m.subject)!,
    );

  // 1. The floor and the spreads.
  const warned: Map<string, number> = starts([elite, militia], true);
  for (const [subject, latency] of warned)
    if (latency < HumanResponse.FLOOR - 1e-9)
      findings.push(
        `${subject} starts ${latency.toFixed(3)} s after the word, before the floor`,
      );
  const e1: { mean: number; sd: number } = stats(of(warned, elite));
  const m1: { mean: number; sd: number } = stats(of(warned, militia));
  if (!(e1.sd < m1.sd))
    findings.push(
      `elite spread ${(e1.sd * 1000).toFixed(1)} ms is not below the militia's ${(m1.sd * 1000).toFixed(1)} ms`,
    );
  for (const [label, s] of [
    ["elite", e1],
    ["militia", m1],
  ] as const)
    if (
      s.sd < 0.5 * Math.hypot(0.025, 0.04) ||
      s.sd > 1.5 * Math.hypot(0.035, 0.07)
    )
      findings.push(
        `${label} spread ${(s.sd * 1000).toFixed(1)} ms outside 23.6 to 117.4 ms`,
      );

  // 2. The preparatory word's lead.
  const unwarned: Map<string, number> = starts([elite, militia], false);
  const e2: { mean: number; sd: number } = stats(of(unwarned, elite));
  if (!(e2.mean > e1.mean))
    findings.push(
      `the elite answer in ${(e1.mean * 1000).toFixed(1)} ms warned and ${(e2.mean * 1000).toFixed(1)} ms unwarned; the warned sooner expected`,
    );
  for (const m of militia.members) {
    const lead: number = unwarned.get(m.subject)! - warned.get(m.subject)!;
    if (lead < -1e-9 || lead > HumanResponse.LEAD + 1e-9)
      findings.push(
        `${m.subject}'s lead ${lead.toFixed(4)} s lies outside 0 to ${HumanResponse.LEAD} s`,
      );
  }

  // 3. Replay and independence.
  const again: Map<string, number> = starts([elite, militia], true);
  for (const [subject, latency] of warned)
    if (again.get(subject) !== latency)
      findings.push(`${subject} does not replay`);
  const grown: Map<string, number> = starts(
    [group("e", "elite", 31), militia],
    true,
  );
  for (const m of elite.members)
    if (grown.get(m.subject) !== warned.get(m.subject))
      findings.push(`adding a member moved ${m.subject}`);
  const looked: Map<string, number> = starts(
    [elite, militia],
    true,
    true,
    true,
  );
  for (const m of elite.members)
    if (looked.get(m.subject) !== warned.get(m.subject))
      findings.push(`a look before the sync moved ${m.subject}`);

  // 4. No latency.
  const exact: Map<string, number> = starts([elite], true, false);
  for (const [subject, latency] of exact)
    if (Math.abs(latency) > 1e-9)
      findings.push(
        `${subject} without a latency starts ${latency} s off the word`,
      );

  // 5. Refusals.
  for (const [label, orders] of [
    ["a caution before the film", [{ word: "fire", at: 0.5, caution: 1 }]],
    [
      "a caution before an earlier word",
      [
        { word: "present", at: 2 },
        { word: "fire", at: 2.5, caution: 1 },
      ],
    ],
  ] as const)
    try {
      HumanCue.orders(orders);
      findings.push(`${label} was not refused`);
    } catch (error) {
      if (!String(error).includes("fire"))
        findings.push(
          `${label}: the refusal does not name the word: ${String(error)}`,
        );
    }

  // 6. Instants and the orders' names.
  const ride: { instants: { label: string; seconds: number }[] } = {
    instants: [
      { label: "rightForeOn", seconds: 1.2 },
      { label: "leftHindOn", seconds: 0.4 },
      { label: "gaitChange", seconds: 0.9 },
      { label: "rightForeOn", seconds: 0.6 },
    ],
  };
  const fore: { name: string; seconds: number }[] = HumanCue.instants(ride, [
    "rightForeOn",
  ]);
  if (
    JSON.stringify(fore) !==
    JSON.stringify([
      { name: "rightForeOn", seconds: 0.6 },
      { name: "rightForeOn", seconds: 1.2 },
    ])
  )
    findings.push(`instants kept ${JSON.stringify(fore)}`);
  if (
    HumanCue.instants(ride)
      .map((c: { seconds: number }): number => c.seconds)
      .join() !== "0.4,0.6,0.9,1.2"
  )
    findings.push("instants are not in time order");
  const words: { name: string; seconds: number }[] = HumanCue.orders([
    { word: "fire", at: 3, caution: 1 },
  ]);
  if (
    JSON.stringify(words) !==
    JSON.stringify([
      { name: "fireCaution", seconds: 2 },
      { name: "fire", seconds: 3 },
    ])
  )
    findings.push(`orders gave ${JSON.stringify(words)}`);
  TestValidator.equals("a command's latency", findings, []);
}
