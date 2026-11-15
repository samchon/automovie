import { createLadder } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionManner,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
  HumanVerdicts,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The travel and carriage laws composed on the grammar (#3360's composition
 * matrix): each law by an overlay on one arm, an overlay on both arms, a
 * manner preset, a carried load and a coupled partner, where the axis
 * applies, keeps every shipped verdict (`HumanVerdicts`), and the walk and
 * the run keep their kinematic signature.
 *
 * Bodies: the average man and the small woman, two statures. Every
 * performance is read by `HumanVerdicts.of`, the shipped bounds unchanged; a
 * refused composition or an unclean report is a finding with its text.
 *
 * Scenarios:
 * 1. Overlay on one arm: a right-hand wave over `stand`, `walk`, `run`,
 *    `approach`, `climbStairs` and `stepOver`, and over a one-hand `carry`
 *    in the left hand (the free arm); the wave plans on the carrier (one
 *    overlay segment) and the report is clean.
 * 2. Overlay on both arms: a clap over `stand`, `walk` and `run`, the same.
 * 3. Manner presets: `weary` and `brisk` against the neutral act for
 *    `walk`, `run`, `approach`, `carry`, `climbStairs`, `crawl` and
 *    `climbLadder`: the weary act lasts longer and the brisk one (walk, run,
 *    carry) less, each report clean. A weary walk's mean speed and steady
 *    step are below the neutral walk's (sad and weary walks are slower with
 *    shorter strides, Montepare, Goldstein and Clausen 1987, the direction
 *    `AutoMovieMotionManner.PRESETS` cites).
 * 4. Neutral manner: a walk given an empty manner is the walk given none,
 *    bone for bone at every 0.1 s.
 * 5. Carried load: `carry`'s former variants, `oneHand` and `hip` on each
 *    side and `twoHands` and `push`, each plain and `weary`, clean.
 * 6. Coupled partner: an approach to a standing partner at `personal`,
 *    plain and `weary`, ends with the sternums within 0.02 m of the gap the
 *    neutral approach reaches (#3227's M1: the manner never moves a goal on
 *    a solid place), facing the partner within 5 degrees.
 * 7. Kinematic signature, in the steady middle (25 to 85 %) of a 6 m walk
 *    and a 10 m run of each pace: the normal walk's mean speed lies in
 *    1.27 to 1.46 m/s (Bohannon 1997, comfortable adult speeds); each foot
 *    bears for less than half the time in every run (a flight phase,
 *    Novacheck 1998); the duty falls from walk to jog to run to sprint
 *    (stance share 62, 31 and 22 % in walking, running and sprinting, Mann
 *    and Hagy 1980).
 * 8. Stride-time variability: over a 12 m walk the coefficient of variation
 *    of each foot's stride times lies within 1 to 3 % (Hausdorff et al.
 *    1995, healthy adults).
 * 9. A short walk of 0.4 m takes at least two steps and ends with the
 *    ankles' midpoint within 10 mm of the floor point asked (#3211).
 * 10. Replay and variation: the 6 m walk performed again with the same seed
 *     is bone for bone the same; with another seed its duration differs.
 * 11. Refusals: a manner pace of 0, a manner intensity above 1 and an
 *     authored stride of 1.4 with a manner are each refused with the
 *     parameter's name in the reason.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs every law of the matrix through the public chain and reads the shipped verdict report, displayed bones, segments and overlays: a refused overlay, an unclean report, a manner that does not change the pace or moves a goal on a solid place, a gait without flight or out of its cited speed and duty, a non-replaying take or an accepted bad manner is caught.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is a shipped verdict (`HumanVerdicts`), #3360's acceptance (Bohannon 1997, Mann and Hagy 1980, Novacheck 1998, Hausdorff et al. 1995) or #3227's 0.02 m and 5 degrees; none is read from the laws.
 * @evidence contracts/development/testing.md#distinguishing-cases Two statures; every travel law on every axis that applies to it; both sides of the side-taking loads; two presets each way of the neutral one; a second seed; three refusals.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies and an archetype ladder, discovered by its exported name; no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the eleven scenarios, their bounds and sources.
 */
export function test_human_motion_recompose_travel(): void {
  const findings: string[] = [];

  /** The everyday captures' 0.3 m box, its near side 0.35 m ahead (the law sweep's). */
  const box: IHumanProp = {
    subject: "box",
    frame: {
      position: { x: 0, y: 0, z: 0.6 },
      rotation: { x: 0, y: 1, z: 0, w: 0 },
    },
    points: {},
    affordances: [
      {
        id: "edge",
        kind: "ledge",
        frame: {
          translation: { x: 0, y: 0.3, z: 0.25 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
      },
      {
        id: "top",
        kind: "surface",
        frame: {
          translation: { x: 0, y: 0.3, z: 0.125 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
        depth: 0.25,
      },
    ],
  };
  const ladder = (): IHumanProp =>
    HumanObject.prop("ladder", createLadder({ kind: "fixed" }), {
      at: { x: 0, y: 0, z: 0.35 },
      yaw: 180,
      fixed: true,
    });
  const weary: AutoMovieMotionManner.IManner =
    AutoMovieMotionManner.PRESETS.weary;
  const brisk: AutoMovieMotionManner.IManner =
    AutoMovieMotionManner.PRESETS.brisk;
  const PARTNER: number = 3;

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const partner: IHumanBody = motionHumanBody("m-average");

    // One performer, or two with a partner standing `PARTNER` ahead.
    const perform = (
      chain: HumanChain,
      props: IHumanProp[] = [],
      options: { seed?: string; duo?: boolean } = {},
    ): HumanPerformance =>
      new HumanPerformance({
        seed: options.seed ?? "recompose-travel",
        props,
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          ...(options.duo === true
            ? [
                {
                  subject: "b",
                  body: partner,
                  at: { x: 0, y: 0, z: PARTNER },
                  yaw: 180,
                  proficiency: { level: "trained" as const },
                },
              ]
            : []),
        ],
        composition:
          options.duo === true
            ? {
                kind: "parallel",
                parts: [
                  chain.node,
                  HumanChain.subject("b").stand({ seconds: 12, sway: 0 }).node,
                ],
              }
            : chain.node,
      });
    const attempt = (
      label: string,
      run: () => HumanPerformance,
    ): HumanPerformance | undefined => {
      try {
        const performance: HumanPerformance = run();
        const report: HumanVerdicts.IReport = HumanVerdicts.of(performance);
        if (!report.clean)
          findings.push(
            `${name}: ${label}: ${HumanVerdicts.describe(report)}`,
          );
        return performance;
      } catch (error) {
        findings.push(
          `${name}: ${label} is refused: ${error instanceof Error ? error.message : String(error)}`,
        );
        return undefined;
      }
    };
    const a = (): HumanChain => HumanChain.subject("a");

    // The travel laws, each as the chain that performs it with a manner.
    type Law =
      | "stand"
      | "walk"
      | "run"
      | "approach"
      | "carry"
      | "climbStairs"
      | "stepOver"
      | "crawl"
      | "climbLadder";
    interface IAct {
      chain: (manner?: AutoMovieMotionManner.IManner) => HumanChain;
      props: () => IHumanProp[];
      duo: boolean;
    }
    const manner = (
      m: AutoMovieMotionManner.IManner | undefined,
    ): { manner?: AutoMovieMotionManner.IManner } =>
      m === undefined ? {} : { manner: m };
    const ACTS: Record<Law, IAct> = {
      stand: {
        chain: () => a().stand({ seconds: 3 }),
        props: () => [],
        duo: false,
      },
      walk: {
        chain: (m) => a().walk({ to: { x: 0, y: 0, z: 3 }, ...manner(m) }),
        props: () => [],
        duo: false,
      },
      run: {
        chain: (m) => a().run({ to: { x: 0, y: 0, z: 6 }, ...manner(m) }),
        props: () => [],
        duo: false,
      },
      approach: {
        chain: (m) =>
          a().approach({
            target: { kind: "person", subject: "b", region: "sternum" },
            at: "personal",
            ...manner(m),
          }),
        props: () => [],
        duo: true,
      },
      carry: {
        chain: (m) =>
          a().carry({
            to: { x: 0, y: 0, z: 2.5 },
            how: "oneHand",
            side: "left",
            load: 0.15,
            ...manner(m),
          }),
        props: () => [],
        duo: false,
      },
      climbStairs: {
        chain: (m) =>
          a().climbStairs({ count: 4, direction: "up", ...manner(m) }),
        props: () => [],
        duo: false,
      },
      stepOver: {
        chain: () => a().stepOver({ obstacle: "box" }),
        props: () => [box],
        duo: false,
      },
      crawl: {
        chain: (m) => a().crawl({ cycles: 2, ...manner(m) }),
        props: () => [],
        duo: false,
      },
      climbLadder: {
        chain: (m) => a().climbLadder({ ladder: "ladder", ...manner(m) }),
        props: () => [ladder()],
        duo: false,
      },
    };
    const act = (
      law: Law,
      m?: AutoMovieMotionManner.IManner,
      over?: (u: HumanChain) => HumanChain,
    ): HumanChain => {
      const chain: HumanChain = ACTS[law].chain(m);
      return over === undefined ? chain : chain.over(over);
    };
    const play = (
      law: Law,
      label: string,
      m?: AutoMovieMotionManner.IManner,
      over?: (u: HumanChain) => HumanChain,
    ): HumanPerformance | undefined =>
      attempt(`${law} ${label}`, () =>
        perform(act(law, m, over), ACTS[law].props(), {
          duo: ACTS[law].duo,
        }),
      );
    const length = (p: HumanPerformance | undefined): number =>
      p?.segments("a")[0]?.plan.duration ?? NaN;

    // 1. An overlay on one arm.
    const wave = (u: HumanChain): HumanChain =>
      u.gesture({ kind: "wave", side: "right" });
    for (const law of [
      "stand",
      "walk",
      "run",
      "approach",
      "carry",
      "climbStairs",
      "stepOver",
    ] as const) {
      const p: HumanPerformance | undefined = play(
        law,
        "with a right-hand wave",
        undefined,
        wave,
      );
      if (p !== undefined && p.overlays("a").length !== 1)
        findings.push(
          `${name}: ${law} with a right-hand wave has ${p.overlays("a").length} overlays, 1 expected`,
        );
    }

    // 2. An overlay on both arms.
    const clap = (u: HumanChain): HumanChain => u.gesture({ kind: "clap" });
    for (const law of ["stand", "walk", "run"] as const) {
      const p: HumanPerformance | undefined = play(
        law,
        "with a clap",
        undefined,
        clap,
      );
      if (p !== undefined && p.overlays("a").length !== 1)
        findings.push(
          `${name}: ${law} with a clap has ${p.overlays("a").length} overlays, 1 expected`,
        );
    }

    // 3. Manner presets.
    for (const law of [
      "walk",
      "run",
      "approach",
      "carry",
      "climbStairs",
      "crawl",
      "climbLadder",
    ] as const) {
      const neutral: number = length(play(law, "neutral"));
      const slow: number = length(play(law, "weary", weary));
      if (!(slow > neutral))
        findings.push(
          `${name}: a weary ${law} lasts ${slow.toFixed(3)} s against the neutral ${neutral.toFixed(3)} s, longer expected`,
        );
      if (law === "walk" || law === "run" || law === "carry") {
        const quick: number = length(play(law, "brisk", brisk));
        if (!(quick < neutral))
          findings.push(
            `${name}: a brisk ${law} lasts ${quick.toFixed(3)} s against the neutral ${neutral.toFixed(3)} s, shorter expected`,
          );
      }
    }

    // The steady middle of a walk or run: its mean speed, its mean step and its gait.
    interface ISteady {
      speed: number;
      step: number;
      gait: HumanSignature.IGait;
    }
    const steady = (p: HumanPerformance): ISteady => {
      const reader: HumanSignature.IReader = HumanSignature.of(p, "a", body, 0);
      const from: number = 0.25 * p.duration;
      const to: number = 0.85 * p.duration;
      const at = (t: number): IAutoMovieVector3 =>
        HumanSignature.joint(reader, t, "hips");
      const gait: HumanSignature.IGait = HumanSignature.gait(reader, from, to);
      const strikes: number[] = gait.strikes.map(
        (s: { seconds: number }): number => at(s.seconds).z,
      );
      const steps: number[] = strikes
        .slice(1)
        .map((z: number, i: number): number => z - strikes[i]!);
      return {
        speed: (at(to).z - at(from).z) / (to - from),
        step:
          steps.length === 0
            ? NaN
            : steps.reduce((s: number, v: number): number => s + v, 0) /
              steps.length,
        gait,
      };
    };
    const walked = (
      to: number,
      m?: AutoMovieMotionManner.IManner,
      seed?: string,
    ): HumanPerformance | undefined =>
      attempt(`a ${to} m walk${m === undefined ? "" : " in a manner"}`, () =>
        perform(
          a().walk({ to: { x: 0, y: 0, z: to }, ...manner(m) }),
          [],
          seed === undefined ? {} : { seed },
        ),
      );
    const plain: HumanPerformance | undefined = walked(6);
    const tired: HumanPerformance | undefined = walked(6, weary);
    if (plain !== undefined && tired !== undefined) {
      const free: ISteady = steady(plain);
      const slow: ISteady = steady(tired);
      if (!(slow.speed < free.speed))
        findings.push(
          `${name}: a weary walk's steady speed is ${slow.speed.toFixed(3)} m/s against ${free.speed.toFixed(3)}, slower expected (Montepare et al. 1987)`,
        );
      if (!(slow.step < free.step))
        findings.push(
          `${name}: a weary walk's steady step is ${slow.step.toFixed(3)} m against ${free.step.toFixed(3)}, shorter expected (Montepare et al. 1987)`,
        );

      // 7. The walk's speed and duty.
      if (!(free.speed >= 1.27 && free.speed <= 1.46))
        findings.push(
          `${name}: the normal walk's steady speed is ${free.speed.toFixed(3)} m/s, inside Bohannon's 1.27 to 1.46 expected`,
        );
      let previous: number = free.gait.duty;
      for (const pace of ["jog", "run", "sprint"] as const) {
        const p: HumanPerformance | undefined = attempt(`a ${pace}`, () =>
          perform(a().run({ to: { x: 0, y: 0, z: 10 }, pace })),
        );
        if (p === undefined) continue;
        const duty: number = steady(p).gait.duty;
        if (!(duty < 0.5))
          findings.push(
            `${name}: a ${pace}'s feet bear ${(duty * 100).toFixed(1)} % of the time, under half expected (a flight phase, Novacheck 1998)`,
          );
        if (!(duty < previous))
          findings.push(
            `${name}: a ${pace}'s duty ${duty.toFixed(3)} is not below the slower gait's ${previous.toFixed(3)} (Mann and Hagy 1980)`,
          );
        previous = duty;
      }

      // 10. Replay and variation.
      const again: HumanPerformance | undefined = walked(6);
      if (again !== undefined)
        for (let t: number = 0; t <= plain.duration; t += 0.1) {
          const p: IAutoMovieVector3 = plain.bones("a", t).get("rightFoot")!
            .worldPosition;
          const q: IAutoMovieVector3 = again.bones("a", t).get("rightFoot")!
            .worldPosition;
          if (p.x !== q.x || p.y !== q.y || p.z !== q.z) {
            findings.push(
              `${name}: the walk performed again with its seed differs at ${t.toFixed(1)} s`,
            );
            break;
          }
        }
      const other: HumanPerformance | undefined = walked(6, undefined, "other");
      if (other !== undefined && other.duration === plain.duration)
        findings.push(
          `${name}: the walk with another seed lasts exactly as long, ${plain.duration} s, a different stride timing expected`,
        );
    }

    // 4. A neutral manner is no manner.
    const none: HumanPerformance | undefined = walked(3);
    const empty: HumanPerformance | undefined = walked(3, {});
    if (none !== undefined && empty !== undefined) {
      if (none.duration !== empty.duration)
        findings.push(
          `${name}: a walk with an empty manner lasts ${empty.duration} s against ${none.duration} s without one`,
        );
      else
        for (let t: number = 0; t <= none.duration; t += 0.1) {
          const p: IAutoMovieVector3 = none.bones("a", t).get("leftHand")!
            .worldPosition;
          const q: IAutoMovieVector3 = empty.bones("a", t).get("leftHand")!
            .worldPosition;
          if (Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) !== 0) {
            findings.push(
              `${name}: a walk with an empty manner differs from one without at ${t.toFixed(1)} s`,
            );
            break;
          }
        }
    }

    // 5. The carry's former variants.
    for (const variant of [
      { how: "oneHand", side: "left" },
      { how: "oneHand", side: "right" },
      { how: "hip", side: "left" },
      { how: "hip", side: "right" },
      { how: "twoHands" },
      { how: "push" },
    ] as const)
      for (const m of [undefined, weary])
        attempt(
          `a ${variant.how} carry${"side" in variant ? ` on the ${variant.side}` : ""}${m === undefined ? "" : ", weary"}`,
          () =>
            perform(
              a().carry({
                to: { x: 0, y: 0, z: 2.5 },
                load: 0.15,
                ...variant,
                ...manner(m),
              }),
            ),
        );

    // 6. A coupled partner: the gap a manner keeps.
    const gap = (
      p: HumanPerformance | undefined,
    ): { gap: number; facing: number } => {
      if (p === undefined) return { gap: NaN, facing: NaN };
      const end: number = p.segments("a")[0]!.start + length(p);
      const mine: IAutoMovieVector3 = HumanSignature.region(
        HumanSignature.of(p, "a", body, 0),
        "sternum",
        end,
      );
      const theirs: IAutoMovieVector3 = HumanSignature.region(
        HumanSignature.of(p, "b", partner, 180),
        "sternum",
        end,
      );
      const hips = p.bones("a", end).get("hips")!.worldRotation;
      // The hips' forward (+Z turned by their rotation) against the line to the partner.
      const fx: number = 2 * (hips.x * hips.z + hips.w * hips.y);
      const fz: number = 1 - 2 * (hips.x * hips.x + hips.y * hips.y);
      const heading: number = (Math.atan2(fx, fz) * 180) / Math.PI;
      const toward: number =
        (Math.atan2(theirs.x - mine.x, theirs.z - mine.z) * 180) / Math.PI;
      return {
        gap: Math.hypot(mine.x - theirs.x, mine.z - theirs.z),
        facing: Math.abs(((heading - toward + 540) % 360) - 180),
      };
    };
    const free = gap(play("approach", "to the partner"));
    const slow = gap(play("approach", "weary to the partner", weary));
    if (!(Math.abs(slow.gap - free.gap) <= 0.02))
      findings.push(
        `${name}: a weary approach stops ${slow.gap.toFixed(3)} m from the partner against ${free.gap.toFixed(3)} m, within 0.02 m expected (#3227)`,
      );
    for (const [label, read] of [
      ["neutral", free],
      ["weary", slow],
    ] as const)
      if (!(read.facing <= 5))
        findings.push(
          `${name}: the ${label} approach ends facing ${read.facing.toFixed(1)} degrees off the partner, within 5 expected (#3227)`,
        );

    // 8. Stride-time variability.
    const long: HumanPerformance | undefined = walked(12);
    if (long !== undefined) {
      const strikes: HumanSignature.IGait["strikes"] = steady(long).gait
        .strikes;
      for (const side of ["left", "right"] as const) {
        const own: number[] = strikes
          .filter((s): boolean => s.side === side)
          .map((s): number => s.seconds);
        const strides: number[] = own
          .slice(1)
          .map((t: number, i: number): number => t - own[i]!);
        if (strides.length < 3) {
          findings.push(
            `${name}: a 12 m walk's steady middle has ${strides.length} ${side} strides, at least 3 expected`,
          );
          continue;
        }
        const mean: number =
          strides.reduce((s: number, v: number): number => s + v, 0) /
          strides.length;
        const cv: number =
          Math.sqrt(
            strides.reduce(
              (s: number, v: number): number => s + (v - mean) ** 2,
              0,
            ) /
              (strides.length - 1),
          ) / mean;
        if (!(cv >= 0.01 && cv <= 0.03))
          findings.push(
            `${name}: the ${side} stride times vary by ${(cv * 100).toFixed(2)} %, within 1 to 3 % expected (Hausdorff et al. 1995)`,
          );
      }
    }

    // 9. A short walk.
    const short: HumanPerformance | undefined = walked(0.4);
    if (short !== undefined) {
      const reader: HumanSignature.IReader = HumanSignature.of(
        short,
        "a",
        body,
        0,
      );
      const strikes: number = HumanSignature.gait(
        reader,
        0,
        short.duration,
      ).strikes.length;
      if (!(strikes >= 2))
        findings.push(
          `${name}: a 0.4 m walk strikes ${strikes} times, at least two steps expected (#3211)`,
        );
      const left: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        short.duration,
        "leftFoot",
      );
      const right: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        short.duration,
        "rightFoot",
      );
      const off: number = Math.hypot(
        (left.x + right.x) / 2,
        (left.z + right.z) / 2 - 0.4,
      );
      if (!(off <= 0.01))
        findings.push(
          `${name}: a 0.4 m walk ends with the ankles' midpoint ${(off * 1000).toFixed(1)} mm from the point asked, within 10 mm expected (#3211)`,
        );
    }

    // 11. Refusals.
    for (const [label, params, parameter] of [
      [
        "a manner pace of 0",
        { to: { x: 0, y: 0, z: 2 }, manner: { pace: 0 } },
        "manner.pace",
      ],
      [
        "a manner intensity of 1.5",
        { to: { x: 0, y: 0, z: 2 }, manner: { intensity: 1.5 } },
        "manner.intensity",
      ],
      [
        "a stride of 1.4 with a manner",
        { to: { x: 0, y: 0, z: 2 }, stride: 1.4, manner: weary },
        "stride",
      ],
    ] as const) {
      let reason: string = "";
      try {
        perform(a().walk(params));
      } catch (error) {
        reason = error instanceof Error ? error.message : String(error);
      }
      if (!reason.includes(parameter))
        findings.push(
          `${name}: a walk with ${label} is ${reason === "" ? "accepted" : `refused for "${reason}"`}, refused naming ${parameter} expected`,
        );
    }
  }
  TestValidator.equals(
    "the travel laws composed on the grammar",
    findings,
    [],
  );
}
