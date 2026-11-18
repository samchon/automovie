import {
  makeActorSynthesizer,
  performShot,
  stageScene,
} from "@automovie/engine";
import {
  IAutoMovieActionCall,
  type IAutoMovieActorContext,
  IAutoMovieCameraAction,
  IAutoMovieGait,
  IAutoMovieLocomoteAction,
  type IAutoMoviePerformedShot,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  type IAutoMovieStagedSet,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HUMANOID_GAITS } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";

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
 * @evidence contracts/development/testing.md#behavioral-verification Performs real shipped gait synthesis and checks compiled authored bone rows, all five gait successes, head layering, shared-arm refusal and custom legs-only or narrowed-region behavior.
 * @evidence contracts/development/testing.md#independent-expectations Shipped limb rows are the input content contract, so each named row must survive; the leg-only fixture removes the authored arm rows independently. These membership assertions cannot detect incorrect per-key joint angles.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves default walk, walk/run/sprint/sneak/march admission, lookAt/wave overlap neighbors, custom legs-only gait and explicit lowerBody drop; the absent ROM rig keeps this focused on masking/overlap.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable synchronous test_motion_gait_authored_region unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Admit the shipped walk under its default region.).
 */
export function test_motion_gait_authored_region(): void {
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

  for (const gait of Object.values(HUMANOID_GAITS)) {
    const result = perform([{ ...walk(), gait: gait.name }, frame], gait);
    if (!result.success) throw new Error(gait.name + " failed to perform.");
    const bones = new Set(
      result.motions.knightA!.keyframes.flatMap((k) =>
        k.pose.joints.map((j) => j.bone),
      ),
    );
    TestValidator.equals(
      "every authored gait row survives",
      gaitBones(gait).filter((b) => !bones.has(b)),
      [],
    );
  }
  const wave: IAutoMovieActionCall = {
    verb: "gesture",
    actor: "knightA",
    start: 0,
    duration: 1,
    kind: "wave",
  };
  const gaze: IAutoMovieActionCall = {
    verb: "lookAt",
    actor: "knightA",
    start: 0,
    duration: 1,
    to: { kind: "node", node: "knightB" },
  };
  TestValidator.predicate(
    "gaze and unmasked gait do not intersect",
    perform([walk(), gaze, frame], HUMANOID_GAITS.walk).success,
  );
  TestValidator.predicate(
    "leg-only gait leaves wave free",
    perform([walk(), wave, frame], LEG_ONLY_GAIT).success,
  );
  const overlap = perform([walk(), wave, frame], HUMANOID_GAITS.walk);
  TestValidator.predicate(
    "overlap reports the occupied arm",
    !overlap.success &&
      overlap.violations.some(
        (v) =>
          v.path === "$input.draft[1].start" &&
          v.expected.includes("rightUpperArm"),
      ),
  );
  const narrow = perform([walk("lowerBody"), frame], HUMANOID_GAITS.walk);
  TestValidator.predicate(
    "explicit mask reports both discarded arms",
    !narrow.success &&
      narrow.violations.some(
        (v) =>
          v.path === "$input.draft[0].region" &&
          ["leftUpperArm", "rightUpperArm"].every((b) =>
            v.expected.includes(b),
          ),
      ),
  );
}
