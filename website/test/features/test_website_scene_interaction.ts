import { TestValidator } from "@nestia/e2e";

import type { IPlaygroundRefusal } from "../../src/playground/structures/IPlaygroundRefusal";
import { SceneFacts } from "../../src/scenes/SceneFacts";
import { SceneTrack } from "../../src/scenes/SceneTrack";
import { SCENES_INTERACTION } from "../../src/scenes/data/SCENES_INTERACTION";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import type { IScene } from "../../src/scenes/structures/IScene";
import { TakeCompute } from "../../src/takes/package/TakeCompute";
import type { ITake } from "../../src/takes/structures/ITake";

/**
 * The four contact and force examples are actual take-worker inputs, not
 * vocabulary names listed on cards without a performance behind them.
 *
 * Scenarios:
 * 1. Each new scene has its installed action, composition and standard takes;
 *    the original take computes at one frame per second through TakeCompute.
 * 2. The resulting timeline includes support, pushPull, release or perturb,
 *    respectively; release remains an overlay after the mug is picked up.
 * 3. Each original take changes a displayed placement, and the stuck sled's
 *    frame stays at its authored point within the track's 1 mm storage unit.
 *
 * This is an admission and wiring check, not a continuous no-slip or force
 * accuracy certificate. The motions package owns those physical bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios, the original-take scope and the track's quantization limit.
 * @evidence contracts/development/testing.md#behavioral-verification Computes every new scene through the real take worker and reads its timeline and displayed placements; a missing prop, invalid action input, refusal or unconnected overlay fails.
 * @evidence contracts/development/testing.md#independent-expectations The four required public actions, authored fixed sled point and 1 mm track unit are the expectations; no producer snapshot supplies them.
 * @evidence contracts/development/testing.md#distinguishing-cases A support sequence, a stationary two-handle press, a held-prop release overlay and a nonzero impulse reaction exercise distinct input requirements.
 * @evidence contracts/development/testing.md#execution-ownership Runs four original takes in memory through the website's discovered test entry; it launches no worker, viewer or browser.
 */
export function test_website_scene_interaction(): void {
  const required: Readonly<Record<string, string>> = {
    "hands-down-and-up": "support",
    "stuck-sled": "pushPull",
    "letting-go": "release",
    "balance-impulse": "perturb",
  };
  const findings: string[] = [];

  TestValidator.equals(
    "one scene for each contact and force example",
    SCENES_INTERACTION.map((scene: IScene): string => scene.id),
    Object.keys(required),
  );

  for (const scene of SCENES_INTERACTION) {
    const action: string | undefined = required[scene.id];
    if (
      action === undefined ||
      scene.composition === null ||
      SceneStatus.of(scene).kind !== "plays" ||
      !SceneFacts.actions(scene).includes(action) ||
      scene.takes.length === 0
    ) {
      findings.push(`${scene.id}: no computable composition for ${action}`);
      continue;
    }

    const made: ITake | IPlaygroundRefusal = TakeCompute.take(
      scene.composition,
      1,
    );
    if (!("track" in made)) {
      findings.push(`${scene.id}: ${made.kind} refusal: ${made.message}`);
      continue;
    }

    const spans: ITake["timeline"]["tracks"][number]["spans"] =
      made.timeline.tracks.flatMap(
        (
          track: ITake["timeline"]["tracks"][number],
        ): ITake["timeline"]["tracks"][number]["spans"] => track.spans,
      );
    if (
      !spans.some(
        (span: (typeof spans)[number]): boolean =>
          span.name === action && span.overlay === (action === "release"),
      )
    )
      findings.push(
        `${scene.id}: ${action} is absent from the actual timeline`,
      );

    const width: number = made.track.values.length / made.track.frames;
    let changed: boolean = false;
    for (let frame: number = 1; frame < made.track.frames; frame++) {
      const current: SceneTrack.IPlacement[][] = SceneTrack.sample(
        made.track,
        frame,
      );
      if (
        made.track.values
          .subarray(frame * width, (frame + 1) * width)
          .some(
            (value: number, index: number): boolean =>
              value !== made.track.values[index],
          )
      )
        changed = true;

      if (scene.id === "stuck-sled") {
        const prop: number = made.figures.length + made.props.indexOf("sled");
        const placed: SceneTrack.IPlacement | undefined = current[prop]?.[0];
        if (
          made.props.indexOf("sled") < 0 ||
          placed === undefined ||
          Math.abs(placed.position[0]) > 1e-3 ||
          Math.abs(placed.position[1]) > 1e-3 ||
          Math.abs(placed.position[2] - 0.35) > 1e-3
        )
          findings.push(`${scene.id}: the fixed sled moved at ${frame} s`);
      }
    }
    if (!changed)
      findings.push(`${scene.id}: the take has no displayed change`);
  }

  TestValidator.equals(
    "the four scenes compute their declared actions",
    findings,
    [],
  );
}
