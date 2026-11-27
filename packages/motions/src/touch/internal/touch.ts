import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchEffectors,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionHumanTouchStance,
  IAutoMovieMotionManner,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { operate } from "../../affordance/internal/operate";
import { AutoMovieMotionHumanArmPlanned } from "../../compose/internal/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTouchContacts } from "../../compose/internal/AutoMovieMotionHumanTouchContacts";
import { AutoMovieMotionHumanTouchForm } from "../../compose/internal/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchLaid } from "../../compose/internal/AutoMovieMotionHumanTouchLaid";
import { motionManner } from "../../compose/internal/motionManner";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { HumanHeld } from "../../handling/internal/HumanHeld";
import { HumanHeldUse } from "../../handling/internal/HumanHeldUse";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { touchBalance } from "./touchBalance";
import { touchClock } from "./touchClock";
import { touchCrossedSupport } from "./touchCrossedSupport";
import { touchEffectors } from "./touchEffectors";
import { touchFaces } from "./touchFaces";
import { touchFingerStance } from "./touchFingerStance";
import { touchHand } from "./touchHand";
import { touchHold } from "./touchHold";
import { touchLayouts } from "./touchLayouts";
import { touchPresented } from "./touchPresented";
import { touchRegion } from "./touchRegion";
import { touchSide } from "./touchSide";
import { touchStance } from "./touchStance";

/*
 * One or both hands touch a partner's or the performer's own region with a tap,
 * pat, stroke, rub, press, squeeze, hold or scratch (Jung et al. 2017). Social
 * touches and self-directed touches are rows of this one law, each stating
 * effector, region, kind and timing.
 *
 * Free-space transport brings the hand to the region; the kind's stroke repeats
 * `count` times, holds, then returns in the reach's time. Manner scales tempo,
 * lift and travel. The entry body holds except for the rise and lean the arm
 * needs. A grounded performer can take one step toward an external site beyond
 * its planted reach (`touchStance`). Seated and carried touches are bounded by
 * the reach from their existing base. Self regions use the entry limb, except
 * that the other arm is presented across the waist, palm down, on the same
 * envelope (`touchPresented`). A leg's region follows the legs as a lean leaves
 * them. Thus a touched limb stays independent of the touching hand or has an
 * explicit presentation.
 *
 * Events: the phrase instants (`ready` on the region, `strokeStart` to
 * `strokeEnd` the repetitions, `relax` leaving). A touch may be cut before it
 * arrives or from `relax` on, into standing, a walk, a gesture or another
 * touch, the declined handshake's rule.
 */
export namespace touch {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "touch";

  /*
   * Cancel table.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    ...AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      gesture: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    }),
  };

  /*
   * A touch may be performed over a carrier: it claims the touching arms and
   * hands, and the trunk when it must lean.
   */
  export const overlay: boolean = true;

  /*
   * Each part's effector (`touchEffectors`).
   */
  export const EFFECTORS: Readonly<
    Record<
      IAutoMovieMotionHumanTouchEffectors.With,
      IAutoMovieMotionHumanTouchEffector.IEffector
    >
  > = touchEffectors.TABLE;

  /*
   * The share of the arm's length (upper arm and forearm) the wrist is kept
   * within before the trunk leans in, so the elbow never locks straight on a
   * region: the one provisional share an operated part is reached by too
   * (`operate.REACH`).
   */
  export const REACH: number = operate.REACH;

  /*
   * Plan a touch.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the count is not a positive whole number, the
   * hold is negative, the clearance is not positive, a site's radius is
   * negative, the region is out of reach, `prop` names a prop the hand does
   * not hold or a point it lacks, `grasp` comes without a prop, its point or
   * a region of the performer's own, or a rest names the other hand's arm on
   * a touch of one hand.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    return touchCrossedSupport.plan(
      context,
      (
        c: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
        attempt?: touchCrossedSupport.IAttempt,
      ): IAutoMovieMotionHumanActionPlan => planned(c, attempt),
    );
  }

  /*
   * A light, sudden flick of the hand's surface, seconds a stroke: no study of
   * a hair flick or a brushing flick was found, so the duration of a natural
   * flick gesture stands in as a proxy, 0.151 s (151 +- 53 ms, Moyle and
   * Cockburn 2003, "A Flick in the Right Direction", AUIC 2003, CRPIT 18; 29
   * participants, 5200 flicks measured at a pointing device).
   */
  export const FLICK: number = 0.151;

  /*
   * The touch law with each repetition lasting a given time, for a row whose
   * stroke is measured on its own (a flick) rather than read off its form's
   * speed (`AutoMovieMotionHumanTouchForm.FORMS`). Internal to the rows; it
   * adds no parameter to the touch's schema.
   * Parameter seconds: Each repetition's length, seconds, before the manner's time
   * scale.
   * Returns: The law, the touch's name, cancel table and refusals with the
   * repetition fixed.
   */
  export function stroked(
    seconds: number,
  ): IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTouch.IParams> {
    return {
      name,
      interrupts,
      overlay,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
      ): IAutoMovieMotionHumanActionPlan =>
        touchCrossedSupport.plan(
          context,
          (
            c: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
            attempt?: touchCrossedSupport.IAttempt,
          ): IAutoMovieMotionHumanActionPlan => planned(c, attempt, seconds),
        ),
    };
  }

  /*
   * Build one reach using its actual girdle posture, material sites and
   * transport clock; a given repetition's period replaces the form's.
   */
  function planned(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
    attempt?: touchCrossedSupport.IAttempt,
    repeated?: number,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanTouch.IParams = context.params;
    // A person naming the performer is the performer's own body, touched as
    // a `self` target is: its regions ride the posture being solved.
    const own = (t: IAutoMovieMotionTarget): IAutoMovieMotionTarget =>
      t.kind === "person" && t.subject === context.subject
        ? { kind: "self", region: t.region }
        : t;
    if (
      own(p.target) !== p.target ||
      (p.other !== undefined && own(p.other) !== p.other)
    )
      return (repeated === undefined ? touch : stroked(repeated)).plan({
        ...context,
        params: {
          ...p,
          target: own(p.target),
          ...(p.other === undefined ? {} : { other: own(p.other) }),
        },
      });
    const body = context.body;
    const kind: IAutoMovieMotionHumanTouchForm.Kind = p.kind ?? "pat";
    const still: boolean =
      kind === "press" || kind === "squeeze" || kind === "hold";
    const count: number = p.count ?? (kind === "stroke" || still ? 1 : 3);
    const hold: number = p.hold ?? (still ? 1.2 : 0.4);
    HumanBound.least("hold", hold, 0, "s");
    if (p.clear !== undefined) HumanBound.above("clear", p.clear, 0, "hand");
    const standoff: number = (p.clear ?? 0) * body.measure.hand;
    const modifiers: IAutoMovieMotionManner.IModifiers = motionManner(
      context,
      p.manner,
    );
    // The part of the hand that touches; the hand is the author's, or the
    // one whose arm reaches the region with the least strain (`touchSide`).
    const touching: IAutoMovieMotionHumanTouchEffector.IEffector =
      AutoMovieMotionHumanTouchForm.curled(
        EFFECTORS[p.effector ?? "palm"],
        kind,
      );
    const first: AutoMovieHumanSide = touchSide(context, touching);
    const resting = AutoMovieMotionHumanTouchContacts.sided(
      p.rests,
      first,
      p.other !== undefined,
      context.subject,
    );

    // The hand part that touches, or the point of the prop the hand holds.
    const requested: IAutoMovieMotionHumanTouchEffector.IEffector =
      p.prop === undefined
        ? touching
        : HumanHeld.effector(
            context,
            { effector: EFFECTORS[p.effector ?? "palm"] },
            first,
            p.prop,
            p.point,
          );
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;

    // A tool held for its use keeps the rotation its grasp presents it in at
    // the region; the first hand alone holds it.
    const kept: IAutoMovieMotionHumanGrasp.IKey | null = HumanHeldUse.kept(
      context,
      first,
      {
        ...(p.prop === undefined ? {} : { prop: p.prop }),
        ...(p.point === undefined ? {} : { point: p.point }),
        ...(p.grasp === undefined ? {} : { grasp: p.grasp }),
      },
      p.target.kind === "self" ? p.target.region : null,
    );
    const shown: touchPresented.IPresented | null =
      p.other === undefined ? touchPresented(context, first, p.target) : null;
    const bones = shown?.bones ?? poseBones(body, context.entry.pose);
    const hands: [AutoMovieHumanSide, IAutoMovieMotionTarget][] = [
      [first, p.target],
      ...(p.other === undefined
        ? []
        : [
            [first === "right" ? "left" : "right", p.other] as [
              AutoMovieHumanSide,
              IAutoMovieMotionTarget,
            ],
          ]),
    ];
    // Each region at a second, a leg's on the leaning legs and the first
    // hand's at its site.
    const placed: ReturnType<typeof touchRegion.reader> = touchRegion.reader(
      context,
      bones,
      first,
      p.target,
      p.site,
    );

    // The rise and the lean for a region beyond the standing arm, measured to
    // the first hand's wrist. Only a body on its own two feet rises.
    const grounded: boolean =
      context.carrier === undefined &&
      context.entry.feet.left.planted &&
      context.entry.feet.right.planted &&
      context.entry.supports.every(
        (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          /Foot$/.test(s.part),
      );
    // The first arm laid on its region at the stroke's start: its wrist is
    // what the stance reaches for, and the whole arm what the lean weighs.
    const laidOn =
      (
        effector: IAutoMovieMotionHumanTouchEffector.IEffector,
        leading: touchHold.ILaid,
      ) =>
      (posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal =>
        AutoMovieMotionHumanTouchLaid.rest(
          body,
          posture,
          first,
          effector,
          placed(p.target, true)(posture, 0),
          leading.tangent,
          AutoMovieMotionHumanBend.hang(body, posture, first),
          leading.lay,
          leading.axis,
          p.elbow,
        );
    // Two hands on regions off to one side face them (`touchFaces`).
    const faces: IAutoMovieVector3 | undefined =
      p.other === undefined
        ? undefined
        : touchFaces(
            bones,
            entry,
            placed(p.target, false)(entry, 0).point,
            placed(p.other, false)(entry, 0).point,
          );
    const fit = (
      hand: IAutoMovieMotionHumanTouchEffector.IEffector,
    ): AutoMovieTouchFit => {
      const layout: touchHold.Lay = touchLayouts(
        hands,
        touchHold.lay(context, bones, hand, placed),
      );
      const arm: ReturnType<typeof laidOn> = laidOn(
        hand,
        layout(first, p.target),
      );
      return [
        layout,
        touchStance(
          {
            body,
            standing: entry,
            ...(attempt?.assist === true
              ? { girdles: touchCrossedSupport.girdles(body, first) }
              : {}),
            ...(grounded ? { feet: context.entry.feet } : {}),
            fixed: context.carrier === undefined,
            side: first,
            // Straight arms lock the elbow and reach the arm's whole length.
            share: p.arms === "straight" ? 1 : REACH,
            wrist: (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
              arm(posture).point,
            arm,
            refuse: (beyond: number, limit: number): string =>
              `The touched region is ${(beyond * 1000).toFixed(0)} mm beyond the ${first} arm at a lean of ${limit} degrees`,
            ...(faces === undefined ? {} : { faces }),
          },
          grounded && p.target.kind !== "self",
        ),
      ];
    };
    const [effector, [laid, adjusted]]: ReturnType<
      typeof touchFingerStance<AutoMovieTouchFit>
    > = touchFingerStance(
      body,
      first,
      requested,
      p.effector === "fingertips" && p.prop === undefined,
      fit,
    );
    const stance: IAutoMovieMotionHumanTouchStance.IStance = adjusted.stance;
    const leaning: boolean = stance.leaning;
    const region = (target: IAutoMovieMotionTarget) => placed(target, leaning);

    // While the hand lies on a person it rides them: read as they are.
    const felt: ReturnType<typeof touchRegion.reader> = touchRegion.reader(
      touchHold.felt(context),
      bones,
      first,
      p.target,
      p.site,
    );

    // The posture the stroke is entered from (the entry, risen), and the one
    // the arms are solved on at plan time: risen and leaned as the stroke's
    // start asks, where the arm reaches its region.
    const risen: IAutoMovieMotionHumanPosture = stance.risen;
    const reached: IAutoMovieMotionHumanPosture = stance.reached;

    const clock: IAutoMovieMotionClock = touchClock({
      context,
      bones,
      hands,
      region,
      effector,
      attempt,
      reached,
      laid,
      kind,
      count,
      hold,
      repeated,
      modifiers,
    });

    const window: HumanPhysics.Window = HumanPhysics.fromClock(
      p,
      {},
      context.start,
      clock,
      context.instant,
    );
    if (window !== null && !grounded)
      throw new AutoMovieMotionHumanRefusal({
        kind: "base",
        axis: "balance",
        value: window.by,
        feasible: null,
        reason:
          "this touch has no planted foot base for the requested balance shift",
        fix: "give the touch a planted foot base or omit the shift",
      });
    const primitives: IAutoMovieMotionHumanPrimitive[] = stance.primitives(
      clock,
      touchBalance(
        body,
        window,
        first,
        laidOn(effector, laid(first, p.target)),
        clock,
        (): IAutoMovieMotionHumanActionPlan =>
          composeMotionHumanAction({
            base: adjusted.base(context, clock),
            clock,
            primitives: stance.primitives(clock),
            contact: "ready",
          }),
      ),
    );
    if (shown !== null)
      primitives.push(
        touchPresented.carry(body, context.entry.pose, shown, clock),
      );
    // Two hands are planned as one trajectory; one hand is a group of one,
    const together: IAutoMovieMotionHumanArmPlanned.ITogether | undefined =
      AutoMovieMotionHumanArmPlanned.together(
        context.handover,
        true,
        context.tempo,
      );
    // The first hand's region without its site, where a ruled or drawn site
    // is laid off from.
    const unsited: ReturnType<typeof touchRegion.reader> = touchRegion.reader(
      context,
      bones,
      first,
      p.target,
      undefined,
    );
    const hand: touchHand.IPrepared = {
      context,
      first,
      region,
      unsited,
      felt,
      leaning,
      laid,
      reached,
      risen,
      effector,
      kept,
      clock,
      kind,
      count,
      extent: modifiers.extent,
      together,
      attempt,
      resting,
      standoff,
    };
    for (const [side, target] of hands)
      primitives.push(...touchHand(hand, side, target));
    const plan: IAutoMovieMotionHumanActionPlan = {
      ...composeMotionHumanAction({
        base: adjusted.base(context, clock),
        clock,
        primitives,
        contact: "ready",
      }),
      ...HumanPhysics.declared(context.params, window),
    };
    return p.prop === undefined
      ? plan
      : HumanHeld.kept(context, plan, first, p.prop);
  }
}

/*
 * The exact hand layouts and support admitted for one fingertip inclination.
 */
type AutoMovieTouchFit = readonly [touchHold.Lay, touchStance.IChosen];
