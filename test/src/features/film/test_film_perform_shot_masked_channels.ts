import {
  IAutoMovieActionSynthesizer,
  IAutoMoviePerformedShot,
  IAutoMovieStagedSet,
  compareCodeUnits,
  performShot,
  stageScene,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieCameraAction,
  IAutoMovieConstraintViolation,
  IAutoMovieExpression,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * The hind legs of a retargeted quadruped: the humanoid `lowerBody` chain.
 */
const HIND: AutoMovieHumanoidBone[] = [
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
  "rightUpperLeg",
  "rightLowerLeg",
  "rightFoot",
];

/**
 * The front legs of a retargeted quadruped: the humanoid arm chains.
 */
const FORE: AutoMovieHumanoidBone[] = [
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
];

/**
 * Every bone the twelve-channel quadruped gait drives.
 */
const QUADRUPED: AutoMovieHumanoidBone[] = [...HIND, ...FORE];

/**
 * The hind chain plus the boundary member `lowerBody` also owns.
 */
const INSIDE_LOWER: AutoMovieHumanoidBone[] = ["hips", ...HIND];

/**
 * The fore-leg bones as the violation must name them: code-unit sorted.
 */
const FORE_SORTED: string =
  "leftHand, leftLowerArm, leftUpperArm, rightHand, rightLowerArm, rightUpperArm";

const HAPPY: IAutoMovieExpression = {
  preset: "happy",
  intensity: 0.5,
  blendshapes: null,
};

const rootAt: (x: number) => IAutoMovieTransform = (
  x: number,
): IAutoMovieTransform => ({
  translation: { x, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * A two-keyframe clip over `bones`, optionally carrying a root / expression.
 */
const clip: (props: {
  bones: AutoMovieHumanoidBone[];
  root?: boolean;
  expression?: boolean;
}) => IAutoMovieMotion = (props: {
  bones: AutoMovieHumanoidBone[];
  root?: boolean;
  expression?: boolean;
}): IAutoMovieMotion => {
  const pose: (flexion: number) => IAutoMoviePose = (
    flexion: number,
  ): IAutoMoviePose =>
    makePose(
      props.bones.map(
        (bone: AutoMovieHumanoidBone): IAutoMovieJointPose =>
          joint(bone, { flexion }),
      ),
      props.root === true ? rootAt(flexion / 20) : null,
    );
  const expression: IAutoMovieExpression | null =
    props.expression === true ? HAPPY : null;
  return makeMotion(
    [
      keyframe(0, pose(0), "linear", expression),
      keyframe(1, pose(20), "linear", expression),
    ],
    1,
  );
};

const gait: (
  region?: IAutoMovieActionCall["region"],
) => IAutoMovieActionCall = (
  region?: IAutoMovieActionCall["region"],
): IAutoMovieActionCall => ({
  verb: "locomote",
  actor: "knightA",
  start: 0,
  duration: 1,
  gait: "walk",
  to: { kind: "point", point: { x: 0, y: 0, z: 0.25 } },
  ...(region === undefined ? {} : { region }),
});

const frame: IAutoMovieCameraAction = {
  verb: "frame",
  actor: "cam-main",
  start: 0,
  duration: "auto",
  framing: "medium",
  move: "static",
  on: { kind: "node", node: "knightA" },
};

const bonesOf: (motion: IAutoMovieMotion) => Set<AutoMovieHumanoidBone> = (
  motion: IAutoMovieMotion,
): Set<AutoMovieHumanoidBone> =>
  new Set(
    motion.keyframes.flatMap((k: IAutoMovieKeyframe): AutoMovieHumanoidBone[] =>
      k.pose.joints.map(
        (j: IAutoMovieJointPose): AutoMovieHumanoidBone => j.bone,
      ),
    ),
  );

/**
 * Performs synthesized clips through region masks and checks located dropped-bone/root/expression diagnoses, surviving channels and actor-ordered reports.
 *
 * Scenarios:
 * 1. Refuse fore-leg channels masked by lowerBody and report every lost bone.
 * 2. Keep all twelve channels under the default fullBody region.
 * 3. Keep hips and hind-chain channels inside lowerBody.
 * 4. Distinguish combined root/expression loss from expression-only loss.
 * 5. Report each actor in a shared action in actor-id order.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs synthesized clips through region masks and checks located dropped-bone/root/expression diagnoses, surviving channels and actor-ordered reports.
 * @evidence contracts/testing.md#independent-expectations The authored quadruped and hips/hind bone lists define membership; expected foreground names are independently code-unit ordered and the caller's channel data defines every expected drop.
 * @evidence contracts/testing.md#distinguishing-cases Retains narrowed/default masks, boundary hips, combined and expression-only losses, and two-actor reporting; ROM is deliberately absent here and covered elsewhere.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_masked_channels unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_masked_channels(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");
  const perform: (
    draft: IAutoMovieActionCall[],
    synthesize: IAutoMovieActionSynthesizer,
  ) => IAutoMoviePerformedShot = (
    draft: IAutoMovieActionCall[],
    synthesize: IAutoMovieActionSynthesizer,
  ): IAutoMoviePerformedShot =>
    performShot({
      script: makeScriptWrite(),
      staged,
      performance: makePerformanceWrite({
        draft,
        revise: { review: "unchanged.", final: null },
      }),
      synthesize,
      // No rig: this scenario is about the region mask, not about ROM, so the
      // motion gate stays out of the picture on both sides of the twin.
      skeleton: (): null => null,
    });

  // 1. positive: an explicitly narrow region cannot carry the fore legs
  const quadruped: IAutoMovieMotion = clip({ bones: QUADRUPED });
  const dropped: IAutoMoviePerformedShot = perform(
    [gait("lowerBody"), frame],
    (): IAutoMovieMotion => quadruped,
  );
  TestValidator.equals(
    "a gait reaching outside its region fails the shot",
    dropped.success,
    false,
  );
  TestValidator.predicate(
    "the drop is reported on the action's own region field",
    hasViolation(dropped, "type", "$input.draft[0].region"),
  );
  TestValidator.equals(
    "the violation names every masked bone in code-unit order",
    namedFacts([
      ["refused", (): boolean => dropped.success === false],
      [
        "violated",
        (): boolean =>
          dropped.success === false &&
          dropped.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.path === "$input.draft[0].region" &&
              v.expected.includes(FORE_SORTED) &&
              v.expected.includes('"lowerBody"') &&
              v.value === "lowerBody",
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  // 2. negative twin: the default full-body gait owns every authored bone
  const widened: IAutoMoviePerformedShot = perform(
    [gait(), frame],
    (): IAutoMovieMotion => quadruped,
  );
  TestValidator.equals(
    "the same gait on fullBody performs",
    widened.success,
    true,
  );
  TestValidator.equals(
    "all twelve authored bones survive to the compiled clip",
    widened.success === true
      ? [...bonesOf(widened.motions.knightA!)].sort(compareCodeUnits)
      : [],
    [...QUADRUPED].sort(compareCodeUnits),
  );

  // 3. boundary: hips is the lowerBody member a leg gait sits next to
  const clean: IAutoMoviePerformedShot = perform(
    [gait("lowerBody"), frame],
    (): IAutoMovieMotion => clip({ bones: INSIDE_LOWER }),
  );
  TestValidator.equals(
    "a gait entirely inside its region performs",
    clean.success,
    true,
  );
  TestValidator.equals(
    "the boundary bone and the whole hind chain survive",
    clean.success === true
      ? [...bonesOf(clean.motions.knightA!)].sort(compareCodeUnits)
      : [],
    [...INSIDE_LOWER].sort(compareCodeUnits),
  );

  // 4. the root and expression channels, and an expression-only drop
  const rootAndFace: IAutoMoviePerformedShot = perform(
    [
      gait("lowerBody"),
      {
        verb: "lookAt",
        actor: "knightA",
        start: 0,
        duration: 1,
        to: { kind: "node", node: "knightB" },
      },
      frame,
    ],
    (action: IAutoMovieActionCall): IAutoMovieMotion =>
      action.verb === "locomote"
        ? clip({ bones: ["hips"], expression: true })
        : clip({ bones: ["head"], root: true, expression: true }),
  );
  TestValidator.equals(
    "a layered non-locomotion region reports its dropped root and expression",
    namedFacts([
      ["refused", (): boolean => rootAndFace.success === false],
      [
        "violated",
        (): boolean =>
          rootAndFace.success === false &&
          rootAndFace.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.path === "$input.draft[1].region" &&
              v.expected.includes("a root displacement and an expression") &&
              v.value === "head",
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "a clip losing only its expression names only that",
    namedFacts([
      ["refused", (): boolean => rootAndFace.success === false],
      [
        "violated",
        (): boolean =>
          rootAndFace.success === false &&
          rootAndFace.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.path === "$input.draft[0].region" &&
              v.expected.includes("authors an expression") &&
              !v.expected.includes("root displacement") &&
              !v.expected.includes("the bones"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  // 5. one record per (action, actor), ordered by action index then actor
  const unison: IAutoMoviePerformedShot = perform(
    [
      {
        verb: "locomote",
        actor: ["knightB", "knightA"],
        start: 0,
        duration: 1,
        region: "lowerBody",
        gait: "walk",
        to: { kind: "point", point: { x: 0, y: 0, z: 0.25 } },
      },
      frame,
    ],
    (): IAutoMovieMotion => quadruped,
  );
  TestValidator.equals(
    "a unison action reports each masked actor, ordered by actor id",
    unison.success === false
      ? unison.violations.map(
          (v: IAutoMovieConstraintViolation): string =>
            v.expected.split("'s clip")[0]!,
        )
      : [],
    ["knightA", "knightB"],
  );
}
