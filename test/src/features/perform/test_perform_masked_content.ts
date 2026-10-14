import {
  IAutoMovieActionSynthesizer,
  compilePerformance,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieExpression,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";

const HAPPY: IAutoMovieExpression = {
  preset: "happy",
  intensity: 0.5,
  blendshapes: null,
};

const ROOT: IAutoMovieTransform = {
  translation: { x: 1, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** A two-keyframe clip whose endpoints may name different bone sets; optional channels borrow the original module-owned ROOT and HAPPY records. */
const clip: (
  first: AutoMovieHumanoidBone[],
  second: AutoMovieHumanoidBone[],
  extra?: { root?: boolean; expression?: boolean },
) => IAutoMovieMotion = (
  first: AutoMovieHumanoidBone[],
  second: AutoMovieHumanoidBone[],
  extra: { root?: boolean; expression?: boolean } = {},
): IAutoMovieMotion =>
  makeMotion(
    [first, second].map(
      (bones: AutoMovieHumanoidBone[], index: number): IAutoMovieKeyframe =>
        keyframe(
          index,
          makePose(
            bones.map(
              (bone: AutoMovieHumanoidBone): IAutoMovieJointPose =>
                joint(bone, { flexion: 10 }),
            ),
            extra.root === true ? ROOT : null,
          ),
          "linear",
          extra.expression === true ? HAPPY : null,
        ),
    ),
    1,
  );

const locomote: (actor: string | string[]) => IAutoMovieActionCall = (
  actor: string | string[],
): IAutoMovieActionCall => ({
  verb: "locomote",
  actor,
  start: 0,
  duration: 1,
  region: "lowerBody",
  gait: "walk",
  to: { kind: "point", point: { x: 0, y: 0, z: 1 } },
});

const wave: (actor: string) => IAutoMovieActionCall = (
  actor: string,
): IAutoMovieActionCall => ({
  verb: "gesture",
  kind: "wave",
  actor,
  start: 0,
  duration: 1,
});

const emote: (actor: string) => IAutoMovieActionCall = (
  actor: string,
): IAutoMovieActionCall => ({
  verb: "emote",
  preset: "happy",
  intensity: 0.5,
  actor,
  start: 0,
  duration: 1,
});

/**
 * Observe compilePerformance's region-loss reports and selected retained channels. The report lets a later shot boundary refuse lost content; shot-level refusal is owned by test_film_perform_shot_masked_channels rather than invoked here.
 *
 * Scenarios:
 *
 * 1. An in-region leg-only clip has no report and retains its second-keyframe bone.
 * 2. Repeated cross-region bones are deduplicated and code-unit ordered with literal action/actor/region fields and false root/expression flags.
 * 3. Layered gesture/locomotion roots report only the gesture's root loss.
 * 4. A face clip reports bone loss and keeps happy, while a non-face clip reports expression loss instead.
 * 5. Reports order action index before actor id for a single actor and a two-actor unison action.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles injected changing-bone and optional-channel clips, then asserts exact loss records, report order and selected surviving bone/preset. Silent loss, duplicated report bones, wrong ownership flags or unstable report order break the literal expectations.
 * @evidence contracts/testing.md#independent-expectations Expected report objects and ordered ids are written from authored content minus each action region, not copied from compiler output. These records contain categorical fields and integer action indices; numeric motion channels are not deep-compared. The clean case observes one retained bone rather than proving the entire motion unchanged, and root reporting does not independently assert the surviving root value.
 * @evidence contracts/testing.md#distinguishing-cases Preserves clean/leaking lowerBody twins, changing endpoint bone sets, root/face/non-face channels and actor-order inversion beta/alpha. Existing cases/values/order and borrowed ROOT/HAPPY identity remain; actual shot refusal and all-region membership exhaustiveness are elsewhere.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns all compiler calls through portable injected synthesizers and asserts their outputs directly. Helpers return clips without registering cases or creating a process, renderer or native artifact.
 */
export function test_perform_masked_content(): void {
  // 1. nothing outside the region: an empty report
  const legOnly: IAutoMovieActionSynthesizer = (): IAutoMovieMotion =>
    clip(["leftUpperLeg"], ["leftUpperLeg"]);
  const clean: ReturnType<typeof compilePerformance> = compilePerformance(
    [locomote("hero")],
    legOnly,
  );
  TestValidator.equals("an in-region clip masks nothing", clean.masked, []);
  TestValidator.equals(
    "the in-region clip keeps its bone",
    clean.performances.hero!.keyframes[1]!.pose.joints.map(
      (j: IAutoMovieJointPose): AutoMovieHumanoidBone => j.bone,
    ),
    ["leftUpperLeg"],
  );

  // 2. dedupe across keyframes, code-unit order, flags off
  const armLeak: IAutoMovieActionSynthesizer = (): IAutoMovieMotion =>
    clip(
      ["rightHand", "leftUpperArm", "leftUpperLeg"],
      ["leftUpperArm", "leftHand"],
    );
  const leaked: ReturnType<typeof compilePerformance> = compilePerformance(
    [locomote("hero")],
    armLeak,
  );
  TestValidator.equals(
    "the masked record names the action, actor, region and bones",
    leaked.masked,
    [
      {
        action: 0,
        actor: "hero",
        region: "lowerBody",
        bones: ["leftHand", "leftUpperArm", "rightHand"],
        root: false,
        expression: false,
      },
    ],
  );

  // 3. the root channel, which only layering strips
  const rooted: IAutoMovieActionSynthesizer = (
    action: IAutoMovieActionCall,
  ): IAutoMovieMotion =>
    action.verb === "locomote"
      ? clip(["leftUpperLeg"], ["leftUpperLeg"], { root: true })
      : clip(["leftUpperArm"], ["leftUpperArm"], { root: true });
  const layered: ReturnType<typeof compilePerformance> = compilePerformance(
    [locomote("hero"), wave("hero")],
    rooted,
  );
  TestValidator.equals(
    "only the non-locomotion region's root is reported",
    layered.masked,
    [
      {
        action: 1,
        actor: "hero",
        region: "upperBody",
        bones: [],
        root: true,
        expression: false,
      },
    ],
  );

  // 4. the expression channel: face keeps it and loses every bone
  const faced: IAutoMovieActionSynthesizer = (): IAutoMovieMotion =>
    clip(["leftUpperArm"], ["leftUpperArm"], { expression: true });
  const face: ReturnType<typeof compilePerformance> = compilePerformance(
    [emote("hero")],
    faced,
  );
  TestValidator.equals(
    "a face clip loses its bones and keeps its expression",
    face.masked,
    [
      {
        action: 0,
        actor: "hero",
        region: "face",
        bones: ["leftUpperArm"],
        root: false,
        expression: false,
      },
    ],
  );
  TestValidator.equals(
    "the face region's expression survives the mask",
    face.performances.hero!.keyframes[1]!.expression?.preset ?? null,
    "happy",
  );
  const nonFace: ReturnType<typeof compilePerformance> = compilePerformance(
    [wave("hero")],
    faced,
  );
  TestValidator.equals(
    "a non-face clip loses the expression instead",
    nonFace.masked,
    [
      {
        action: 0,
        actor: "hero",
        region: "upperBody",
        bones: [],
        root: false,
        expression: true,
      },
    ],
  );

  // 5. ordering: action index first, then actor id
  const ordered: ReturnType<typeof compilePerformance> = compilePerformance(
    [wave("zeta"), locomote(["beta", "alpha"])],
    armLeak,
  );
  TestValidator.equals(
    "masked records sort by action index, then actor",
    ordered.masked.map(
      (m: ReturnType<typeof compilePerformance>["masked"][number]): string =>
        `${m.action}:${m.actor}`,
    ),
    ["0:zeta", "1:alpha", "1:beta"],
  );
}
