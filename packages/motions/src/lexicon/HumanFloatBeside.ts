import {
  AutoMovieHumanoidSurfaceRays,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFloatBeside,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanWater } from "../perform/HumanWater";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanShapeBlend } from "../posture/prepareHumanShapeBlend";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AquaticPosture } from "../sport/AquaticPosture";
import { HumanFloatBesideForm } from "./HumanFloatBesideForm";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRideHands } from "./HumanRideHands";

/**
 * Place the floating body beside the horse's moving held part and verify the
 * displayed hand on it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the refusals, the trim, the placement, the kick and the grip check.
 * @evidence contracts/development/implementation.md#principled-implementation The float shape is measured once at a fixed root: its trim, its mouth and its near shoulder; each second places that shoulder from the held part's actual frame and fits the near arm to it; the displayed palm's skin, found on the body's own surface under its palm socket, must then lie on the part's skin.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the timing, the side and the part; measure the shape; then each second places, kicks, slides and holds.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A side named blocked, a part higher than the arm reaches from the surface and a displayed hand off the part are refused, never moved.
 * @evidence contracts/development/implementation.md#efficient-algorithms The trim, mouth and shoulder are read once; each sample reads one horse frame, one grip and one selected-bone FK for the check.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work `AquaticPosture`, `ExerciseKey`, `HumanWater.float`, `HumanRideHands` and `HumanMountRider.hold` supply the shape, trim, grip and arm.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the measured offsets, the joint blend and the grip closure for this action; sampled frames and postures stay local.
 */
function planHumanFloatBeside(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFloatBeside>,
): IAutoMovieMotionHumanActionPlan {
  const {
    on,
    side,
    hold = "mane",
    water,
    blocked = [],
    duration: seconds,
    transition,
  } = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  if (!(transition > 0 && transition < seconds))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "transition",
      value: transition,
      feasible: null,
      reason: "a float needs a positive slide-off shorter than the action",
      fix: "Give a transition shorter than the total seconds.",
    });
  if (blocked.includes(side))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "side",
      value: side,
      feasible: null,
      reason: `the horse's ${side} side is blocked, and sliding off downstream puts the rider under the horse`,
      fix: "Clear the upstream side, or keep the rider seated through the swim.",
    });
  const support: IAutoMovieMotionHumanPropReader = context.prop(on);
  const part: IAutoMovieAffordance | undefined = support.prop.affordances?.find(
    (contact: IAutoMovieAffordance): boolean => contact.id === hold,
  );
  if (part === undefined || !(part.aperture! > 0))
    throw new HumanRefusal({
      kind: "affordance",
      axis: "hold",
      value: hold,
      feasible: null,
      reason: `${on}.${hold} does not describe a part with an actual aperture to hold`,
      fix: "Name the horse's actual mane or saddle grip.",
    });

  // The hand nearer the horse holds; the horse's left is +X in its frame as in the body's.
  const near: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const sign: number = side === "left" ? 1 : -1;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const first: IAutoMovieRigidTransform = support.frame(context.start);
  const { gripsAt, closures }: HumanRideHands.IHands = HumanRideHands(
    {
      ...context,
      params: { on, duration: seconds, hands: { [near]: hold } },
    },
    on,
    support,
    entry,
    first,
    transition,
  );

  // The float shape at a fixed root, its legs at a share of their flutter.
  const shape = (swing: number): IAutoMovieMotionHumanPosture => ({
    ...AquaticPosture.key(
      entry,
      ExerciseKey.from(
        body,
        { pitch: HumanFloatBesideForm.PITCH, neck: HumanFloatBesideForm.NECK },
        { shoulder: 40, raise: 20, elbow: 30 },
        {
          hip:
            HumanFloatBesideForm.HIP[0] + HumanFloatBesideForm.HIP[1] * swing,
          knee:
            HumanFloatBesideForm.KNEE[0] + HumanFloatBesideForm.KNEE[1] * swing,
        },
        {
          hip:
            HumanFloatBesideForm.HIP[0] - HumanFloatBesideForm.HIP[1] * swing,
          knee:
            HumanFloatBesideForm.KNEE[0] - HumanFloatBesideForm.KNEE[1] * swing,
        },
      ),
      HumanFloatBesideForm.ORIGIN,
    ),
    yaw: 0,
  });
  const still: IAutoMovieMotionHumanPosture = shape(0);
  const arm: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    AquaticPosture.markers(body, [
      `${near}UpperArm`,
      `${near}LowerArm`,
      `${near}Hand`,
    ])(still);
  const shoulder: IAutoMovieVector3 = arm.get(`${near}UpperArm`)!.worldPosition;
  const length: number =
    Vector3.distance(shoulder, arm.get(`${near}LowerArm`)!.worldPosition) +
    Vector3.distance(
      arm.get(`${near}LowerArm`)!.worldPosition,
      arm.get(`${near}Hand`)!.worldPosition,
    ) +
    Vector3.length(HumanHand.offset(body, near, "palm").point);
  const trim: number | null = HumanWater.float(
    body,
    poseBones(body, resolveHumanPosture(body, still)),
    { surface: water },
  );
  const height: number = Math.max(
    trim ?? -Infinity,
    water +
      HumanFloatBesideForm.CLEAR -
      HumanTrunk.region(body, still, "mouth").point.y,
  );
  const reach: number = HumanFloatBesideForm.REACH_SHARE * length;
  const rise: number =
    gripsAt(context.start, first)[near]!.point.y - (height + shoulder.y);
  if (!(Math.abs(rise) < reach))
    throw new HumanRefusal({
      kind: "reach",
      axis: "hold",
      value: rise,
      feasible: {
        kind: "range",
        minimum: -reach,
        maximum: reach,
        unit: "m",
      },
      reason: `${on}.${hold} is ${rise.toFixed(2)} m above the floating shoulder, beyond the ${reach.toFixed(2)} m the arm keeps`,
      fix: "Hold a part nearer the water, such as the saddle.",
    });
  const out: number = Math.sqrt(reach * reach - rise * rise);
  const beside: IAutoMovieVector3 = {
    x: sign * out * Math.cos((HumanFloatBesideForm.TRAIL * Math.PI) / 180),
    y: 0,
    z: -out * Math.sin((HumanFloatBesideForm.TRAIL * Math.PI) / 180),
  };
  const slide: ReturnType<typeof prepareHumanShapeBlend> =
    prepareHumanShapeBlend(entry.joints, still.joints);
  // The palm's skin under its socket, found once on the body's own surface at rest, in the socket bone's frame.
  const socket: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.sockets[near === "left" ? "palmLeft" : "palmRight"];
  const rays: ReturnType<typeof AutoMovieHumanoidSurfaceRays.tools> =
    AutoMovieHumanoidSurfaceRays.tools(body.skeleton, body.profile);
  const rest: IAutoMovieResolvedBone = rays.at(socket.bone);
  const palm: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(rest.worldRotation),
    Vector3.subtract(
      rays.exit(
        socket.bone,
        Vector3.add(
          rest.worldPosition,
          Quaternion.rotateVector(rest.worldRotation, socket.point),
        ),
        Quaternion.rotateVector(rest.worldRotation, socket.normal),
      ),
      rest.worldPosition,
    ),
  );
  const run: number = (part.length ?? 0) / 2;
  // The palm socket's own offset from the wrist (`HumanHand.offset`): its depth along the palm's normal, which the hold keeps the wrist off the part's skin, and its reach along the fingers.
  const socketed: ReturnType<typeof HumanHand.offset> = HumanHand.offset(
    body,
    near,
    "palm",
  );
  const depth: number = Vector3.dot(socketed.point, socketed.normal);
  const ahead: number = Vector3.dot(socketed.point, socketed.forward);
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([socket.bone]);

  /**
   * The float placed beside the held part at a film second, its legs at a share
   * of their flutter.
   */
  const float = (
    frame: IAutoMovieRigidTransform,
    grip: IAutoMovieVector3,
    swing: number,
  ): IAutoMovieMotionHumanPosture => {
    const yaw: number = heading(frame.rotation);
    const at: IAutoMovieVector3 = HumanFrame.point(
      { origin: grip, yaw },
      beside,
    );
    const offset: IAutoMovieVector3 = HumanFrame.point(
      { origin: HumanFloatBesideForm.ORIGIN, yaw },
      shoulder,
    );
    return {
      ...shape(swing),
      yaw,
      root: { x: at.x - offset.x, y: height, z: at.z - offset.z },
    };
  };
  const sliding: number = transition / seconds;
  // The law's goal: the near hand on the held part where the horse has it
  // at every second.
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration: seconds,
    hands: [near],
    events: [
      { name: "slideOff", share: 0 },
      { name: "afloat", share: sliding },
    ],
    contacts: [
      {
        part: `${near}Hand`,
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: on },
      },
    ],
    posture(
      at,
      _channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture {
      const time: number = Math.max(0, Math.min(seconds, at));
      const film: number = context.start + time;
      const frame: IAutoMovieRigidTransform = support.frame(film);
      const grip: HumanRideHands.IMaterialGrip = gripsAt(film, frame)[near]!;
      let torso: IAutoMovieMotionHumanPosture;
      if (time < transition) {
        // The seated entry is carried with the horse while it blends into the float, lifted over the saddle's side.
        const u: number = minimumJerk.share(time / transition);
        const to: IAutoMovieMotionHumanPosture = float(frame, grip.point, 0);
        const from: IAutoMovieMotionHumanPosture = AquaticPosture.translate(
          entry,
          Vector3.add(
            entry.root,
            Vector3.subtract(frame.position, first.position),
          ),
        );
        torso = {
          ...to,
          root: Vector3.add(Vector3.lerp(from.root, to.root, u), {
            x: 0,
            y: 4 * HumanFloatBesideForm.ARC * u * (1 - u),
            z: 0,
          }),
          yaw: from.yaw + (to.yaw - from.yaw) * u,
          pitch: from.pitch + (to.pitch - from.pitch) * u,
          roll: from.roll + (to.roll - from.roll) * u,
          joints: slide(u),
          rotation:
            from.rotation === undefined
              ? undefined
              : {
                  about: Vector3.lerp(from.rotation.about, to.root, u),
                  turn: Quaternion.slerp(
                    from.rotation.turn,
                    Quaternion.identity(),
                    u,
                  ),
                },
        };
      } else {
        // The flutter grows from rest over its first cycle, so the kick starts without a jump in speed.
        const kicking: number = time - transition;
        torso = float(
          frame,
          grip.point,
          minimumJerk.share(Math.min(1, kicking / HumanFloatBesideForm.KICK)) *
            Math.sin((2 * Math.PI * kicking) / HumanFloatBesideForm.KICK),
        );
      }
      // The hold seats its palm station (`CENTRE` hand lengths along the fingers) on the part; the grip it is given is moved round the part so this hand's own palm socket lands there instead.
      const across: IAutoMovieVector3 | undefined =
        grip.axis === undefined
          ? undefined
          : Vector3.cross(grip.axis, grip.normal);
      // The fingers keep the side the hold was taken on (`sideRideGrips`, chosen once where it begins): a side re-taken against the floating torso's heading at every second would turn the hand over on the part.
      const turn: NonNullable<HumanRideHands.IMaterialGrip["across"]> =
        grip.across ??
        (across !== undefined &&
        Vector3.dot(across, HumanFrame.forward(torso.yaw)) < 0
          ? -1
          : 1);
      const seated: HumanRideHands.IMaterialGrip =
        across === undefined || Vector3.length(across) < 1e-6
          ? { ...grip, palmDepth: depth }
          : {
              ...grip,
              palmDepth: depth,
              across: turn,
              point: Vector3.addScaled(
                grip.point,
                Vector3.scale(Vector3.normalize(across), turn),
                HumanMountRider.CENTRE * body.measure.hand - ahead,
              ),
            };
      const hand: ReturnType<typeof HumanMountRider.hold> =
        HumanMountRider.hold(
          body,
          near,
          torso,
          seated,
          1,
          closures[near] ?? {},
          resolution,
          projection,
        );
      const shown: IAutoMovieMotionHumanPosture = {
        ...torso,
        limbs: { ...torso.limbs, [`${near}Arm`]: hand.arm },
        joints: { ...torso.joints, ...hand.fingers },
      };
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const pose: ReturnType<typeof resolveHumanPosture.seeded> =
        resolveHumanPosture.seeded(
          body,
          shown,
          undefined,
          undefined,
          read,
          prepareHumanPoseResolution.isNativeSource(resolution)
            ? requested
            : undefined,
          projection,
        );
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, pose.pose, read(), requested);
      // The displayed palm's skin, carried by its bone, must lie on the held part's skin about its run.
      const bone: IAutoMovieResolvedBone = bones.get(socket.bone)!;
      const skin: IAutoMovieVector3 = Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, palm),
      );
      const axis: IAutoMovieVector3 =
        grip.axis ??
        Quaternion.rotateVector(
          Quaternion.multiply(frame.rotation, part.frame.rotation),
          { x: 1, y: 0, z: 0 },
        );
      const along: number = Math.max(
        -run,
        Math.min(run, Vector3.dot(Vector3.subtract(skin, grip.point), axis)),
      );
      const miss: number = Math.abs(
        Vector3.distance(skin, Vector3.addScaled(grip.point, axis, along)) -
          part.aperture! / 2,
      );
      if (!(miss <= HumanFloatBesideForm.REACH))
        throw new HumanRefusal({
          kind: "affordance",
          axis: "holdReach",
          value: miss,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: HumanFloatBesideForm.REACH,
            unit: "m",
          },
          reason: `the displayed ${near} hand misses ${on}.${hold} by ${miss} m at film second ${film}`,
          fix: "Hold a part the floating arm reaches.",
        });
      return shown;
    },
  };

  // The near arm keeps the mane on one planned course from the seat into
  // the float, so it never changes branch as the horse swims on.
  return courseArmGoal({
    context,
    plan: goals,
    side: near,
    span: {
      start: 0,
      ready: transition,
      relax: seconds,
      end: seconds,
    },
  });
}

/**
 * Slide off a swimming horse to its upstream side and float beside it, one hand
 * on its mane.
 *
 * A rider crossing water too deep for the horse to wade slides off on the
 * upstream side, keeps hold of the mane and floats prone beside the horse,
 * kicking, while it swims; the current then presses the rider against the horse
 * rather than under it. The float's height is the water's own trim of the posed
 * shape (`HumanWater.float`, the immersed swim's buoyancy), raised until the
 * mouth clears the surface by `CLEAR` where buoyancy alone leaves it under: the
 * held mane carries the rest. The near shoulder keeps `REACH_SHARE` of the
 * arm's length from the held part, `TRAIL` degrees behind its lateral line, so
 * the body follows the horse's actual moving mane; the slide-off blends the
 * seated entry, carried with the horse, into that float over `transition`, its
 * path lifted by `ARC` over the saddle's side.
 *
 * The author gives the total `seconds` and the `transition` into the float; a
 * flutter kick cycle is provisional (missing a measured swimmer's kick rate).
 */
export const HumanFloatBeside: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanFloatBeside> =
  {
    name: "floatBeside",
    interrupts: {},
    plan: planHumanFloatBeside,
  };

/** A frame's heading about +Y, degrees, 0 facing +Z. */
function heading(rotation: IAutoMovieQuaternion): number {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
}
