import {
  IAutoMovieActionSynthesizer,
  IAutoMoviePerformedShot,
  IAutoMovieStagedSet,
  performShot,
  stageScene,
} from "@automovie/engine";
import {
  IAutoMovieActionCall,
  IAutoMovieCameraAction,
  IAutoMovieConstraintViolation,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const locomote: IAutoMovieActionCall = {
  verb: "locomote",
  actor: "knightA",
  start: 0,
  duration: 1,
  gait: "walk",
  to: { kind: "point", point: { x: 0, y: 0, z: 0.25 } },
};

const lookAt: (start: number) => IAutoMovieActionCall = (
  start: number,
): IAutoMovieActionCall => ({
  verb: "lookAt",
  actor: "knightA",
  start,
  duration: 1,
  to: { kind: "node", node: "knightB" },
});

const emote: (start: number) => IAutoMovieActionCall = (
  start: number,
): IAutoMovieActionCall => ({
  verb: "emote",
  actor: "knightA",
  start,
  duration: 1,
  preset: "neutral",
  intensity: 0.5,
});

const fullBody: (start: number) => IAutoMovieActionCall = (
  start: number,
): IAutoMovieActionCall => ({
  verb: "gesture",
  kind: "jump",
  region: "fullBody",
  actor: "knightA",
  start,
  duration: 1,
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

/**
 * Performs overlapping synthesized channel content and checks shared arm/head/root/expression refusal, adjacent/disjoint admission and exactly two callback invocations for the cached pair.
 *
 * Scenarios:
 * 1. Refuse overlapping arm content and admit adjacent placements.
 * 2. Refuse three overlapping head actions at the later action's field.
 * 3. Refuse shared root and expression content with channel-specific guidance.
 * 4. Admit disjoint head/face actions and require exactly two synthesis calls.
 * 5. Admit fullBody with disjoint face/head content and refuse its shared-head twin.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs overlapping synthesized channel content and checks shared arm/head/root/expression refusal, adjacent/disjoint admission and exactly two callback invocations for the cached pair.
 * @evidence contracts/testing.md#independent-expectations Authored clip channels, not broad region labels, define conflicts; half-open adjacent spans do not overlap, and one synthesis per action/actor requires the counted two actions to invoke the callback twice.
 * @evidence contracts/testing.md#distinguishing-cases Covers shared-channel overlap and adjacency, repeated head comparisons, root/expression conflicts, partial regions, broad disjoint masks and shared-head twin; the callback count specifically observes the counted disjoint pair.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_region_gates unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_region_gates(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  // Both clips carry the same arm but return it to rest at their boundary, so
  // overlap is the only fault under test; adjacent placement remains smooth.
  const armSynth: IAutoMovieActionSynthesizer = (): IAutoMovieMotion =>
    makeMotion(
      [
        keyframe(0, makePose([joint("leftUpperArm", { flexion: 0 })])),
        keyframe(0.5, makePose([joint("leftUpperArm", { flexion: 20 })])),
        keyframe(1, makePose([joint("leftUpperArm", { flexion: 0 })])),
      ],
      1,
    );
  const overlapping: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [locomote, fullBody(0.5), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: armSynth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "overlapping actions sharing an arm fail",
    overlapping.success,
    false,
  );
  TestValidator.equals(
    "shared-arm overlap is reported on the later action start",
    namedFacts([
      ["refused", (): boolean => overlapping.success === false],
      [
        "violated",
        (): boolean =>
          overlapping.success === false &&
          hasViolation(overlapping, "range", "$input.draft[1].start"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const adjacent: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [locomote, fullBody(1), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: armSynth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "adjacent shared-arm actions pass",
    adjacent.success,
    true,
  );

  const headSynth: IAutoMovieActionSynthesizer = (): IAutoMovieMotion =>
    makeMotion(
      [
        keyframe(0, makePose([joint("head", { flexion: 0 })])),
        keyframe(1, makePose([joint("head", { flexion: 20 })])),
      ],
      1,
    );
  const sameRegion: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      // Three overlaps exercise repeated comparisons of the first action;
      // this case observes refusal, while the counted pair below owns reuse.
      draft: [lookAt(0), lookAt(0.25), lookAt(0.5), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: headSynth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "overlapping same-region actions fail",
    sameRegion.success,
    false,
  );
  TestValidator.equals(
    "same-region overlap is reported on the later action start",
    namedFacts([
      ["refused", (): boolean => sameRegion.success === false],
      [
        "violated",
        (): boolean =>
          sameRegion.success === false &&
          hasViolation(sameRegion, "range", "$input.draft[1].start"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const rootSynth: IAutoMovieActionSynthesizer = (): IAutoMovieMotion =>
    makeMotion(
      [
        keyframe(
          0,
          makePose([], {
            translation: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          }),
        ),
        keyframe(
          1,
          makePose([], {
            translation: { x: 0, y: 0, z: 1 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          }),
        ),
      ],
      1,
    );
  const sharedRoot: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [fullBody(0), fullBody(0.5), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: rootSynth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "two overlapping root motions conflict on root",
    namedFacts([
      ["refused", (): boolean => sharedRoot.success === false],
      [
        "violated",
        (): boolean =>
          sharedRoot.success === false &&
          sharedRoot.violations.some(
            (violation: IAutoMovieConstraintViolation): boolean =>
              violation.path === "$input.draft[1].start" &&
              violation.expected.includes("root"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  const expressionSynth: IAutoMovieActionSynthesizer = (): IAutoMovieMotion =>
    makeMotion(
      [
        keyframe(0, makePose([]), "linear", {
          preset: "happy",
          intensity: 0.5,
          blendshapes: null,
        }),
        keyframe(1, makePose([]), "linear", {
          preset: "happy",
          intensity: 0.5,
          blendshapes: null,
        }),
      ],
      1,
    );
  const sharedExpression: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [emote(0), emote(0.5), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: expressionSynth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "two overlapping face clips conflict on expression",
    namedFacts([
      ["refused", (): boolean => sharedExpression.success === false],
      [
        "violated",
        (): boolean =>
          sharedExpression.success === false &&
          sharedExpression.violations.some(
            (violation: IAutoMovieConstraintViolation): boolean =>
              violation.path === "$input.draft[1].start" &&
              violation.expected.includes("expression"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  let synthesisCalls: number = 0;
  const countedSynth: IAutoMovieActionSynthesizer = (
    action: IAutoMovieActionCall,
    actor: string,
  ): IAutoMovieMotion | null => {
    ++synthesisCalls;
    return validSynthesizer(action, actor);
  };
  const layeredPartials: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [lookAt(0), emote(0.25), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: countedSynth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "overlapping disjoint partial regions pass",
    layeredPartials.success,
    true,
  );
  TestValidator.equals(
    "overlap inspection and compilation synthesize each actor action once",
    synthesisCalls,
    2,
  );

  // The fixture's fullBody clip authors an arm only, so a head action is truly
  // disjoint despite the broad mask. A fullBody clip that actually authors the
  // head conflicts, as the headSynth twin proves.
  const smileWhileJumping: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [fullBody(0), emote(0.25), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "an emote overlapping a fullBody gesture passes",
    smileWhileJumping.success,
    true,
  );
  const lookWhileJumping: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [fullBody(0), lookAt(0.25), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.predicate(
    "a content-disjoint head action may overlap a fullBody mask",
    lookWhileJumping.success === true,
  );
  const sharedHead: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [fullBody(0), lookAt(0.25), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: headSynth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "a fullBody clip and head action sharing head still gate",
    namedFacts([
      ["refused", (): boolean => sharedHead.success === false],
      [
        "violated",
        (): boolean =>
          sharedHead.success === false &&
          hasViolation(sharedHead, "range", "$input.draft[1].start"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
