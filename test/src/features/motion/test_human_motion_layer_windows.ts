import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanAffect,
  HumanBreath,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanLayer,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A layer runs inside the window it is scheduled in: nothing of it shows
 * outside, it comes in and goes out without a step, and its window may open
 * at an instant of another person's action.
 *
 * "She sighs as he finishes waving" is a layer on her, opened at an instant
 * of his action, over whatever she is doing; it cuts nothing of hers. A
 * layer adds to the body, so where it is absent the body is exactly the
 * body without it, and where it enters it must not jump: a displayed joint
 * may move no farther in one 24 Hz frame than the layer moves it at full
 * weight in that time plus the fade's own share, which the scenarios bound
 * by comparing against the unlayered film.
 *
 * Scenarios, two average men standing 1.5 m apart, the second waving:
 * 1. Breathing scheduled from 2 s to 4 s: before 2 s and after 4 s every
 *    joint centre is where the film without the layer has it, to the
 *    micrometre; at 3 s the chest has moved.
 * 2. One frame inside each edge of that window no joint centre is more
 *    than 2 mm from the unlayered film, so the layer neither pops in nor
 *    pops out (full-weight breathing moves a joint up to 22 mm).
 * 3. Away from its edges the windowed layer is the whole-film layer: at
 *    3 s every joint centre agrees to the micrometre.
 * 4. A sigh scheduled at the end of the other man's wave stroke: nothing
 *    shows before that instant, and within 0.8 s after it the chest has
 *    moved more than 5 mm. The layer is built from the window's seconds.
 * 5. A layer sees the action under it: scheduled over a stand, it reads
 *    `stand` as the action at every second it is applied.
 * 6. Refused, each naming what to change: a layer that writes a leg while
 *    the stand plants that foot (a channel refusal naming the contact); a
 *    window opened at an anchor that does not exist (the anchors listed);
 *    at an event the action lacks (its events listed); a window that ends
 *    before it starts.
 * 7. The same performance built twice shows the same poses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public input and reads displayed joint centres and refusals; a layer that leaks outside its window, steps at an edge, opens at the wrong instant or is accepted over a held limb fails.
 * @evidence contracts/development/testing.md#independent-expectations The comparisons are against the same film without the layer and with it for the whole film; no expected pose is stored. The 2 mm edge bound is a tenth of the layer's own full displacement, measured here, in one frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside, outside and both edges of a window; a second and a partner's event as its opening; a layer given and a layer built from the window; four refusals.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and samples short films; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 7 scenarios with their bounds.
 */
export function test_human_motion_layer_windows(): void {
  const FRAME: number = 1 / 24;
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const perform = (
    layers: readonly (IHumanLayer | IHumanLayer.IScheduled)[],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "layer",
      layers: { a: layers },
      performers: ["a", "b"].map((subject: string, index: number) => ({
        subject,
        body,
        at: { x: index * 1.5, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      })),
      composition: HumanChain.subject("a")
        .stand({ seconds: 6 })
        .with(
          HumanChain.subject("b")
            .stand({ seconds: 1 })
            .gesture({ kind: "wave" }, "bye")
            .stand({ seconds: 2 }),
        ).node,
    });

  // The farthest any of a's joint centres lies between two films, metres.
  const apart = (
    one: HumanPerformance,
    other: HumanPerformance,
    seconds: number,
  ): number => {
    const there: ReturnType<HumanPerformance["bones"]> = other.bones(
      "a",
      seconds,
    );
    let far: number = 0;
    for (const [bone, resolved] of one.bones("a", seconds)) {
      const p: IAutoMovieVector3 = resolved.worldPosition;
      const q: IAutoMovieVector3 = there.get(bone)!.worldPosition;
      far = Math.max(far, Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z));
    }
    return far;
  };
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
  const mm = (metres: number): string => `${(metres * 1000).toFixed(2)} mm`;

  const bare: HumanPerformance = perform([]);
  const whole: HumanPerformance = perform([HumanBreath.layer({ rate: 20 })]);
  const windowed = (): HumanPerformance =>
    perform([{ layer: HumanBreath.layer({ rate: 20 }), from: 2, to: 4 }]);
  const breathing: HumanPerformance = windowed();

  // 1. Nothing outside, something inside.
  for (const seconds of [0.5, 1.99, 4.01, 5.5]) {
    const leak: number = apart(breathing, bare, seconds);
    if (leak > 1e-6)
      complaints.push(
        `breathing scheduled from 2 s to 4 s moves a joint ${mm(leak)} at ${seconds} s, outside its window`,
      );
  }
  if (!(apart(breathing, bare, 3) > 0.002))
    complaints.push(
      `breathing scheduled from 2 s to 4 s moves no joint more than ${mm(apart(breathing, bare, 3))} at 3 s`,
    );

  // 2. No step at either edge.
  for (const seconds of [2 + FRAME, 4 - FRAME]) {
    const step: number = apart(breathing, bare, seconds);
    if (step > 0.002)
      complaints.push(
        `one frame inside its window (${seconds.toFixed(3)} s) the breathing layer has a joint ${mm(step)} from the unlayered film, within 2 mm expected`,
      );
  }

  // 3. In the middle it is the layer itself.
  if (apart(breathing, whole, 3) > 1e-6)
    complaints.push(
      `at 3 s the windowed breathing differs from whole-film breathing by ${mm(apart(breathing, whole, 3))}`,
    );

  // 4. A window opened at a partner's instant, the layer built from it.
  const sighing: HumanPerformance = perform([
    {
      from: { of: "bye", event: "strokeEnd" },
      layer: (window: IHumanLayer.IWindow): IHumanLayer =>
        HumanAffect.layer([{ kind: "sigh", at: window.from }]),
    },
  ]);
  const cue: number = sighing.instant({ of: "bye", event: "strokeEnd" });
  const wave: HumanSegment.ISegment = sighing.segments("b")[1]!;
  const stroke: number =
    wave.start +
    wave.plan.events.find((e): boolean => e.name === "strokeEnd")!.share *
      wave.plan.duration;
  if (Math.abs(cue - stroke) > 1e-9)
    complaints.push(
      `the instant of the wave's strokeEnd reads ${cue.toFixed(4)} s, the placed action has it at ${stroke.toFixed(4)} s`,
    );
  if (apart(sighing, bare, cue - FRAME) > 1e-6)
    complaints.push(
      `a sigh scheduled at the partner's strokeEnd shows ${mm(apart(sighing, bare, cue - FRAME))} a frame before it`,
    );
  if (!(apart(sighing, bare, cue + 0.8) > 0.005))
    complaints.push(
      `0.8 s after the partner's strokeEnd the sigh has moved no joint more than ${mm(apart(sighing, bare, cue + 0.8))}, over 5 mm expected`,
    );

  // 5. A layer sees the action under it.
  const seen: Set<string> = new Set();
  perform([
    {
      from: 1,
      to: 2,
      layer: {
        name: "witness",
        apply: (
          posture: IHumanPosture,
          _seconds: number,
          context: IHumanLayer.IContext,
        ): IHumanPosture => {
          seen.add(context.action()?.name ?? "none");
          return posture;
        },
      },
    },
  ]).pose("a", 1.5);
  if (!(seen.size === 1 && seen.has("stand")))
    complaints.push(
      `a layer over a stand reads the action under it as ${[...seen].join(", ") || "nothing"}, stand expected`,
    );

  // 6. What cannot be scheduled.
  const still: IHumanLayer["apply"] = (posture: IHumanPosture): IHumanPosture =>
    posture;
  for (const [label, layer, kind, mentions] of [
    [
      "a layer writing a planted leg",
      {
        from: 1,
        to: 3,
        layer: { name: "sway", channels: ["leftLeg"], apply: still },
      },
      "channel",
      "leftFoot",
    ],
    [
      "a window opened at a missing anchor",
      { from: { of: "exit", event: "end" }, layer: HumanBreath.layer() },
      "participant",
      "bye",
    ],
    [
      "a window opened at a missing event",
      { from: { of: "bye", event: "apex" }, layer: HumanBreath.layer() },
      "parameter",
      "strokeEnd",
    ],
    [
      "a window that ends before it starts",
      { from: 3, to: 2, layer: HumanBreath.layer() },
      "parameter",
      "3.00",
    ],
  ] as const satisfies readonly (readonly [
    string,
    IHumanLayer.IScheduled,
    HumanRefusal["kind"],
    string,
  ])[]) {
    const thrown: unknown = refused(() => perform([layer]));
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === kind &&
        thrown.message.includes(mentions)
      )
    )
      complaints.push(
        `${label}: expected a ${kind} refusal mentioning ${mentions}, got ${said(thrown)}`,
      );
  }

  // 7. Twice the same.
  const again: HumanPerformance = windowed();
  for (const seconds of [2.1, 3, 3.9])
    if (apart(breathing, again, seconds) !== 0)
      complaints.push(
        `built twice, the windowed breathing differs at ${seconds} s by ${mm(apart(breathing, again, seconds))}`,
      );

  TestValidator.equals("layers keep their windows", complaints, []);
}
