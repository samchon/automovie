import {
  HumanChain,
  HumanCue,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An action is timed to an instant of speech, of music or of another
 * person's action: the instant of its own that carries its meaning falls
 * there, and it begins as early as its body needs to get there.
 *
 * A speaker's gesture stroke meets the stressed syllable it goes with
 * (McNeill 1992, Hand and Mind: the stroke coincides with or just precedes
 * the stressed syllable), and a film shows a meeting of two instants as one
 * when they fall in the same frame, so the bound on every meeting below is
 * one frame at 24 Hz, 1/24 s.
 *
 * Scenarios, with a dialogue line from 1 s to 4 s stressed at 2.0 s and
 * 3.2 s and a score at 96 beats a minute:
 * 1. On the average man and the small woman, a wave synced by its
 *    `strokeStart` to the first accent has that instant within a frame of
 *    2.0 s, begins before it by its own preparation, and the stand before
 *    it ends where the wave begins.
 * 2. The same wave synced to the second accent has every instant 1.2 s
 *    later than in scenario 1, within a millisecond: moving the cue moves
 *    the action and changes nothing else.
 * 3. A stand cut on the score's fifth beat ends at 4 x 60 / 96 = 2.5 s.
 * 4. A listener's nod synced by its `strokeStart` to the end of the
 *    speaker's wave stroke, 0.2 s later, has that instant within a frame of
 *    the speaker's `strokeEnd` plus 0.2 s.
 * 5. The same composition and seed give the same placed instants twice.
 * 6. Refused, each naming what to change: a wave whose stroke would have to
 *    be prepared before the film begins, with the earliest second it can
 *    meet; a stand synced to a beat that falls inside a wave's stroke, as
 *    the cut the wave does not allow; an instant the action does not have,
 *    with the ones it has.
 * 7. The tracks: beat `i` of a score lies `i x 60 / bpm` s after its first
 *    and every fourth is also a `downbeat`; a dialogue's instants come in
 *    film order; an accent outside its line is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain, cue builders and input and reads the placed actions' instants and refusals; an action that misses its instant, moves with something other than its cue, or is placed where it cannot be fails.
 * @evidence contracts/development/testing.md#independent-expectations The instants are the cue track's own seconds and the frame is the film's; the beat arithmetic is the tempo's definition; no expected value is read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases Three sources of an instant (speech, music, a partner), two bodies whose preparations differ, a moved cue, a cut and a start, and three ways a sync cannot be met.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and builds short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its source and bound and the 7 scenarios.
 */
export function test_human_motion_sync_cues(): void {
  const FRAME: number = 1 / 24;
  const cues = {
    dialogue: HumanCue.dialogue([{ from: 1, to: 4, accents: [2.0, 3.2] }]),
    music: HumanCue.beats({ bpm: 96, count: 16 }),
  };
  const complaints: string[] = [];
  const perform = (
    bodies: Readonly<Record<string, IHumanBody>>,
    composition: HumanChain,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "sync",
      cues,
      performers: Object.entries(bodies).map(([subject, body], index) => ({
        subject,
        body,
        at: { x: index * 1.2, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      })),
      composition: composition.node,
    });
  const instant = (segment: HumanSegment.ISegment, event: string): number =>
    segment.start +
    (segment.plan.events.find((e): boolean => e.name === event)?.share ?? NaN) *
      segment.plan.duration;
  const refused = (build: () => unknown): unknown => {
    try {
      build();
    } catch (error) {
      return error;
    }
    return null;
  };
  const said = (thrown: unknown): string =>
    thrown instanceof Error ? thrown.message : String(thrown);
  const waving = (index: number): HumanChain =>
    HumanChain.subject("a")
      .stand({ seconds: 4 })
      .gesture({ kind: "wave" })
      .sync({ of: "dialogue", event: "accent", index, align: "strokeStart" });

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);

    // 1. The stroke meets the accent, and the stand gives way where needed.
    const [stood, wave] = perform({ a: body }, waving(0)).segments("a");
    const met: number = instant(wave!, "strokeStart");
    if (!(Math.abs(met - 2.0) <= FRAME))
      complaints.push(
        `${name}: the wave's stroke starts at ${met.toFixed(3)} s, within a frame of the accent at 2.000 s expected`,
      );
    if (!(wave!.entryTime < met - FRAME))
      complaints.push(
        `${name}: the wave begins at ${wave!.entryTime.toFixed(3)} s, before its stroke at ${met.toFixed(3)} s expected`,
      );
    if (Math.abs(stood!.end - wave!.entryTime) > 1e-6)
      complaints.push(
        `${name}: the stand ends at ${stood!.end.toFixed(3)} s and the wave begins at ${wave!.entryTime.toFixed(3)} s, the same second expected`,
      );

    // 2. Moving the cue moves the action and nothing else.
    const later = perform({ a: body }, waving(1)).segments("a")[1]!;
    for (const event of wave!.plan.events) {
      const moved: number =
        instant(later, event.name) - instant(wave!, event.name);
      if (Math.abs(moved - 1.2) > 1e-3)
        complaints.push(
          `${name}: synced to the accent 1.2 s later, the wave's ${event.name} moves ${moved.toFixed(4)} s`,
        );
    }
  }

  const body: IHumanBody = motionHumanBody("m-average");

  // 3. A cut on a beat.
  const cut = perform(
    { a: body },
    HumanChain.subject("a")
      .stand({ seconds: 5 })
      .until({ of: "music", event: "beat", index: 4 })
      .gesture({ kind: "nod" }),
  ).segments("a")[0]!;
  if (Math.abs(cut.end - 2.5) > 1e-6)
    complaints.push(
      `a stand cut on the fifth beat at 96 beats a minute ends at ${cut.end.toFixed(3)} s, 2.500 s expected`,
    );

  // 4 and 5. A partner's instant, twice.
  const pair = (): HumanPerformance =>
    perform(
      { a: body, b: body },
      HumanChain.subject("a")
        .gesture({ kind: "wave" }, "greeting")
        .with(
          HumanChain.subject("b")
            .stand({ seconds: 6 })
            .gesture({ kind: "nod" })
            .sync({
              of: "greeting",
              event: "strokeEnd",
              align: "strokeStart",
              offset: 0.2,
            }),
        ),
    );
  const first: HumanPerformance = pair();
  const answered: number = instant(first.segments("b")[1]!, "strokeStart");
  const asked: number = instant(first.segments("a")[0]!, "strokeEnd") + 0.2;
  if (!(Math.abs(answered - asked) <= FRAME))
    complaints.push(
      `the listener's nod starts its stroke at ${answered.toFixed(3)} s, within a frame of ${asked.toFixed(3)} s expected`,
    );
  const placed = (performance: HumanPerformance): string =>
    JSON.stringify(
      ["a", "b"].map((subject: string) =>
        performance
          .segments(subject)
          .map((s: HumanSegment.ISegment) => [s.name, s.entryTime, s.end]),
      ),
    );
  if (placed(first) !== placed(pair()))
    complaints.push("the same composition and seed place the actions apart");

  // 6. What cannot be met.
  const early: unknown = refused(() =>
    perform(
      { a: body },
      HumanChain.subject("a")
        .gesture({ kind: "wave" })
        .sync({
          of: "dialogue",
          event: "lineStart",
          align: "strokeEnd",
          offset: -0.9,
        }),
    ),
  );
  if (
    !(
      early instanceof HumanRefusal &&
      early.axis === "sync" &&
      early.feasible?.kind === "range" &&
      early.feasible.minimum !== null &&
      early.feasible.minimum > 0.1
    )
  )
    complaints.push(
      `a stroke to prepare before the film begins: expected a sync refusal with the earliest second, got ${said(early)}`,
    );
  const inside: unknown = refused(() =>
    perform(
      { a: body },
      HumanChain.subject("a")
        .gesture({ kind: "wave", count: 4 })
        .stand({ seconds: 1 })
        .sync({ of: "music", event: "beat", index: 2 }),
    ),
  );
  if (!(inside instanceof HumanRefusal && inside.kind === "cut"))
    complaints.push(
      `a stand synced into a wave's stroke: expected a cut refusal, got ${said(inside)}`,
    );
  const unnamed: unknown = refused(() =>
    perform(
      { a: body },
      HumanChain.subject("a")
        .stand({ seconds: 4 })
        .gesture({ kind: "nod" })
        .sync({ of: "dialogue", event: "accent", align: "apex" }),
    ),
  );
  if (
    !(
      unnamed instanceof HumanRefusal &&
      unnamed.axis === "sync" &&
      unnamed.feasible?.kind === "alternatives" &&
      unnamed.feasible.values.includes("strokeStart")
    )
  )
    complaints.push(
      `an instant the nod does not have: expected its instants listed, got ${said(unnamed)}`,
    );

  // 7. The tracks.
  const beats = cues.music.filter((c): boolean => c.name === "beat");
  const downs = cues.music.filter((c): boolean => c.name === "downbeat");
  if (
    beats.length !== 16 ||
    downs.length !== 4 ||
    beats.some((c, i): boolean => Math.abs(c.seconds - (i * 60) / 96) > 1e-9) ||
    downs.some((c, i): boolean => Math.abs(c.seconds - (i * 240) / 96) > 1e-9)
  )
    complaints.push(
      `16 beats at 96 a minute in common time: got ${beats.length} beats and ${downs.length} downbeats, or one off its second`,
    );
  const spoken = HumanCue.dialogue([
    { from: 5, to: 6, accents: [5.5] },
    { from: 1, to: 4, accents: [2, 3.2], phrases: [2.6] },
  ]).map((c): string => c.name);
  TestValidator.equals("a dialogue's instants in film order", spoken, [
    "lineStart",
    "accent",
    "phraseEnd",
    "accent",
    "lineEnd",
    "lineStart",
    "accent",
    "lineEnd",
  ]);
  if (
    refused(() => HumanCue.dialogue([{ from: 1, to: 2, accents: [2.5] }])) ===
    null
  )
    complaints.push("an accent after its line ends is accepted");

  TestValidator.equals("actions meet their instants", complaints, []);
}
