import { Vector3, wrapDegrees } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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
import { strikingStepSupport } from "./strikingStepSupport";

/** The alternatives of `BandResult`'s site. */
type BandResult = "low" | "middle" | "high";

/** The alternatives of `OfLevel`'s site. */
type OfLevel = "low" | "middle" | "high";

/**
 * The height band of a target point against a body's own heights, the floor at
 * zero.
 */
function band(
  body: IAutoMovieMotionHumanBody,
  point: IAutoMovieVector3,
): BandResult {
  if (point.y < body.measure.waistHeight * KickForm.BAND.low) return "low";
  if (point.y < body.measure.shoulderHeight * KickForm.BAND.middle)
    return "middle";
  return "high";
}

/**
 * A kick's launch.
 *
 * @param context The kick's context, its entry being the kick's own start.
 * @param timing The kick's timing.
 * @param t0 Film second of the kick's time zero.
 * @param kept What a redirect keeps of its source; a fresh kick reads its own
 *   line and steps up when short.
 * @returns The launch.
 */
export function KickLaunch(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
  timing: IAutoMovieMotionHumanKickGeometry.ITiming,
  t0: number,
  kept: IAutoMovieMotionHumanKickGeometry.IKept | undefined,
): KickLaunch.ILaunch {
  const p: IAutoMovieMotionHumanKick.IParams = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const { side, prep, impact } = timing;
  const support: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const round: boolean = p.technique === "round";
  const feint: boolean = p.feint !== undefined;
  const recovery: strikingStepSupport.ISupport | undefined =
    strikingStepSupport(context);
  const feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> =
    { ...StrikingTarget.feet(context.entry), ...recovery?.landings };

  // Where the target is, and the range a standing target is read at, from
  // the stance centre: how far ahead of it the root stands over the support
  // foot at contact, plus the leg's comfortable length for the push kick,
  // or for the round kick the comfortable share of the lower shin's
  // horizontal reach at the target's height from the hip's standing height.
  const stance: IAutoMovieMotionHumanStrikingTarget.IStance =
    StrikingTarget.stance(context.entry);
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
  const level: OfLevel = band(body, first);
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
  // prediction).
  const planned: IAutoMovieVector3 = Vector3.add(
    StrikingAim.predict(
      aim,
      t0 - StrikingTarget.LOOK,
      t0 + impact,
      StrikingAim.STEP,
    ),
    offset,
  );

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
    ...(recovery === undefined ? {} : { recovery }),
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
  ): KickLaunch.IPlanned => {
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

/**
 * What a kick fixes when it is launched: the point it aims at as the kicker
 * perceives it then, the line, the travel and the pelvis's turn that point
 * gives, the seeded miss, the carriage's inputs, and the launch's contact,
 * decided on the fitted figure (`KickContact`) with the chamber folded from it
 * and the leg's path.
 *
 * A kick's geometry is built again whenever the performance settles (another
 * action was placed, a stop was committed): three or four times a kick. Of what
 * it holds, only the tracker of the aim, the corrections' contacts and the
 * committed stop follow what settled; the launch follows the one reading the
 * kicker made before its start. So the launch is its own record, made once for
 * the plan, and a geometry is built on it. A settle that shows the partner
 * elsewhere at the launch's own reading (a stop committed on an earlier action
 * of theirs) gives a launch that reads differently, and only then is it made
 * again.
 */
export namespace KickLaunch {
  /** One goal's plan with the leg its contact fitted. */
  export interface IPlanned extends KickPlans.IPlan {
    /** The fitted contact leg. */
    fit: KickChain.IFit;
  }

  /** A kick's launch. */
  export interface ILaunch {
    /** The target's point at a film second, as the kicker reads it. */
    aim: (seconds: number) => IAutoMovieVector3;

    /** The point aimed at when the kick is launched, world metres. */
    first: IAutoMovieVector3;

    /**
     * The goal predicted at the launch with the seeded miss, world metres: the
     * tracker's planned goal.
     */
    planned: IAutoMovieVector3;

    /** The horizontal unit line toward the target. */
    line: IAutoMovieVector3;

    /**
     * What a redirect kept of its source when the launch was made; absent for a
     * fresh kick.
     */
    kept: IAutoMovieMotionHumanKickGeometry.IKept | undefined;

    /** The seeded miss added to the aim, world metres. */
    offset: IAutoMovieVector3;

    /** The carriage's inputs. */
    props: KickCarriage.IProps;

    /** The kicking ankle at the launch, world metres. */
    origin: IAutoMovieVector3;

    /** Whether the kick is a feint. */
    feint: boolean;

    /**
     * Solve a contact for a goal on this launch's line, with a decided step
     * (metres), a lean tried first (degrees), the pelvis drive a decided step
     * goes with (metres) and a chamber flexion in place of the skill's
     * (degrees) when given.
     */
    contact: (
      goal: IAutoMovieVector3,
      decided: number | undefined,
      prefer?: number,
      driven?: number,
      chamber?: number,
    ) => IPlanned;

    /**
     * The chamber's knee flexion when the launch's clearing decided it, degrees
     * (`KickClear`); the skill's own when absent.
     */
    chamber?: number;

    /** The launch's own contact, which decides the step. */
    launched: IPlanned;
  }
}
