import { TestValidator } from "@nestia/e2e";

import type { IPlaygroundRefusal } from "../../src/playground/structures/IPlaygroundRefusal";
import { SceneFacts } from "../../src/scenes/SceneFacts";
import { SceneTrack } from "../../src/scenes/SceneTrack";
import { SCENES_HANDLING } from "../../src/scenes/data/SCENES_HANDLING";
import { SCENES_INTERACTION } from "../../src/scenes/data/SCENES_INTERACTION";
import { SCENES_UPPER } from "../../src/scenes/data/SCENES_UPPER";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import type { IScene } from "../../src/scenes/structures/IScene";
import { TakeCompute } from "../../src/takes/package/TakeCompute";
import type { ITake } from "../../src/takes/structures/ITake";

/**
 * The contact, force, handling and upper-body examples are actual take-worker inputs, not
 * vocabulary names listed on cards without a performance behind them.
 *
 * Scenarios:
 * 1. Each scene has its installed action or registered row, composition and
 *    standard takes. All eleven original inputs run through TakeCompute at
 *    one frame per second; ten return tracks.
 * 2. The low-table scramble remains marked refused until #3573 and returns
 *    the actual reach refusal on stances: the left hand misses at lift1 by
 *    more than the unchanged 10 mm contact bound. A returned track fails so
 *    a fixed SDK requires removal of the stale refusal metadata.
 * 3. Every successful timeline includes the scene's named actions or rows;
 *    release remains an overlay after the mug is picked up. Each successful
 *    take changes a displayed placement, and the stuck sled's frame stays
 *    at its authored point within the track's 1 mm storage unit.
 *
 * This is an admission and wiring check, not a continuous no-slip or force
 * accuracy certificate. The motions package owns those physical bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios, the original-take scope, the tracked SDK refusal and the track's quantization limit.
 * @evidence contracts/development/testing.md#behavioral-verification Runs all eleven inputs through the real take worker. Ten must return their actual timelines and displayed placements; the unchanged low-table input must return its specific public reach refusal, and an arbitrary error or stale refusal mark fails.
 * @evidence contracts/development/testing.md#independent-expectations The required public actions and rows, authored fixed sled point, 1 mm track unit and unchanged 10 mm contact bound are expectations. The narrow refusal contract is the observed SDK boundary tracked by #3573, not a proof that the movement is physically impossible; no producer snapshot supplies expected placements.
 * @evidence contracts/development/testing.md#distinguishing-cases A support sequence, a stationary two-handle press, a held-prop release overlay, a nonzero impulse reaction, a raised-support row, keyed typing, an already held mug's grip change, and upper-body pointing, gesture, rest, touch, face, dress and tool rows exercise distinct input requirements.
 * @evidence contracts/development/testing.md#execution-ownership Runs eleven original inputs in memory through the website's discovered test entry, requiring ten tracks and one precise current SDK refusal; it launches no worker, viewer or browser.
 */
export function test_website_scene_interaction(): void {
  const required: Readonly<Record<string, readonly string[]>> = {
    "hands-down-and-up": ["support"],
    "stuck-sled": ["pushPull"],
    "letting-go": ["release"],
    "balance-impulse": ["perturb"],
    "low-table-scramble": ["scramble"],
    "typing-at-the-counter": ["type"],
    "changing-a-mug-grip": ["regrip"],
    "upper-explanation": ["pointAt", "gestureNod", "restSide"],
    "upper-bench-break": ["touchTap", "faceWipeMouth"],
    "upper-hat": ["dressHat"],
    "upper-hammer": ["toolHammer"],
  };
  const findings: string[] = [];
  const scenes: readonly IScene[] = [
    ...SCENES_INTERACTION,
    ...SCENES_HANDLING,
    ...SCENES_UPPER,
  ];

  TestValidator.equals(
    "one record for each contact, force, handling and upper-body example",
    scenes.map((scene: IScene): string => scene.id),
    Object.keys(required),
  );

  for (const scene of scenes) {
    const actions: readonly string[] | undefined = required[scene.id];
    const status: SceneStatus.Status = SceneStatus.of(scene);
    const knownRefusal: boolean = scene.id === "low-table-scramble";
    if (
      actions === undefined ||
      scene.composition === null ||
      (knownRefusal
        ? status.kind !== "refused" || status.until !== 3573
        : status.kind !== "plays") ||
      !actions.every(
        (action: string): boolean => SceneFacts.actions(scene).includes(action),
      ) ||
      scene.takes.length === 0
    ) {
      findings.push(`${scene.id}: no computable composition for ${actions?.join(", ")}`);
      continue;
    }

    const started: number = performance.now();
    console.log(JSON.stringify({ scene: scene.id, phase: "start" }));
    let made: ITake | IPlaygroundRefusal;
    try {
      made = TakeCompute.take(scene.composition, 1);
    } catch (error) {
      findings.push(
        `${scene.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.log(JSON.stringify({
        scene: scene.id,
        phase: "error",
        elapsedMs: performance.now() - started,
      }));
      continue;
    }
    console.log(JSON.stringify({
      scene: scene.id,
      phase: "computed",
      elapsedMs: performance.now() - started,
    }));
    if (knownRefusal) {
      if ("track" in made)
        findings.push(
          `${scene.id}: the SDK now computes the take; remove the stale #3573 refusal mark`,
        );
      else if (
        made.kind !== "reach" ||
        made.performer !== "ath" ||
        made.act !== "scramble" ||
        made.instance !== 1 ||
        made.axis !== "stances" ||
        typeof made.value !== "number" ||
        !Number.isFinite(made.value) ||
        made.value <= 10 ||
        !made.message.includes("leftHand") ||
        !made.message.includes("lift1") ||
        !made.message.includes("10 mm")
      )
        findings.push(
          `${scene.id}: the refusal differs from the SDK contact failure tracked by #3573: ${made.message}`,
        );
      continue;
    }
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
    for (const action of actions)
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
    "the scenes compute their actions or surface their tracked SDK refusal",
    findings,
    [],
  );
}
