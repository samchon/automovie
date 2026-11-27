import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanKick,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingAim,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { KickCarriage } from "./KickCarriage";
import type { KickChain } from "./KickChain";
import { KickLaunch } from "./KickLaunch";
import { KickPlans } from "./KickPlans";
import { StrikingAim } from "./StrikingAim";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import { StrikingTarget } from "./StrikingTarget";
import type { strikingStepSupport } from "./strikingStepSupport";

/*
 * Builds a kick's geometry.
 *
 * The contact is decided first, at the launch (KickLaunch), on the
 * figure itself (KickContact): the carriage under which the fitted leg
 * lands its weapon on the planned point with the support foot on its plant. The
 * displayed contact goal is then that fitted leg (its ankle, its knee and its
 * foot rotation), so the figure shows exactly what was judged, and the chamber
 * is the same leg with the knee folded (KickChamber).
 *
 * Between its plant, the chamber and the contact the leg travels on the path
 * KickSwing carries with the pelvis. Each online correction of the
 * target's point (StrikingAim) is a whole plan of its own, and the
 * figure moves from plan to plan (KickPlans).
 */
export namespace KickGeometry {
  /*
   * Build a kick's geometry.
   * Parameter context: The kick's context, its entry being the kick's own start.
   * Parameter timing: The kick's timing.
   * Parameter t0: Film second of the kick's time zero.
   * Parameter fixed: The contact second the performance committed: null when the
   * leg met nothing, undefined when the kick offers no weapon.
   * Parameter launch: What the kick fixed at its launch (`KickLaunch`): its line,
   * its seeded miss, its carriage inputs and its contact.
   * Returns: The geometry.
   */
  export function build(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
    timing: IAutoMovieMotionHumanKickGeometry.ITiming,
    t0: number,
    fixed: number | null | undefined,
    launch: KickLaunch.ILaunch,
  ): IAutoMovieMotionHumanKickGeometry {
    const body: IAutoMovieMotionHumanBody = context.body;
    const { side }: IAutoMovieMotionHumanKickGeometry.ITiming = timing;
    const support: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const { line, offset, props, origin, feint }: KickLaunch.ILaunch = launch;

    // What follows the partner as shown: the aim's tracker, and a contact
    // for each correction of the aim on the launch's step, trying the lean
    // it corrects first. A feint follows nothing. The shadow opponent is
    // fixed in the entry's frame, so every prediction would equal launch.
    const tracker: IAutoMovieMotionHumanStrikingAim.ITracker | undefined =
      context.params.at.kind === "none"
        ? undefined
        : StrikingAim.track(
            launch.aim,
            {
              launch: t0 - StrikingTarget.LOOK,
              impact: t0 + timing.impact,
              latency: StrikingSkill.CORRECTION_LATENCY,
              step: StrikingAim.STEP,
              shortest: StrikingAim.SHORTEST,
            },
            offset,
          );
    const launched: KickLaunch.IPlanned = launch.launched;
    const carriage: IAutoMovieMotionHumanKickGeometry.ICarriage =
      launched.carriage;
    const fit: KickChain.IFit = launched.fit;
    const plans: KickPlans.IPlans =
      feint || tracker === undefined
        ? {
            shown: (): IAutoMovieMotionHumanKickGeometry.ICarriage => carriage,
            leg: launched.leg,
          }
        : KickPlans.create({
            first: launched,
            next: (
              previous: KickPlans.IPlan,
              goal: IAutoMovieVector3,
            ): KickLaunch.IPlanned =>
              launch.contact(
                goal,
                carriage.step,
                previous.carriage.lean,
                carriage.drive,
                launch.chamber,
              ),
            units: tracker.units,
            t0,
          });
    return compose(
      body,
      timing,
      t0,
      {
        line,
        carriage,
        base: (
          seconds: number,
          shown: IAutoMovieMotionHumanKickGeometry.ICarriage,
          turning?: number,
          resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
          projection?: ReturnType<typeof prepareHumanPostureProjection>,
        ): IAutoMovieMotionHumanPosture =>
          KickCarriage.posture(
            props,
            shown,
            seconds,
            turning,
            resolution,
            projection,
          ),
        shown: plans.shown,
        leg: plans.leg,
        origin,
        back: Vector3.add(origin, Vector3.scale(line, carriage.step)),
        contacts: windows(
          timing,
          side,
          support,
          carriage.step !== 0,
          props.recovery,
        ),
        record: {
          limb: side === "left" ? "leftFoot" : "rightFoot",
          offset,
          planned: tracker?.planned ?? { ...launch.planned },
          reached: fit.reached,
          status: fit.status,

          // The stop is the performance's joint resolution of the leg's
          // capsules; the kick scans nothing itself.
          stop: (seconds: number): number | undefined =>
            fixed !== undefined && fixed !== null && fixed <= seconds
              ? fixed
              : undefined,
        },
      },
      props.recovery,
    );
  }

  /*
   * Assemble the posture from the body, the kicking leg and the guard.
   *
   * When the leg meets a surface, the whole striking chain (the pelvis's turn
   * and lean, and the leg under it) holds for the dwell and then withdraws
   * along the way it came: the kick's own approach played backwards from the
   * stop to its start on a minimum-jerk clock, so it leaves at rest and arrives
   * at rest. Every configuration of the approach up to the stop was clear of
   * the body it met (the stop is the first contact), so retracing it never
   * passes the knee or the shin through that body, wherever the contact was.
   * The support foot's step-up stops where the contact found it, so the
   * retraced body stands on the same foot it approached on, and the kicking
   * foot replants by the share of the step the support foot had made.
   * Parameter body: The kicking body.
   * Parameter timing: The kick's timing.
   * Parameter t0: Film second of the kick's time zero.
   * Parameter parts: The geometry's parts.
   * Parameter recovery: Any open touchdown inherited from the cut into this kick.
   * Returns: The geometry with its posture.
   */
  export function compose(
    body: IAutoMovieMotionHumanBody,
    timing: IAutoMovieMotionHumanKickGeometry.ITiming,
    t0: number,
    parts: Omit<IAutoMovieMotionHumanKickGeometry, "posture">,
    recovery?: strikingStepSupport.ISupport,
  ): IAutoMovieMotionHumanKickGeometry {
    const ball: IAutoMovieVector3 = HumanFoot.offset(body, timing.side, "ball");
    const guardAt: ReturnType<typeof StrikingStance.prepareGuard> =
      StrikingStance.prepareGuard(body, { lead: timing.lead });
    const chain = (
      t: number,
      resolution: ReturnType<typeof prepareHumanPoseResolution>,
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IHeld => {
      const at: number | undefined = parts.record.stop(t0 + t);
      const s: number | undefined = at === undefined ? undefined : at - t0;
      if (s === undefined || t <= s) {
        const base: IAutoMovieMotionHumanPosture = parts.base(
          t,
          parts.shown(t),
          undefined,
          resolution,
          projection,
        );
        const hip: IAutoMovieVector3 = KickCarriage.hip(
          body,
          base,
          timing.side,
          resolution,
          projection,
        );
        return {
          body: base,
          leg: parts.leg(t, base, { x: 0, y: 0, z: 0 }, hip),
        };
      }

      // The approach clock runs back from the stop to the start over the
      // rest of the kick, after the dwell, while the step's clock stays at
      // the stop.
      const rest: number = Math.max(
        1e-3,
        timing.duration - s - StrikingStroke.DWELL,
      );
      const w: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        (t - s - StrikingStroke.DWELL) / rest,
      );
      const back: number = s * (1 - w);
      const stepped: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        (s - timing.prep) / Math.max(1e-3, timing.chamber - timing.prep),
      );
      const base: IAutoMovieMotionHumanPosture = parts.base(
        s,
        parts.shown(back),
        back,
        resolution,
        projection,
      );
      const hip: IAutoMovieVector3 = KickCarriage.hip(
        body,
        base,
        timing.side,
        resolution,
        projection,
      );
      return {
        body: base,
        leg: parts.leg(
          back,
          base,
          Vector3.scale(
            Vector3.subtract(parts.back, parts.origin),
            stepped * w,
          ),
          hip,
        ),
      };
    };
    return {
      ...parts,
      posture: (
        t: number,
        channels?: readonly AutoMovieMotionHumanChannel[],
        source?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: ReturnType<typeof prepareHumanPostureProjection>,
      ): IAutoMovieMotionHumanPosture => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        const held: IHeld = chain(t, resolution, projection);
        const arms: boolean =
          channels === undefined ||
          channels.some(
            (channel: AutoMovieMotionHumanChannel): boolean =>
              channel.endsWith("Arm") || channel.endsWith("Hand"),
          );
        const down: boolean =
          (recovery?.landings[timing.side] === undefined && t <= timing.prep) ||
          t >= timing.duration - 1e-9;
        const rise: number = recovery?.rise(timing.side, t, timing.prep) ?? 0;
        const toes: readonly [number, number, number] | undefined =
          held.leg.toes === undefined
            ? undefined
            : (held.body.joints[`${timing.side}Toes`] ?? [0, 0, 0]);
        return {
          ...held.body,
          ...(toes === undefined
            ? {}
            : {
                joints: {
                  ...held.body.joints,
                  [`${timing.side}Toes`]: [
                    toes[0] + held.leg.toes!,
                    toes[1],
                    toes[2],
                  ],
                },
              }),
          limbs: {
            ...held.body.limbs,
            ...(arms ? guardAt(held.body, resolution, projection) : {}),
            [timing.side === "left" ? "leftLeg" : "rightLeg"]: {
              point:
                rise === 0
                  ? held.leg.ankle
                  : { ...held.leg.ankle, y: held.leg.ankle.y + rise },
              bend: held.leg.hint,
              rotation: held.leg.rotation,
              ...(down ? { planted: true, contact: ball } : {}),
            },
          },
        };
      },
    };
  }

  /*
   * A kick's foot windows: the kicking foot planted until the launch, unless it
   * is still landing from a step, and back down at the end; the support foot
   * pivoting throughout, or, stepping, pivoting to the launch, bearing to the
   * chamber and pivoting after.
   * Parameter timing: The kick's launch, chamber and length, seconds.
   * Parameter side: The kicking side.
   * Parameter support: The support side.
   * Parameter stepped: Whether the support foot steps.
   * Parameter recovery: The feet still landing from a cut step, if any.
   * Returns: The windows.
   */
  export function windows(
    timing: Pick<
      IAutoMovieMotionHumanKickGeometry.ITiming,
      "duration" | "prep" | "chamber"
    >,
    side: AutoMovieHumanSide,
    support: AutoMovieHumanSide,
    stepped: boolean,
    recovery?: strikingStepSupport.ISupport,
  ): IAutoMovieMotionHumanContactWindow[] {
    const d: number = timing.duration;
    const launch: number = timing.prep / d;
    const initiallyBearing: boolean = recovery?.landings[support] === undefined;
    const pivot = (
      from: number,
      to: number,
    ): IAutoMovieMotionHumanContactWindow => ({
      part: `${support}Foot`,
      kind: "pivot",
      from,
      to,
      support: { kind: "ground" },
    });
    return [
      ...(recovery?.landings[side] !== undefined
        ? []
        : [
            {
              part: `${side}Foot`,
              kind: "plant",
              from: 0,
              to: launch,
              support: { kind: "ground" },
            } satisfies IAutoMovieMotionHumanContactWindow,
          ]),
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 1,
        to: 1,
        support: { kind: "ground" },
      },
      ...(stepped
        ? [
            ...(initiallyBearing ? [pivot(0, launch)] : []),
            // The stepping support foot slides along the floor bearing the
            // body: a bearing slide, not a plant.
            {
              part: `${support}Foot`,
              kind: "bear",
              from: launch,
              to: timing.chamber / d,
              support: { kind: "ground" },
            } satisfies IAutoMovieMotionHumanContactWindow,
            pivot(timing.chamber / d, 1),
          ]
        : [pivot(initiallyBearing ? 0 : launch, 1)]),
    ];
  }

  /*
   * The body and the kicking leg's goal at one instant.
   */
  interface IHeld {
    /*
     * The body's posture without the kicking leg's goal.
     */
    body: IAutoMovieMotionHumanPosture;

    /*
     * The kicking leg's goal.
     */
    leg: IAutoMovieMotionHumanKickGeometry.ILeg;
  }
}
