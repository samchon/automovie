import { IAutoMovieResolvedBone } from "../../../../packages/engine/src/kinematics/IAutoMovieResolvedBone";
import { IAutoMovieArmChainFault } from "../../../../packages/engine/src/kinematics/IAutoMovieArmChainFault";
import { HUMANOID_JOINT_AXES } from "../../../../packages/engine/src/kinematics/constants/HUMANOID_JOINT_AXES";
import { armChainFault } from "../../../../packages/engine/src/kinematics/armChainFault";
import { reachPose } from "../../../../packages/engine/src/kinematics/reachPose";
import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
const bone: (name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null, translation: IAutoMovieVector3) => IAutoMovieBone = (
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
 * Two rigs identical except for the direction the arm chain rests in: the same
 * bones, the same `0.32 m` upper and `0.28 m` fore, the same shoulder. `down`
 * hangs the arm along local −Y (the other obvious rest pose, and the one S-02's
 * agent authored); `out` holds the canonical VRM T-pose along local ±X.
 *
 * One property apart, which is what makes the pair a twin.
 */
const armRig: (direction: "down" | "out") => IAutoMovieSkeleton = (direction: "down" | "out"): IAutoMovieSkeleton => {
  const step: (length: number) => IAutoMovieVector3 = (length: number): IAutoMovieVector3 =>
    direction === "down"
      ? { x: 0, y: -length, z: 0 }
      : { x: -length, y: 0, z: 0 };
  return {
    id: "rig-mara",
    bones: [
      bone("hips", null, { x: 0, y: 0.95, z: 0 }),
      bone("spine", "hips", { x: 0, y: 0.2, z: 0 }),
      bone("chest", "spine", { x: 0, y: 0.18, z: 0 }),
      bone("rightUpperArm", "chest", { x: -0.09, y: 0, z: 0 }),
      bone("rightLowerArm", "rightUpperArm", step(0.32)),
      bone("rightHand", "rightLowerArm", step(0.28)),
    ],
  };
};

/** Shoulder-to-hand distance at one elbow flexion angle. */
const spanAt: (skeleton: IAutoMovieSkeleton, flexion: number) => number = (skeleton: IAutoMovieSkeleton, flexion: number): number => {
  const resolved: IAutoMovieResolvedBone[] = resolvePose(
    {
      skeleton: skeleton.id,
      root: null,
      joints: [{ bone: "rightLowerArm", flexion, abduction: 0, twist: 0 }],
    },
    skeleton,
    HUMANOID_JOINT_AXES,
  );
  const shoulder: IAutoMovieVector3 = resolved.find(
    (b: IAutoMovieResolvedBone): boolean => b.bone === "rightUpperArm",
  )!.worldPosition;
  const hand: IAutoMovieVector3 = resolved.find((b: IAutoMovieResolvedBone): boolean => b.bone === "rightHand")!.worldPosition;
  return Math.hypot(
    hand.x - shoulder.x,
    hand.y - shoulder.y,
    hand.z - shoulder.z,
  );
};

const SWEEP: number[] = [0, 15, 30, 60, 90, 150];

/**
 * The humanoid arm axes cannot bend a forearm whose rest offset is parallel
 * to the declared elbow flexion axis (#1346).
 *
 * `HUMANOID_JOINT_AXES` maps the arm's `flexion` onto local **+Y** because a
 * T-pose arm points along local X, so flexion swings it sagittally instead of
 * rolling it. Applied to an arm that HANGS along local −Y, that same table
 * names the bone's own long axis: elbow flexion becomes a roll and does not
 * change the hand's position relative to the elbow. This case diagnoses that
 * rest geometry at reach use rather than testing an authoring or harness gate.
 *
 * The refusal belongs at the point of USE, not at authoring time: the humanoid
 * bone enum is the only vocabulary the surface has, so a retargeted quadruped's
 * front legs can ride the arm chains and rest along −Y. The test therefore asks
 * a geometric question: is the elbow's flexion axis parallel to the forearm's
 * rest direction? It does not establish acceptance of any production rig.
 *
 * The expected spans below are hand-computed, not sampled from the code: an
 * elbow rolling about the forearm's own axis cannot change the shoulder-to-hand
 * distance, so it stays `0.32 + 0.28 = 0.600000` at EVERY angle, while a T-pose
 * elbow closes the triangle by the law of cosines, `sqrt(0.32² + 0.28² −
 * 2·0.32·0.28·cos(180° − flexion))`.
 *
 * Scenarios:
 *
 * 1. The degeneracy, measured: on the arms-down rig the shoulder-to-hand span is
 *    `0.600000` at every elbow flexion in the sweep. The elbow does nothing.
 * 2. NEGATIVE TWIN: the same sweep on the T-pose rig matches the law of cosines at
 *    every angle and falls from `0.600000` to `0.160026`, so the sweep itself
 *    is a working measurement rather than a constant.
 * 3. `armChainFault` names the arms-down rig's elbow, and returns `null` for the
 *    T-pose rig: the diagnosis matches both measured right-arm geometries.
 * 4. `reachPose` refuses the arms-down rig rather than returning a pose whose bend
 *    rides axes the rig declares immobile, and still solves the T-pose rig.
 * 5. Boundary, per SIDE not per rig: a rig with one arm T-posed and the other
 *    hanging is faulted on exactly the hanging side.
 * 6. Boundary, nothing to diagnose: a rig with no hand bone is not a convention
 *    fault, it is a missing chain, and the two answers stay distinct.
 * 7. Boundary, an ill-posed question: a zero-length forearm has no direction to be
 *    parallel to, and an axis table that names no elbow hinge (or names a
 *    zero-length one) states no convention to break. None is a fault.
 * 8. Boundary, a broken chain: a hand parented to the upper arm instead of the
 *    lower arm has a rest offset outside the elbow's frame, so the arms-down rig
 *    is not diagnosed as an elbow fault and `reachPose` refuses even the T-pose
 *    rig rather than solving offsets that are not one chain.
 * 9. A finite diagonal forearm remains nonparallel to the hinge even when its
 *    Euclidean length exceeds binary64, so normalization cannot collapse it.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls armChainFault, reachPose and forward kinematics, checking unbendable diagnosis versus valid T-pose reach and refusing misparented offsets outside the elbow frame.
 * @evidence contracts/testing.md#independent-expectations The arms-down span is 0.32+0.28 metres and the T-pose sweep follows the law of cosines; returned fault side/bone/reason identify the geometric cause.
 * @evidence contracts/testing.md#distinguishing-cases Covers both sides, conforming/unbendable twins, missing hand, collapsed/large finite forearms, missing/zero axes and broken parenting; reach tests own general targets and ROM gates.
 * @evidence contracts/testing.md#execution-ownership A discoverable kinematics entry uses numerical skeleton records and direct TypeScript source, with no Human basis, probe, GPU or external driver.
 */
export function test_kinematics_arm_chain_fault(): void {
  const down: IAutoMovieSkeleton = armRig("down");
  const out: IAutoMovieSkeleton = armRig("out");

  // 1. the degeneracy: the elbow cannot change the span at all
  for (const flexion of SWEEP)
    TestValidator.predicate(
      `an arms-down elbow at ${flexion} deg leaves the span at 0.600000`,
      nclose(spanAt(down, flexion), 0.6, 1e-9),
    );

  // 2. NEGATIVE TWIN: the same measurement on the conforming rig moves, and
  // moves to where the law of cosines says it should.
  for (const flexion of SWEEP) {
    const interior: number = ((180 - flexion) * Math.PI) / 180;
    const expected: number = Math.sqrt(
      0.32 * 0.32 + 0.28 * 0.28 - 2 * 0.32 * 0.28 * Math.cos(interior),
    );
    TestValidator.predicate(
      `a T-pose elbow at ${flexion} deg closes the triangle to ${expected.toFixed(6)}`,
      nclose(spanAt(out, flexion), expected, 1e-9),
    );
  }
  TestValidator.equals(
    "and that sweep really moves: 0.600000 at 0 deg down to 0.160026 at 150",
    namedFacts([
      ["ncloseSpanAtOut", (): boolean => nclose(spanAt(out, 0), 0.6, 1e-9)],
      ["ncloseSpanAtOut2", (): boolean => nclose(spanAt(out, 150), 0.160026, 1e-6)],
    ]),
    { ncloseSpanAtOut: true, ncloseSpanAtOut2: true },
  );

  // 3. the diagnosis agrees with both measured right-arm geometries
  const fault: IAutoMovieArmChainFault | null = armChainFault(down, "right");
  TestValidator.equals(
    "the arms-down rig is faulted, at its elbow, with a reason that says why",
    namedFacts([
      ["fault", (): boolean => fault !== null],
      ["faultSideRight", (): boolean => fault !== null && fault.side === "right"],
      [
        "faultBoneRightLowerArm",
        (): boolean => fault !== null && fault.bone === "rightLowerArm",
      ],
      [
        "faultReasonIncludes",
        (): boolean => fault !== null && fault.reason.includes("parallel"),
      ],
    ]),
    {
      fault: true,
      faultSideRight: true,
      faultBoneRightLowerArm: true,
      faultReasonIncludes: true,
    },
  );
  TestValidator.equals(
    "the conforming rig is not faulted",
    armChainFault(out, "right"),
    null,
  );

  // 4. the refusal lands where the arm IK is actually asked for
  const target: IAutoMovieVector3 = { x: 0.25, y: 1.0, z: 0.35 };
  TestValidator.equals(
    "reachPose refuses an arm whose elbow cannot bend it",
    reachPose(down, "right", target),
    null,
  );
  TestValidator.predicate(
    "and still solves the twin that can",
    reachPose(out, "right", { x: -0.35, y: 1.1, z: 0.3 }) !== null,
  );

  // 5. BOUNDARY: the fault is a property of a SIDE, not of a rig. A rig may
  // legitimately carry one conforming arm and one that does not.
  const mixed: IAutoMovieSkeleton = {
    id: "rig-mixed",
    bones: [
      ...armRig("down").bones,
      bone("leftUpperArm", "chest", { x: 0.09, y: 0, z: 0 }),
      bone("leftLowerArm", "leftUpperArm", { x: 0.32, y: 0, z: 0 }),
      bone("leftHand", "leftLowerArm", { x: 0.28, y: 0, z: 0 }),
    ],
  };
  TestValidator.equals(
    "a mixed rig faults only the hanging side",
    namedFacts([
      ["armChainFaultMixedRight", (): boolean => armChainFault(mixed, "right") !== null],
      ["armChainFaultMixedLeft", (): boolean => armChainFault(mixed, "left") === null],
    ]),
    { armChainFaultMixedRight: true, armChainFaultMixedLeft: true },
  );

  // 6. BOUNDARY: an absent chain is a different fact from an unbendable one.
  const handless: IAutoMovieSkeleton = {
    id: "rig-handless",
    bones: armRig("down").bones.filter((b: IAutoMovieBone): boolean => b.bone !== "rightHand"),
  };
  TestValidator.equals(
    "a rig with no hand bone is not a convention fault",
    armChainFault(handless, "right"),
    null,
  );
  TestValidator.equals(
    "though reachPose still has no chain to solve",
    reachPose(handless, "right", target),
    null,
  );

  // 7. BOUNDARY: the inputs the test itself needs to be well posed. A forearm of
  // zero length has no direction to be parallel TO, and an axis table that
  // names no hinge for the elbow states no convention to check against, so
  // neither is a convention fault. The diagnosis answers only the question it
  // can actually decide.
  const collapsed: IAutoMovieSkeleton = {
    id: "rig-collapsed",
    bones: armRig("down").bones.map((b: IAutoMovieBone): IAutoMovieBone =>
      b.bone === "rightHand"
        ? { ...b, rest: { ...b.rest, translation: { x: 0, y: 0, z: 0 } } }
        : b,
    ),
  };
  TestValidator.equals(
    "a zero-length forearm is not a convention fault",
    armChainFault(collapsed, "right"),
    null,
  );
  TestValidator.equals(
    "an axis table naming no elbow hinge states no convention to break",
    armChainFault(down, "right", {}),
    null,
  );
  TestValidator.equals(
    "and a zero-length hinge axis names no direction either",
    armChainFault(down, "right", {
      rightLowerArm: {
        flexion: { x: 0, y: 0, z: 0 },
        abduction: { x: 0, y: 0, z: 1 },
        twist: { x: 1, y: 0, z: 0 },
      },
    }),
    null,
  );

  // 8. BOUNDARY: a hand that does not hang from the lower arm breaks the chain
  // both functions read, so neither may treat its offset as the forearm.
  const misparented: (rig: IAutoMovieSkeleton) => IAutoMovieSkeleton = (rig: IAutoMovieSkeleton): IAutoMovieSkeleton => ({
    ...rig,
    bones: rig.bones.map((b: IAutoMovieBone): IAutoMovieBone =>
      b.bone === "rightHand" ? { ...b, parent: "rightUpperArm" } : b,
    ),
  });
  TestValidator.equals(
    "a hand outside the elbow's frame is not an elbow fault",
    armChainFault(misparented(down), "right"),
    null,
  );
  TestValidator.equals(
    "and reachPose refuses offsets that are not one chain",
    reachPose(misparented(out), "right", { x: -0.35, y: 1.1, z: 0.3 }),
    null,
  );
  const large: IAutoMovieSkeleton = {
    ...out,
    bones: out.bones.map((entry: IAutoMovieBone): IAutoMovieBone =>
      entry.bone === "rightHand"
        ? { ...entry, rest: { ...entry.rest, translation: { x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: 0 } } }
        : entry,
    ),
  };
  TestValidator.equals(
    "finite forearm direction survives an unrepresentable Euclidean length",
    armChainFault(large, "right"),
    null,
  );
}
