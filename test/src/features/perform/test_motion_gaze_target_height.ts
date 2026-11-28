import { AutoMovieEngineFilm } from "@automovie/engine";
import {
  IAutoMovieActionCall,
  type IAutoMovieActionSynthesizer,
  IAutoMovieActionTarget,
  type IAutoMovieActorContext,
  IAutoMovieGait,
  IAutoMovieMotion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../internal/fixtures";
import { nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const WALK: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 25 }],
};

const actorAt: (
  position: IAutoMovieVector3,
  eyeHeight: number,
) => IAutoMovieActorContext = (
  position: IAutoMovieVector3,
  eyeHeight: number,
): IAutoMovieActorContext => ({
  skeleton: "h",
  gaits: [WALK],
  position,
  speed: 1,
  facingDeg: 0,
  eyeHeight,
  restPose: makePose([joint("spine", { flexion: 0 })]),
});

/** The looker stands at the origin facing +Z, eyes at 1.6 m. */
const HERO: IAutoMovieActorContext = actorAt({ x: 0, y: 0, z: 0 }, 1.6);

/** Conversational range, the distance the staging schema names for a duel. */
const GUARD_PLACEMENT: IAutoMovieVector3 = { x: 0, y: 0, z: 0.7 };

/** A shorter performer, so the lift cannot be a constant in disguise. */
const CHILD_PLACEMENT: IAutoMovieVector3 = { x: 0, y: 0, z: 2 };

/** A staged thing with no actor context: its origin is wherever staging put it. */
const ALTAR_PLACEMENT: IAutoMovieVector3 = { x: 0, y: 0.9, z: 3 };

/** A staged camera: its translation already IS its optical point. */
const LENS_PLACEMENT: IAutoMovieVector3 = { x: 1, y: 1.6, z: 3 };

const contexts: Map<string, IAutoMovieActorContext> = new Map<
  string,
  IAutoMovieActorContext
>([
  ["hero", HERO],
  ["guard", actorAt(GUARD_PLACEMENT, 1.6)],
  ["child", actorAt(CHILD_PLACEMENT, 1.2)],
  ["statue", actorAt({ x: 0, y: 0, z: 4 }, 0)],
]);

const nodes: Map<string, IAutoMovieVector3> = new Map<
  string,
  IAutoMovieVector3
>([
  ["hero", { x: 0, y: 0, z: 0 }],
  ["guard", GUARD_PLACEMENT],
  ["child", CHILD_PLACEMENT],
  ["statue", { x: 0, y: 0, z: 4 }],
  ["altar", ALTAR_PLACEMENT],
  ["lens", LENS_PLACEMENT],
]);

const synth: IAutoMovieActionSynthesizer = AutoMovieEngineFilm.makeActorSynthesizer(
  contexts,
  nodes,
);

const lookAt: (to: IAutoMovieActionTarget) => IAutoMovieActionCall = (
  to: IAutoMovieActionTarget,
): IAutoMovieActionCall => ({
  verb: "lookAt",
  to,
  actor: "hero",
  start: 0,
  duration: 1,
});

const look: (to: IAutoMovieActionTarget) => IAutoMovieMotion | null = (
  to: IAutoMovieActionTarget,
): IAutoMovieMotion | null => synth(lookAt(to), "hero");

/**
 * Resolves an actor's eye point before the head angle is synthesized.
 * Scenarios:
 * - Equal and unequal eye heights, their centroid, and an explicit point at ground level.
 * - Zero-height actors, cameras and props have literal placement targets. A direction or missing node has no position.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the synthesized head and checks exact clip equivalence where lifting is identity. The same guard is addressed once by its staged node and once by an explicit ground location in metres.
 * @evidence contracts/development/testing.md#independent-expectations Elevation is the negative arc tangent of height difference over horizontal separation.
 * @evidence contracts/development/common.md#meaningful-documentation Separates point resolution from joint-range allocation.
 */
export function test_motion_gaze_target_height(): void {
  const elevation = (target: IAutoMovieActionTarget, dy: number, z: number) => {
    const head = look(target)!.keyframes[0]!.pose.joints.find(
      (j) => j.bone === "head",
    )!;
    TestValidator.predicate(
      "eye target elevation and heading",
      nclose(head.flexion!, (-Math.atan2(dy, z) * 180) / Math.PI) &&
        nclose(head.twist!, 0),
    );
  };
  elevation({ kind: "node", node: "guard" }, 0, 0.7);
  elevation({ kind: "node", node: "child" }, 1.2 - 1.6, 2);
  elevation(
    { kind: "group", nodes: ["guard", "child"] },
    (1.2 - 1.6) / 2,
    (2 + 0.7) / 2,
  );
  elevation({ kind: "point", point: GUARD_PLACEMENT }, -1.6, 0.7);
  for (const [id, point] of [
    ["altar", ALTAR_PLACEMENT],
    ["lens", LENS_PLACEMENT],
    ["statue", { x: 0, y: 0, z: 4 }],
  ] as const)
    TestValidator.predicate(
      id + " is a literal target",
      test12ValuesClose(
        look({ kind: "node", node: id }),
        look({ kind: "point", point }),
      ),
    );
  TestValidator.equals(
    "direction and unplaced id have no positional gaze",
    [
      look({ kind: "direction", headingDeg: 90 }),
      look({ kind: "node", node: "ghost" }),
    ],
    [null, null],
  );
}
