import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "../compose/courseArmGoal";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { AquaticPosture } from "./AquaticPosture";

/** Seconds a support contact blends in before its grip and out after its release. */
const CONTACT_BLEND: number = 0.22;

/** Seconds a base's support arm takes to reach into its palm offer and back out: provisional, an unhurried sculling arm. */
const BASE_REACH: number = 0.5;

/**
 * An artistic figure with optional team support. Flat and vertical sculls
 * follow the form distinctions measured by Homma et al. (PMID 31718520).
 * The supported figure uses the separate support and featured roles of the
 * World Aquatics Artistic Swimming Manual, Group B. The timing and contact
 * depths here are authored for this film figure.
 *
 * @see https://resources.fina.org/fina/document/2026/02/26/e04faca7-a6bd-4b2b-ba86-0354ee34dd82/AQUA-AS_MANUAL_February-2026.pdf
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the researched support shapes and the ensemble variation.
 * @evidence contracts/development/design.md#principled-representation One figure clock governs joint shape and the support blend.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the assisted and unassisted artistic swimming figure.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each foot borrows its own named base's displayed palm over the actual contact interval.
 */
export namespace AquaticTeam {
  /**
   * Prepare a flat layout, sculling rise, figure and recovery.
   *
   * @param context The performer, role, beat and the named swimmers.
   * @param water The shared world water height in metres.
   * @returns The plan with named support and release events for assisted roles.
   * @throws {HumanRefusal} For absent or repeated bases, or when a named
   * support is not an upward submerged palm during the bearing interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the shared water, performer roles, lifted stage and refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A base prepares a palm-up target on the same clock as the rising figure. The flyer transfers each actual forefoot surface to a named base's current palm, then returns to the sculling posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare nominal figure keys, the optional supporter and the borrowed palm readers once. Sample the nominal figure and apply its timed contact phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Contact is an offset anatomical surface on both performers. The law refuses missing or repeated bases and downward or emerged contact offers during declared support.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed participant lookup and anatomy preparation. The support interval requests only each partner hand bone and the required current own bones.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each role shares its prepared posture blends and contact timing across queries. Hand and sole datums reuse the canonical frame owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its fixed posture blends and partner frame readers. Current FK and kinematic target records are released after each query.
   */
  export function artistic(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const duration: number = 4;
    const lifted: boolean = params.role === "flyer";
    const bases: readonly [string, string] | undefined = lifted
      ? params.bases
      : undefined;
    if (
      lifted &&
      (bases === undefined ||
        bases[0] === bases[1] ||
        bases.includes(context.subject))
    )
      throw new HumanRefusal({
        kind: "participant",
        axis: "bases",
        value: bases ?? null,
        reason: "an assisted flyer needs two distinct supporting swimmers",
        fix: "name two other performers as the flyer's left and right bases",
      });
    const base: boolean = params.role === "base";
    const measured: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: -90 },
        { shoulder: 6, raise: 19, elbow: 32, hip: 6, knee: 10, ankle: -24 },
      ),
    );
    const laid: IAutoMovieMotionHumanPosture = {
      ...measured,
      root: {
        ...measured.root,
        y:
          measured.root.y +
          water -
          0.13 -
          AquaticPosture.markers(body, ["hips"])(measured).get("hips")!
            .worldPosition.y,
      },
    };
    const upright: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        {
          pitch: 2,
          spine: [-4, 0, 0],
        },
        {
          shoulder: 12,
          raise: 55,
          elbow: 82,
          hip: 16,
          spread: 17,
          knee: 43,
          ankle: -16,
        },
      ),
      {
        ...entry.posture.root,
        y: water - body.measure.stature * 0.81,
      },
    );
    const high: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        {
          pitch: lifted ? -9 : 3,
          spine: [-9, 0, 0],
          neck: base ? -20 : 3,
        },
        {
          shoulder: base ? 138 : 164,
          raise: base ? 25 : 17,
          elbow: base ? 26 : 7,
          hip: lifted ? 10 : 35,
          spread: lifted ? 30 : 19,
          knee: lifted ? 8 : 57,
          ankle: -25,
        },
      ),
      { ...upright.root, y: upright.root.y + (lifted ? 0.76 : 0.18) },
    );
    const vertical: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(laid, upright);
    const rise: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      upright,
      high,
    );
    const fall: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      high,
      upright,
    );
    const settle: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(upright, laid);
    const lag: number = 0.35 * (params.phase ?? 0);
    const tVertical: number = 1.35 + lag;
    const tHigh: number = 2.3 + lag;
    const tReturn: number = 3.15 + lag;
    const partners:
      | readonly [
          IAutoMovieMotionHumanPerformerReader,
          IAutoMovieMotionHumanPerformerReader,
        ]
      | undefined =
      bases !== undefined
        ? [context.performer(bases[0]), context.performer(bases[1])]
        : undefined;
    const legsAt: ReturnType<typeof AquaticPosture.markers> | undefined =
      partners === undefined
        ? undefined
        : AquaticPosture.markers(body, [
            "leftFoot",
            "leftLowerLeg",
            "rightFoot",
            "rightLowerLeg",
          ]);
    const gripStart: number = tHigh - 0.14;
    const gripEnd: number = tHigh + 0.14;
    const support: ReturnType<typeof prepareBase> | undefined = base
      ? prepareBase(context, water, tHigh)
      : undefined;
    const contact: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {
      left: HumanFoot.offset(body, "left", "ball"),
      right: HumanFoot.offset(body, "right", "ball"),
    };
    const flat: IAutoMovieQuaternion = Quaternion.fromAxisAngle(UP, high.yaw);
    const hands:
      | readonly [
          ReadonlySet<AutoMovieHumanoidBone>,
          ReadonlySet<AutoMovieHumanoidBone>,
        ]
      | undefined =
      partners === undefined
        ? undefined
        : [
            new Set([partners[0].body.surfaces.regions.palmRight.bone]),
            new Set([partners[1].body.surfaces.regions.palmLeft.bone]),
          ];
    const contacts: IAutoMovieMotionHumanContactWindow[] =
      bases === undefined
        ? []
        : (["left", "right"] as const).map(
            (
              side: AutoMovieHumanSide,
              i: number,
            ): IAutoMovieMotionHumanContactWindow => ({
              part: `${side}Foot`,
              kind: "bear",
              from: gripStart / duration,
              to: gripEnd / duration,
              support: {
                kind: "person",
                subject: bases[i]!,
                region: side === "left" ? "palmRight" : "palmLeft",
              },
            }),
          );

    const plan: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: [
        { name: "flatScull", share: 0 },
        { name: "supportScull", share: tVertical / duration },
        ...(base || lifted
          ? [{ name: "supportAcquire", share: gripStart / duration }]
          : []),
        { name: "figure", share: tHigh / duration },
        ...(base || lifted
          ? [{ name: "supportRelease", share: gripEnd / duration }]
          : []),
        { name: "return", share: tReturn / duration },
        { name: "relax", share: 1 },
      ],
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const result: IAutoMovieMotionHumanPosture =
          t <= tVertical
            ? vertical((t - 0.65 - lag) / 0.7)
            : t <= tHigh
              ? rise((t - tVertical) / (tHigh - tVertical))
              : t <= tReturn
                ? fall((t - tHigh) / (tReturn - tHigh))
                : settle((t - tReturn) / (duration - tReturn));
        const phase: number = (2 * Math.PI * (t - lag)) / 0.66;
        const active: number =
          1 - 0.97 * Math.max(0, 1 - Math.abs(t - tHigh) / 0.47);
        const joint = (
          part: "leftUpperArm" | "rightUpperArm" | "leftHand" | "rightHand",
          change: number,
        ) => {
          const [x, y, z]: readonly [number, number, number] = result.joints[
            part
          ] ?? [0, 0, 0];
          return [
            x,
            y + change * active * Math.sin(phase),
            z + (change * active * Math.cos(phase)) / 2,
          ] as const;
        };
        const shaped: IAutoMovieMotionHumanPosture = {
          ...result,
          joints: {
            ...result.joints,
            leftUpperArm: joint("leftUpperArm", 12),
            rightUpperArm: joint("rightUpperArm", 12),
            leftHand: joint("leftHand", 18),
            rightHand: joint("rightHand", 18),
          },
        };
        const blendContact: number = minimumJerk.share(
          Math.max(
            0,
            Math.min(
              1,
              (t - gripStart + CONTACT_BLEND) / CONTACT_BLEND,
              (gripEnd + CONTACT_BLEND - t) / CONTACT_BLEND,
            ),
          ),
        );
        // A base writes its whole palm offer over its arm's course, which
        // lays the reach in and out itself.
        if (support !== undefined)
          return t >= gripStart - BASE_REACH && t <= gripEnd + BASE_REACH
            ? support(shaped, t, 1)
            : shaped;
        if (blendContact === 0) return shaped;
        if (
          partners === undefined ||
          hands === undefined ||
          legsAt === undefined
        )
          return shaped;
        const legs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          legsAt(shaped);
        const limb = (
          side: AutoMovieHumanSide,
          index: 0 | 1,
        ): IAutoMovieHumanLimbGoal => {
          const base: IAutoMovieMotionHumanPerformerReader = partners[index];
          const region: IAutoMovieHumanoidSurfaces.IFrame =
            base.body.surfaces.regions[
              side === "left" ? "palmRight" : "palmLeft"
            ];
          const bone: IAutoMovieResolvedBone = base
            .bones(context.start + t, hands[index])
            .get(region.bone)!;
          const palm: ReturnType<
            typeof resolveAutoMovieHumanoidSurfaces.place
          > = resolveAutoMovieHumanoidSurfaces.place(region, bone);
          if (
            t >= gripStart &&
            t <= gripEnd &&
            (palm.normal.y < UPWARD || palm.point.y >= water)
          )
            throw new HumanRefusal({
              kind: "participant",
              axis: "bases",
              value: bases?.[index],
              reason: "the named base does not offer an upward submerged palm",
              fix: "compose the base's facing and support beat before the flyer",
            });

          const foot: IAutoMovieResolvedBone = legs.get(`${side}Foot`)!;
          const knee: IAutoMovieVector3 = legs.get(
            `${side}LowerLeg`,
          )!.worldPosition;
          return transfer(
            foot,
            knee,
            contact[side],
            palm.point,
            flat,
            blendContact,
          );
        };
        return {
          ...shaped,
          limbs: { leftLeg: limb("left", 0), rightLeg: limb("right", 1) },
        };
      },
    };
    // A base's support arm is laid as one admitted course: from its sculling
    // arm into the offered palm and back out (`courseArmGoal`).
    if (!base) return plan;
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: gripStart - BASE_REACH,
      ready: gripStart,
      relax: gripEnd,
      end: gripEnd + BASE_REACH,
    };
    // The arm the figure's own key holds as the reach begins.
    const opening: IAutoMovieMotionHumanPosture = plan.posture(span.start);
    return (
      params.side === undefined ? (["left", "right"] as const) : [params.side]
    ).reduce(
      (
        laid: IAutoMovieMotionHumanActionPlan,
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanActionPlan =>
        courseArmGoal({
          body,
          plan: laid,
          side,
          rest: AquaticPosture.rest(body, opening, side),
          span,
        }),
      plan,
    );
  }
}

/** The shared upward direction of the figure's hand and sole frames. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** A provisional cos(36.9°) minimum for a submerged palm bearing upward. */
const UPWARD: number = 0.8;

/** Fixed plan-time placement and pose offer of one supporting hand. */
interface IPalmOffer {
  /** The supporting hand's anatomical side. */
  side: AutoMovieHumanSide;

  /** Its bearing palm offset in hand coordinates, metres. */
  contact: IAutoMovieVector3;

  /** Its horizontal set position on the beat, world metres. */
  at: IAutoMovieVector3;

  /** Its bearing orientation, with the palm facing up. */
  rotation: IAutoMovieQuaternion;
}

/**
 * Prepare the base swimmer's independent palm offer.
 *
 * @param context The base performer and selected supporting side.
 * @param water The common world water surface, metres.
 * @param peak The timed figure apex, in action seconds.
 * @returns A pose writer for the supporting part of the figure.
 */
function prepareBase(
  context: AquaticPosture.Context,
  water: number,
  peak: number,
): (
  shaped: IAutoMovieMotionHumanPosture,
  seconds: number,
  weight: number,
) => IAutoMovieMotionHumanPosture {
  const { body, entry, params }: AquaticPosture.Context = context;
  const sides: readonly AutoMovieHumanSide[] =
    params.side === undefined ? ["left", "right"] : [params.side];
  const markers: ReturnType<typeof AquaticPosture.markers> =
    AquaticPosture.markers(
      body,
      sides.flatMap((side: AutoMovieHumanSide): AutoMovieHumanoidBone[] => [
        `${side}Hand`,
        `${side}LowerArm`,
      ]),
    );
  const frame: IAutoMovieMotionHumanFrame = {
    origin: entry.posture.root,
    yaw: entry.posture.yaw,
  };
  const fingers: IAutoMovieVector3 = HumanFrame.forward(frame.yaw);
  const palms: readonly IPalmOffer[] = sides.map(
    (side: AutoMovieHumanSide): IPalmOffer => ({
      side,
      contact: HumanHand.offset(body, side, "palm").point,
      at: HumanFrame.point(frame, {
        x: (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth * 1.25,
        y: 0,
        z: body.measure.forearm * 0.75,
      }),
      // A supinated hand under a load points its fingers inward and
      // forward, as a tray is carried, not straight ahead.
      rotation: HumanHand.rotation(side, {
        fingers: Vector3.normalize(
          Vector3.add(
            fingers,
            HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
              { x: side === "left" ? -1 : 1, y: 0, z: 0 },
            ),
          ),
        ),
        palm: UP,
      }),
    }),
  );
  return (
    shaped: IAutoMovieMotionHumanPosture,
    seconds: number,
    weight: number,
  ): IAutoMovieMotionHumanPosture => {
    const bones: ReturnType<typeof markers> = markers(shaped);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...shaped.limbs };

    // The base's palm rises slightly but stays submerged at the figure apex.
    const near: number = minimumJerk.share(
      Math.max(0, 1 - Math.abs(seconds - peak) / 0.36),
    );
    const y: number = water - body.measure.stature * (0.275 - 0.04 * near);
    for (const { side, contact, at, rotation } of palms)
      limbs[`${side}Arm`] = transfer(
        bones.get(`${side}Hand`)!,
        bones.get(`${side}LowerArm`)!.worldPosition,
        contact,
        { x: at.x, y, z: at.z },
        rotation,
        weight,
      );
    return { ...shaped, limbs };
  };
}

/** Turn a limb around the actual palm or sole point as it takes or leaves support. */
function transfer(
  end: IAutoMovieResolvedBone,
  bend: IAutoMovieVector3,
  contact: IAutoMovieVector3,
  target: IAutoMovieVector3,
  facing: IAutoMovieQuaternion,
  weight: number,
): IAutoMovieHumanLimbGoal {
  const rotation: IAutoMovieQuaternion = Quaternion.slerp(
    end.worldRotation,
    facing,
    weight,
  );
  const original: IAutoMovieVector3 = Vector3.add(
    end.worldPosition,
    Quaternion.rotateVector(end.worldRotation, contact),
  );
  return {
    point: Vector3.subtract(
      Vector3.lerp(original, target, weight),
      Quaternion.rotateVector(rotation, contact),
    ),
    bend,
    rotation,
    contact,
  };
}
