import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  gatePerformShotCompiledMotions
} from "../../../../../packages/engine/src/film/internal/gatePerformShotCompiledMotions";
import type {
  IAutoMovieCompiledPerformance,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../internal/createSkeleton";
import { joint } from "../../internal/joint";
import { keyframe } from "../../internal/keyframe";
import { makeMotion } from "../../internal/makeMotion";
import { makePose } from "../../internal/makePose";

/**
 * The compiled-motion gate roots a removed channel at the authored action
 * region and a rig validation error at the actor's compiled motion.
 *
 * Scenarios:
 *
 * 1. A single mask drop names the bones, root motion and expression once at the
 *    indexed author path. A rigged elbow set 10 degrees beyond its 150 degree
 *    bound is refused beneath the compiled motion's node id.
 * 2. The same motion on a node with no rig adds no rig validation findings.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the masked channel report, the nominal rig limit and the corresponding unrigged case.
 * @evidence contracts/development/testing.md#behavioral-verification The test invokes the compiled-motion validation gate on prepared channel and rig facts, comparing diagnostic paths and scope with and without the rig.
 * @evidence contracts/development/testing.md#independent-expectations The authored elbow is 160 degrees against a declared 150-degree limit. The skipped component, expression and root channels belong to the same author region. Removing the rig removes the specific constraint source but preserves the other scope.
 */
export function test_engine_film_gate_compiled_motions(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const rig: IAutoMovieSkeleton = createSkeleton();
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 150 })])),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 160 })])),
    ],
    1,
  );
  const compiled: IAutoMovieCompiledPerformance = {
    masked: [
      {
        action: 1,
        actor: "dancer",
        region: "head",
        bones: ["leftLowerArm"],
        root: true,
        expression: true,
      },
    ],
    performances: { dancer: motion, prop: motion },
  };
  gatePerformShotCompiledMotions(
    out,
    compiled,
    ["$input.draft[0].region", "$input.draft[1].region"],
    (node: string): IAutoMovieSkeleton | null =>
      node === "dancer" ? rig : null,
  );
  TestValidator.equals(
    "the only findings concern the selected mask and rigged actor",
    out.items.map(({ kind, path, overshoot }) => [
      kind,
      path,
      overshoot ?? null,
    ]),
    [
      ["type", "$input.draft[1].region", null],
      ["rom", '$compiled["dancer"].keyframes[1].pose.joints[0].flexion', 10],
    ],
  );
  TestValidator.predicate(
    "the mask finding describes every authored channel it removes",
    out.items[0]!.expected.includes(
      "the bones leftLowerArm and a root displacement and an expression",
    ),
  );
}
