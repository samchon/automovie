import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanFoot,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Each gait that carries a state of the walker shows it, against the
 * neutral walk of the same body: a limp spares one leg, a stiff-knee limp
 * also swings it straight, a tiptoe never sets the heels down, a prowl is
 * lower than a sneak, a sad walk is slow and slumped, a proud one upright
 * and free, and a drunk one leaves its line and loses its rhythm.
 *
 * Read at the footfalls the gait names between 25 and 85 % of its time, on
 * the displayed body: a stance is from a foot's heel strike to its next
 * toe-off, a swing from its toe-off to its next heel strike, and the body
 * is read at their middles. One body performs each style, the average man
 * or the small woman in turn, beside its own neutral walk; six metres are
 * walked.
 *
 * Scenarios:
 * 1. `limp` of the right leg: the right foot's stances last at least 10 %
 *    less than the left's (a painful leg is stood on briefly; a normal
 *    stance is about 60 % of the stride, Perry and Burnfield 2010; the 10 %
 *    is a provisional floor until a cohort's asymmetry is read).
 * 2. `stiffLimp` of the right leg: at the middle of its swings the right
 *    knee is flexed at least 15 degrees less than the left knee at the
 *    middle of its own (a stiff knee does not fold to swing; the margin is
 *    provisional).
 * 3. `tiptoe`: at the middle of every stance read, the heel's sole point is
 *    at least 20 mm above the floor while the toe's is within 20 mm of it.
 * 4. `prowl` carries the hips lower than `sneak` on the same body.
 * 5. `sad` goes at least 10 % slower than the neutral walk, with less wrist
 *    travel and the trunk inclined further forward; `proud` keeps the
 *    neutral speed within 10 % with more wrist travel and the trunk
 *    inclined less (the directions of Michalak et al. 2009 for sadness, and
 *    their opposite). The comparison is seed-paired: a style draws its
 *    take's tempo as the walk in its place of the chain does, so the two
 *    takes differ by the style alone.
 * 6. `drunk` leaves the straight line by more than three times the neutral
 *    walk's greatest sideways excursion, and its step times vary more than
 *    the neutral walk's (Gimunova et al. 2022 and Suffoletto et al. 2020
 *    give more sway and more variable gait under alcohol; directions only).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers each gait through the public input, performs it on a real body and reads the displayed knees, soles, hips, trunk and wrists; a style that is the neutral walk under another name fails its comparison.
 * @evidence contracts/development/testing.md#independent-expectations Every expectation is the direction the style's name and its cited description state, compared with the same body's neutral walk or sneak, never a value from a gait table. Limitation: magnitudes are not asserted beyond the stated provisional margins, since none was read at a source, and the footfall instants are the gait's own events.
 * @evidence contracts/development/testing.md#distinguishing-cases Seven styles, each against the reference it must differ from, on two bodies of opposite build taken in turn.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds eleven short performances in memory, reading about a dozen instants of each: one body per style keeps the run near a minute, and the comparison is within one body, so a second body per style would repeat the same claim.
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, at which instants, and the 6 scenarios with their bounds and sources.
 */
export function test_human_motion_travel_styles(): void {
  const complaints: string[] = [];

  /** What one gait shows over the middle of its way. */
  interface IReading {
    /** The hip joints' advance over the instants read, metres per second. */
    speed: number;

    /** The hip joints' mean height, metres. */
    hips: number;

    /** The trunk's mean forward inclination, degrees. */
    trunk: number;

    /** The left wrist's fore-aft travel against the hips, metres. */
    swing: number;

    /** The greatest sideways excursion of the hips from the line walked, metres. */
    aside: number;

    /** Mean stance seconds of each foot. */
    stance: Record<"left" | "right", number>;

    /** Mean knee flexion of each leg at the middle of its swings, degrees. */
    swung: Record<"left" | "right", number>;

    /** The lowest heel height and the highest toe height at the middles of the stances, metres. */
    soles: { heel: number; toe: number };

    /** The standard deviation of the step times over their mean. */
    uneven: number;
  }
  const read = (
    body: IHumanBody,
    name: string,
    row: string | null,
    params: object = {},
  ): IReading | null => {
    const standing: HumanChain = HumanChain.subject("a").stand({
      seconds: 0.3,
    });
    const to: IAutoMovieVector3 = { x: 0, y: 0, z: 6 };
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "styles",
        laws: [...HUMAN_LEXICON.gait!],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: (row === null
          ? standing.walk({ to })
          : standing.registered(row, { ...params, to })
        ).node,
      });
    } catch (error) {
      complaints.push(
        `${name} ${row ?? "walk"}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
    const segment: HumanSegment.ISegment = performance.segments("a")[1]!;
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const span: number = segment.end - segment.entryTime;
    const named = (
      kind: "HeelStrike" | "ToeOff",
      side: "left" | "right",
    ): number[] =>
      segment.plan.events
        .filter((e: IAutoMovieMotionEvent): boolean =>
          new RegExp(`^${side}${kind}\\d+$`).test(e.name),
        )
        .map(
          (e: IAutoMovieMotionEvent): number =>
            segment.start + e.share * segment.plan.duration,
        )
        .filter(
          (t: number): boolean =>
            t >= segment.entryTime + 0.25 * span &&
            t <= segment.entryTime + 0.85 * span,
        )
        .sort((a: number, b: number): number => a - b);

    // Each foot's stances (strike to its next toe-off) and swings (toe-off to its next strike) inside the window.
    const spans = (
      side: "left" | "right",
      from: "HeelStrike" | "ToeOff",
    ): (readonly [number, number])[] => {
      const ends: number[] = named(
        from === "HeelStrike" ? "ToeOff" : "HeelStrike",
        side,
      );
      return named(from, side).flatMap(
        (begin: number): (readonly [number, number])[] => {
          const end: number | undefined = ends.find(
            (t: number): boolean => t > begin,
          );
          return end === undefined ? [] : [[begin, end]];
        },
      );
    };
    const mean = (values: readonly number[]): number =>
      values.length === 0
        ? NaN
        : values.reduce((sum: number, v: number): number => sum + v, 0) /
          values.length;
    const stances: Record<"left" | "right", (readonly [number, number])[]> = {
      left: spans("left", "HeelStrike"),
      right: spans("right", "HeelStrike"),
    };
    const swings: Record<"left" | "right", (readonly [number, number])[]> = {
      left: spans("left", "ToeOff"),
      right: spans("right", "ToeOff"),
    };
    const middles: { side: "left" | "right"; seconds: number }[] = (
      ["left", "right"] as const
    ).flatMap(
      (side: "left" | "right"): { side: "left" | "right"; seconds: number }[] =>
        stances[side]
          .slice(0, 2)
          .map(
            (
              s: readonly [number, number],
            ): { side: "left" | "right"; seconds: number } => ({
              side,
              seconds: (s[0] + s[1]) / 2,
            }),
          ),
    );
    if (middles.length < 2) {
      complaints.push(
        `${name} ${row ?? "walk"}: ${middles.length} stances named over the middle of the way, at least 2 expected`,
      );
      return null;
    }
    const hips = (t: number): IAutoMovieVector3 => {
      const l: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        t,
        "leftUpperLeg",
      );
      const r: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        t,
        "rightUpperLeg",
      );
      return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2, z: (l.z + r.z) / 2 };
    };
    const ts: number[] = middles
      .map((m: { seconds: number }): number => m.seconds)
      .sort((a: number, b: number): number => a - b);
    const sole = (
      m: { side: "left" | "right"; seconds: number },
      socket: "heel" | "toe",
    ): number =>
      HumanFoot.sockets(
        body,
        HumanSignature.bones(reader, m.seconds),
        m.side,
      ).find((s: HumanFoot.ISocket): boolean => s.socket === socket)!.point.y;
    const fore: number[] = ts.map(
      (t: number): number =>
        HumanSignature.joint(reader, t, "leftHand").z - hips(t).z,
    );
    const strikes: number[] = [
      ...named("HeelStrike", "left"),
      ...named("HeelStrike", "right"),
    ].sort((a: number, b: number): number => a - b);
    const steps: number[] = strikes
      .slice(1)
      .map((t: number, i: number): number => t - strikes[i]!);
    const even: number = mean(steps);
    return {
      speed:
        (hips(ts[ts.length - 1]!).z - hips(ts[0]!).z) /
        (ts[ts.length - 1]! - ts[0]!),
      hips: mean(ts.map((t: number): number => hips(t).y)),
      trunk: mean(
        ts.map((t: number): number => HumanSignature.trunk(reader, t)),
      ),
      swing: Math.max(...fore) - Math.min(...fore),
      aside: Math.max(...ts.map((t: number): number => Math.abs(hips(t).x))),
      stance: {
        left: mean(
          stances.left.map((s: readonly [number, number]): number => s[1] - s[0]),
        ),
        right: mean(
          stances.right.map(
            (s: readonly [number, number]): number => s[1] - s[0],
          ),
        ),
      },
      swung: {
        left: mean(
          swings.left
            .slice(0, 2)
            .map((s: readonly [number, number]): number =>
              HumanSignature.knee(reader, (s[0] + s[1]) / 2, "left"),
            ),
        ),
        right: mean(
          swings.right
            .slice(0, 2)
            .map((s: readonly [number, number]): number =>
              HumanSignature.knee(reader, (s[0] + s[1]) / 2, "right"),
            ),
        ),
      },
      soles: {
        heel: Math.min(
          ...middles.map(
            (m: { side: "left" | "right"; seconds: number }): number =>
              sole(m, "heel"),
          ),
        ),
        toe: Math.max(
          ...middles.map(
            (m: { side: "left" | "right"; seconds: number }): number =>
              sole(m, "toe"),
          ),
        ),
      },
      uneven: Math.sqrt(
        mean(steps.map((s: number): number => (s - even) * (s - even))),
      ) / even,
    };
  };
  const expect = (ok: boolean, message: string): void => {
    if (!ok) complaints.push(message);
  };
  const man: IHumanBody = motionHumanBody("m-average");
  const woman: IHumanBody = motionHumanBody("f-small");
  const walks: Record<"man" | "woman", IReading | null> = {
    man: read(man, "m-average", null),
    woman: read(woman, "f-small", null),
  };

  // 1. Limp.
  const limp: IReading | null = read(man, "m-average", "limp", {
    side: "right",
  });
  if (limp !== null)
    expect(
      limp.stance.right <= 0.9 * limp.stance.left,
      `m-average limp: the spared right foot stands ${limp.stance.right.toFixed(3)} s and the left ${limp.stance.left.toFixed(3)} s, at least 10 % less on the right expected`,
    );

  // 2. Stiff-knee limp.
  const stiff: IReading | null = read(woman, "f-small", "stiffLimp", {
    side: "right",
  });
  if (stiff !== null)
    expect(
      stiff.swung.right <= stiff.swung.left - 15,
      `f-small stiffLimp: the right knee is flexed ${stiff.swung.right.toFixed(1)} degrees at mid-swing and the left ${stiff.swung.left.toFixed(1)}, at least 15 less on the right expected`,
    );

  // 3. Tiptoe.
  const tiptoe: IReading | null = read(woman, "f-small", "tiptoe");
  if (tiptoe !== null)
    expect(
      tiptoe.soles.heel >= 0.02 && tiptoe.soles.toe <= 0.02,
      `f-small tiptoe: at mid-stance the lowest heel is ${(tiptoe.soles.heel * 1000).toFixed(1)} mm and the highest toe ${(tiptoe.soles.toe * 1000).toFixed(1)} mm above the floor; the heel at least 20 mm up and the toe within 20 mm expected`,
    );

  // 4. Prowl.
  const prowl: IReading | null = read(man, "m-average", "prowl");
  const sneak: IReading | null = read(man, "m-average", "sneak");
  if (prowl !== null && sneak !== null)
    expect(
      prowl.hips < sneak.hips,
      `m-average prowl: the hips ride at ${prowl.hips.toFixed(3)} m and the sneak's at ${sneak.hips.toFixed(3)} m, lower expected`,
    );

  // 5. Moods.
  const sad: IReading | null = read(man, "m-average", "sad");
  if (sad !== null && walks.man !== null)
    expect(
      sad.speed <= 0.9 * walks.man.speed &&
        sad.swing < walks.man.swing &&
        sad.trunk > walks.man.trunk,
      `m-average sad: ${sad.speed.toFixed(2)} m/s, ${sad.swing.toFixed(3)} m of wrist travel and the trunk at ${sad.trunk.toFixed(1)} degrees against the walk's ${walks.man.speed.toFixed(2)}, ${walks.man.swing.toFixed(3)} and ${walks.man.trunk.toFixed(1)}; slower by 10 %, less travel and more inclined expected`,
    );
  const proud: IReading | null = read(woman, "f-small", "proud");
  if (proud !== null && walks.woman !== null)
    expect(
      Math.abs(proud.speed - walks.woman.speed) <= 0.1 * walks.woman.speed &&
        proud.swing > walks.woman.swing &&
        proud.trunk < walks.woman.trunk,
      `f-small proud: ${proud.speed.toFixed(2)} m/s, ${proud.swing.toFixed(3)} m of wrist travel and the trunk at ${proud.trunk.toFixed(1)} degrees against the walk's ${walks.woman.speed.toFixed(2)}, ${walks.woman.swing.toFixed(3)} and ${walks.woman.trunk.toFixed(1)}; the same speed within 10 %, more travel and less inclined expected`,
    );

  // 6. Drunk.
  const drunk: IReading | null = read(woman, "f-small", "drunk");
  if (drunk !== null && walks.woman !== null)
    expect(
      drunk.aside > 3 * walks.woman.aside && drunk.uneven > walks.woman.uneven,
      `f-small drunk: ${drunk.aside.toFixed(3)} m off the line with step times varying ${(drunk.uneven * 100).toFixed(1)} % against the walk's ${walks.woman.aside.toFixed(3)} m and ${(walks.woman.uneven * 100).toFixed(1)} %; more than three times as far off and more varied expected`,
    );
  TestValidator.equals("each style shows its state", complaints, []);
}
