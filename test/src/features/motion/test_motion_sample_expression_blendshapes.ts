import { sampleMotion } from "@automovie/engine";
import type { AutoMovieArkitChannel, IAutoMovieBlendshapeChannel, IAutoMovieExpression, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  joint,
  keyframe,
  makeExpression,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const rest: IAutoMoviePose = makePose([joint("leftLowerArm", { flexion: 0 })]);

/**
 * Observe midpoint channel weights when a same-preset expression has one shared channel and one channel authored only at the start. This is expression-data interpolation; ARKit-labelled channel names do not establish observed facial deformation.
 *
 * Scenarios:
 *
 * 1. On the unchanged one-second happy clip, jawOpen 1-to-0 samples 0.5 and start-only mouthSmileLeft 0.4 samples 0.2 at t=0.5.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls sampleMotion, checks expression/channel presence and observes the two named midpoint weights from its returned blendshape population.
 * @evidence contracts/testing.md#independent-expectations Local endpoints give (1+0)/2=0.5 and 0.4*(1-0.5)=0.2 without reading expected values from blendChannels. Existing nclose tolerance and the missing-channel sentinel -1 remain unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Retains a both-present channel versus a start-only channel in one same-preset segment. End-only population, null expressions, nonlinear easing, duplicate channel admission and exact output ordering are outside these unchanged assertions.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns one direct sample call and local map observation with existing fixture constructors. No helper registers additional cases or starts a viewer, process or native artifact.
 */
export function test_motion_sample_expression_blendshapes(): void {
  const clip: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        rest,
        "linear",
        makeExpression("happy", 1, [
          { channel: "jawOpen", weight: 1 },
          { channel: "mouthSmileLeft", weight: 0.4 },
        ]),
      ),
      keyframe(
        1,
        rest,
        "linear",
        makeExpression("happy", 1, [{ channel: "jawOpen", weight: 0 }]),
      ),
    ],
    1,
  );
  const blended: IAutoMovieExpression | null = sampleMotion(clip, 0.5).expression;
  TestValidator.equals(
    "blendshapes present",
    namedFacts([
      ["blended", (): boolean => blended !== null],
      [
        "blendedBlendshapes",
        (): boolean => blended !== null && blended.blendshapes !== null,
      ],
    ]),
    { blended: true, blendedBlendshapes: true },
  );

  const channels: Map<AutoMovieArkitChannel, number> = new Map(
    (blended!.blendshapes ?? []).map((c: IAutoMovieBlendshapeChannel): [AutoMovieArkitChannel, number] => [c.channel, c.weight]),
  );
  TestValidator.predicate(
    "jawOpen blends to 0.5",
    nclose(channels.get("jawOpen") ?? -1, 0.5),
  );
  TestValidator.predicate(
    "one-sided mouthSmileLeft decays to 0.2",
    nclose(channels.get("mouthSmileLeft") ?? -1, 0.2),
  );
}
