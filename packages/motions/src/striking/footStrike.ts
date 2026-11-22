import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFootStrike,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { CloseStrikeLegs } from "./CloseStrikeLegs";
import { FootStrikeForms } from "./FootStrikeForms";
import { FootStrikeLeg } from "./FootStrikeLeg";
import { FootStrikeTilt } from "./FootStrikeTilt";
import { KickForm } from "./KickForm";
import { StrikingBody } from "./StrikingBody";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * The foot strikes (`IAutoMovieMotionHumanFootStrike`): the kicking ankle
 * from its plant through a chamber to the contact and back, the support leg
 * planted on its ball, the pelvis turned, spun or lifted as the technique and
 * its modifiers ask.
 *
 * The ankle's goal is the contact point's: the foot turned to the
 * technique's attitude (`StrikingBody.foot`) and the ankle placed so the
 * heel or sole lands on the target. A leg asked higher than the hip's range
 * reaches tilts the body away through the support hip (`FootStrikeTilt`). A
 * contact beyond the leg's reach is moved along the hip's line to the leg's
 * full reach, where it lands short, as a capoeira kick passes the partner
 * across the roda; a sweep that cannot reach the partner's ankle is refused
 * with the distance. The
 * chamber folds the knee in front of the hip (above it for an axe kick, on
 * the far side of the travel for a hook or a crescent), and the extension
 * aims through the target so it meets it at 0.82 of its unit, after its peak
 * speed. The knee bends toward the line between the hip and the ankle's
 * goal, raised.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the foot's goal, the reach rule, the chamber and the extension's timing source.
 * @evidence contracts/development/design.md#principled-representation One law record over the shared clock, base and lower-body primitive, with a data table of the techniques.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table and the plan registration reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The techniques differ by data in `FootStrikeForms.FORMS`; timings are the cited ones or the kick's.
 */
export namespace footStrike {
  /** Action key. */
  export const name: AutoMovieMotionHumanActionKey = "footStrike";

  /** Cancel table: a foot strike chains into another from its impact. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    footStrike: [
      { window: ["impact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
  };

  /** The share of the extension unit at which the foot meets the target (Wąsik 2011). */
  export const MEET: number = 0.82;

  /** A side kick's launch to contact, seconds: the middle of Pieter and Pieter's 0.70 to 0.84 s. */
  export const SIDE: number = 0.77;

  /** The round kick's preparation, chamber and extension to contact, seconds (Gavagan and Sayers 2017). */
  export const KICK: number = 0.074 + 0.25 * 1.02;

  /** The round kick's recoil, seconds (Gavagan and Sayers 2017). */
  export const RECOIL: number = 0.65;

  /** The share of the chamber the kicking foot stays planted before it leaves (provisional). */
  export const RELEASE: number = 0.1;

  /** The share of the foot's rise it leads its travel by, and of its return it sets down after (provisional). */
  export const LEAD: number = 0.2;

  /** The share of the leg's length a low target is reached at, short of straight (provisional). */
  export const STRAIGHT: number = 0.97;

  /** The most the hips drop for a low target, a share of the leg's length (provisional). */
  export const DROP: number = 0.25;

  /** A jump's added time and its height, a share of the leg (provisional). */
  export const JUMP: readonly [seconds: number, height: number] = [0.15, 0.25];

  /**
   * Plan a foot strike.
   *
   * @param context The action's context.
   * @returns The plan, whose decisive instant is `impact`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the plan's events.
   * @evidence contracts/development/implementation.md#principled-implementation Two minimum-jerk units carry the ankle through the chamber to the contact, a third back to the plant; the lower body turns, spins and hops on the strike's share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Timing, the target and the form, the contact goal and the chamber, then the lower body and the kicking leg.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target beyond reach is missed at full reach; provisional shares are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms The goal is solved once; each posture costs the lowering and leg fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the kick's timing, the close strike's lower body and the shared clock and base.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its fixed geometry until release.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFootStrike.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanFootStrike.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const lead: AutoMovieHumanSide = StrikingTarget.lead(context.entry);
    const rear: AutoMovieHumanSide = StrikingStance.rear({ lead });
    const side: AutoMovieHumanSide = p.leg === "lead" ? lead : rear;
    const support: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const form: FootStrikeForms.IForm = FootStrikeForms.FORMS[p.technique];

    // Timing: the side kick's own execution, else the kick's, a spin and a
    // jump adding theirs, skill scaling as the kick's.
    const strike: number = StrikingSkill.strike(context.skill);
    const spinTime: number = p.spin === true ? KICK : 0;
    const jumpTime: number = p.jump === true ? JUMP[0] : 0;
    const shown: number =
      ((p.technique === "side" ? SIDE : KICK) + spinTime + jumpTime) * strike;
    const recoil: number = RECOIL * StrikingSkill.recovery(context.skill);
    const duration: number = shown + recoil;
    const chamber: number =
      spinTime * strike + 0.5 * (shown - spinTime * strike);
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(duration, [
      { name: "launch", seconds: 0 },
      { name: "chamber", seconds: chamber },
      { name: "impact", seconds: shown },
      { name: "recovered", seconds: duration },
    ]);
    const share = (seconds: number): number =>
      seconds <= shown
        ? minimumJerk.share(seconds / shown)
        : 1 - minimumJerk.share((seconds - shown) / recoil);

    // The geometry reads the target, which may only be read from settled
    // placement, so it is built on first use and dropped when placement
    // settles, as the close strike's is.
    let built: IAutoMovieMotionHumanActionPlan | undefined;
    const build = (): IAutoMovieMotionHumanActionPlan => {
      if (built !== undefined) return built;
      // The target, the line and the form's directions.
      const target: IAutoMovieVector3 = StrikingTarget.aim(
        context,
        p.at,
        context.start,
        (): number => m.hipHeight,
      );
      const line: IAutoMovieVector3 = StrikingTarget.line(
        entry.root,
        target,
        entry.yaw,
      );
      const left: IAutoMovieVector3 = Vector3.normalize(
        Vector3.cross(FootStrikeForms.UP, line),
      );
      const outward: IAutoMovieVector3 = Vector3.scale(
        left,
        side === "left" ? 1 : -1,
      );
      const travel: IAutoMovieVector3 = form.travel(line, left, outward);
      let rotation: IAutoMovieQuaternion = StrikingBody.foot(
        form.toes(line, left, outward),
        form.instep(line, left, outward),
      );

      // The lower body: a side kick turns the kicking hip to the target, a back
      // kick turns away on the support ball, a spin turns a whole turn first.
      const sign: number = side === "left" ? -1 : 1;
      const turn: number = p.technique === "side" ? 90 * sign : 0;
      const away: number = p.technique === "back" ? 180 * sign : 0;
      const whole: number = p.spin === true ? 360 * sign : 0;
      const spun = (seconds: number): number =>
        whole *
          minimumJerk.share(
            Math.min(1, seconds / Math.max(1e-6, spinTime * strike)),
          ) +
        away * share(seconds);
      const lift: number = JUMP[1] * (m.thigh + m.shank);
      const hop = (seconds: number): number =>
        p.jump === true && seconds > chamber && seconds < shown + 0.5 * JUMP[0]
          ? lift *
            Math.sin(
              (Math.PI * (seconds - chamber)) /
                (shown + 0.5 * JUMP[0] - chamber),
            )
          : 0;
      const feet: ReturnType<typeof StrikingTarget.feet> = StrikingTarget.feet(
        context.entry,
      );
      const lowerWith = (
        drop: number,
        tilt?: CloseStrikeLegs.ITilt,
      ): IAutoMovieMotionHumanPrimitive =>
        CloseStrikeLegs(body, entry, feet, support, {
          duration,
          turn,
          lean: 0,
          shift: { x: 0, y: 0, z: 0 },
          share,
          spin: spun,
          hop,
          drop,
          free: side,
          // The support rises onto its ball with the strike, as a round
          // kick's does (`KickForm.PIVOT`).
          raise: KickForm.PIVOT.raise,
          ...(tilt === undefined ? {} : { tilt }),
        });
      const hipOf = (
        primitive: IAutoMovieMotionHumanPrimitive,
      ): IAutoMovieVector3 =>
        HumanTrunk.resolve(
          body,
          primitive.write(entry, shown),
          undefined,
          undefined,
          new Set<AutoMovieHumanoidBone>([`${side}UpperLeg`]),
        ).get(`${side}UpperLeg`)!.worldPosition;
      const offset: IAutoMovieVector3 = HumanFoot.point(
        body,
        side,
        form.contact,
        {
          ankle: { x: 0, y: 0, z: 0 },
          rotation,
        },
      );
      let ankle: IAutoMovieVector3 = Vector3.subtract(target, offset);
      const reach: number = m.thigh + m.shank;

      // A low target drops the hips, the support knee bending, until the leg
      // reaches it a little short of straight, at most `DROP` of the leg.
      const standing: IAutoMovieVector3 = hipOf(lowerWith(0));
      const level: number = Math.hypot(
        ankle.x - standing.x,
        ankle.z - standing.z,
      );
      const straight: number = STRAIGHT * reach;
      const drop: number =
        level < straight && Vector3.distance(ankle, standing) > straight
          ? Math.min(
              DROP * reach,
              Math.max(
                0,
                standing.y -
                  ankle.y -
                  Math.sqrt(straight * straight - level * level),
              ),
            )
          : 0;
      const dropped: IAutoMovieMotionHumanPrimitive = lowerWith(drop);
      const low: IAutoMovieVector3 = drop === 0 ? standing : hipOf(dropped);
      // A leg asked higher than the hip's range reaches at its azimuth tilts
      // the body away from it through the support hip, at most
      // `KickForm.LEAN_MOST` (`FootStrikeTilt`); the contact is placed again
      // from the tilted hip below.
      const tilt: CloseStrikeLegs.ITilt | undefined = FootStrikeTilt.of(
        side,
        dropped.write(entry, shown).yaw,
        low,
        ankle,
      );
      const lower: IAutoMovieMotionHumanPrimitive =
        tilt === undefined ? dropped : lowerWith(drop, tilt);
      const hip: IAutoMovieVector3 = tilt === undefined ? low : hipOf(lower);
      // A sweep that cannot reach the partner's ankle is refused: it has no
      // miss to show.
      if (
        p.technique === "sweep" &&
        p.at.kind === "person" &&
        Vector3.distance(ankle, hip) > reach
      )
        throw new HumanRefusal({
          kind: "reach",
          axis: "at",
          value: Vector3.distance(ankle, hip),
          reason: `the sweep needs ${Vector3.distance(ankle, hip).toFixed(3)} m from the hip to the partner's ankle, beyond the leg's ${reach.toFixed(3)} m`,
          fix: "stand closer to the partner, or sweep a nearer leg",
        });
      const clamp = (goal: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.distance(goal, hip) > reach
          ? Vector3.add(
              hip,
              Vector3.scale(
                Vector3.normalize(Vector3.subtract(goal, hip)),
                reach,
              ),
            )
          : goal;
      ankle = clamp(ankle);

      // The foot's attitude is the form's, turned square to the leg it ends,
      // so the ankle stays near neutral at the contact whatever the target's
      // height; the ankle is placed again for that attitude.
      const square = (
        v: IAutoMovieVector3,
        along: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        Vector3.subtract(v, Vector3.scale(along, Vector3.dot(v, along)));
      for (let i: number = 0; i < 2; ++i) {
        const leg: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(ankle, hip),
        );
        const toes: IAutoMovieVector3 = square(
          form.toes(line, left, outward),
          leg,
        );
        if (Vector3.length(toes) < 1e-3) break;
        const pointing: IAutoMovieVector3 = Vector3.normalize(toes);
        rotation = StrikingBody.foot(
          pointing,
          Vector3.normalize(
            square(square(form.instep(line, left, outward), leg), pointing),
          ),
        );
        ankle = clamp(
          Vector3.subtract(
            target,
            HumanFoot.point(body, side, form.contact, {
              ankle: { x: 0, y: 0, z: 0 },
              rotation,
            }),
          ),
        );
      }

      // The chamber: the knee folded before the hip, above it for an axe, on
      // the far side of the travel for a sweep across the target. The front
      // chamber's ankle lies `fold` from the hip; a sweep's is folded as far
      // toward its far side, so its knee is bent as much and the extension is
      // the knee's opening, not a straight leg swung from out of reach.
      const across: boolean =
        p.technique === "hook" || p.technique === "crescent";
      const fold: number =
        Vector3.length(
          Vector3.add(
            Vector3.scale(FootStrikeForms.DOWN, 0.45),
            Vector3.scale(line, 0.25),
          ),
        ) * reach;
      const folded: IAutoMovieVector3 =
        p.technique === "axe"
          ? Vector3.add(
              hip,
              Vector3.add(
                Vector3.scale(FootStrikeForms.UP, 0.6 * reach),
                Vector3.scale(line, 0.3 * reach),
              ),
            )
          : across
            ? Vector3.add(
                hip,
                Vector3.scale(
                  Vector3.normalize(
                    Vector3.subtract(
                      Vector3.subtract(ankle, Vector3.scale(travel, 0.5 * reach)),
                      hip,
                    ),
                  ),
                  fold,
                ),
              )
            : Vector3.add(
                hip,
                Vector3.add(
                  Vector3.scale(FootStrikeForms.DOWN, 0.45 * reach),
                  Vector3.scale(line, 0.25 * reach),
                ),
              );
      const through: IAutoMovieVector3 = Vector3.add(
        folded,
        Vector3.scale(
          Vector3.subtract(ankle, folded),
          1 / minimumJerk.share(MEET),
        ),
      );
      // The knee bends toward the line between the hip and the ankle, raised,
      // its turn about the leg kept inside the hip's twist range
      // (`FootStrikeTilt.knee`).
      const knee: IAutoMovieVector3 = FootStrikeTilt.knee(
        side,
        resolveHumanPosture.heading(lower.write(entry, shown)),
        hip,
        ankle,
        Vector3.add(
          Vector3.lerp(hip, ankle, 0.5),
          Vector3.scale(FootStrikeForms.UP, 0.25 * m.thigh),
        ),
      );
      const release: number = RELEASE * chamber;
      const leg: IAutoMovieMotionHumanPrimitive = FootStrikeLeg({
        body,
        pose: context.entry.pose,
        entry,
        lower,
        side,
        feet,
        release,
        chamber,
        shown,
        recoil,
        duration,
        folded,
        through,
        knee,
        ankle,
        rotation,
        lead: LEAD,
        meet: MEET,
      });
      // The support foot stands on its ball throughout, or around the jump's
      // flight.
      const flight: readonly [number, number] = [
        chamber / duration,
        (shown + 0.5 * JUMP[0]) / duration,
      ];
      const contacts: IAutoMovieMotionHumanContactWindow[] = [
        {
          part: `${side}Foot`,
          kind: "plant",
          from: 0,
          to: release / duration,
          support: { kind: "ground" },
        },
      ];
      contacts.push(
        ...(p.jump === true
          ? [
              [0, flight[0]],
              [flight[1], 1],
            ]
          : [[0, 1]]
        ).map(
          ([
            from,
            to,
          ]: readonly number[]): IAutoMovieMotionHumanContactWindow => ({
            part: `${support}Foot`,
            // The support stands on its ball, risen with the strike, and a
            // spin or a back kick turns it there.
            kind: "pivot",
            from: from!,
            to: to!,
            support: { kind: "ground" },
          }),
        ),
      );
      built = composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
        clock,
        primitives: [lower, leg],
      });
      return built;
    };
    return {
      duration,
      events: clock.events(),
      contact: shown,
      get contacts(): IAutoMovieMotionHumanActionPlan["contacts"] {
        return build().contacts;
      },
      posture: (
        ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
      ): IAutoMovieMotionHumanPosture => build().posture(...args),
      settle: (): void => {
        built = undefined;
      },
    };
  }
}
