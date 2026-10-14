import {
  IAutoMovieActionSynthesizer,
  IAutoMovieActorContext,
  makeActorSynthesizer,
} from "@automovie/engine";
import {
  IAutoMovieActionCall,
  IAutoMovieActionTarget,
  IAutoMovieGait,
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";
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

const synth: IAutoMovieActionSynthesizer = makeActorSynthesizer(
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

const headOf: (motion: IAutoMovieMotion) => {
  flexion: number;
  twist: number;
} = (motion: IAutoMovieMotion): { flexion: number; twist: number } => {
  const bone: IAutoMovieJointPose = motion.keyframes[0]!.pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "head",
  )!;
  return { flexion: bone.flexion!, twist: bone.twist! };
};

/** Degrees of head flexion the spec's aim formula demands for a raw aim. */
const flexionFor: (dy: number, horizontal: number) => number = (
  dy: number,
  horizontal: number,
): number => (-Math.atan2(dy, horizontal) * 180) / Math.PI;

/**
 * Observe the actor synthesizer's gaze-only eye-height lift through first-keyframe head angles and exact node/point motion pairs. The injected contexts have no rig, so this unit observes raw single-head angles without running a ROM gate or rendered-eye FK.
 *
 * Scenarios:
 *
 * 1. Equal 1.6 m eye heights at separation 0.7 produce zero flexion/twist; the explicit ground point instead produces 66.3706 degrees of flexion, exceeding the stated 45-degree reference.
 * 2. A 1.2 m-eyed child at separation 2 produces the downward angle for the 0.4 m difference.
 * 3. A guard/child group aims at the centroid of their lifted points, with Y 1.4 and Z 1.35.
 * 4. Set-piece and camera node targets match explicit placement-point motions exactly.
 * 5. A zero-eye-height actor matches its explicit placement-point motion exactly.
 * 6. Direction and unplaced-node targets still return null.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual actor synthesizer for node, point, group and unsupported positional targets, checking raw head angles, full motion equivalence and null refusals. A blanket actor-origin aim or indiscriminate lift breaks these observations.
 * @evidence contracts/testing.md#independent-expectations Angles derive from atan2 on literal metre geometry, including the independent 66.3706 reference with original 1e-4 tolerance. Normal finite motion pairs compare every plain-record/array field through test12ValuesClose with numeric eps0; this is structural value equality, not serialized bytes or prototype/symbol identity. These paired calls constrain target equivalence but share the same downstream solver.
 * @evidence contracts/testing.md#distinguishing-cases Retains equal/unequal eye heights, lifted group centroid, non-actor set piece/camera, zero lift, explicit ground points, direction and missing node. Gaze-chain ROM distribution and animated eye geometry belong to other units.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns all synthesis and assertions through local callbacks; module initialization only builds fixture maps and the synthesizer. No case is registered dynamically and no viewer, GPU or native host starts.
 */
export function test_perform_look_at_eye_level(): void {
  // 1. eyes meet eyes at conversational range.
  const level: ReturnType<typeof headOf> = headOf(
    look({ kind: "node", node: "guard" })!,
  );
  TestValidator.equals(
    "an actor target at equal eye height needs no head tilt",
    namedFacts([
      ["ncloseLevelFlexion", (): boolean => nclose(level.flexion, 0)],
      ["ncloseLevelTwist", (): boolean => nclose(level.twist, 0)],
    ]),
    { ncloseLevelFlexion: true, ncloseLevelTwist: true },
  );
  const ground: ReturnType<typeof headOf> = headOf(
    look({ kind: "point", point: GUARD_PLACEMENT })!,
  );
  TestValidator.equals(
    "the same subject's placement point still demands the ROM-breaking tilt",
    namedFacts([
      [
        "ncloseGroundFlexion",
        (): boolean => nclose(ground.flexion, flexionFor(-1.6, 0.7)),
      ],
      [
        "ncloseGroundFlexion2",
        (): boolean => nclose(ground.flexion, 66.3706, 1e-4),
      ],
      ["groundFlexion", (): boolean => ground.flexion > 45],
    ]),
    {
      ncloseGroundFlexion: true,
      ncloseGroundFlexion2: true,
      groundFlexion: true,
    },
  );

  // 2. each subject's own eye height, not a shared constant.
  const shorter: ReturnType<typeof headOf> = headOf(
    look({ kind: "node", node: "child" })!,
  );
  TestValidator.predicate(
    "a shorter subject tilts the head down by its own height difference",
    nclose(shorter.flexion, flexionFor(1.2 - 1.6, 2)),
  );

  // 3. a group averages eye points, not ground points.
  const group: ReturnType<typeof headOf> = headOf(
    look({ kind: "group", nodes: ["guard", "child"] })!,
  );
  TestValidator.predicate(
    "a group target averages the members' eye points",
    nclose(group.flexion, flexionFor((1.6 + 1.2) / 2 - 1.6, (0.7 + 2) / 2)),
  );

  // 4. the negative twins: no context, no lift.
  TestValidator.predicate(
    "a set piece target keeps its placement point",
    test12ValuesClose(
      look({ kind: "node", node: "altar" }),
      look({ kind: "point", point: ALTAR_PLACEMENT }),
    ),
  );
  TestValidator.predicate(
    "a camera target keeps its placement point",
    test12ValuesClose(
      look({ kind: "node", node: "lens" }),
      look({ kind: "point", point: LENS_PLACEMENT }),
    ),
  );

  // 5. the zero-lift boundary.
  TestValidator.predicate(
    "an actor with zero eye height is lifted by nothing",
    test12ValuesClose(
      look({ kind: "node", node: "statue" }),
      look({ kind: "point", point: { x: 0, y: 0, z: 4 } }),
    ),
  );

  // 6. what still resolves to nothing.
  TestValidator.equals(
    "a relative target still synthesises nothing",
    look({ kind: "direction", headingDeg: 90 }),
    null,
  );
  TestValidator.equals(
    "an unplaced id still synthesises nothing",
    look({ kind: "node", node: "ghost" }),
    null,
  );
}
