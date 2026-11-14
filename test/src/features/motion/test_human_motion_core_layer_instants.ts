import type { resolveAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanAffect,
  HumanBreath,
  HumanChain,
  HumanCue,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  type IHumanBody,
  type IHumanLayer,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A scheduled layer has instants of its own, addressed like an action's
 * events: when it starts coming in (`onset`), is fully in (`full`), starts
 * going out (`offset`) and is gone (`end`). Another layer's window, an
 * action's sync and an action's cut name them.
 *
 * Scenarios, the average man as `a` and the small woman as `b`, with a
 * dialogue track whose line starts at 1 s; `b` breathes under a layer
 * anchored `air` from the line's start to 4 s with a fade of 0.5 s:
 * 1. The layer's instants are 1.0, 1.5, 3.5 and 4.0 s: the window's ends,
 *    and a fade inside each.
 * 2. A nod of `a` synced to `air`'s `full` begins within one 24 Hz frame of
 *    1.5 s, and a stand of `a` cut on `air`'s `end` ends at 4.0 s.
 * 3. A sigh of `b` windowed from `air`'s `offset`: before 3.5 s the film
 *    shows `b` where the film without the sigh does, to a micrometre, and
 *    within the 2 s after it some joint centre differs by more than 1 mm.
 * 4. A window of 0.4 s with the default fade of 0.3 s is fully in at its
 *    middle and goes out from there: a fade never takes more than half the
 *    window.
 * 5. A layer whose window waits for an action cannot be synced to by an
 *    action: a `participant` refusal on `of`. Two layers under one anchor,
 *    and a layer anchored under a cue track's name, are `parameter`
 *    refusals on `layers`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public input and reads the placed actions, the displayed joints and the thrown refusals; an instant off its second, a sync or a cut that misses it, a second layer that starts early, or an unrefused clash fails.
 * @evidence contracts/development/testing.md#independent-expectations Each instant follows from the window's own seconds and fade by arithmetic; the second layer's effect is compared with the same film without it; the frame bound is the campaign's timing bound.
 * @evidence contracts/development/testing.md#distinguishing-cases A window from a cue and to a second; a sync and a cut on layer instants; a layer windowed on a layer; the fade's half-window limit; a window that waits for an action; two kinds of duplicate name. Windows, fades and channel refusals are `test_human_motion_layer_windows`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their seconds and bounds.
 */
export function test_human_motion_core_layer_instants(): void {
  const complaints: string[] = [];
  const FRAME: number = 1 / 24;
  const cues: Record<string, readonly resolveAutoMovieSchedule.ICue[]> = {
    dialogue: HumanCue.dialogue([{ from: 1, to: 3, accents: [2] }]),
  };
  const bodies: Record<"a" | "b", IHumanBody> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
  };
  const air: IHumanLayer.IScheduled = {
    anchor: "air",
    from: { of: "dialogue", event: "lineStart" },
    to: 4,
    fade: 0.5,
    layer: HumanBreath.layer(),
  };
  const perform = (
    composition: { node: HumanChain["node"] },
    layers: readonly (IHumanLayer | IHumanLayer.IScheduled)[],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "instants",
      cues,
      performers: (["a", "b"] as const).map(
        (subject: "a" | "b", index: number) => ({
          subject,
          body: bodies[subject],
          at: { x: index * 1.2, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" as const },
        }),
      ),
      layers: { b: layers },
      composition: composition.node,
    });
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
  const waiting = (): HumanChain =>
    HumanChain.subject("b").stand({ seconds: 6 });

  // 1 and 2. The instants, a sync to one and a cut on another.
  const film: HumanPerformance = perform(
    waiting().with(
      HumanChain.subject("a")
        .stand({ seconds: 6 })
        .until({ of: "air", event: "end" })
        .gesture({ kind: "nod" }),
    ),
    [air],
  );
  for (const [event, expected] of [
    ["onset", 1.0],
    ["full", 1.5],
    ["offset", 3.5],
    ["end", 4.0],
  ] as const) {
    const seconds: number = film.instant({ of: "air", event });
    if (Math.abs(seconds - expected) > 1e-9)
      complaints.push(
        `the layer's ${event} is at ${seconds.toFixed(4)} s, ${expected.toFixed(1)} s expected`,
      );
  }
  const cut: number | undefined = film.segments("a")[0]?.end;
  if (cut === undefined || Math.abs(cut - 4.0) > 1e-6)
    complaints.push(
      `a stand cut on the layer's end ends at ${cut?.toFixed(4)} s, 4.0 s expected`,
    );
  const synced: HumanPerformance = perform(
    waiting().with(
      HumanChain.subject("a")
        .stand({ seconds: 6 })
        .gesture({ kind: "nod" })
        .sync({ of: "air", event: "full" }),
    ),
    [air],
  );
  const began: number | undefined = synced.segments("a")[1]?.entryTime;
  if (began === undefined || Math.abs(began - 1.5) > FRAME)
    complaints.push(
      `a nod synced to the layer's full begins at ${began?.toFixed(4)} s, within a frame of 1.5 s expected`,
    );

  // 3. A layer windowed on a layer's instant.
  const sigh: IHumanLayer.IScheduled = {
    from: { of: "air", event: "offset" },
    layer: (window: IHumanLayer.IWindow): IHumanLayer =>
      HumanAffect.layer([{ kind: "sigh", at: window.from }]),
  };
  const plain: HumanSignature.IReader = HumanSignature.of(
    perform(waiting(), [air]),
    "b",
    bodies.b,
    0,
  );
  const sighing: HumanSignature.IReader = HumanSignature.of(
    perform(waiting(), [air, sigh]),
    "b",
    bodies.b,
    0,
  );
  const moved = (seconds: number): number =>
    Math.max(
      ...(["head", "chest", "leftShoulder", "rightShoulder"] as const).map(
        (bone: "head" | "chest" | "leftShoulder" | "rightShoulder"): number => {
          const one: IAutoMovieVector3 = HumanSignature.joint(
            plain,
            seconds,
            bone,
          );
          const other: IAutoMovieVector3 = HumanSignature.joint(
            sighing,
            seconds,
            bone,
          );
          return Math.hypot(one.x - other.x, one.y - other.y, one.z - other.z);
        },
      ),
    );
  let before: number = 0;
  let after: number = 0;
  for (let t: number = 0; t <= 5.5 + 1e-9; t += 0.1)
    if (t < 3.5 - 1e-9) before = Math.max(before, moved(t));
    else after = Math.max(after, moved(t));
  if (before > 1e-6)
    complaints.push(
      `a sigh windowed from the layer's offset moves a joint by ${(before * 1000).toFixed(4)} mm before 3.5 s, nothing expected`,
    );
  if (!(after > 0.001))
    complaints.push(
      `a sigh windowed from the layer's offset moves a joint by ${(after * 1000).toFixed(4)} mm in the 2 s after 3.5 s, more than 1 mm expected`,
    );

  // 4. A fade never takes more than half its window.
  const brief: HumanPerformance = perform(waiting(), [
    { anchor: "brief", from: 2, to: 2.4, layer: HumanBreath.layer() },
  ]);
  for (const event of ["full", "offset"] as const) {
    const seconds: number = brief.instant({ of: "brief", event });
    if (Math.abs(seconds - 2.2) > 1e-9)
      complaints.push(
        `a 0.4 s window's ${event} is at ${seconds.toFixed(4)} s, its middle at 2.2 s expected`,
      );
  }

  // 5. What cannot be named.
  const late: unknown = refused(() =>
    perform(
      waiting().with(
        HumanChain.subject("a")
          .gesture({ kind: "wave" }, "bye")
          .stand({ seconds: 4 })
          .gesture({ kind: "nod" })
          .sync({ of: "after", event: "onset" }),
      ),
      [
        {
          anchor: "after",
          from: { of: "bye", event: "end" },
          layer: HumanBreath.layer(),
        },
      ],
    ),
  );
  if (
    !(
      late instanceof HumanRefusal &&
      late.kind === "participant" &&
      late.axis === "of"
    )
  )
    complaints.push(
      `an action synced to a layer that waits for an action: expected a participant refusal on of, got ${said(late)}`,
    );
  for (const [label, layers] of [
    ["two layers under one anchor", [air, { ...air, from: 4.5, to: 5 }]],
    [
      "a layer anchored under a cue track's name",
      [{ ...air, anchor: "dialogue" }],
    ],
  ] as const) {
    const twice: unknown = refused(() => perform(waiting(), layers));
    if (
      !(
        twice instanceof HumanRefusal &&
        twice.kind === "parameter" &&
        twice.axis === "layers" &&
        twice.performer === "b"
      )
    )
      complaints.push(
        `${label}: expected a parameter refusal on layers located on b, got ${said(twice)}`,
      );
  }

  TestValidator.equals(
    "a scheduled layer's instants are addressable",
    complaints,
    [],
  );
}
