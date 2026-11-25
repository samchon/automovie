import {
  Quaternion,
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
import { AquaticPosture } from "./AquaticPosture";
import { AquaticTeamBase } from "./AquaticTeamBase";
import { aquaticArtisticSchedule } from "./aquaticArtisticSchedule";

/**
 * Seconds a support contact blends in before its grip and out after its
 * release.
 */
const CONTACT_BLEND: number = 0.22;

/**
 * Seconds a base's support arm takes to reach into its palm offer and back out:
 * provisional, an unhurried sculling arm.
 */
const BASE_REACH: number = 0.5;
/** The alternatives of `PlanLimbIndex`'s site. */
type PlanLimbIndex = 0 | 1;

/**
 * An artistic figure with optional team support. Flat and vertical sculls
 * follow the form distinctions measured by Homma et al. (PMID 31718520). The
 * supported figure uses the separate support and featured roles of the World
 * Aquatics Artistic Swimming Manual, Group B. The timing and contact depths
 * here are authored for this film figure.
 *
 * @see https://resources.fina.org/fina/document/2026/02/26/e04faca7-a6bd-4b2b-ba86-0354ee34dd82/AQUA-AS_MANUAL_February-2026.pdf
 */
export namespace AquaticTeam {
  /**
   * Prepare a flat layout, sculling rise, figure and recovery.
   *
   * @param context The performer, role, beat and the named swimmers.
   * @param water The shared world water height in metres.
   * @returns The plan with named support and release events for assisted roles.
   * @throws {HumanRefusal} For absent or repeated bases, or when a named
   *   support is not an upward submerged palm during the bearing interval.
   */
  export function artistic(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const schedule: aquaticArtisticSchedule.ISchedule = aquaticArtisticSchedule(
      context.subject,
      params,
    );
    const duration: number = aquaticArtisticSchedule.DURATION;
    const lifted: boolean = params.role === "flyer";
    const bases: readonly [string, string] | undefined = schedule.bases;
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
    const tVertical: number = schedule.vertical;
    const tHigh: number = schedule.high;
    const tReturn: number = schedule.back;
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
    const gripStart: number = schedule.gripStart;
    const gripEnd: number = schedule.gripEnd;
    const support: ReturnType<typeof AquaticTeamBase.prepare> | undefined = base
      ? AquaticTeamBase.prepare(context, water, tHigh, high)
      : undefined;
    const contact: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {
      left: HumanFoot.offset(body, "left", "ball"),
      right: HumanFoot.offset(body, "right", "ball"),
    };
    const flat: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      AquaticTeamBase.UP,
      high.yaw,
    );
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
    const contacts: IAutoMovieMotionHumanContactWindow[] = schedule.contacts;

    const plan: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: schedule.events,
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
        const joint = (part: AutoMovieHumanoidBone, change: number) => {
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
          index: PlanLimbIndex,
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
              reason: `the named base does not offer an upward submerged palm at ${t.toFixed(3)} s: its normal rises ${palm.normal.y.toFixed(3)} of the ${UPWARD} it needs, ${(palm.point.y - water).toFixed(3)} m from the surface`,
              fix: "compose the base's facing and support beat before the flyer",
            });

          const foot: IAutoMovieResolvedBone = legs.get(`${side}Foot`)!;
          const knee: IAutoMovieVector3 = legs.get(
            `${side}LowerLeg`,
          )!.worldPosition;
          return AquaticTeamBase.transfer(
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
    const sides: readonly AutoMovieHumanSide[] =
      params.side === undefined ? ["left", "right"] : [params.side];
    return sides.reduce(
      (
        laid: IAutoMovieMotionHumanActionPlan,
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanActionPlan =>
        courseArmGoal({
          context,
          plan: laid,
          side,
          rest: AquaticPosture.rest(body, opening, side),
          span,
        }),
      plan,
    );
  }
}

/** A provisional cos(36.9°) minimum for a submerged palm bearing upward. */
const UPWARD: number = 0.8;
