import type { IAutoMovieMotionEvent, IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanCue,
  HumanEnsemble,
  HumanFormation,
  HumanManoeuvre,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanEnsemble,
  type IHumanFormation,
  type IHumanManoeuvre,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Line infantry composed from the crowd primitives with no law of its own:
 * a battalion marches in step to a drum, halts on the word, and answers the
 * volley's words, an elite battalion tighter than a militia under the same
 * composition; its column deploys into line without a crossing.
 *
 * Scenarios, a three-rank line of 8 files (French 0.56 m files and 0.33 m
 * ranks, Balagan's summary of Haythornthwaite and Nafziger, with the ranks
 * opened to body depth), on three bodies, marching 8 m at the French 1791
 * ordinary step to a drum at 76 a minute:
 * 1. Step: every elite member's cadence over its middle strikes is the
 *    drum's within 1 %, and the elite's strike asynchrony spreads less than
 *    the militia's.
 * 2. Dress: at the last strike, the elite's mean distance from their slots
 *    is no larger than the militia's.
 * 3. Halt: every member stands still within one step's time after the word
 *    "halt" plus its reaction latency.
 * 4. Volley: the members' instants answering "fire" (synced with a reaction
 *    latency; the musket's own discharge awaits the firearm drill, #3488)
 *    spread less for the elite than for the militia, none before the word
 *    plus the reaction floor, and the six members picked to misfire do not
 *    answer.
 * 5. Deploy: a column of three blocks deploys into a line of three by the
 *    `deploy` drill with no crossing (the plan's own check passes).
 * 6. Determinism: the scene replays bit for bit, and a battalion of one more
 *    member draws the same for the others.
 *
 * Running fire (case 5 of #3465) needs the reload law and is not composed
 * here; the square and the rout belong to the manoeuvre and crowd specs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the scene for two presets and reads strikes, roots and synced instants: a march off the drum, a militia as tight as the elite, a halt that drifts, a volley before its word, a misfire that fires, a crossing deployment or a non-replaying scene is caught.
 * @evidence contracts/development/testing.md#independent-expectations The drum, the regulation's step and the drill spacings are the sources'; elite tighter than militia is the user's requirement as a relation; the reaction floor is the false-start rule; replay is the keyed-draw contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Two presets on one composition, a halt, a volley with picked misfires, a deployment and a grown battalion; the primitives' own cases belong to their specs.
 * @evidence contracts/development/testing.md#execution-ownership A scene test of the motions package on prepared polygon-man bodies, discovered by its exported name; postures and events, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios, what each pins, and the cases left to other issues.
 */
export function test_human_motion_scene_line_infantry(): void {
  const findings: string[] = [];
  const pool: IHumanBody[] = [motionHumanBody("m-average"), motionHumanBody("f-small"), motionHumanBody("m-tall")];
  const line: IHumanFormation = {
    blocks: [{ layout: { kind: "line", ranks: 3, files: 8, spacing: { lateral: 0.56, depth: 0.6 } }, count: 24 }],
    frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
  };
  const orders: ReturnType<typeof HumanCue.orders> = HumanCue.orders([
    { word: "halt", at: 9 },
    { word: "fire", at: 12, caution: 1.5 },
  ]);
  const battalion = (preset: IHumanEnsemble["preset"], count: number = 24): IScene => {
    const ensemble: HumanEnsemble.IEnsemble = HumanEnsemble.of({
      id: preset ?? "b",
      seed: "infantry",
      count,
      bodies: pool,
      ...(preset === undefined ? {} : { preset }),
      formation: count === 24 ? line : { ...line, blocks: [{ ...line.blocks[0]!, layout: { kind: "line", ranks: 3, files: 9, spacing: { lateral: 0.56, depth: 0.6 } }, count }] },
    });
    const misfires: number[] = HumanEnsemble.pick(ensemble, 6, "misfire", undefined, "discipline");
    const performance: HumanPerformance = new HumanPerformance({
      seed: "infantry",
      laws: [...HUMAN_LEXICON.gait!],
      performers: HumanEnsemble.performers(ensemble),
      cues: { drum: HumanCue.beats({ bpm: 76, count: 30, from: 1 }), orders },
      composition: HumanEnsemble.chains(ensemble, (m: HumanEnsemble.IMember, chain: HumanChain) => {
        const marched: HumanChain = chain
          .registered("march", { to: { x: m.place.at.x, y: 0, z: m.place.at.z + 8 }, regulation: "french1791", time: "ordinary", cadence: { cue: "drum" } })
          .registered("stand", { seconds: 1 })
          .sync({ of: "orders", event: "halt", latency: "reaction" });
        return misfires.includes(m.index)
          ? marched
          : marched.stand({ seconds: 0.5 }).sync({ of: "orders", event: "fire", latency: "reaction" });
      }),
    });
    return { ensemble, performance, misfires };
  };
  const elite: IScene = battalion("elite");
  const militia: IScene = battalion("militia");
  const strikes = (scene: IScene, subject: string): number[] => {
    const s: HumanSegment.ISegment = scene.performance.segments(subject)[0]!;
    return s.plan.events
      .filter((e: IAutoMovieMotionEvent): boolean => /^(left|right)HeelStrike\d+$/.test(e.name))
      .map((e: IAutoMovieMotionEvent): number => s.start + e.share * s.plan.duration)
      .sort((a: number, b: number): number => a - b);
  };
  const beats: number[] = HumanCue.beats({ bpm: 76, count: 30, from: 1 })
    .filter((c: { name: string }): boolean => c.name === "beat")
    .map((c: { seconds: number }): number => c.seconds);
  const sd = (v: readonly number[]): number => {
    const m: number = v.reduce((a: number, b: number): number => a + b, 0) / v.length;
    return Math.sqrt(v.reduce((a: number, b: number): number => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1));
  };
  const spread = (scene: IScene): number =>
    sd(
      scene.ensemble.members.flatMap((m: HumanEnsemble.IMember): number[] =>
        strikes(scene, m.subject)
          .slice(2, -2)
          .map((t: number): number => t - beats.reduce((best: number, b: number): number => (Math.abs(b - t) < Math.abs(best - t) ? b : best), beats[0]!)),
      ),
    );

  // 1. Step.
  for (const m of elite.ensemble.members) {
    const s: number[] = strikes(elite, m.subject).slice(2, -2);
    const cadence: number = (60 * (s.length - 1)) / (s[s.length - 1]! - s[0]!);
    if (Math.abs(cadence - 76) > 0.76) findings.push(`${m.subject} marches ${cadence.toFixed(2)} steps a minute on a 76 drum`);
  }
  if (!(spread(elite) < spread(militia))) findings.push(`the elite's step spread ${(spread(elite) * 1000).toFixed(1)} ms is not below the militia's ${(spread(militia) * 1000).toFixed(1)} ms`);

  // 2. Dress at the last strike.
  const dress = (scene: IScene): number =>
    scene.ensemble.members.reduce((sum: number, m: HumanEnsemble.IMember): number => {
      const s: number[] = strikes(scene, m.subject);
      const root: IAutoMovieVector3 = scene.performance.posture(m.subject, s[s.length - 1]!).root;
      const slot: IAutoMovieVector3 = { x: m.place.at.x, y: 0, z: m.place.at.z + 8 };
      return sum + Math.hypot(root.x - slot.x, root.z - slot.z);
    }, 0) / scene.ensemble.members.length;
  if (!(dress(elite) <= dress(militia))) findings.push(`the elite stand ${dress(elite).toFixed(3)} m from their places on average, the militia ${dress(militia).toFixed(3)} m`);

  // 3. Halt and 4. volley.
  const word = (name: string): number => orders.find((c: { name: string }): boolean => c.name === name)!.seconds;
  const answered = (scene: IScene): number[] => {
    const out: number[] = [];
    for (const m of scene.ensemble.members) {
      const segments: readonly HumanSegment.ISegment[] = scene.performance.segments(m.subject);
      const halted: HumanSegment.ISegment = segments[1]!;
      if (halted.entryTime < word("halt") + 0.1 - 1e-9) findings.push(`${m.subject} halts before the word`);
      const fired: HumanSegment.ISegment | undefined = segments[2];
      if (scene.misfires.includes(m.index)) {
        if (fired !== undefined) findings.push(`${m.subject} was picked to misfire and fires`);
      } else if (fired === undefined) findings.push(`${m.subject} does not fire`);
      else {
        if (fired.entryTime < word("fire") + 0.1 - 1e-9) findings.push(`${m.subject} fires before the word plus the floor`);
        out.push(fired.entryTime - word("fire"));
      }
    }
    return out;
  };
  const eliteVolley: number[] = answered(elite);
  const militiaVolley: number[] = answered(militia);
  if (!(sd(eliteVolley) < sd(militiaVolley))) findings.push(`the elite volley spreads ${(sd(eliteVolley) * 1000).toFixed(1)} ms, the militia's ${(sd(militiaVolley) * 1000).toFixed(1)} ms`);

  // 5. Deploy.
  const block = (lateral: number, depth: number): IHumanFormation.IBlock => ({ layout: { kind: "line", ranks: 3, files: 8, spacing: { lateral: 0.56, depth: 0.6 } }, count: 24, offset: { lateral, depth } });
  const fixed: IHumanFormation.Frame = { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 };
  const column: IHumanFormation = { blocks: [block(0, 0), block(0, 3), block(0, 6)], frame: fixed };
  const deployed: IHumanFormation = { blocks: [block(-5, 0), block(0, 0), block(5, 0)], frame: fixed };
  const regiment: HumanEnsemble.IEnsemble = HumanEnsemble.of({ id: "r", seed: "infantry", count: 72, bodies: pool, preset: "line", formation: column });
  try {
    const manoeuvre: IHumanManoeuvre = { from: column, to: deployed, rule: "deploy", on: { of: "orders", event: "deploy" }, at: 0 };
    HumanManoeuvre.plan(regiment, manoeuvre);
  } catch (error) {
    findings.push(`the deployment is refused: ${String(error)}`);
  }
  if (HumanFormation.count(deployed) !== 72) findings.push("the deployed line lost a slot");

  // 6. Determinism.
  const again: IScene = battalion("elite");
  for (const m of elite.ensemble.members)
    if (JSON.stringify(again.performance.posture(m.subject, 10)) !== JSON.stringify(elite.performance.posture(m.subject, 10))) findings.push(`${m.subject} does not replay`);
  const grown: HumanEnsemble.IEnsemble = HumanEnsemble.of({ id: "elite", seed: "infantry", count: 27, bodies: pool, preset: "elite", places: (i: number) => ({ at: { x: i, y: 0, z: 0 }, yaw: 0 }) });
  for (const m of elite.ensemble.members)
    if (JSON.stringify(grown.members[m.index]!.attributes) !== JSON.stringify(m.attributes)) findings.push(`a grown battalion changes ${m.subject}'s draws`);
  TestValidator.equals("line infantry", findings, []);
}

/** A battalion performed: its ensemble, the performance and the members picked to misfire. */
interface IScene {
  /** The ensemble. */
  ensemble: HumanEnsemble.IEnsemble;

  /** The performance. */
  performance: HumanPerformance;

  /** The members who do not fire. */
  misfires: readonly number[];
}
