import { AutoMovieGravity, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEdgeRescue,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lieDown } from "../../floor/internal/lieDown";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { stuntFallPose } from "../../reaction/internal/stuntFallPose";
import { edgeRescueScene } from "./edgeRescueScene";

/**
 * Seconds the faller takes to settle from its entry into the hang
 * (provisional).
 */
const SETTLE: number = 0.3;

/**
 * How far out from the lip the hanging body's hands sit, metres: the wall's
 * face clear of the knuckles (provisional).
 */
const CLEAR: number = 0.05;

/**
 * How far up past the lip the hips clear it as the faller comes over, metres
 * (provisional).
 */
const OVER: number = 0.15;

/** Seconds a missed faller takes to collapse on the ground (provisional). */
const COLLAPSE: number = 0.5;

/**
 * The hang: arms up on the lip, the body hanging straight (provisional angles,
 * degrees).
 */
const HANG: IAutoMovieMotionHumanLieDown.IPose = {
  pitch: 0,
  roll: 0,
  joints: {
    leftUpperLeg: [5, 5, 0],
    rightUpperLeg: [5, 5, 0],
    leftLowerLeg: [10, 0, 0],
    rightLowerLeg: [10, 0, 0],
    leftUpperArm: [165, 10, 0],
    rightUpperArm: [165, 10, 0],
    leftLowerArm: [10, 0, 0],
    rightLowerArm: [10, 0, 0],
  },
};

/**
 * The faller's part in an edge rescue, closed form over the shared scene:
 * hanging by both hands from the lip, facing the wall; at release falling
 * freely, the right hand drawn out to the grip as the body drops to it; once
 * caught, hanging by the right hand from the grip as the rescuer hauls it; then
 * coming over the lip, the hips lifted `OVER` above it, into a kneel on the top
 * facing the rescuer. A missed catch falls on to the ground and collapses
 * supine.
 *
 * @param context The faller's context.
 * @param p The parameters.
 * @param scene The shared scene.
 * @returns The faller's plan.
 */
export function edgeRescueFaller(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanEdgeRescue.IParams>,
  p: IAutoMovieMotionHumanEdgeRescue.IParams,
  scene: edgeRescueScene.IScene,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const g: number = AutoMovieGravity.STANDARD;
  // Facing the wall, against the way out.
  const yaw: number = (Math.atan2(-scene.out.x, -scene.out.z) * 180) / Math.PI;
  const hang: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw,
    pitch: HANG.pitch,
    roll: HANG.roll,
    joints: HANG.joints,
    limbs: {},
  };
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture.seeded(body, hang).pose,
  );
  const rightHand: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
  const hands: IAutoMovieVector3 = Vector3.lerp(
    bones.get("leftHand")!.worldPosition,
    rightHand,
    0.5,
  );
  const toes: number = Math.min(
    bones.get("leftToes")!.worldPosition.y,
    bones.get("rightToes")!.worldPosition.y,
  );
  const clear: IAutoMovieVector3 = Vector3.scale(scene.out, CLEAR);
  const hung: IAutoMovieVector3 = Vector3.add(
    Vector3.subtract(scene.lip, hands),
    clear,
  );
  const byRight: (grip: IAutoMovieVector3) => IAutoMovieVector3 = (
    grip: IAutoMovieVector3,
  ): IAutoMovieVector3 => Vector3.add(Vector3.subtract(grip, rightHand), clear);
  const kneelPose: IAutoMovieMotionHumanPosture = {
    root: Vector3.add({ ...scene.lip }, Vector3.scale(scene.out, -0.6)),
    yaw,
    pitch: lieDown.POSES.kneel.pitch,
    roll: lieDown.POSES.kneel.roll,
    joints: lieDown.POSES.kneel.joints,
    limbs: {},
  };
  const kneelRoot: IAutoMovieVector3 = { ...kneelPose.root, y: scene.lip.y };
  const entry: IAutoMovieMotionHumanPosture = {
    ...context.entry.posture,
    limbs: {},
  };
  const fallTo: number = scene.lip.y - scene.grip.y;
  const ground: number = 0;
  const missFall: number = Math.sqrt(
    (2 * Math.max(0, hung.y + toes - ground)) / g,
  );
  const duration: number = scene.holds
    ? scene.end
    : scene.release + missFall + COLLAPSE;
  const supine: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw,
    pitch: lieDown.POSES.supine.pitch,
    roll: lieDown.POSES.supine.roll,
    joints: lieDown.POSES.supine.joints,
    limbs: {},
  };
  const at: (root: IAutoMovieVector3) => IAutoMovieMotionHumanPosture = (
    root: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture => ({ ...hang, root });

  // The landed body's hips offset from its root, the hang's own.
  const landedHips: IAutoMovieVector3 = stuntFallPose.offset(
    body,
    at({ x: 0, y: 0, z: 0 }),
  );
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t <= scene.release)
      return t >= SETTLE
        ? at(hung)
        : stuntFallPose.blend(entry, at(hung), AutoMovieEngineMotionSampling.minimumJerkShare(t / SETTLE));
    const s: number = t - scene.release;
    if (!scene.holds) {
      if (s <= missFall) return at({ ...hung, y: hung.y - 0.5 * g * s * s });
      const landed: IAutoMovieMotionHumanPosture = at({
        ...hung,
        y: hung.y - (hung.y + toes - ground),
      });
      const lying: IAutoMovieMotionHumanPosture = stuntFallPose.at(
        supine,
        { ...landed.root, y: ground + 0.12 },
        { x: 0, y: 0, z: 0 },
      );
      // The collapse rests its own lowest collider on the floor at every
      // instant, so no part passes under it on the way down.
      return stuntFallPose.rest(
        body,
        stuntFallPose.blend(
          landed,
          lying,
          AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, (s - missFall) / COLLAPSE)),
        ),
        {
          x:
            landed.root.x +
            landedHips.x,
          y: ground,
          z: landed.root.z + landedHips.z,
        },
      );
    }
    if (t <= scene.caught) {
      // Falling to the grip, the body drawn out to it as it drops.
      const u: number = Math.min(1, s / (scene.caught - scene.release));
      const target: IAutoMovieVector3 = byRight(scene.grip);
      return at({
        x: hung.x + (target.x - hung.x) * AutoMovieEngineMotionSampling.minimumJerkShare(u),
        y: hung.y - Math.min(fallTo, 0.5 * g * s * s),
        z: hung.z + (target.z - hung.z) * AutoMovieEngineMotionSampling.minimumJerkShare(u),
      });
    }
    if (t <= scene.kneel) return at(byRight(scene.gripAt(t)));
    // Over the lip: up to the waypoint, then down into the kneel.
    const u: number = (t - scene.kneel) / (scene.end - scene.kneel);
    const from: IAutoMovieMotionHumanPosture = at(
      byRight(scene.gripAt(scene.kneel)),
    );
    const waypoint: IAutoMovieVector3 = {
      ...Vector3.lerp(from.root, kneelRoot, 0.5),
      y: Math.max(from.root.y, scene.lip.y + OVER),
    };
    const root: IAutoMovieVector3 =
      u < 0.5
        ? Vector3.lerp(from.root, waypoint, AutoMovieEngineMotionSampling.minimumJerkShare(u * 2))
        : Vector3.lerp(waypoint, kneelRoot, AutoMovieEngineMotionSampling.minimumJerkShare(u * 2 - 1));
    const shaped: IAutoMovieMotionHumanPosture = stuntFallPose.blend(
      from,
      { ...kneelPose, root: kneelRoot },
      AutoMovieEngineMotionSampling.minimumJerkShare(u),
    );
    return { ...shaped, root };
  };

  const share: (seconds: number) => number = (seconds: number): number =>
    Math.min(1, seconds / duration);
  const lip: IAutoMovieMotionHumanContactWindow["support"] = {
    kind: "prop",
    subject: p.ledge,
  };
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: "leftHand",
      kind: "grip",
      support: lip,
      from: share(SETTLE),
      to: share(scene.release),
    },
    {
      part: "rightHand",
      kind: "grip",
      support: lip,
      from: share(SETTLE),
      to: share(scene.release),
    },
  ];
  if (scene.holds)
    contacts.push(
      {
        part: "rightHand",
        kind: "grip",
        support: { kind: "person", subject: p.partner, bone: "rightHand" },
        from: share(scene.caught),
        to: share(scene.kneel),
      },
      {
        part: "leftLowerLeg",
        kind: "bear",
        support: lip,
        from: share(scene.end - 0.2),
        to: 1,
      },
      {
        part: "rightLowerLeg",
        kind: "bear",
        support: lip,
        from: share(scene.end - 0.2),
        to: 1,
      },
    );
  else
    contacts.push({
      part: "back",
      kind: "lie",
      support: { kind: "ground" },
      from: share(scene.release + missFall + COLLAPSE * 0.8),
      to: 1,
    });
  return {
    duration,
    events: [
      { name: "release", share: share(scene.release) },
      ...(scene.holds
        ? [
            { name: "catch", share: share(scene.caught) },
            { name: "haul", share: share(scene.haul) },
            { name: "over", share: share(scene.kneel) },
          ]
        : [{ name: "ground", share: share(scene.release + missFall) }]),
    ],
    contacts,
    base: { kind: scene.holds ? "kneeling" : "lying" },
    posture,
    yields: [],
  };
}
