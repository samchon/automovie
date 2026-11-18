import { createTable } from "@automovie/archetypes/furniture";
import { TestValidator } from "@nestia/e2e";

import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "../../src/playground/structures/IPlaygroundRefusal";
import { SCENE_FPS } from "../../src/scenes/SCENE_FPS";
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
 *    standard takes. Each original input must yield a track at the website rate.
 * 2. Both ankles move from below the coffee tabletop to just above it.
 *    Raising the table by the figure's stature must produce a stance refusal.
 * 3. Every successful timeline includes the scene's named actions or rows;
 *    release remains an overlay after the mug is picked up. Each successful
 *    take changes a displayed placement, and the stuck sled's frame stays
 *    at its authored point within the track's 1 mm storage unit.
 *
 * This is an admission and wiring check, not a continuous no-slip or force
 * accuracy certificate. The motions package owns those physical bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original-take scope, contact and quantization limits.
 * @evidence contracts/development/testing.md#behavioral-verification Computes the original inputs, reads their timelines and placements, then raises the scramble support beyond reach and checks the public refusal.
 * @evidence contracts/development/testing.md#independent-expectations The tabletop affordance height, 10 mm stance bound, registered actions and fixed sled position supply independent expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases A support sequence, a stationary two-handle press, a held-prop release overlay, a nonzero impulse reaction, a raised-support row, keyed typing, an already held mug's grip change, and upper-body pointing, gesture, rest, touch, face, dress and tool rows exercise distinct input requirements.
 * @evidence contracts/development/testing.md#execution-ownership Runs the take computation in memory through the website's test entry.
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
    "entry-gate": ["openGate"],
    "drop-test": ["pressRelease", "seize", "loose"],
    "sorting-recycling": ["pickUp", "hurlBottle"],
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
    if (
      actions === undefined ||
      scene.composition === null ||
      status.kind !== "plays" ||
      !actions.every((action: string): boolean =>
        SceneFacts.actions(scene).includes(action),
      ) ||
      scene.takes.length === 0
    ) {
      findings.push(
        `${scene.id}: no computable composition for ${actions?.join(", ")}`,
      );
      continue;
    }

    const started: number = performance.now();
    console.log(JSON.stringify({ scene: scene.id, phase: "start" }));
    let made: ITake | IPlaygroundRefusal;
    try {
      made = TakeCompute.take(scene.composition, SCENE_FPS);
    } catch (error) {
      findings.push(
        `${scene.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.log(
        JSON.stringify({
          scene: scene.id,
          phase: "error",
          elapsedMs: performance.now() - started,
        }),
      );
      continue;
    }
    console.log(
      JSON.stringify({
        scene: scene.id,
        phase: "computed",
        elapsedMs: performance.now() - started,
      }),
    );
    if (!("track" in made)) {
      findings.push(`${scene.id}: ${made.kind} refusal: ${made.message}`);
      continue;
    }
    if (scene.id === "low-table-scramble")
      checkScramble(scene.composition, made, findings);

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
            span.name === action &&
            span.overlay === (action === "release" || action === "loose"),
        )
      )
        findings.push(
          `${scene.id}: ${action} is absent from the actual timeline`,
        );

    const width: number = made.track.values.length / made.track.frames;
    let changed: boolean = false;
    for (let frame: number = 1; frame < made.track.frames; frame++) {
      const seconds: number = frame / SCENE_FPS;
      const current: SceneTrack.IPlacement[][] = SceneTrack.sample(
        made.track,
        seconds,
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
          findings.push(`${scene.id}: the fixed sled moved at ${seconds} s`);
      }
    }
    if (!changed)
      findings.push(`${scene.id}: the take has no displayed change`);
  }

  TestValidator.equals(
    "the scenes play their actions and reject unreachable supports",
    findings,
    [],
  );
}

function checkScramble(
  composition: IPlaygroundComposition,
  take: ITake,
  findings: string[],
): void {
  const first: SceneTrack.IPlacement[] = SceneTrack.sample(take.track, 0)[0]!;
  const last: SceneTrack.IPlacement[] = SceneTrack.sample(
    take.track,
    take.duration,
  )[0]!;
  const tabletop: number = createTable({ kind: "coffee" }).affordance("top")
    .frame.translation.y;
  const contactMillimetres: number = 10;
  function height(p: SceneTrack.IPlacement): number {
    const m: number[] = take.reflection;
    return (
      p.position[0] * m[1]! +
      p.position[1] * m[5]! +
      p.position[2] * m[9]! +
      m[13]!
    );
  }
  for (const foot of ["leftFoot", "rightFoot"]) {
    const index: number = first.findIndex(
      (p: SceneTrack.IPlacement): boolean => p.bone === foot,
    );
    if (index < 0) {
      findings.push(`low-table-scramble: missing ${foot}`);
      continue;
    }
    // These are ankle joints. Their heights over the sole vary with foot pitch.
    const floorClearance: number = height(first[index]!);
    const tableClearance: number = height(last[index]!) - tabletop;
    if (
      floorClearance >= tabletop ||
      tableClearance < 0 ||
      tableClearance > floorClearance + contactMillimetres / 1000
    )
      findings.push(`low-table-scramble: ${foot} did not reach the tabletop`);
  }
  const raised: IPlaygroundComposition = structuredClone(composition);
  const support: IPlaygroundComposition.IObject | undefined =
    raised.objects?.find(
      (o: IPlaygroundComposition.IObject): boolean => o.subject === "table",
    );
  if (support === undefined) throw new Error("The scramble needs its table.");
  const heights: number[] = first.map(height);
  support.y = Math.max(...heights) - Math.min(...heights);
  const refusal: ITake | IPlaygroundRefusal = TakeCompute.take(
    raised,
    SCENE_FPS,
  );
  if (
    "track" in refusal ||
    refusal.kind !== "reach" ||
    refusal.act !== "scramble" ||
    refusal.performer !== "ath" ||
    refusal.axis !== "stances" ||
    typeof refusal.value !== "number" ||
    !Number.isFinite(refusal.value) ||
    refusal.value <= contactMillimetres
  )
    findings.push(
      "A table above the athlete's reach must report the missed stance contact.",
    );
}
