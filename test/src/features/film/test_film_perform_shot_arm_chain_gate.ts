import {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieBone,
  IAutoMovieCameraAction,
  IAutoMovieConstraintViolation,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot, IAutoMovieStagedSet, performShot, stageScene } from "@automovie/engine";



import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const bone: (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
  translation: IAutoMovieVector3,
) => IAutoMovieBone = (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
  translation: IAutoMovieVector3,
): IAutoMovieBone => ({
  bone: name,
  parent,
  rest: {
    translation,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  constraint: null,
});

/**
 * A rig whose arms rest hanging (`down`) or in the canonical T-pose (`out`).
 * One direction parameter changes both lower-arm and hand rest offsets, keeping
 * lengths, hierarchy and the remaining rig fields fixed.
 */
const armRig: (direction: "down" | "out") => IAutoMovieSkeleton = (
  direction: "down" | "out",
): IAutoMovieSkeleton => {
  const step: (length: number, sign: number) => IAutoMovieVector3 = (
    length: number,
    sign: number,
  ): IAutoMovieVector3 =>
    direction === "down"
      ? { x: 0, y: -length, z: 0 }
      : { x: sign * length, y: 0, z: 0 };
  return {
    id: "skeleton-1",
    bones: [
      bone("hips", null, { x: 0, y: 0.95, z: 0 }),
      bone("spine", "hips", { x: 0, y: 0.2, z: 0 }),
      bone("chest", "spine", { x: 0, y: 0.18, z: 0 }),
      bone("leftUpperArm", "chest", { x: 0.09, y: 0, z: 0 }),
      bone("leftLowerArm", "leftUpperArm", step(0.32, 1)),
      bone("leftHand", "leftLowerArm", step(0.28, 1)),
      bone("rightUpperArm", "chest", { x: -0.09, y: 0, z: 0 }),
      bone("rightLowerArm", "rightUpperArm", step(0.32, -1)),
      bone("rightHand", "rightLowerArm", step(0.28, -1)),
    ],
  };
};

const reach: IAutoMovieActionCall = {
  verb: "reach",
  actor: "knightA",
  start: 0,
  duration: 0.6,
  hand: "left",
  to: { kind: "point", point: { x: 0, y: 1.1, z: 0.3 } },
};

const frame: IAutoMovieCameraAction = {
  verb: "frame",
  actor: "cam-main",
  start: 0,
  duration: "auto",
  framing: "medium",
  move: "static",
  on: { kind: "node", node: "knightA" },
};

const run: (
  rig: IAutoMovieSkeleton | null,
  actions: IAutoMovieActionCall[],
) => IAutoMoviePerformedShot = (
  rig: IAutoMovieSkeleton | null,
  actions: IAutoMovieActionCall[],
): IAutoMoviePerformedShot =>
  performShot({
    script: makeScriptWrite(),
    staged: ((): IAutoMovieStagedSet.ISuccess => {
      const s: IAutoMovieStagedSet = stageScene(
        makeScriptWrite(),
        makeStagingWrite(),
      );
      if (s.success !== true) throw new Error("staging must succeed");
      return s;
    })(),
    performance: makePerformanceWrite({
      draft: [...actions, frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton | null => rig,
  });

/**
 * Arm-solving actions refuse incompatible rest chains at their authored fields.
 *
 * Scenarios:
 * 1. Refuse reach, point and strike on an arms-down chain with located geometry guidance.
 * 2. Accept the identical actions on the outward rest-chain twin.
 * 3. Leave non-arm hold and unresolved skeleton lookup outside this arm-chain refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs stageScene and performShot and checks located hand/kind faults, geometry guidance and accepted twins, catching an unperformable arm request silently skipped after null synthesis.
 * @evidence contracts/testing.md#independent-expectations The authored down-chain rest direction is parallel to its flexion axis, while the outward twin changes that direction alone; the gate contract makes the former unbendable for these verbs. The test measures admission, not a rendered reach trajectory.
 * @evidence contracts/testing.md#distinguishing-cases Keeps reach and both right-arm gestures, outward positive twins, hold and unresolved-rig scope boundaries. Solver position accuracy, region masking and motion constraints have dedicated tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable unit owns all in-memory performance gate cases and directly calls engine source with the existing numerical synthesizer; no native rig, browser or GPU is started.
 */
export function test_film_perform_shot_arm_chain_gate(): void {
  // 1. the refusal, at the field that names the arm
  const refused: IAutoMoviePerformedShot = run(armRig("down"), [reach]);
  TestValidator.equals(
    "a reach on an unbendable arm fails the shot",
    refused.success,
    false,
  );
  TestValidator.predicate(
    "and is reported at the action's own hand field",
    hasViolation(refused, "type", "$input.draft[0].hand"),
  );
  TestValidator.equals(
    "with the rig's own geometry as the reason",
    namedFacts([
      ["refused", (): boolean => refused.success === false],
      [
        "violated",
        (): boolean =>
          refused.success === false &&
          refused.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.path.includes("[0].hand") &&
              v.expected.includes("parallel") &&
              v.expected.includes("knightA"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  // 2. NEGATIVE TWIN: the same shot, the same target, a conforming rest
  TestValidator.equals(
    "the identical shot passes on the T-pose twin",
    run(armRig("out"), [reach]).success,
    true,
  );

  // 3. the arm gestures ride the same solver, so they carry the same gate
  for (const kind of ["point", "strike"] as const) {
    const gesture: IAutoMovieActionCall = {
      verb: "gesture",
      actor: "knightA",
      start: 0,
      duration: 0.6,
      kind,
      at: { kind: "point", point: { x: 0, y: 1.1, z: 0.3 } },
    };
    const gestureRefused: IAutoMoviePerformedShot = run(armRig("down"), [
      gesture,
    ]);
    TestValidator.equals(
      `a ${kind} gesture on an unbendable arm is refused at its kind field`,
      namedFacts([
        ["refused", (): boolean => gestureRefused.success === false],
        [
          "violated",
          (): boolean =>
            gestureRefused.success === false &&
            hasViolation(gestureRefused, "type", "$input.draft[0].kind"),
        ],
      ]),
      { refused: true, violated: true },
    );
    TestValidator.equals(
      `and the same ${kind} passes on the T-pose twin`,
      run(armRig("out"), [gesture]).success,
      true,
    );
  }

  // 4. BOUNDARY: the gate is scoped to arm verbs. A rig that never reaches is
  // still perfectly performable, which is what keeps retargeted quadrupeds
  // (whose front legs ride the arm chains) legal.
  const hold: IAutoMovieActionCall = {
    verb: "hold",
    actor: "knightA",
    start: 0,
    duration: 1,
  };
  TestValidator.equals(
    "a shot with no arm verb is untouched on the arms-down rig",
    run(armRig("down"), [hold]).success,
    true,
  );

  // 5. BOUNDARY: no rig to diagnose. A node the skeleton lookup does not resolve
  // carries no geometry, so the gate has nothing to decide and stays silent
  // rather than guessing a convention for a rig it cannot see.
  TestValidator.predicate(
    "an unresolved rig raises no arm-chain violation",
    !hasViolation(run(null, [reach]), "type", "$input.draft[0].hand"),
  );
}
