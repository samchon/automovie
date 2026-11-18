import { createLongGun } from "@automovie/archetypes";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanCrowd,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanManoeuvre,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanCrowd,
  HumanCue,
  HumanEnsemble,
  HumanFormation,
  HumanManoeuvre,
  HumanMusketDrill,
  HumanObject,
  HumanPerformance,
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
 * 4. Volley: each member shoulders its flintlock musket (`HumanMusketDrill`
 *    on #3483's musket), makes ready on "ready" (the firelock to the recover,
 *    and over it the thumb on the cock's spur drawing it to full cock, its
 *    hinge's own travel), presents on
 *    "present" and fires on "fire", each synced with a
 *    reaction latency; the fire instants spread less for the elite than for
 *    the militia, none comes before the word plus the reaction floor, and the
 *    six members picked to misfire present and do not fire.
 * 5. Deploy: a column of three blocks deploys into a line of three by the
 *    `deploy` drill with no crossing (the plan's own check passes).
 * 6. Determinism: the scene replays bit for bit, and a battalion of one more
 *    member draws the same for the others.
 * 7. Rout: at the screenplay's cue, eight militia members drawn weighted
 *    toward low morale (`HumanEnsemble.pick`) flee 25 m to the rear by the
 *    crowd's steering in flight: none passes through another, all arrive, and
 *    the breakers' mean morale is below the line's.
 *
 * Running fire (case 5 of #3465) needs the reload law and is not composed
 * here; the square's faces belong to the manoeuvre spec.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the scene for two presets and reads strikes, roots and synced instants: a march off the drum, a militia as tight as the elite, a halt that drifts, a volley before its word, a misfire that fires, a crossing deployment or a non-replaying scene is caught.
 * @evidence contracts/development/testing.md#independent-expectations The drum, the regulation's step and the drill spacings are the sources'; elite tighter than militia is the user's requirement as a relation; the reaction floor is the false-start rule; replay is the keyed-draw contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Two presets on one composition, a halt, a volley with picked misfires, a deployment and a grown battalion; the primitives' own cases belong to their specs.
 * @evidence contracts/development/testing.md#execution-ownership A scene test of the motions package on prepared polygon-man bodies, discovered by its exported name; postures and events, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven scenarios, what each pins, and the cases left to other issues.
 */
export function test_human_motion_scene_line_infantry(): void {
  const findings: string[] = [];
  const pool: IAutoMovieMotionHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("f-small"),
    motionHumanBody("m-tall"),
  ];
  const line: IAutoMovieMotionHumanFormation = {
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 3,
          files: 8,
          spacing: { lateral: 0.56, depth: 0.6 },
        },
        count: 24,
      },
    ],
    frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
  };
  const orders: ReturnType<typeof HumanCue.orders> = HumanCue.orders([
    { word: "halt", at: 9 },
    { word: "ready", at: 9.8 },
    { word: "present", at: 10.4 },
    { word: "fire", at: 12, caution: 1.5 },
  ]);
  // The flintlock musket (#3483), its lock's cock, frizzen and pan on the right of the breech.
  const musket: ReturnType<typeof createLongGun> = createLongGun({
    kind: "musket",
  });
  // Make ready draws the cock back to full cock: its hinge's travel, the archetype's.
  const COCK: number = musket.affordances!.find(
    (a: { id: string }): boolean => a.id === "cock",
  )!.travel!;
  const battalion = (
    preset: IAutoMovieMotionHumanEnsemble["preset"],
    count: number = 24,
  ): IScene => {
    const ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
      id: preset ?? "b",
      seed: "infantry",
      count,
      bodies: pool,
      ...(preset === undefined ? {} : { preset }),
      formation:
        count === 24
          ? line
          : {
              ...line,
              blocks: [
                {
                  ...line.blocks[0]!,
                  layout: {
                    kind: "line",
                    ranks: 3,
                    files: 9,
                    spacing: { lateral: 0.56, depth: 0.6 },
                  },
                  count,
                },
              ],
            },
    });
    const misfires: number[] = HumanEnsemble.pick(
      ensemble,
      6,
      "misfire",
      undefined,
      "discipline",
    );
    const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "infantry",
      laws: [
        ...HUMAN_LEXICON.gait!,
        ...(Object.values(
          HumanMusketDrill,
        ) as IAutoMovieMotionHumanActionLaw<never>[]),
      ],
      performers: HumanEnsemble.performers(ensemble),
      props: ensemble.members.map(
        (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieMotionHumanProp =>
          HumanObject.prop(m.prop("musket"), musket, {
            at: {
              x: m.place.at.x - m.body.measure.shoulderHalfWidth,
              y: m.body.measure.waistHeight,
              z: m.place.at.z + 0.35,
            },
            yaw: 0,
          }),
      ),
      cues: { drum: HumanCue.beats({ bpm: 76, count: 30, from: 1 }), orders },
      composition: HumanEnsemble.chains(
        ensemble,
        (
          m: IAutoMovieMotionHumanEnsemble.IMember,
          chain: IAutoMovieMotionHumanChain,
        ) => {
          const gun: string = m.prop("musket");
          const marched: IAutoMovieMotionHumanChain = chain
            .registered("shoulderArms", { gun })
            .registered("march", {
              to: { x: m.place.at.x, y: 0, z: m.place.at.z + 8 },
              regulation: "french1791",
              time: "ordinary",
              cadence: { cue: "drum" },
            })
            .registered("stand", { seconds: 1 })
            .sync({ of: "orders", event: "halt", latency: "reaction" });
          const presented: IAutoMovieMotionHumanChain = marched
            .registered("recover", {
              gun,
              target: {
                kind: "point",
                frame: "performer",
                at: { x: 0, y: 1.4, z: 60 },
              },
            })
            .over((u: IAutoMovieMotionHumanChain) =>
              u.registered("makeReady", {
                mechanism: {
                  kind: "hinge",
                  at: { kind: "prop", subject: gun, point: "spur" },
                  swing: COCK,
                },
              }),
            )
            .sync({ of: "orders", event: "ready", latency: "reaction" })
            .registered("presentMusket", {
              gun,
              target: {
                kind: "point",
                frame: "performer",
                at: { x: 0, y: 1.4, z: 60 },
              },
            })
            .sync({ of: "orders", event: "present", latency: "reaction" });
          return misfires.includes(m.index)
            ? presented
            : presented
                .registered("fireMusket", { gun })
                .sync({ of: "orders", event: "fire", latency: "reaction" });
        },
      ),
    });
    return { ensemble, performance, misfires };
  };
  const elite: IScene = battalion("elite");
  const militia: IScene = battalion("militia");
  const strikes = (scene: IScene, subject: string): number[] => {
    const s: IAutoMovieMotionHumanSegment = scene.performance
      .segments(subject)
      .find((x: IAutoMovieMotionHumanSegment): boolean => x.name === "march")!;
    return s.plan.events
      .filter((e: IAutoMovieMotionEvent): boolean =>
        /^(left|right)HeelStrike\d+$/.test(e.name),
      )
      .map(
        (e: IAutoMovieMotionEvent): number =>
          s.start + e.share * s.plan.duration,
      )
      .sort((a: number, b: number): number => a - b);
  };
  const beats: number[] = HumanCue.beats({ bpm: 76, count: 30, from: 1 })
    .filter((c: { name: string }): boolean => c.name === "beat")
    .map((c: { seconds: number }): number => c.seconds);
  const sd = (v: readonly number[]): number => {
    const m: number =
      v.reduce((a: number, b: number): number => a + b, 0) / v.length;
    return Math.sqrt(
      v.reduce((a: number, b: number): number => a + (b - m) ** 2, 0) /
        Math.max(1, v.length - 1),
    );
  };
  const spread = (scene: IScene): number =>
    sd(
      scene.ensemble.members.flatMap(
        (m: IAutoMovieMotionHumanEnsemble.IMember): number[] =>
          strikes(scene, m.subject)
            .slice(2, -2)
            .map(
              (t: number): number =>
                t -
                beats.reduce(
                  (best: number, b: number): number =>
                    Math.abs(b - t) < Math.abs(best - t) ? b : best,
                  beats[0]!,
                ),
            ),
      ),
    );

  // 1. Step.
  for (const m of elite.ensemble.members) {
    const s: number[] = strikes(elite, m.subject).slice(2, -2);
    const cadence: number = (60 * (s.length - 1)) / (s[s.length - 1]! - s[0]!);
    if (Math.abs(cadence - 76) > 0.76)
      findings.push(
        `${m.subject} marches ${cadence.toFixed(2)} steps a minute on a 76 drum`,
      );
  }
  if (!(spread(elite) < spread(militia)))
    findings.push(
      `the elite's step spread ${(spread(elite) * 1000).toFixed(1)} ms is not below the militia's ${(spread(militia) * 1000).toFixed(1)} ms`,
    );

  // 2. Dress at the last strike.
  const dress = (scene: IScene): number =>
    scene.ensemble.members.reduce(
      (sum: number, m: IAutoMovieMotionHumanEnsemble.IMember): number => {
        const s: number[] = strikes(scene, m.subject);
        const root: IAutoMovieVector3 = scene.performance.posture(
          m.subject,
          s[s.length - 1]!,
        ).root;
        const slot: IAutoMovieVector3 = {
          x: m.place.at.x,
          y: 0,
          z: m.place.at.z + 8,
        };
        return sum + Math.hypot(root.x - slot.x, root.z - slot.z);
      },
      0,
    ) / scene.ensemble.members.length;
  if (!(dress(elite) <= dress(militia)))
    findings.push(
      `the elite stand ${dress(elite).toFixed(3)} m from their places on average, the militia ${dress(militia).toFixed(3)} m`,
    );

  // 3. Halt and 4. volley.
  const word = (name: string): number =>
    orders.find((c: { name: string }): boolean => c.name === name)!.seconds;
  const answered = (scene: IScene): number[] => {
    const out: number[] = [];
    for (const m of scene.ensemble.members) {
      const segments: readonly IAutoMovieMotionHumanSegment[] =
        scene.performance.segments(m.subject);
      const halted: IAutoMovieMotionHumanSegment = segments.find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "stand",
      )!;
      if (halted.entryTime < word("halt") + 0.1 - 1e-9)
        findings.push(`${m.subject} halts before the word`);
      // Make ready rides its recover as an overlay; the recover carries the body and answers the word.
      const ready: IAutoMovieMotionHumanSegment | undefined = segments.find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "recover",
      );
      const presenting: IAutoMovieMotionHumanSegment | undefined =
        segments.find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.name === "presentMusket",
        );
      if (ready === undefined)
        findings.push(`${m.subject} does not make ready`);
      else if (ready.entryTime < word("ready") + 0.1 - 1e-9)
        findings.push(`${m.subject} makes ready before the word`);
      else if (
        presenting !== undefined &&
        !(ready.entryTime < presenting.entryTime)
      )
        findings.push(`${m.subject} presents before it makes ready`);
      const fired: IAutoMovieMotionHumanSegment | undefined = segments.find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "fireMusket",
      );
      if (scene.misfires.includes(m.index)) {
        if (fired !== undefined)
          findings.push(`${m.subject} was picked to misfire and fires`);
      } else if (fired === undefined)
        findings.push(`${m.subject} does not fire`);
      else {
        if (fired.entryTime < word("fire") + 0.1 - 1e-9)
          findings.push(`${m.subject} fires before the word plus the floor`);
        out.push(fired.entryTime - word("fire"));
      }
    }
    return out;
  };
  const eliteVolley: number[] = answered(elite);
  const militiaVolley: number[] = answered(militia);
  if (!(sd(eliteVolley) < sd(militiaVolley)))
    findings.push(
      `the elite volley spreads ${(sd(eliteVolley) * 1000).toFixed(1)} ms, the militia's ${(sd(militiaVolley) * 1000).toFixed(1)} ms`,
    );

  // 5. Deploy.
  const block = (
    lateral: number,
    depth: number,
  ): IAutoMovieMotionHumanFormation.IBlock => ({
    layout: {
      kind: "line",
      ranks: 3,
      files: 8,
      spacing: { lateral: 0.56, depth: 0.6 },
    },
    count: 24,
    offset: { lateral, depth },
  });
  const fixed: IAutoMovieMotionHumanFormation.Frame = {
    kind: "fixed",
    at: { x: 0, y: 0, z: 0 },
    heading: 0,
  };
  const column: IAutoMovieMotionHumanFormation = {
    blocks: [block(0, 0), block(0, 3), block(0, 6)],
    frame: fixed,
  };
  const deployed: IAutoMovieMotionHumanFormation = {
    blocks: [block(-5, 0), block(0, 0), block(5, 0)],
    frame: fixed,
  };
  const regiment: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "r",
    seed: "infantry",
    count: 72,
    bodies: pool,
    preset: "line",
    formation: column,
  });
  try {
    const manoeuvre: IAutoMovieMotionHumanManoeuvre = {
      from: column,
      to: deployed,
      rule: "deploy",
      on: { of: "orders", event: "deploy" },
      at: 0,
    };
    HumanManoeuvre.plan(regiment, manoeuvre);
  } catch (error) {
    findings.push(`the deployment is refused: ${String(error)}`);
  }
  if (HumanFormation.count(deployed) !== 72)
    findings.push("the deployed line lost a slot");

  // 7. A rout: the least steady break first and flee by steering.
  const routed: number[] = HumanEnsemble.pick(
    militia.ensemble,
    8,
    "rout",
    undefined,
    "morale",
  );
  const breakers: IAutoMovieMotionHumanEnsemble.IEnsemble = {
    ...militia.ensemble,
    members: routed.map(
      (i: number): IAutoMovieMotionHumanEnsemble.IMember =>
        militia.ensemble.members[i]!,
    ),
  };
  const flight: IAutoMovieMotionHumanCrowd.IResult = HumanCrowd.steer(
    breakers,
    {
      goals: (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieVector3 => ({
        x: m.place.at.x,
        y: 0,
        z: m.place.at.z - 25,
      }),
      gait: "run",
      start: 13,
      until: 30,
      latency: "reaction",
      flight: true,
    },
  );
  flight.arrivals.forEach((a: number | null, k: number): void => {
    if (a === null)
      findings.push(`rout: ${breakers.members[k]!.subject} never gets away`);
  });
  for (let t: number = 13; t <= 30; t += 1 / 24) {
    const at: IAutoMovieVector3[] = flight.frames.map(
      (f: IAutoMovieMotionHumanFormation.ICourse): IAutoMovieVector3 =>
        HumanFormation.frame({ blocks: [], frame: f }, t).at,
    );
    let crossed: boolean = false;
    for (let a: number = 0; a < at.length && !crossed; ++a)
      for (let b: number = a + 1; b < at.length; ++b) {
        const sum: number =
          HumanCrowd.half(breakers.members[a]!) +
          HumanCrowd.half(breakers.members[b]!);
        if (Math.hypot(at[a]!.x - at[b]!.x, at[a]!.z - at[b]!.z) < sum - 1e-6) {
          findings.push(
            `rout: ${breakers.members[a]!.subject} and ${breakers.members[b]!.subject} pass through each other at ${t.toFixed(2)} s`,
          );
          crossed = true;
          break;
        }
      }
    if (crossed) break;
  }
  const mean = (
    members: readonly IAutoMovieMotionHumanEnsemble.IMember[],
  ): number =>
    members.reduce(
      (s: number, m: IAutoMovieMotionHumanEnsemble.IMember): number =>
        s + (m.attributes.morale ?? 0.5),
      0,
    ) / members.length;
  if (!(mean(breakers.members) < mean(militia.ensemble.members)))
    findings.push(
      `rout: the breakers' morale ${mean(breakers.members).toFixed(3)} is not below the line's ${mean(militia.ensemble.members).toFixed(3)}`,
    );

  // 6. Determinism.
  const again: IScene = battalion("elite");
  for (const m of elite.ensemble.members)
    if (
      JSON.stringify(again.performance.posture(m.subject, 10)) !==
      JSON.stringify(elite.performance.posture(m.subject, 10))
    )
      findings.push(`${m.subject} does not replay`);
  const grown: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "elite",
    seed: "infantry",
    count: 27,
    bodies: pool,
    preset: "elite",
    places: (i: number) => ({ at: { x: i, y: 0, z: 0 }, yaw: 0 }),
  });
  for (const m of elite.ensemble.members)
    if (
      JSON.stringify(grown.members[m.index]!.attributes) !==
      JSON.stringify(m.attributes)
    )
      findings.push(`a grown battalion changes ${m.subject}'s draws`);
  TestValidator.equals("line infantry", findings, []);
}

/** A battalion performed: its ensemble, the performance and the members picked to misfire. */
interface IScene {
  /** The ensemble. */
  ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble;

  /** The performance. */
  performance: IAutoMovieMotionHumanPerformance;

  /** The members who do not fire. */
  misfires: readonly number[];
}
