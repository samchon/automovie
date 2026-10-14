import {
  IAutoMovieActionCall,
  IAutoMovieCameraAction,
  IAutoMovieConstraintViolation,
  IAutoMovieGait,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieLocomoteAction,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { HUMANOID_GAITS } from "../../../../packages/archetypes/src/HUMANOID_GAITS";
import type { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import type { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import type { IAutoMovieActorContext } from "../../../../packages/engine/src/perform/IAutoMovieActorContext";
import { makeActorSynthesizer } from "../../../../packages/engine/src/perform/makeActorSynthesizer";
import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

const frame: IAutoMovieCameraAction = {
  verb: "frame",
  actor: "cam-main",
  start: 0,
  duration: "auto",
  framing: "medium",
  move: "static",
  on: { kind: "node", node: "knightA" },
};

const walk: (
  region?: IAutoMovieActionCall["region"],
) => IAutoMovieLocomoteAction = (
  region?: IAutoMovieActionCall["region"],
): IAutoMovieLocomoteAction => ({
  verb: "locomote",
  actor: "knightA",
  start: 0,
  duration: 1,
  gait: "walk",
  to: { kind: "point", point: { x: 0, y: 0, z: 0.25 } },
  ...(region === undefined ? {} : { region }),
});

/**
 * The bones a gait spec drives, as its limb rows name them.
 */
const gaitBones: (gait: IAutoMovieGait) => string[] = (
  gait: IAutoMovieGait,
): string[] =>
  gait.limbs.map((limb: IAutoMovieGait["limbs"][number]): string => limb.bone);

/**
 * A custom gait that genuinely authors legs only.
 */
const LEG_ONLY_GAIT: IAutoMovieGait = {
  ...HUMANOID_GAITS.walk,
  limbs: HUMANOID_GAITS.walk.limbs.filter(
    (limb: IAutoMovieGait["limbs"][number]): boolean =>
      !limb.bone.endsWith("UpperArm"),
  ),
};

/**
 * Performs real shipped gait synthesis and checks compiled authored bone rows, all five gait successes, head layering, shared-arm refusal and custom legs-only or narrowed-region behavior.
 *
 * Scenarios:
 * 1. Admit the shipped walk under its default region.
 * 2. Preserve every authored walk limb row in the compiled clip.
 * 3. Produce a nonempty actor clip for walk, run, sprint, sneak and march.
 * 4. Layer head-only lookAt and refuse a wave sharing the authored right upper arm.
 * 5. Admit that wave after removing the gait's authored arm rows.
 * 6. Report both discarded arm rows under an explicit lowerBody override.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs real shipped gait synthesis and checks compiled authored bone rows, all five gait successes, head layering, shared-arm refusal and custom legs-only or narrowed-region behavior.
 * @evidence contracts/testing.md#independent-expectations Shipped limb rows are the input content contract, so each named row must survive; the leg-only fixture removes the authored arm rows independently. These membership assertions cannot detect incorrect per-key joint angles.
 * @evidence contracts/testing.md#distinguishing-cases Preserves default walk, walk/run/sprint/sneak/march admission, lookAt/wave overlap neighbors, custom legs-only gait and explicit lowerBody drop; the absent ROM rig keeps this focused on masking/overlap.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_shipped_gait unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_shipped_gait(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const perform: (
    draft: IAutoMovieActionCall[],
    gait: IAutoMovieGait,
  ) => IAutoMoviePerformedShot = (
    draft: IAutoMovieActionCall[],
    gait: IAutoMovieGait,
  ): IAutoMoviePerformedShot =>
    performShot({
      script: makeScriptWrite(),
      staged,
      performance: makePerformanceWrite({
        draft,
        revise: { review: "unchanged.", final: null },
      }),
      synthesize: makeActorSynthesizer(
        new Map<string, IAutoMovieActorContext>([
          [
            "knightA",
            {
              skeleton: skeleton.id,
              gaits: [gait],
              position: { x: 0, y: 0, z: 0 },
              speed: 1.2,
              facingDeg: 0,
              eyeHeight: 1.7,
              restPose: { skeleton: skeleton.id, root: null, joints: [] },
              rig: skeleton,
            },
          ],
        ]),
        new Map<string, IAutoMovieVector3>(
          staged.scene.nodes.map(
            (node: IAutoMovieSceneNode): [string, IAutoMovieVector3] => [
              node.id,
              node.transform.translation,
            ],
          ),
        ),
      ),
      // No rig on the gate: this scenario is about the region mask meeting the
      // shipped content, not about ROM, which has its own scenarios.
      skeleton: (): null => null,
    });

  // 1. the plain walk performs, with nothing to report
  const plain: IAutoMoviePerformedShot = perform(
    [walk(), frame],
    HUMANOID_GAITS.walk,
  );
  TestValidator.equals(
    "a shipped walk with no region performs",
    plain.success,
    true,
  );

  // 2. the walk carries every authored gait row, including both arms.
  const gaitRows: string[] = gaitBones(HUMANOID_GAITS.walk);
  const compiled: Set<string> = new Set<string>(
    plain.success === true
      ? plain.motions.knightA!.keyframes.flatMap(
          (k: IAutoMovieKeyframe): string[] =>
            k.pose.joints.map((j: IAutoMovieJointPose): string => j.bone),
        )
      : [],
  );
  TestValidator.equals(
    "the compiled clip carries every gait row",
    namedFacts([
      ["refused", (): boolean => gaitRows.length > 0],
      [
        "violated",
        (): boolean =>
          gaitRows.length > 0 &&
          gaitRows.every((bone: string): boolean => compiled.has(bone)),
      ],
    ]),
    { refused: true, violated: true },
  );

  // 3. every shipped gait, under the default region
  TestValidator.equals(
    "every shipped gait performs",
    (["walk", "run", "sprint", "sneak", "march"] as const).filter(
      (name: "walk" | "run" | "sprint" | "sneak" | "march"): boolean => {
        const gait: IAutoMovieGait = HUMANOID_GAITS[name];
        const performed: IAutoMoviePerformedShot = perform(
          [{ ...walk(), gait: gait.name }, frame],
          gait,
        );
        return (
          performed.success !== true ||
          performed.motions.knightA === undefined ||
          performed.motions.knightA.keyframes.length === 0
        );
      },
    ),
    [],
  );

  // 4. Head-only content layers, arm content collides on the actual bone.
  const lookAt: IAutoMovieActionCall = {
    verb: "lookAt",
    actor: "knightA",
    start: 0,
    duration: 1,
    to: { kind: "node", node: "knightB" },
  };
  TestValidator.equals(
    "a shipped walk layers with a head-only lookAt",
    perform([walk(), lookAt, frame], HUMANOID_GAITS.walk).success,
    true,
  );
  const wave: IAutoMovieActionCall = {
    verb: "gesture",
    actor: "knightA",
    start: 0,
    duration: 1,
    kind: "wave",
  };
  const walkAndWave: IAutoMoviePerformedShot = perform(
    [walk(), wave, frame],
    HUMANOID_GAITS.walk,
  );
  TestValidator.equals(
    "a shipped walk conflicts with a wave on their shared arm",
    namedFacts([
      ["refused", (): boolean => walkAndWave.success === false],
      [
        "violated",
        (): boolean =>
          walkAndWave.success === false &&
          walkAndWave.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.path === "$input.draft[1].start" &&
              v.expected.includes("rightUpperArm"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  // 5. Content, not the fullBody label, decides the overlap.
  TestValidator.equals(
    "a custom legs-only gait layers with the same wave",
    perform([walk(), wave, frame], LEG_ONLY_GAIT).success,
    true,
  );

  // 6. An authored narrow override still cannot silently discard the arms.
  const narrowed: IAutoMoviePerformedShot = perform(
    [walk("lowerBody"), frame],
    HUMANOID_GAITS.walk,
  );
  TestValidator.equals(
    "an explicit lowerBody override reports the masked arm rows",
    namedFacts([
      ["refused", (): boolean => narrowed.success === false],
      [
        "violated",
        (): boolean =>
          narrowed.success === false &&
          narrowed.violations.some(
            (violation: IAutoMovieConstraintViolation): boolean =>
              violation.path === "$input.draft[0].region" &&
              violation.expected.includes("leftUpperArm") &&
              violation.expected.includes("rightUpperArm"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
