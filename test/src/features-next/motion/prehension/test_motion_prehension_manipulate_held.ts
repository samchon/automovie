import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Transform,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
  resolvePose,
  rotationBetween,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieJointPose,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { qclose } from "../../../features/internal/qclose";

const { HumanManipulate } = AutoMovieMotionHumanOperate;

/** The per-press contact bound in the specification (#3446), metres. */
const CONTACT: number = 0.002;

/** The rigid grip translation bound in the specification (#3447), metres. */
const SLIP: number = 0.001;

/** Authored press times 0.30 s apart, the measured inward mean (Trudeau et al. 2012). */
const TIMES: readonly [number, number] = [0.4, 0.7];

/** The four fingers holding the pad. */
const HOLDERS: readonly AutoMovieHumanoidBone[] = [
  "rightIndexProximal",
  "rightMiddleProximal",
  "rightRingProximal",
  "rightLittleProximal",
];

/**
 * Thumb taps on a pad the same hand holds as the carrier moves.
 *
 * The pad is already in the hand at the start of the shot. Two reachable
 * sites come from direct forward kinematics of distinct, authored flexion
 * poses within the thumb's range. Each site's surface faces the thumb at its
 * authored contact pose. The independent oracle transforms the fixed sites by
 * the displayed prop frame at each authored press time.
 *
 * Scenarios:
 *
 * 1. The overlay takes the right thumb alone, at both authored instants.
 * 2. The thumb reaches each site within 2 mm after the moving carrier has
 *    displaced it. Four fingers retain their authored grip throughout.
 * 3. The prop's local translation and rotation in the hand stay constant
 *    through the approach, presses and release.
 * 4. The overlay refuses the same named pad without a hold, and refuses a key that has its own mechanical articulation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the held pad fixture, the forward-kinematics oracle and the four scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the public thumbText row over a moving carrier and observes displayed joints, thumb tip and prop frame at planned times.
 * @evidence contracts/development/testing.md#independent-expectations Direct rig forward kinematics generates the fixed two-site fixture. Authored times, rigid transform composition, unchanged carrier joints, and the issue's contact and grip bounds provide the expected readings.
 * @evidence contracts/development/testing.md#distinguishing-cases Two distinct contacts after carrier displacement with intervening and releasing samples distinguish rigid following from a world-fixed finger target or a whole-hand motion. The same pad without its hold, and a mechanically articulated site, are refused.
 * @evidence contracts/development/testing.md#execution-ownership One polygon man and one performance with no arm IK targets, viewers, clocks or host dependencies.
 */
export function test_motion_prehension_manipulate_held(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const fingerAngles: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const bone of HOLDERS) fingerAngles[bone] = [45, 0, 0];
  /** The carrier moves its root while keeping the same authored grip. */
  const carrying = (seconds: number): IAutoMovieMotionHumanPosture => ({
    root: { x: seconds, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    limbs: {},
    joints: fingerAngles,
  });

  /** Use the carrier's clinical joint defaults before measuring the two explicitly flexed thumb poses by forward kinematics. */
  const forward = (flexion: number): IAutoMovieResolvedBone[] =>
    resolvePose(
      resolveHumanPosture(body, {
        ...carrying(0),
        joints: {
          ...fingerAngles,
          rightThumbProximal: [20, 0, 0],
          rightThumbDistal: [flexion, 0, 0],
        },
      }),
      body.skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
    );
  const first: IAutoMovieResolvedBone[] = forward(15);
  const second: IAutoMovieResolvedBone[] = forward(35);
  const hand: IAutoMovieResolvedBone = first.find(
    (bone: IAutoMovieResolvedBone): boolean => bone.bone === "rightHand",
  )!;
  const surface: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions.thumbTipRight;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.worldRotation);
  const sites: IAutoMovieTransform[] = [first, second].map(
    (bones: IAutoMovieResolvedBone[]): IAutoMovieTransform => {
      const distal: IAutoMovieResolvedBone = bones.find(
        (bone: IAutoMovieResolvedBone): boolean => bone.bone === surface.bone,
      )!;
      const tip: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
        resolveAutoMovieHumanoidSurfaces.place(surface, distal);
      return {
        ...Transform.identity(),
        translation: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(tip.point, hand.worldPosition),
        ),
        rotation: rotationBetween(
          { x: 0, y: 1, z: 0 },
          Quaternion.rotateVector(inverse, Vector3.scale(tip.normal, -1)),
        ),
      };
    },
  );
  const prop: IAutoMovieMotionHumanProp = {
    subject: "pad",
    frame: { position: hand.worldPosition, rotation: hand.worldRotation },
    points: {},
    affordances: sites.map(
      (
        frame: IAutoMovieTransform,
        index: number,
      ): NonNullable<IAutoMovieMotionHumanProp["affordances"]>[number] => ({
        id: `key${index + 1}`,
        kind: "button",
        frame,
        extent: null,
      }),
    ),
  };
  const carried: IAutoMovieMotionHumanActionLaw<never> = {
    name: "carryPad",
    interrupts: {},
    yields: ["rightThumb"],
    plan: (): IAutoMovieMotionHumanActionPlan => ({
      duration: 2,
      contacts: [],
      events: [],
      holds: [{ side: "right", prop: "pad", from: 0, fingers: fingerAngles }],
      posture: carrying,
    }),
  };
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "held-pad",
    laws: [carried, HumanManipulate.thumbText],
    props: [prop],
    performers: [
      {
        subject: "a",
        body,
        at: origin,
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .registered("carryPad")
      .over(
        (overlay: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
          overlay.registered("thumbText", {
            prop: "pad",
            contacts: TIMES.map(
              (at: number, index: number): { site: string; at: number } => ({
                site: `key${index + 1}`,
                at,
              }),
            ),
          }),
      ).node,
  });
  const overlay: IAutoMovieMotionHumanSegment.IOverlay =
    performance.overlays("a")[0]!;
  TestValidator.equals("only the holding thumb", overlay.channels, [
    "rightThumb",
  ]);

  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const samples: number[] = [
    0,
    TIMES[0],
    (TIMES[0] + TIMES[1]) / 2,
    TIMES[1],
    overlay.plan.duration,
  ];
  for (const t of samples) {
    const seconds: number = overlay.start + t;
    const pose: IAutoMoviePose = performance.pose("a", seconds);
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, pose);
    const world: IAutoMovieRigidTransform = performance.prop("pad", seconds);
    const wrist: IAutoMovieResolvedBone = bones.get("rightHand")!;
    const offset: IAutoMovieVector3 = Vector3.subtract(
      world.position,
      wrist.worldPosition,
    );
    const relative: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(wrist.worldRotation),
      world.rotation,
    );
    TestValidator.predicate(
      `the pad stays rigid in the wrist frame at ${t}`,
      nclose(Vector3.length(offset), 0, SLIP) && qclose(relative, identity),
    );

    TestValidator.predicate(
      `all four fingers keep their grip at ${t}`,
      HOLDERS.every((bone: AutoMovieHumanoidBone): boolean =>
        nclose(
          pose.joints.find(
            (joint: IAutoMovieJointPose): boolean => joint.bone === bone,
          )?.flexion ?? NaN,
          45,
        ),
      ),
    );

    const pressed: number = TIMES.indexOf(t);
    if (pressed < 0) continue;
    const event: IAutoMovieMotionEvent = overlay.plan.events[pressed]!;
    TestValidator.predicate(
      `key ${pressed + 1} has the authored time`,
      event.name === `press${pressed + 1}` &&
        nclose(event.share * overlay.plan.duration, t),
    );
    const measured: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      surface,
      bones.get(surface.bone)!,
    ).point;
    const target: IAutoMovieVector3 = Vector3.add(
      world.position,
      Quaternion.rotateVector(world.rotation, sites[pressed]!.translation),
    );
    TestValidator.predicate(
      `key ${pressed + 1} travels with the prop and is pressed within 2 mm`,
      nclose(Vector3.length(Vector3.subtract(measured, target)), 0, CONTACT) &&
        nclose(world.position.x - prop.frame.position.x, t, SLIP),
    );
  }

  let refusal: unknown;
  try {
    HumanManipulate.thumbText.plan({
      ...overlay.context,
      params: { prop: "pad", contacts: [{ site: "key1", at: TIMES[0] }] },
      entry: { ...overlay.context.entry, holds: {} },
    });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "same prop without the hold is refused",
    refusal instanceof HumanRefusal &&
      refusal.kind === "affordance" &&
      refusal.axis === "prop",
  );

  const articulated: IAutoMovieMotionHumanProp = {
    ...prop,
    articulate: (): IAutoMovieMotionHumanProp.IPosed => ({
      affordances: prop.affordances!,
    }),
  };
  refusal = undefined;
  try {
    HumanManipulate.thumbText.plan({
      ...overlay.context,
      params: { prop: "pad", contacts: [{ site: "key1", at: TIMES[0] }] },
      prop: (): ReturnType<typeof overlay.context.prop> => ({
        ...overlay.context.prop("pad"),
        prop: articulated,
      }),
    });
  } catch (error: unknown) {
    refusal = error;
  }
  TestValidator.predicate(
    "a key with its own articulation is refused",
    refusal instanceof HumanRefusal &&
      refusal.kind === "affordance" &&
      refusal.axis === "contacts.site",
  );
}
