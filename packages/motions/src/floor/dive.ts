import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDive,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";

/**
 * A fall onto the floor on purpose from a stance: a goalkeeper's dive to
 * the side, or a sliding tackle forward on the hip.
 *
 * Every second the body is a set of joint angles blended from the entry's
 * toward the kind's (`SHAPES`, provisional), turned about one axis of its
 * own (the dive about its forward axis, so it lands on its side; the slide
 * about its lateral axis, leaning back), and placed with its root on a path:
 *
 * - `dive`: a crouch with the feet planted and the knees bending under the
 *   lowered root (`AutoMovieMotionHumanTrunk.preparePlanted`), then a flight whose
 *   hips move `REACH` statures to the side on a parabola `APEX` statures
 *   above the line from take-off to landing, the body turning a quarter
 *   about its forward axis on the way while its joints extend from the
 *   crouch's solved angles into the shape, then lying on its side where it
 *   landed. The flight is the one airborne part, on that one axis.
 * - `slide`: the body leans back and sinks onto its hip while its hips
 *   slide `REACH` statures forward and slowing to rest, the lead leg reaching
 *   ahead and the trailing one bent under, never off the floor.
 *
 * Landed, the root is placed so the lowest joint centre lies at the
 * ankle's standing height above the floor, as on the feet.
 *
 * Contact windows: the feet plant through the crouch; landed, the seat lies
 * on the floor (the hip) and, in a dive, the lower hand plants beside it.
 *
 * First pass: the take-off is not driven by the legs' push, the landing
 * does not absorb the fall through the arm, and a slide from a run starts
 * from the run's posture at rest, not its speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two kinds, the root's path, the one airborne axis, the landing and the contacts, and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A shape of the joints, a turn about one body axis and a root path, with the landed body read off its own lowest point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the shapes, four constants, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flight turns about one axis only, as stated; no tumble is faked.
 */
export namespace dive {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "dive";

  /** A dive's content is a fall to the floor caught on the hands, so its balance is judged (`IAutoMovieMotionHumanActionLaw.physical`). */
  export const physical: boolean = true;

  /** Cancel table: a dive or slide is left once it has come to rest. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["landed", 1], kind: "inertialize", entry: 0 }],
  };
  /** Each kind's joint angles at full extent, clinical degrees, for a dive to the performer's left; a dive to the right mirrors the arms (provisional). */
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

  /** How far the hips joint travels, statures: to the side in a dive, ahead in a slide (provisional). */
  export const REACH: Readonly<Record<IAutoMovieMotionHumanDive.Kind, number>> = {
    dive: 0.8,
    slide: 0.7,
  };

  /** How high the dive's flight rises above its chord, statures (provisional). */
  export const APEX: number = 0.12;

  /** The turn about the kind's axis when landed, degrees (provisional): a quarter onto the side in a dive, leaning back in a slide. */
  export const TURN: Readonly<Record<IAutoMovieMotionHumanDive.Kind, number>> = { dive: 90, slide: -55 };

  /** Seconds of each phase (provisional): the crouch, the flight or the slide, and the rest on the floor. */
  export const PHASES: Readonly<
    Record<IAutoMovieMotionHumanDive.Kind, readonly [number, number, number]>
  > = { dive: [0.3, 0.45, 0.6], slide: [0.2, 0.8, 0.5] };

  /**
   * Plan a dive or a slide.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the entry is not on both feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The crouch keeps the ankles where they stood by planted leg goals, so the lowered root bends the knees; the flight starts from the crouch's solved joints (`GymnasticsFlight.frozen`), so the pose is continuous at take-off; the flight's root is a parabola over the chord from take-off to the landed root, which is read off the landed body's lowest joint; the turn is about the one axis the kind names.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shape, the landed root, the three phases, the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A body not on both feet is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Target start/difference triples, fixed foot-heading/contact readers and ankle/hip name demands prepare once. Crouch observations keep full direct admission but resolve only goals affecting ankle ancestry; start-hip observation omits independent leg fits. Every actual knee hint, planted goal, landing joint centre and displayed solve remains, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Crouch/solved launch joints prepare separate target differences. The same unchanged entry feet feed Trunk.preparePlanted's original leg-goal owner, while every current root/yaw still writes its knee/contact/goal. Genuine name readers and synchronous FK/projector loans share only prerequisites; current joint projection and digit/unsupported full fallback remain.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains original entry, two fixed foot placements/goal readers, two bounded track readers, ankle/hip demands and landed geometry. Query maps/getters release on return/throw; optional FK/projector loans stay synchronous and never enter raw output or retained callbacks. No previous-query result, handle or task is retained.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDive.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const kind: IAutoMovieMotionHumanDive.Kind = context.params.kind ?? "dive";
    const toLeft: number = (context.params.side ?? "left") === "left" ? 1 : -1;
    const feet: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDive.IParams>["entry"]["feet"] = context.entry.feet;
    if (!(feet.left.planted && feet.right.planted))
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: "not on both feet",
        feasible: { kind: "alternatives", values: ["standing"] },
        reason: `a ${kind} starts from both feet on the floor`,
        fix: "stand before it",
      });
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const stature: number = body.measure.stature;
    const [crouch, travel, rest]: readonly [number, number, number] = PHASES[kind];
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
      ([bone, angles]: [AutoMovieHumanoidBone, readonly [number, number, number]]): [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ] => [
        kind === "dive" && toLeft < 0
          ? ((bone.startsWith("left")
              ? bone.replace(/^left/, "right")
              : bone.replace(/^right/, "left")) as AutoMovieHumanoidBone)
          : bone,
        angles,
      ],
    );
    const prepareShape: (from: IAutoMovieMotionHumanPosture["joints"]) => ShapeReader = (from: IAutoMovieMotionHumanPosture["joints"]): ShapeReader => {
      // The joints the shape leaves alone stay as `from` holds them.
      const blend: (share: number) => IAutoMovieMotionHumanPosture["joints"] =
        prepareHumanShapeBlend(from, { ...from, ...Object.fromEntries(targets) });
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
    const shape: ShapeReader = prepareShape(entry.joints);
    const readAnkles: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, FEET);
    const ankleMid: (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]) => IAutoMovieVector3 = (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]): IAutoMovieVector3 => {
      const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
      const bones: ReturnType<typeof poseBones> = readAnkles(
        resolveHumanPosture.seeded(body, posture, undefined, undefined, read, FEET, projection).pose,
        read(),
      );
      const l: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
      const r: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
      return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2, z: (l.z + r.z) / 2 };
    };

    // Take-off: crouched on the feet, a third of the way into the shape. The
    // root goes down with the legs planted on the entry's feet, so the knees
    // bend under it instead of the straight legs sinking into the floor.
    const plant: ReturnType<typeof AutoMovieMotionHumanTrunk.preparePlanted> =
      AutoMovieMotionHumanTrunk.preparePlanted(body, {
        left: { ankle: feet.left.ankle, rotation: feet.left.rotation },
        right: { ankle: feet.right.ankle, rotation: feet.right.rotation },
      }, ["left", "right"]);
    const crouched: (share: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]) => IAutoMovieMotionHumanPosture = (share: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = shape(share / 3, 0);
      const local: IAutoMovieVector3 = ankleMid(posture, resolution, projection);
      return plant({
        ...posture,
        root: {
          x: ankles.x - local.x,
          y: ankles.y - local.y - 0.05 * stature * share,
          z: ankles.z - local.z,
        },
      });
    };
    const takeoff: IAutoMovieMotionHumanPosture = crouched(1);
    const off: IAutoMovieVector3 = takeoff.root;

    // The flight leaves from the take-off's solved joints, its bent knees
    // included, and extends them into the kind's shape, so the legs push out
    // of the crouch rather than snapping straight as the feet leave.
    const launch: IAutoMovieMotionHumanPosture["joints"] = GymnasticsFlight.frozen(
      body,
      takeoff,
    ).joints;
    const launchShape: ShapeReader = prepareShape(launch);

    // Landed: the full shape, its lowest joint at the ankles' height, the
    // hips joint `REACH` statures from where it took off (the turn moves the
    // hips about the root, so the root is placed for the hips).
    const landedShape: IAutoMovieMotionHumanPosture = launchShape(1, TURN[kind]);
    const landedBones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, landedShape),
    );
    let lowest: number = Infinity;
    for (const bone of landedBones.values())
      lowest = Math.min(lowest, bone.worldPosition.y);
    const readHips: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, HIPS);
    const hips: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieVector3 = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 => {
      const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
      return readHips(resolveHumanPosture.seeded(body, posture, undefined, undefined, read, HIPS).pose, read()).get("hips")!.worldPosition;
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
    const share: (seconds: number) => number = (seconds: number): number => seconds / duration;
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...(["leftFoot", "rightFoot"] as const).map(
        (part: "leftFoot" | "rightFoot"): IAutoMovieMotionHumanContactWindow => ({
          part,
          kind: "plant",
          from: 0,
          to: share(crouch),
          support: { kind: "ground" },
        }),
      ),
      {
        part: "seat",
        kind: "lie",
        from: share(kind === "dive" ? crouch + travel : crouch + 0.3 * travel),
        to: 1,
        support: { kind: "ground" },
      },
      ...(kind === "dive"
        ? [
            {
              part: toLeft > 0 ? ("leftHand" as const) : ("rightHand" as const),
              kind: "plant" as const,
              from: share(crouch + travel),
              to: 1,
              support: { kind: "ground" as const },
            },
          ]
        : []),
    ];
    return {
      duration,
      events: [
        { name: "takeOff", share: share(crouch) },
        { name: "landed", share: share(crouch + travel) },
      ],
      contacts,
      posture: (seconds: number, _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1], resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2], projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= crouch) return crouched(minimumJerk.share(t / crouch), resolution, projection);
        if (t >= crouch + travel) return { ...landedShape, root: landed };
        const u: number = (t - crouch) / travel;
        const s: number = kind === "dive" ? u : minimumJerk.share(u);
        const posture: IAutoMovieMotionHumanPosture = launchShape(s, TURN[kind] * s);
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

  /** Only ankles are measured while placing the crouch over its feet. */
  const FEET: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftFoot",
    "rightFoot",
  ]);

  /** The planned travel is stated at the hips joint. */
  const HIPS: ReadonlySet<AutoMovieHumanoidBone> = new Set(["hips"]);

  /** One changing share/turn of a fixed entered or solved-launch articulation. */
  type ShapeReader = (share: number, turn: number) => IAutoMovieMotionHumanPosture;
}
