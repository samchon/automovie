import { ANKLE_DORSIFLEXION, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDive,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { GymnasticsFlight } from "../../sport/internal/GymnasticsFlight";
import { diveAnkleMid } from "./diveAnkleMid";
import { diveContacts } from "./diveContacts";
import { diveCrouched } from "./diveCrouched";
import { diveCrouchedOn } from "./diveCrouchedOn";
import { diveFootRoll } from "./diveFootRoll";
import { diveLift } from "./diveLift";
import { floorEntry } from "./floorEntry";

/*
 * A fall onto the floor on purpose from a stance: a goalkeeper's dive to the
 * side, or a sliding tackle forward on the hip.
 *
 * Every second the body is a set of joint angles blended from the entry's
 * toward the kind's (`SHAPES`, provisional), turned about one axis of its own
 * (the dive about its forward axis, so it lands on its side; the slide about
 * its lateral axis, leaning back), and placed with its root on a path:
 *
 * - `dive`: a crouch with the feet planted and the knees bending under the
 *   lowered root (`AutoMovieMotionHumanTrunk.preparePlanted`), then a flight
 *   whose hips move `REACH` statures to the side on a parabola `APEX` statures
 *   above the line from take-off to landing, the body turning a quarter about
 *   its forward axis on the way while its joints extend from the crouch's
 *   solved angles into the shape, then lying on its side where it landed. The
 *   flight is the one airborne part, on that one axis.
 * - `slide`: the body leans back and sinks onto its hip while its hips slide
 *   `REACH` statures forward and slowing to rest, the lead leg reaching ahead
 *   and the trailing one bent under, never off the floor.
 *
 * Landed, the root is placed so the lowest joint centre lies at the ankle's
 * standing height above the floor, as on the feet.
 *
 * Toe-off, in a dive: over the crouch's last `TOE_OFF` seconds each planted
 * foot rolls about its ball, the heel rising, by the angle (solved on the
 * planted take-off, `SECANT`) that brings the take-off's ankle to what a
 * weightless ankle reaches (`ANKLE_DORSIFLEXION.unloaded`), so the feet leave
 * the floor plantarflexed, as the push-off's plantarflexion leaves them, and
 * stay so in the air.
 *
 * Contact windows: the feet plant through the crouch; in a slide they then bear
 * on the floor, sliding with the body, to the end; landed, the seat lies on the
 * floor (the hip) and, in a dive, the lower hand plants beside it.
 *
 * First pass: the take-off is not driven by the legs' push, the landing does
 * not absorb the fall through the arm, and a slide from a run starts from the
 * run's posture at rest, not its speed.
 */
export namespace dive {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionKey = "dive";

  /*
   * A dive's content is a fall to the floor caught on the hands, so its balance
   * is judged (`IAutoMovieMotionHumanActionLaw.physical`).
   */
  export const physical: boolean = true;

  /*
   * Cancel table: a dive or slide is left once it has come to rest.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: { start: "landed", end: 1 }, kind: "inertialize", entry: 0 }],
  };
  /*
   * Each kind's joint angles at full extent, clinical degrees, for a dive to
   * the performer's left; a dive to the right mirrors the arms (provisional).
   */
  export const SHAPES: Readonly<
    Record<
      IAutoMovieMotionHumanDive.Kind,
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >
  > = {
    dive: {
      leftUpperArm: [0, 175, 0],
      rightUpperArm: [10, 160, 0],
      leftLowerArm: [10, 0, 0],
      rightLowerArm: [10, 0, 0],
      leftUpperLeg: [20, 10, 0],
      rightUpperLeg: [10, 0, 0],
      leftLowerLeg: [20, 0, 0],
      rightLowerLeg: [30, 0, 0],
      // The toes the toe-off bent relax in the air.
      leftToes: [0, 0, 0],
      rightToes: [0, 0, 0],
    },
    slide: {
      spine: [-5, 0, 0],
      leftUpperLeg: [60, 0, 0],
      leftLowerLeg: [5, 0, 0],
      rightUpperLeg: [55, 0, 0],
      rightLowerLeg: [60, 0, 0],
      leftUpperArm: [-10, 30, 0],
      rightUpperArm: [-20, 30, 0],
      leftLowerArm: [60, 0, 0],
      rightLowerArm: [70, 0, 0],
    },
  };

  /*
   * How far the hips joint travels, statures: to the side in a dive, ahead in a
   * slide (provisional).
   */
  export const REACH: Readonly<Record<IAutoMovieMotionHumanDive.Kind, number>> =
    {
      dive: 0.8,
      slide: 0.7,
    };

  /*
   * How high the dive's flight rises above its chord, statures (provisional).
   */
  export const APEX: number = 0.12;

  /*
   * The turn about the kind's axis when landed, degrees (provisional): a
   * quarter onto the side in a dive, leaning back in a slide.
   */
  export const TURN: Readonly<Record<IAutoMovieMotionHumanDive.Kind, number>> =
    { dive: 90, slide: -55 };

  /*
   * Seconds of each phase (provisional): the crouch, the flight or the slide,
   * and the rest on the floor.
   */
  export const PHASES: Readonly<
    Record<IAutoMovieMotionHumanDive.Kind, readonly [number, number, number]>
  > = { dive: [0.3, 0.45, 0.6], slide: [0.2, 0.8, 0.5] };

  /*
   * Seconds the feet take to roll onto their balls before they leave the floor:
   * about a sprint's ground contact, the push-off's plantarflexion
   * (provisional).
   */
  export const TOE_OFF: number = 0.1;

  /*
   * The most secant steps the toe-off roll takes toward the unloaded limit: the
   * ankle's response to the roll is nearly linear, so each step leaves a small
   * fraction of the last one's residual.
   */
  export const SECANT: number = 4;

  /*
   * Plan a dive or a slide.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the entry is not on both feet.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDive.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const kind: IAutoMovieMotionHumanDive.Kind = context.params.kind ?? "dive";
    const toLeft: number = (context.params.side ?? "left") === "left" ? 1 : -1;
    const feet: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDive.IParams>["entry"]["feet"] =
      context.entry.feet;
    floorEntry.bothFeet(
      feet.left.planted,
      feet.right.planted,
      `a ${kind} starts from both feet on the floor`,
      "stand before it",
    );
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const stature: number = body.measure.stature;
    const [crouch, travel, rest]: readonly [number, number, number] =
      PHASES[kind];
    const ankles: IAutoMovieVector3 = {
      x: (feet.left.ankle.x + feet.right.ankle.x) / 2,
      y: (feet.left.ankle.y + feet.right.ankle.y) / 2,
      z: (feet.left.ankle.z + feet.right.ankle.z) / 2,
    };
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { x: 0, y: 0, z: 0 },
      yaw: entry.yaw,
    };
    const away: IAutoMovieVector3 = HumanFrame.point(
      frame,
      kind === "dive" ? { x: toLeft, y: 0, z: 0 } : { x: 0, y: 0, z: 1 },
    );

    // The joints a share of the way from `from` to the kind's shape,
    // mirrored for a dive to the right, turned about the kind's axis.
    const targets: [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][] = (
      Object.entries(SHAPES[kind]) as [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ][]
    ).map(
      ([bone, angles]: [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ]): [AutoMovieHumanoidBone, readonly [number, number, number]] => [
        kind === "dive" && toLeft < 0
          ? ((bone.startsWith("left")
              ? bone.replace(/^left/, "right")
              : bone.replace(/^right/, "left")) as AutoMovieHumanoidBone)
          : bone,
        angles,
      ],
    );
    const prepareShape: (
      from: IAutoMovieMotionHumanPosture["joints"],
    ) => ShapeReader = (
      from: IAutoMovieMotionHumanPosture["joints"],
    ): ShapeReader => {
      // The joints the shape leaves alone stay as `from` holds them.
      const blend: (share: number) => IAutoMovieMotionHumanPosture["joints"] =
        prepareHumanShapeBlend(from, {
          ...from,
          ...Object.fromEntries(targets),
        });
      return (share: number, turn: number): IAutoMovieMotionHumanPosture => {
        return {
          ...entry,
          root: { x: 0, y: 0, z: 0 },
          joints: blend(share),
          limbs: {},
          ...(kind === "dive"
            ? { roll: entry.roll - toLeft * turn }
            : { pitch: entry.pitch + turn }),
        };
      };
    };
    // The shape starts from the entry as it is shown: its displayed joints,
    // the stance's bent knees among them, so the crouch's first second places
    // the root where the entry stands it and the legs as the entry bends
    // them, rather than straight legs under a root raised off the stance's.
    const shown: IAutoMovieMotionHumanPosture["joints"] = Object.fromEntries(
      context.entry.pose.joints.map(
        (
          joint: IAutoMovieJointPose,
        ): [AutoMovieHumanoidBone, readonly [number, number, number]] => [
          joint.bone,
          [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0],
        ],
      ),
    );
    const shape: ShapeReader = prepareShape({ ...entry.joints, ...shown });
    const readAnkles: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      HumanBoneGroups.FEET,
    );
    const ankleMid: (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ) => IAutoMovieVector3 = diveAnkleMid({ readAnkles, body });

    // Take-off: crouched on the feet, a third of the way into the shape. The
    // root goes down with the legs planted on the entry's feet, so the knees
    // bend under it instead of the straight legs sinking into the floor.
    const plant: ReturnType<typeof AutoMovieMotionHumanTrunk.preparePlanted> =
      AutoMovieMotionHumanTrunk.preparePlanted(
        body,
        {
          left: { ankle: feet.left.ankle, rotation: feet.left.rotation },
          right: { ankle: feet.right.ankle, rotation: feet.right.rotation },
        },
        ["left", "right"],
      );
    const crouchedOn: (
      share: number,
      on?: Feet,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ) => IAutoMovieMotionHumanPosture = diveCrouchedOn({
      shape,
      ankleMid,
      ankles,
      stature,
      plant,
      body,
    });

    // Toe-off (a dive's; a slide's feet stay on the floor): each foot rolls
    // about its ball, toes down, by the angle that brings the take-off's
    // ankle to the unloaded limit. The heel's rise moves the ankle under the
    // fixed hips, so the knee and the shank's lean change with the roll too:
    // the angle is solved on the planted take-off itself, by secant steps
    // from the flat take-off's excess.
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const roll: (side: AutoMovieHumanSide) => FootRoll = diveFootRoll({
      feet,
      body,
      entry,
      up,
    });
    const rolls: Readonly<Record<AutoMovieHumanSide, FootRoll>> = {
      left: roll("left"),
      right: roll("right"),
    };
    const rolled: (lift: Lift) => Feet = (lift: Lift): Feet => ({
      left: rolls.left(lift.left),
      right: rolls.right(lift.right),
    });
    // How far each take-off ankle stays dorsiflexed past the unloaded limit.
    const excess: (on?: Feet) => Lift = (on?: Feet): Lift => {
      const joints: IAutoMovieMotionHumanPosture["joints"] =
        GymnasticsFlight.frozen(body, crouchedOn(1, on)).joints;
      return {
        left: (joints.leftFoot?.[0] ?? 0) - ANKLE_DORSIFLEXION.unloaded,
        right: (joints.rightFoot?.[0] ?? 0) - ANKLE_DORSIFLEXION.unloaded,
      };
    };
    const lift: Lift = diveLift({ kind, excess, rolled });
    const toeOff: number = Math.min(TOE_OFF, crouch);
    const crouched: (
      seconds: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ) => IAutoMovieMotionHumanPosture = diveCrouched({
      crouch,
      toeOff,
      lift,
      crouchedOn,
      rolled,
    });
    const takeoff: IAutoMovieMotionHumanPosture = crouched(crouch);
    const off: IAutoMovieVector3 = takeoff.root;

    // The flight leaves from the take-off's solved joints, its bent knees
    // included, and extends them into the kind's shape, so the legs push out
    // of the crouch rather than snapping straight as the feet leave.
    const launch: IAutoMovieMotionHumanPosture["joints"] =
      GymnasticsFlight.frozen(body, takeoff).joints;
    const launchShape: ShapeReader = prepareShape(launch);

    // Landed: the full shape, its lowest joint at the ankles' height, the
    // hips joint `REACH` statures from where it took off (the turn moves the
    // hips about the root, so the root is placed for the hips).
    const landedShape: IAutoMovieMotionHumanPosture = launchShape(
      1,
      TURN[kind],
    );
    const landedBones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, landedShape),
    );
    let lowest: number = Infinity;
    for (const bone of landedBones.values())
      lowest = Math.min(lowest, bone.worldPosition.y);
    const readHips: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      HumanBoneGroups.HIPS,
    );
    const hips: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieVector3 = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3 => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      return readHips(
        resolveHumanPosture.seeded(
          body,
          posture,
          undefined,
          undefined,
          read,
          HumanBoneGroups.HIPS,
        ).pose,
        read(),
      ).get("hips")!.worldPosition;
    };
    const startHips: IAutoMovieVector3 = hips(takeoff);
    const landedHips: IAutoMovieVector3 =
      landedBones.get("hips")!.worldPosition;
    const landed: IAutoMovieVector3 = {
      x: startHips.x + away.x * REACH[kind] * stature - landedHips.x,
      y: ankles.y - lowest,
      z: startHips.z + away.z * REACH[kind] * stature - landedHips.z,
    };

    const duration: number = crouch + travel + rest;
    const share: (seconds: number) => number = (seconds: number): number =>
      seconds / duration;
    const contacts: IAutoMovieMotionHumanContactWindow[] = diveContacts({
      share,
      crouch,
      kind,
      travel,
      toLeft,
    });
    return {
      duration,
      events: [
        { name: "takeOff", share: share(crouch) },
        { name: "landed", share: share(crouch + travel) },
      ],
      contacts,
      physicalWindow: { from: crouch, to: crouch + travel },
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= crouch) return crouched(t, resolution, projection);
        if (t >= crouch + travel) return { ...landedShape, root: landed };
        const u: number = (t - crouch) / travel;
        const s: number = kind === "dive" ? u : AutoMovieEngineMotionSampling.minimumJerkShare(u);
        const posture: IAutoMovieMotionHumanPosture = launchShape(
          s,
          TURN[kind] * s,
        );
        const rise: number =
          kind === "dive" ? 4 * APEX * stature * u * (1 - u) : 0;
        return {
          ...posture,
          root: {
            x: off.x + (landed.x - off.x) * s,
            y: off.y + (landed.y - off.y) * s + rise,
            z: off.z + (landed.z - off.z) * s,
          },
        };
      },
    };
  }

  /*
   * One changing share/turn of a fixed entered or solved-launch articulation.
   */
  export type ShapeReader = (
    share: number,
    turn: number,
  ) => IAutoMovieMotionHumanPosture;

  /*
   * Each foot's placement, world frame.
   */
  export type Feet = Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
  >;

  /*
   * A foot's placement rolled about its ball by an angle, degrees, toes down.
   */
  export type FootRoll = (
    degrees: number,
  ) => IAutoMovieMotionHumanFoot.IPlacement;

  /*
   * Each foot's toe-off roll, degrees, or each take-off ankle's dorsiflexion
   * past the unloaded limit.
   */
  export type Lift = Readonly<Record<AutoMovieHumanSide, number>>;
}
