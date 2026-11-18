import { Vector3, wrapDegrees } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanKick,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { KickCarriage } from "./KickCarriage";
import type { KickChain } from "./KickChain";
import { KickChamber } from "./KickChamber";
import { KickContact } from "./KickContact";
import { KickForm } from "./KickForm";
import type { KickPlans } from "./KickPlans";
import { KickSwing } from "./KickSwing";
import { StrikingAim } from "./StrikingAim";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * What a kick fixes when it is launched: the point it aims at as the kicker
 * perceives it then, the line, the travel and the pelvis's turn that point
 * gives, the seeded miss, the carriage's inputs, and the launch's contact,
 * decided on the fitted figure (`KickContact`) with the chamber folded from
 * it and the leg's path.
 *
 * A kick's geometry is built again whenever the performance settles (another
 * action was placed, a stop was committed): three or four times a kick. Of
 * what it holds, only the tracker of the aim, the corrections' contacts and
 * the committed stop follow what settled; the launch follows the one reading
 * the kicker made before its start. So the launch is its own record, made
 * once for the plan, and a geometry is built on it. A settle that shows the
 * partner elsewhere at the launch's own reading (a stop committed on an
 * earlier action of theirs) gives a launch that reads differently, and only
 * then is it made again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a launch fixes, why it is apart from the geometry, how often each is built and when a launch is made again.
 * @evidence contracts/development/design.md#principled-representation The launch's reading and everything that follows from it alone, with the solver of a further contact on the same line.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The contact's record, the launch and its maker, read by the kick's geometry and its redirect.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is kept by time or looked up by a key: a launch is one record, compared with the reading it was made from.
 */
export namespace KickLaunch {
  /**
   * One goal's plan with the leg its contact fitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is added to a plan.
   * @evidence contracts/development/design.md#principled-representation A plan of the kick's plans with the fit it shows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One member beyond the plan's.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the plan and the fit.
   */
  export interface IPlanned extends KickPlans.IPlan {
    /** The fitted contact leg. */
    fit: KickChain.IFit;
  }

  /**
   * A kick's launch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The reading, what it gives, and the contact decided on it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members the geometry composes and the two a later launch is compared by.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact's solver is the launch's own closure, so a correction is solved on the same line and travel.
   */
  export interface ILaunch {
    /** The target's point at a film second, as the kicker reads it. */
    aim: (seconds: number) => IAutoMovieVector3;

    /** The point aimed at when the kick is launched, world metres. */
    first: IAutoMovieVector3;

    /** The goal predicted at the launch with the seeded miss, world metres: the tracker's planned goal. */
    planned: IAutoMovieVector3;

    /** The horizontal unit line toward the target. */
    line: IAutoMovieVector3;

    /** What a redirect kept of its source when the launch was made; absent for a fresh kick. */
    kept: IAutoMovieMotionHumanKickGeometry.IKept | undefined;

    /** The seeded miss added to the aim, world metres. */
    offset: IAutoMovieVector3;

    /** The carriage's inputs. */
    props: KickCarriage.IProps;

    /** The kicking ankle at the launch, world metres. */
    origin: IAutoMovieVector3;

    /** Whether the kick is a feint. */
    feint: boolean;

    /** Solve a contact for a goal on this launch's line, with a decided step (metres), a lean tried first (degrees), the pelvis drive a decided step goes with (metres) and a chamber flexion in place of the skill's (degrees) when given. */
    contact: (
      goal: IAutoMovieVector3,
      decided: number | undefined,
      prefer?: number,
      driven?: number,
      chamber?: number,
    ) => IPlanned;

    /** The chamber's knee flexion when the launch's clearing decided it, degrees (`KickClear`); the skill's own when absent. */
    chamber?: number;

    /** The launch's own contact, which decides the step. */
    launched: IPlanned;
  }

  /**
   * A kick's launch: the one before when it reads the same, else a new one.
   *
   * @param context The kick's context, its entry being the kick's own start.
   * @param timing The kick's timing.
   * @param t0 Film second of the kick's time zero.
   * @param kept What a redirect keeps of its source; a fresh kick reads its own line and steps up when short.
   * @param before The launch this plan made before, when it has one.
   * @returns The launch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the result and the refusal; the namespace states what a launch is.
   * @evidence contracts/development/implementation.md#principled-implementation The aimed point is read a look before the start; the line, the height band, the travel and the turn follow from it and the body's measure; the launch's contact is decided on the fitted figure and its chamber folded from it by the skill's range share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The reading and what it gives, the comparison with the launch before, then the contact's solver and the launch's contact.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A launch before is returned only when its aimed point, its predicted goal and what a redirect keeps are the same in every component; every band, share and refusal is the law's own.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three reads of the target and constant arithmetic to compare; the carriage search (up to eight leans of four step rounds of eight whole-posture fits) runs once for a launch, where it ran at each of a kick's three or four geometry builds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Equivalence is the launch's own reading: the same aimed point and predicted goal on the same body, entry, timing and kept line give the same contact, so the plan's one launch serves every geometry built on it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds one launch, with its contact's fitted pose and path, until it is released or the launch reads differently.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
    timing: IAutoMovieMotionHumanKickGeometry.ITiming,
    t0: number,
    kept: IAutoMovieMotionHumanKickGeometry.IKept | undefined,
    before: ILaunch | undefined,
  ): ILaunch {
    const p: IAutoMovieMotionHumanKick.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const { side, prep, impact } = timing;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const round: boolean = p.technique === "round";
    const feint: boolean = p.feint === true;
    const feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);

    // Where the target is, and the range a standing target is read at, from
    // the stance centre: how far ahead of it the root stands over the support
    // foot at contact, plus the leg's comfortable length for the push kick,
    // or for the round kick the comfortable share of the lower shin's
    // horizontal reach at the target's height from the hip's standing height.
    const stance: IAutoMovieMotionHumanStrikingTarget.IStance = StrikingTarget.stance(context.entry);
    const ahead: number = Vector3.dot(
      Vector3.subtract(
        Vector3.lerp(
          { ...entry.root, y: 0 },
          { ...feet[support].ankle, y: 0 },
          KickForm.CENTRE_SHARE,
        ),
        stance.centre,
      ),
      stance.forward,
    );
    const aim = (seconds: number): IAutoMovieVector3 =>
      StrikingTarget.aim(context, p.at, seconds, (height: number): number =>
        round
          ? ahead +
            0.5 * m.hipHalfWidth +
            KickForm.RANGE_SHARE *
              Math.sqrt(
                Math.max(
                  0,
                  (m.thigh + KickForm.SHIN_SHARE * m.shank) ** 2 -
                    (height - m.hipHeight) ** 2,
                ),
              )
          : ahead + KickForm.RANGE_SHARE * (m.thigh + m.shank),
      );
    const first: IAutoMovieVector3 = aim(t0 - StrikingTarget.LOOK);
    const line: IAutoMovieVector3 =
      kept?.line ?? StrikingTarget.line(entry.root, first, entry.yaw);
    const outward: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(up, line),
      side === "left" ? 1 : -1,
    );
    const level: "low" | "middle" | "high" = band(body, first);
    const amplitude: number = StrikingSkill.amplitude(context.skill);

    // The round kick's pelvis turns until the target lies the band's azimuth
    // to the kicking side of its forward; the push kick tips back instead.
    const turn: number = round
      ? wrapDegrees(
          StrikingTarget.heading(line) +
            (side === "right" ? 1 : -1) * KickForm.AZIMUTH[level] -
            entry.yaw,
        ) * amplitude
      : 0;
    const pitch: number = round ? 0 : -KickForm.PUSH_PITCH * amplitude;
    const direction: IAutoMovieVector3 = round
      ? Vector3.normalize(
          Vector3.add(
            Vector3.add(
              Vector3.scale(outward, -KickForm.TRAVEL.across),
              Vector3.scale(line, KickForm.TRAVEL.along),
            ),
            Vector3.scale(up, KickForm.TRAVEL.vertical[level]),
          ),
        )
      : line;
    const offset: IAutoMovieVector3 = StrikingQuality.offset({
      skill: context.skill,
      random: context.random("scatter"),
      ...(p.accuracy === undefined ? {} : { accuracy: p.accuracy }),
      direction,
      radius: m.shankRadius,
      distance: Vector3.distance(first, feet[side].ankle),
      seconds: impact - prep,
    });

    // The goal the tracker plans at the launch (`StrikingAim.track`'s first
    // prediction). A launch before that read the same point and planned the
    // same goal, on the same kept line and step, is this one.
    const planned: IAutoMovieVector3 = Vector3.add(
      StrikingAim.predict(
        aim,
        t0 - StrikingTarget.LOOK,
        t0 + impact,
        StrikingAim.STEP,
      ),
      offset,
    );
    if (
      before !== undefined &&
      same(before.first, first) &&
      same(before.planned, planned) &&
      before.kept?.step === kept?.step &&
      before.kept?.drive === kept?.drive &&
      (before.kept === undefined
        ? kept === undefined
        : kept !== undefined && same(before.kept.line, kept.line))
    )
      return before;

    // The contact, decided on the fitted figure, and the chamber folded from
    // it by the skill's range share.
    const props: KickCarriage.IProps = {
      body,
      entry,
      joints: { ...entry.joints, ...StrikingStance.joints(entry.joints) },
      feet,
      side,
      line,
      timing,
      amplitude,
      rise: Math.max(0, m.hipHeight - KickCarriage.hip(body, entry, support).y),
    };
    const origin: IAutoMovieVector3 = feet[side].ankle;
    const knee: IAutoMovieVector3 = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}LowerLeg`]),
    ).get(`${side}LowerLeg` as AutoMovieHumanoidBone)!.worldPosition;

    // One goal's plan: its contact, the chamber folded from it, and the leg's
    // path. A feint ends on the chamber, and a kick that lands opens the knee
    // from it onto the fitted contact leg, arriving with its share of the
    // opening's peak speed.
    const contact = (
      goal: IAutoMovieVector3,
      decided: number | undefined,
      prefer?: number,
      driven?: number,
      chamber?: number,
    ): IPlanned => {
      const found: KickContact.IContact = KickContact.choose(
        props,
        { body, side, technique: p.technique, line, direction, planned: goal },
        { turn, pitch, ...(driven === undefined ? {} : { drive: driven }) },
        decided,
        prefer,
      );
      const fit: KickChain.IFit = found.fit;
      const folded: number =
        chamber ??
        fit.flexion + (KickForm.CHAMBER_FLEXION - fit.flexion) * amplitude;
      const key: KickChamber.IKey = KickChamber.fold(
        body,
        side,
        fit.pose,
        folded,
      );
      return {
        goal,
        carriage: found.carriage,
        fit,
        leg: KickSwing.create({
          body,
          side,
          timing,
          base: found.base,
          key,
          path: round ? "hinge" : "thrust",
          contact:
            feint && round
              ? key
              : { knee: fit.knee, ankle: fit.ankle, rotation: fit.rotation },
          flexion: {
            chamber: folded,
            contact: feint ? folded : fit.flexion,
            least: KickForm.FLEXION[p.technique][0],
          },
          speed: feint
            ? 1
            : round
              ? StrikingSkill.IMPACT_SPEED_SHARE.kick
              : KickForm.PUSH_SPEED_SHARE,
          plant: { knee, ankle: origin, rotation: feet[side].rotation },
          step: Vector3.scale(line, found.carriage.step),
        }),
      };
    };
    return {
      aim,
      first,
      planned,
      line,
      kept,
      offset,
      props,
      origin,
      feint,
      contact,

      // The launch's contact decides the step; a feint does not step.
      launched: contact(
        planned,
        kept?.step ?? (feint ? 0 : undefined),
        undefined,
        kept?.drive,
      ),
    };
  }

  /** Whether two points have the same components exactly. */
  function same(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  }

  /** The height band of a target point against a body's own heights, the floor at zero. */
  function band(
    body: IAutoMovieMotionHumanBody,
    point: IAutoMovieVector3,
  ): "low" | "middle" | "high" {
    if (point.y < body.measure.waistHeight * KickForm.BAND.low) return "low";
    if (point.y < body.measure.shoulderHeight * KickForm.BAND.middle)
      return "middle";
    return "high";
  }
}
