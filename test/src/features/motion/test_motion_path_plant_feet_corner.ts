import {
  followPathMotion,
  plantStanceFeet,
  resolvePose,
  sampleMotion,
  validateFootSkate,
  validateGroundContact,
} from "@automovie/engine";
import {
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  nclose,
  validationHasNoWarnings,
  validationHasWarnings,
} from "../internal/predicates";

const t: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

// The plant-feet suite's bent-rest leg: hip 0.8 up over an ~0.85 leg, so the
// horizontal reach shell is ~0.29 m; every pin-to-hip distance below stays
// well inside it. Its rest geometry is 41.1 degrees of clinical knee flexion.
const legSkeleton: IAutoMovieSkeleton = {
  id: "leg",
  bones: [
    { bone: "hips", parent: null, rest: t(0, 0.8, 0), constraint: null },
    {
      bone: "leftUpperLeg",
      parent: "hips",
      rest: t(0.1, 0, 0),
      constraint: null,
    },
    {
      bone: "leftLowerLeg",
      parent: "leftUpperLeg",
      rest: t(0, -0.4, 0.15),
      constraint: null,
    },
    {
      bone: "leftFoot",
      parent: "leftLowerLeg",
      rest: t(0, -0.4, -0.15),
      constraint: null,
    },
  ],
};
const KNEE_REST_FLEXION: number = (2 * Math.atan2(0.15, 0.4) * 180) / Math.PI;
const REST_FRAMES: NonNullable<
  Parameters<typeof plantStanceFeet>[0]["restFrames"]
> = {
  leftLowerLeg: {
    flexion: { sign: 1 as const, neutral: KNEE_REST_FLEXION },
  },
};

// Beside the driving thigh, a zero-articulation shin and foot ride along:
// numerically identity (the toe track is untouched), but the planting
// re-solve's leg-strip filters now see non-thigh joints (the shin is stripped
// with the thigh, the foot is carried through) instead of only ever matching
// the first `bone !== upper` test.
const flex: (deg: number) => IAutoMovieJointPose[] = (
  deg: number,
): IAutoMovieJointPose[] => [
  { bone: "leftUpperLeg", flexion: deg, abduction: null, twist: null },
  {
    bone: "leftLowerLeg",
    flexion: KNEE_REST_FLEXION,
    abduction: null,
    twist: null,
  },
  { bone: "leftFoot", flexion: 0, abduction: null, twist: null },
];

const kf: (time: number, deg: number) => IAutoMovieKeyframe = (
  time: number,
  deg: number,
): IAutoMovieKeyframe => ({
  time,
  pose: { skeleton: "leg", root: null, joints: flex(deg) },
  expression: null,
  easing: "linear",
  bezier: null,
});

/**
 * Author a one-second lifting cycle with a 20-degree thigh peak at t=0.5 between flat stops at 0.4 and 0.6. With the authored bent-rest offsets its foot rise is 0.8*(1-cos(20 degrees)), about 0.048 metres. The 24 Hz clock and 0.005 tolerance place {11,12,13}/24 in swing; the looser-tolerance twin below preserves the existing over-reach warning rather than changing the fixture to hide it.
 */
const liftGait: IAutoMovieMotion = {
  id: "lift",
  skeleton: "leg",
  duration: 1,
  loop: true,
  keyframes: [kf(0, 0), kf(0.4, 0), kf(0.5, 20), kf(0.6, 0), kf(1, 0)],
};

const LEG: NonNullable<Parameters<typeof plantStanceFeet>[0]["legs"]>[number] =
  {
    foot: "leftFoot",
    upper: "leftUpperLeg",
    lower: "leftLowerLeg",
  } as const;

// Stance runs land at R1 = [0, 10/24], R2 = [14/24, 1+10/24] (straddling the
// t=1 apex), R3 = [1+14/24, 2]; the declared windows sit safely inside them.
const contacts: Parameters<typeof validateFootSkate>[0]["contacts"] = [
  { bone: "leftFoot", start: 0.05, end: 0.38 },
  { bone: "leftFoot", start: 0.62, end: 1.38 },
  { bone: "leftFoot", start: 1.62, end: 1.95 },
] as const;

const footAt: (motion: IAutoMovieMotion, time: number) => IAutoMovieVector3 = (
  motion: IAutoMovieMotion,
  time: number,
): IAutoMovieVector3 =>
  resolvePose(
    sampleMotion(motion, time).pose,
    legSkeleton,
    undefined,
    REST_FRAMES,
  ).find(
    (b: ReturnType<typeof resolvePose>[number]): boolean =>
      b.bone === "leftFoot",
  )!.worldPosition;

/** Run the same existing corner assertions for one heading window; this helper registers no separate test. */
const plantAndAssert: (turnWindow: number, label: string) => void = (
  turnWindow: number,
  label: string,
): void => {
  const path: ReturnType<typeof followPathMotion> = followPathMotion({
    id: `corner-${label}`,
    gait: liftGait,
    waypoints: [
      { x: 0, y: 0, z: 0 },
      { x: 0.12, y: 0, z: 0 },
      { x: 0.12, y: 0, z: 0.12 },
    ],
    speed: 0.12,
    turnWindow,
  });
  TestValidator.equals(`${label}: two cycles sized`, path.cycles, 2);

  TestValidator.predicate(
    `${label}: raw corner bake skates the foot (warns)`,
    validationHasWarnings(
      `${label} raw corner foot-skate`,
      validateFootSkate({
        motion: path.motion,
        skeleton: legSkeleton,
        contacts,
        restFrames: REST_FRAMES,
      }),
    ),
  );

  const planted: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: legSkeleton,
    motion: path.motion,
    groundY: 0,
    tolerance: 0.005,
    legs: [LEG],
    sampleRate: 24,
    restFrames: REST_FRAMES,
  });

  TestValidator.predicate(
    `${label}: planted corner walk has no foot-skate warning`,
    validationHasNoWarnings(
      `${label}: planted corner walk foot-skate`,
      validateFootSkate({
        motion: planted.motion,
        skeleton: legSkeleton,
        contacts,
        restFrames: REST_FRAMES,
      }),
    ),
  );
  TestValidator.predicate(
    `${label}: planted corner walk has no ground-contact warning`,
    validationHasNoWarnings(
      `${label}: planted corner walk ground-contact`,
      validateGroundContact({
        motion: planted.motion,
        skeleton: legSkeleton,
        footBones: ["leftFoot"],
        groundY: 0,
        tolerance: 1e-3,
        restFrames: REST_FRAMES,
      }),
    ),
  );

  TestValidator.equals(
    `${label}: stance runs before/straddling/after the apex`,
    planted.plants.length,
    3,
  );
  const straddle: ReturnType<typeof plantStanceFeet>["plants"][number] =
    planted.plants[1]!;
  TestValidator.equals(
    `${label}: the middle run straddles the corner at t=1`,
    namedFacts([
      ["straddleStart", (): boolean => straddle.start < 1],
      ["straddleEnd", (): boolean => straddle.start < 1 && straddle.end > 1],
    ]),
    { straddleStart: true, straddleEnd: true },
  );

  for (const run of planted.plants) {
    const pin: IAutoMovieVector3 = footAt(planted.motion, run.start);
    for (const time of [
      run.start,
      (run.start + run.end) / 2,
      1.0,
      run.end,
    ].filter((s: number): boolean => s >= run.start && s <= run.end)) {
      const p: IAutoMovieVector3 = footAt(planted.motion, time);
      TestValidator.equals(
        `${label}: foot XZ pinned through t=${time.toFixed(3)}`,
        namedFacts([
          ["nclosePX", (): boolean => nclose(p.x, pin.x, 1e-4)],
          ["nclosePZ", (): boolean => nclose(p.z, pin.z, 1e-4)],
          ["nclosePY", (): boolean => nclose(p.y, 0, 1e-4)],
        ]),
        { nclosePX: true, nclosePZ: true, nclosePY: true },
      );
    }
  }

  TestValidator.equals(
    `${label}: stride clock survives the corner`,
    namedFacts([
      ["motionGaitCycle", (): boolean => path.motion.gaitCycle !== undefined],
      [
        "motionGaitCycle2",
        (): boolean =>
          path.motion.gaitCycle !== undefined && path.motion.gaitCycle !== null,
      ],
      [
        "ncloseMotionGaitCycle",
        (): boolean =>
          path.motion.gaitCycle !== undefined &&
          path.motion.gaitCycle !== null &&
          nclose(path.motion.gaitCycle.period, 1),
      ],
      [
        "ncloseMotionGaitCycle2",
        (): boolean =>
          path.motion.gaitCycle !== undefined &&
          path.motion.gaitCycle !== null &&
          nclose(path.motion.gaitCycle.phaseAt, 0),
      ],
    ]),
    {
      motionGaitCycle: true,
      motionGaitCycle2: true,
      ncloseMotionGaitCycle: true,
      ncloseMotionGaitCycle2: true,
    },
  );
};

/**
 * Observe sampled stance correction across an L-path corner with both blended and snapped heading. Fixed per-run coordinates supplement shared validator results, and the unchanged loose-tolerance twin records the unreachable-pin limitation rather than promising exact contact for every detected stance.
 *
 * Path arithmetic: 0.12 + 0.12 metres at 0.12 m/s gives two one-second cycles with the apex at t=1, inside the middle stance run [14/24,1+10/24]. The supplied 0.5-metre turn window caps at half of each stretch, so its yaw blend covers arc [0.06,0.18] and time [0.5,1.5]. The sampled coordinate assertions below bound the reachable fixture's correction without asserting a global reach margin.
 *
 * Scenarios (each run for the blend window AND the snap corner, turnWindow 0,
 * the harsher discontinuity):
 *
 * 1. The raw corner bake warns from validateFootSkate in the declared stance
 *    windows (the root drags the foot at 0.12 m/s).
 * 2. PlantStanceFeet over the corner bake passes BOTH validateFootSkate and
 *    validateGroundContact: pinning holds under the rotating pelvis.
 * 3. Exactly three stance runs land (before, straddling, and after the apex), and
 *    the middle run brackets t = 1.0 (the straddle fact).
 * 4. Each run's foot world XZ is numerically constant from run start through the
 *    apex to run end (the anti-skate property, through the turn).
 * 5. The composite's gaitCycle meta ({period: 1, phaseAt: 0}) survives the bake:
 *    the stride clock never resets across the corner (#650/#597).
 * 6. A loose 0.02-metre detection tolerance retains the diagnosed over-reach and foot-skate warning.
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes both corner modes, observes raw warnings and corrected skate/ground results, counts and brackets the three stance runs, and compares resolved foot coordinates to each run's start pin. It also preserves gait-cycle metadata and the warning-producing loose-tolerance twin.
 * @evidence contracts/testing.md#independent-expectations Two 0.12-metre stretches at 0.12 m/s require two one-second cycles with the apex at t=1. Authored lifting keys and detection tolerances determine the three runs; unchanged 1e-4 coordinate tolerances require fixed XZ and zero Y. Shared FK and validators are consumer checks, while literal run/count/coordinate expectations independently constrain agreement; this does not prove continuous-time or biological contact.
 * @evidence contracts/testing.md#distinguishing-cases Preserves blend 0.5 versus snap 0, before/straddling/after-apex runs, run endpoints/interiors/apex, raw versus corrected clips, metadata and the 0.02 versus 0.005 tolerance twin. Missing chains and swing preservation belong to adjacent planting units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns both private helper invocations and the loose-tolerance bake/correction/validator chain. Local rigs, windows and helpers register no additional tests or background work and start no renderer, Human host or native artifact.
 */
export function test_motion_path_plant_feet_corner(): void {
  plantAndAssert(0.5, "blend");
  plantAndAssert(0, "snap");

  // Scenario 6, the diagnosed failure mode, pinned as fact: with a LOOSE
  // stance tolerance (0.02 m) the run starts at 11.67° of flexion, throwing
  // the pin ~0.16 m behind the yaw-rotated hip; the blend then drags the
  // upper joint past the ~0.298 m reach shell, and the pass extends the leg
  // toward the unreachable pin instead of holding it, so the planted clip
  // honestly FAILS foot-skate (the documented unreachable-pin semantics, the
  // exact trap this test's arithmetic avoids above).
  const loose: ReturnType<typeof followPathMotion> = followPathMotion({
    id: "corner-loose",
    gait: liftGait,
    waypoints: [
      { x: 0, y: 0, z: 0 },
      { x: 0.12, y: 0, z: 0 },
      { x: 0.12, y: 0, z: 0.12 },
    ],
    speed: 0.12,
    turnWindow: 0.5,
  });
  const overReached: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: legSkeleton,
    motion: loose.motion,
    groundY: 0,
    tolerance: 0.02,
    legs: [LEG],
    sampleRate: 24,
    restFrames: REST_FRAMES,
  });
  TestValidator.predicate(
    "loose tolerance over-reaches through the corner and skates (warns)",
    validationHasWarnings(
      "loose-tolerance corner foot-skate",
      validateFootSkate({
        motion: overReached.motion,
        skeleton: legSkeleton,
        contacts,
        restFrames: REST_FRAMES,
      }),
    ),
  );
}
