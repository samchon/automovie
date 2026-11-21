import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
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

import { HumanTrunk } from "../everyday/HumanTrunk";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanWater } from "../perform/HumanWater";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AquaticPosture } from "../sport/AquaticPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRideHands } from "./HumanRideHands";

/** The trunk's forward pitch while floating, degrees: provisional, the body trailing 20 degrees below the horizontal, near the front crawl's 80 of `AquaticRescue`. */
const PITCH: number = 70;

/** The neck's extension that lifts the face toward the horse's head, degrees: provisional. */
const NECK: number = -30;

/** The mouth's height above the surface, metres: the towed victim's clearance in `AquaticRescue`. */
const CLEAR: number = 0.08;

/** Seconds of one flutter-kick cycle: provisional. */
const KICK: number = 0.8;

/** The hips' mean flexion and its flutter amplitude, degrees: provisional. */
const HIP: readonly [number, number] = [10, 15];

/** The knees' mean flexion and its flutter amplitude, degrees: provisional. */
const KNEE: readonly [number, number] = [25, 15];

/** The share of the near arm's length from shoulder to palm the float keeps between the shoulder and the held part: provisional, a bent but working arm. */
const REACH_SHARE: number = 0.75;

/** Degrees the near shoulder sits behind the held part's lateral line: provisional, the body trailing along the horse. */
const TRAIL: number = 20;

/** Metres the slide-off path rises at its middle, clearing the saddle's side: provisional. */
const ARC: number = 0.15;

/** The displayed wrist's largest admitted miss of its hold, metres: the lead's and the handles' contact tolerance. */
const REACH: number = 0.01;

/** The root of the float shape measured once, before it is placed. */
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * Slide off a swimming horse to its upstream side and float beside it, one hand on its mane.
 *
 * A rider crossing water too deep for the horse to wade slides off on the upstream side, keeps hold of the mane and floats prone beside the horse, kicking, while it swims; the current then presses the rider against the horse rather than under it. The float's height is the water's own trim of the posed shape (`HumanWater.float`, the immersed swim's buoyancy), raised until the mouth clears the surface by `CLEAR` where buoyancy alone leaves it under: the held mane carries the rest. The near shoulder keeps `REACH_SHARE` of the arm's length from the held part, `TRAIL` degrees behind its lateral line, so the body follows the horse's actual moving mane; the slide-off blends the seated entry, carried with the horse, into that float over `transition`, its path lifted by `ARC` over the saddle's side.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the side's reason, the trim, the placement, the slide-off and the provisional constants.
 * @evidence contracts/development/design.md#principled-representation One base action owning the whole body over the horse's moving frame; the near hand's grip is declared over the whole action.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses the aquatic posture keys, the water's trim, the rider's grip resolver and arm hold; no horse course is planned here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The float follows the horse's actual held part each second; a blocked side, an unreachable part and a missed grip are refused.
 */
export const HumanFloatBeside: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanFloatBeside> =
  {
    name: "floatBeside",
    interrupts: {},
    /**
     * Place the floating body beside the horse's moving held part and verify the displayed hand on it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines the refusals, the trim, the placement, the kick and the grip check.
     * @evidence contracts/development/implementation.md#principled-implementation The float shape is measured once at a fixed root: its trim, its mouth and its near shoulder; each second places that shoulder from the held part's actual frame and fits the near arm to it, whose displayed wrist must then reach the hold's goal.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the timing, the side and the part; measure the shape; then each second places, kicks, slides and holds.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A side named blocked, a part higher than the arm reaches from the surface and a displayed hand off the part are refused, never moved.
     * @evidence contracts/development/implementation.md#efficient-algorithms The trim, mouth and shoulder are read once; each sample reads one horse frame, one grip and one selected-bone FK for the check.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work `AquaticPosture`, `ExerciseKey`, `HumanWater.float`, `HumanRideHands` and `HumanMountRider.hold` supply the shape, trim, grip and arm.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the measured offsets, the joint blend and the grip closure for this action; sampled frames and postures stay local.
     */
    plan(
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFloatBeside>,
    ): IAutoMovieMotionHumanActionPlan {
      const {
        on,
        side,
        hold = "mane",
        water,
        blocked = [],
        seconds,
        transition,
      } = context.params;
      const body: IAutoMovieMotionHumanBody = context.body;
      if (
        ![seconds, transition].every(Number.isFinite) ||
        !(transition > 0 && transition < seconds)
      )
        throw new HumanRefusal({
          kind: "parameter",
          axis: "transition",
          value: transition,
          feasible: null,
          reason: "a float needs a positive slide-off shorter than the action",
          fix: "Give a transition shorter than the total seconds.",
        });
      if (!Number.isFinite(water?.surface))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "water.surface",
          value: water?.surface ?? null,
          feasible: null,
          reason: "the surface must give a finite world height",
          fix: "Set water.surface in metres.",
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
      const part: IAutoMovieAffordance | undefined =
        support.prop.affordances?.find(
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
      const { gripsAt, closures }: HumanRideHands.IHands = HumanRideHands.of(
        { ...context, params: { on, seconds, hands: { [near]: hold } } },
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
            { pitch: PITCH, neck: NECK },
            { shoulder: 40, raise: 20, elbow: 30 },
            { hip: HIP[0] + HIP[1] * swing, knee: KNEE[0] + KNEE[1] * swing },
            { hip: HIP[0] - HIP[1] * swing, knee: KNEE[0] - KNEE[1] * swing },
          ),
          ORIGIN,
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
      const shoulder: IAutoMovieVector3 = arm.get(
        `${near}UpperArm`,
      )!.worldPosition;
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
        water,
      );
      const height: number = Math.max(
        trim ?? -Infinity,
        water.surface + CLEAR - HumanTrunk.region(body, still, "mouth").point.y,
      );
      const reach: number = REACH_SHARE * length;
      const rise: number =
        gripsAt(context.start, first)[near]!.point.y - (height + shoulder.y);
      if (!(Math.abs(rise) < reach))
        throw new HumanRefusal({
          kind: "reach",
          axis: "hold",
          value: rise,
          feasible: { kind: "range", minimum: -reach, maximum: reach, unit: "m" },
          reason: `${on}.${hold} is ${rise.toFixed(2)} m above the floating shoulder, beyond the ${reach.toFixed(2)} m the arm keeps`,
          fix: "Hold a part nearer the water, such as the saddle.",
        });
      const out: number = Math.sqrt(reach * reach - rise * rise);
      const beside: IAutoMovieVector3 = {
        x: sign * out * Math.cos((TRAIL * Math.PI) / 180),
        y: 0,
        z: -out * Math.sin((TRAIL * Math.PI) / 180),
      };
      const slide: ReturnType<typeof prepareHumanShapeBlend> =
        prepareHumanShapeBlend(entry.joints, still.joints);
      const requested: ReadonlySet<AutoMovieHumanoidBone> =
        new Set<AutoMovieHumanoidBone>([`${near}Hand`]);

      /** The float placed beside the held part at a film second, its legs at a share of their flutter. */
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
          { origin: ORIGIN, yaw },
          shoulder,
        );
        return {
          ...shape(swing),
          yaw,
          root: { x: at.x - offset.x, y: height, z: at.z - offset.z },
        };
      };
      const sliding: number = transition / seconds;
      return {
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
          const grip: HumanRideHands.IMaterialGrip = gripsAt(film, frame)[
            near
          ]!;
          let torso: IAutoMovieMotionHumanPosture;
          if (time < transition) {
            // The seated entry is carried with the horse while it blends into the float, lifted over the saddle's side.
            const u: number = minimumJerk.share(time / transition);
            const to: IAutoMovieMotionHumanPosture = float(
              frame,
              grip.point,
              0,
            );
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
                y: 4 * ARC * u * (1 - u),
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
              minimumJerk.share(Math.min(1, kicking / KICK)) *
                Math.sin((2 * Math.PI * kicking) / KICK),
            );
          }
          const hand: ReturnType<typeof HumanMountRider.hold> =
            HumanMountRider.hold(
              body,
              near,
              torso,
              grip,
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
          // The hold puts the wrist where the palm's measured depth wraps the part (`HumanMountRider.hold`); the displayed wrist must reach that goal.
          const miss: number = Vector3.distance(
            bones.get(`${near}Hand`)!.worldPosition,
            hand.arm.point,
          );
          if (!(miss <= REACH))
            throw new HumanRefusal({
              kind: "affordance",
              axis: "holdReach",
              value: miss,
              feasible: { kind: "range", minimum: 0, maximum: REACH, unit: "m" },
              reason: `the displayed ${near} hand misses ${on}.${hold} by ${miss} m at film second ${film}`,
              fix: "Hold a part the floating arm reaches.",
            });
          return shown;
        },
      };
    },
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
