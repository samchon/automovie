import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieActionCall,
  IAutoMovieActionSynthesizer,
  IAutoMovieMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  IDENTITY_TRANSFORM,
  joint,
  keyframe,
  makeExpression,
  makeMotion,
  makePose,
} from "../internal/fixtures";

/**
 * Assigned regions determine which authored channels survive and which are reported as lost.
 *
 * Scenarios:
 * 1. Upper-body and face layers author different expressions; the face layer owns the composite expression.
 * 2. A lower-body clip drops an arm and expression, while a root on an upper-body clip is separately reported.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks the returned masked records and the remaining pose and expression. The unit compiles short in-memory clips with each channel alone and with overlapping pose, expression and root channels.
 * @evidence contracts/development/testing.md#independent-expectations Face, arm, leg and root have explicitly different owners.
 * @evidence contracts/development/common.md#meaningful-documentation States both sides of the mask.
 */
export function test_perform_motion_channel_mask(): void {
  const action = (
    region: IAutoMovieActionCall["region"],
  ): IAutoMovieActionCall => ({
    verb: "gesture",
    kind: "wave",
    actor: "actor",
    region,
    start: 0,
    duration: 1,
  });
  const synth: IAutoMovieActionSynthesizer = (call): IAutoMovieMotion => {
    const pose = makePose(
      [
        joint("leftUpperLeg", { flexion: 10 }),
        joint("leftUpperArm", { flexion: 20 }),
      ],
      IDENTITY_TRANSFORM,
    );
    const face = makeExpression(call.region === "face" ? "happy" : "angry", 1);
    return makeMotion(
      [keyframe(0, pose, "linear", face), keyframe(1, pose, "linear", face)],
      1,
    );
  };
  const lower = AutoMovieEngineFilm.compilePerformance([action("lowerBody")], synth);
  TestValidator.equals("lower body loss", lower.masked, [
    {
      action: 0,
      actor: "actor",
      region: "lowerBody",
      bones: ["leftUpperArm"],
      root: false,
      expression: true,
    },
  ]);
  TestValidator.predicate(
    "retained leg and stripped expression",
    lower.performances.actor!.keyframes.every(
      (k) =>
        k.expression === null &&
        k.pose.joints.some((j) => j.bone === "leftUpperLeg") &&
        !k.pose.joints.some((j) => j.bone === "leftUpperArm"),
    ),
  );
  const result = AutoMovieEngineFilm.compilePerformance(
    [action("upperBody"), action("face")],
    synth,
  );
  TestValidator.predicate(
    "face owns the active expression",
    result.performances.actor!.keyframes.every(
      (k) => k.expression?.preset === "happy",
    ),
  );
  TestValidator.predicate(
    "upper-body root and face lost",
    result.masked.some(
      (m) => m.action === 0 && m.actor === "actor" && m.root && m.expression,
    ),
  );
}
