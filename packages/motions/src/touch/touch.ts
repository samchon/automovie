import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchEffectors,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionHumanTouchSite,
  IAutoMovieMotionHumanTouchStance,
  IAutoMovieMotionManner,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { operate } from "../affordance/operate";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchContacts } from "../compose/AutoMovieMotionHumanTouchContacts";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchStance } from "../compose/AutoMovieMotionHumanTouchStance";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanHeld } from "../handling/HumanHeld";
import { HumanHeldUse } from "../handling/HumanHeldUse";
import { HumanBound } from "../law/HumanBound";
import { poseBones } from "../posture/poseBones";
import { touchEffectors } from "./touchEffectors";
import { touchHold } from "./touchHold";
import { touchLayouts } from "./touchLayouts";
import { touchPresented } from "./touchPresented";
import { touchReach } from "./touchReach";
import { touchRegion } from "./touchRegion";
import { touchSide } from "./touchSide";

/**
 * One or both hands touch a partner's or the performer's own region with a
 * tap, pat, stroke, rub, press, squeeze, hold or scratch (Jung et al. 2017).
 * Social touches (#3284) and self-directed touches (#3285) are rows of this
 * one law, each stating effector, region, kind and timing.
 *
 * Free-space transport brings the hand to the region; the kind's stroke
 * repeats `count` times, holds, then returns in the reach's time. Manner
 * scales tempo, lift and travel. Feet stay planted and the entry body holds,
 * except for the rise and lean the arm needs (`AutoMovieMotionHumanTouchStance`).
 * Seated or carried bodies do not rise; a region beyond the lean limit is refused.
 * Self regions use the entry limb, except that the other arm is presented
 * across the waist, palm down, on the same envelope (`touchPresented`). A leg's
 * region follows the legs as a lean leaves them. Thus a touched limb stays
 * independent of the touching hand or has an explicit presentation.
 *
 * Events: the phrase instants (`ready` on the region, `strokeStart` to
 * `strokeEnd` the repetitions, `relax` leaving). A touch may be cut before
 * it arrives or from `relax` on, into standing, a walk, a gesture or another
 * touch, the declined handshake's rule.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the families it serves, the timing, the source of the kinds, what stays still and the events and cuts.
 * @evidence contracts/development/design.md#principled-representation A law record composed of the touch primitive per hand over a held base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One law for every touch row; no row is a law of its own.
 */
export namespace touch {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "touch";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    ...AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      gesture: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    }),
  };

  /** A touch may be performed over a carrier: it claims the touching arms and hands, and the trunk when it must lean. */
  export const overlay: boolean = true;

  /** Each part's effector (`touchEffectors`). */
  export const EFFECTORS: Readonly<
    Record<
      IAutoMovieMotionHumanTouchEffectors.With,
      IAutoMovieMotionHumanTouchEffector.IEffector
    >
  > = touchEffectors.TABLE;

  /** The share of the arm's length (upper arm and forearm) the wrist is kept within before the trunk leans in, so the elbow never locks straight on a region: the one provisional share an operated part is reached by too (`operate.REACH`). */
  export const REACH: number = operate.REACH;

  /**
   * Plan a touch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the count is not a positive whole number, the hold is negative, the clearance is not positive, a site's radius is negative, the region is out of reach, `prop` names a prop the hand does not hold or a point it lacks, `grasp` comes without a prop, its point or a region of the performer's own, or a rest names the other hand's arm on a touch of one hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals; the law's doc gives the timing and the sources.
   * @evidence contracts/development/implementation.md#principled-implementation A phrase clock from the free-space transport of the farther hand, the kind's repetitions and the hold, with one touch stroke per hand over the base it was entered on or its carrier; a region the arm does not reach as it stands is closed by the girdle, the heels and the lean of `AutoMovieMotionHumanTouchStance`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Defaults, the stance, the clock, one stroke per hand, the composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Defaults are named per kind; a negative hold throws; no region or body is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry resolve, one stance solve and one elbow solve per hand at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates physical planning to its existing owners; exact declared hand/target entry-layout decisions and each hand's fixed reached-region frame share completed work only within this synchronous plan construction, without retaining sampled poses.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the entry bones and the clock.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
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
      return touch.plan({
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
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    // The part of the hand that touches; the hand is the author's, or the
    // one whose arm reaches the region with the least strain (`touchSide`).
    const touching: IAutoMovieMotionHumanTouchEffector.IEffector =
      AutoMovieMotionHumanTouchForm.curled(EFFECTORS[p.with ?? "palm"], kind);
    const first: AutoMovieHumanSide = touchSide.of(context, touching);
    const resting = AutoMovieMotionHumanTouchContacts.sided(
      p.rests,
      first,
      p.other !== undefined,
      context.subject,
    );

    // The hand part that touches, or the point of the prop the hand holds.
    const effector: IAutoMovieMotionHumanTouchEffector.IEffector =
      p.prop === undefined
        ? touching
        : HumanHeld.effector(
            context,
            { effector: EFFECTORS[p.with ?? "palm"] },
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
      p.other === undefined
        ? touchPresented.of(context, first, p.target)
        : null;
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

    const laid: touchHold.Lay = touchLayouts(
      hands,
      touchHold.lay(context, bones, effector, placed),
    );
    const leading: touchHold.ILaid = laid(first, p.target);

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
    const laidOn = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieHumanLimbGoal =>
      AutoMovieMotionHumanTouchLaid.rest(
        body,
        posture,
        first,
        effector,
        placed(p.target, true)(posture, 0),
        leading.tangent,
        AutoMovieMotionHumanBend.hang(body, posture, first),
        "arm",
      );
    const stance: IAutoMovieMotionHumanTouchStance.IStance =
      AutoMovieMotionHumanTouchStance.solve({
        body,
        standing: entry,
        ...(grounded ? { feet: context.entry.feet } : {}),
        side: first,
        share: REACH,
        wrist: (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
          laidOn(posture).point,
        arm: laidOn,
        refuse: (beyond: number, limit: number): string =>
          `The touched region is ${(beyond * 1000).toFixed(0)} mm beyond the ${first} arm at a lean of ${limit} degrees`,
      });
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

    // The reach's length: the farther hand's distance to its region at the entry.
    let far: number = 0;
    for (const [side, target] of hands) {
      const at: IAutoMovieVector3 = region(target)(entry, 0).point;
      const from: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
        body,
        bones,
        side,
        effector,
      );
      far = Math.max(
        far,
        Math.hypot(at.x - from.x, at.y - from.y, at.z - from.z),
      );
    }
    // At least as long as the arms need to keep within the audit's travel bound.
    const reach: number = Math.max(
      AutoMovieMotionHumanTiming.transport(far),
      touchReach.duration(
        body,
        context.entry.pose,
        reached,
        hands,
        effector,
        region,
        laid,
      ),
    );
    const repetition: number = AutoMovieMotionHumanTouchForm.period(
      body,
      kind,
      AutoMovieMotionHumanTiming.seconds(
        AutoMovieMotionHumanTouchForm.FORMS[kind].period,
      ),
    );
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: reach,
        attack: count * repetition,
        hold,
        retract: reach,
      }),
      modifiers,
    );

    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    primitives.push(...stance.primitives(clock));
    if (shown !== null)
      primitives.push(
        touchPresented.carry(body, context.entry.pose, shown, clock),
      );
    // Two hands are planned as one trajectory; one hand is a group of one,
    const together: IAutoMovieMotionHumanArmPlanned.ITogether | undefined =
      AutoMovieMotionHumanArmPlanned.together(context.handover);
    for (const [side, target] of hands) {
      const disc: number | undefined = touchRegion.disc(
        context,
        target,
        side === first ? p.site : undefined,
      );
      const support: IAutoMovieMotionHumanContactWindow.Support | undefined =
        target.kind === "person"
          ? { kind: "person", subject: target.subject, region: target.region }
          : target.kind === "self"
            ? {
                kind: "person",
                subject: context.subject,
                region: target.region,
              }
            : undefined;
      const { lay, tangent } = laid(side, target);
      let destination: IAutoMovieMotionHumanTouchSite.IFrame | undefined;
      const arrival: () => IAutoMovieMotionHumanTouchSite.IFrame =
        (): IAutoMovieMotionHumanTouchSite.IFrame =>
          (destination ??= region(target)(reached, 0));

      // A hand that meets its place end on runs from its elbow, so the
      // elbow's place is settled with the hand and serves as the hint too.
      const from: IAutoMovieVector3 | undefined =
        lay === "reach"
          ? AutoMovieMotionHumanTouchLaid.settled(
              body,
              reached,
              side,
              effector,
              arrival(),
              tangent,
              p.elbow,
            )
          : undefined;
      const own: IAutoMovieMotionHumanGrasp.IKey | null =
        side === first ? kept : null;
      const bend: IAutoMovieVector3 =
        from ??
        own?.bend ??
        AutoMovieMotionHumanTouchLaid.bend(
          body,
          reached,
          side,
          effector,
          arrival(),
          tangent,
          lay,
          undefined,
          p.elbow,
        );
      primitives.push(
        ...AutoMovieMotionHumanTouch.touch({
          body,
          clock,
          side,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          effector,
          region: touchHold.region(
            clock,
            region(target),
            felt(target, leaning),
          ),
          kind,
          count,
          tangent,
          extent: modifiers.extent,
          bend,
          reference:
            own === null
              ? AutoMovieMotionHumanTouchLaid.laid(
                  body,
                  reached,
                  side,
                  effector,
                  arrival(),
                  tangent,
                  bend,
                  lay,
                  undefined,
                  p.elbow,
                  from,
                )
              : AutoMovieMotionHumanTouchLaid.reference(body, reached, side, {
                  point: own.wrist.point,
                  rotation: own.wrist.rotation,
                  bend,
                }),
          lay,
          ...(own === null ? {} : { held: own.wrist.rotation }),
          ...(from === undefined ? {} : { from }),
          ...(p.elbow === undefined ? {} : { elbow: p.elbow }),
          entry: risen,
          ...(together === undefined ? {} : { together }),
          ...(disc === undefined ? {} : { disc }),
          ...(target.kind === "self"
            ? { on: body.surfaces.regions[target.region].bone }
            : {}),
          ...(resting(side).length === 0 ? {} : { rests: resting(side) }),
          ...(p.prop !== undefined && side === first
            ? { fingers: "keep" as const }
            : {}),
          ...(standoff > 0 ? { standoff } : {}),
          ...(support === undefined || standoff > 0
            ? {}
            : { contact: support }),
          ...(target.kind === "person"
            ? {
                others: touchHold.others(context, target, clock),
                perceived: touchHold.perceived(
                  context,
                  target,
                  clock,
                  region(target),
                ),
              }
            : {}),
        }),
      );
    }
    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.under(context, clock.duration),
        clock,
        primitives,
        contact: "ready",
      });
    return p.prop === undefined
      ? plan
      : HumanHeld.kept(context, plan, first, p.prop);
  }
}
