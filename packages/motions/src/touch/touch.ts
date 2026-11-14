import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
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
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { HumanGrasp } from "../handling/HumanGrasp";
import { HumanHeld } from "../handling/HumanHeld";
import { HumanHeldUse } from "../handling/HumanHeldUse";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { touchEffectors } from "./touchEffectors";
import { touchHold } from "./touchHold";
import { touchPresented } from "./touchPresented";
import { touchReach } from "./touchReach";
import { touchRegion } from "./touchRegion";
import type { touchSite } from "./touchSite";

/**
 * A touch while standing: one hand, or both, laid on a region of a partner
 * or of the performer's own body and moved on it by a kind of social touch
 * (Jung et al. 2017): a tap, a pat, a stroke, a rub, a press, a squeeze, a
 * hold or a scratch. It is the one law of the affectionate and social touch
 * family (#3284: a pat on the head, a tap on the shoulder, a hand on the
 * arm) and of the self-directed family (#3285: a belly pat, a nape rub, a
 * forearm scratch, a self hug, hands over the ears), each item a row of
 * `(effector, region, kind, timing)`.
 *
 * The hand reaches the region in the free-space transport time of the
 * distance (`AutoMovieMotionHumanTiming.transport`), repeats the kind's
 * stroke `count` times (`AutoMovieMotionHumanTouchForm.FORMS`), dwells for the
 * hold and goes back in the reach's time; the manner's tempo scales every
 * span and its extent the lift and the travel. The feet stay planted and the
 * body keeps the entry posture. A region of the performer's limbs is read on
 * the entry pose, so it must ride a limb the touch does not move, except a
 * region on the other arm: a person scratching or patting their own forearm
 * first brings it up, so that arm is carried on the same envelope to its
 * forearm held across the front of the waist, palm down, and the region is
 * read on the arm held there (`present`). A region above the shoulder that
 * the standing arm does not reach (a taller person's cheek) is risen to on
 * the toes, and a region beyond the standing arm (a thigh slapped while
 * standing) is leaned into, each as far as the hand needs
 * (`AutoMovieMotionHumanTouchStance`), a leg's region then read on the legs
 * as the lean leaves them; one still out of reach at the lean's limit is
 * refused. A seated or carried body does not rise.
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
  export const name: HumanActionName = "touch";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
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

  /** Which part of the hand touches (`touchEffectors`). */
  export type With = touchEffectors.With;

  /** Each part's effector (`touchEffectors`). */
  export const EFFECTORS: Readonly<
    Record<With, AutoMovieMotionHumanTouchEffector.IEffector>
  > = touchEffectors.TABLE;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The region as the shared target union, the kind and the effector as closed unions, timing as counts and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target union and the manner.
   */
  export interface IParams {
    /** The region touched: a partner's (`person`) or the performer's own (`self`). */
    target: AutoMovieMotionTarget;

    /** The kind; `pat` when absent. */
    kind?: AutoMovieMotionHumanTouchForm.Kind;

    /** The part of the hand; the palm when absent. `forefinger` is the end of the forefinger of a flat hand held in line with its forearm, the palm turned down, as a salute meets the brow. */
    with?: With;

    /** The hand; `right` when absent. */
    side?: HumanHand.Side;

    /** Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent. */
    site?: touchSite.ISite;

    /** The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent. */
    prop?: string;

    /** The held prop's point that touches, one of its affordance ids; required with `prop`. */
    point?: string;

    /**
     * With `prop` on a region of the performer's own, the grasp the tool was
     * taken up by for its use (`pickUp`'s `handle` and `use.line`): the
     * stroke holds the tool as that grasp presents it at the region
     * (`HumanGraspUse.presented`, the region as the use's place) and moves
     * only its point, as a razor keeps its angle on the jaw. Absent, the
     * prop's point faces into the region.
     */
    grasp?: HumanHeldUse.IGrasp;

    /** A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent. */
    clear?: number;

    /**
     * Where the elbow lies while the hand is on the region: `natural`, the
     * place of least strain, or `level`, raised to the shoulder's height so
     * the upper arm is horizontal, as a salute or a hand shading the eyes
     * holds it. `natural` when absent.
     */
    elbow?: "natural" | "level";

    /** The other hand's region, touched the same way at the same time; one hand when absent. */
    other?: AutoMovieMotionTarget;

    /** The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent. */
    rests?: readonly AutoMovieMotionHumanTouchContacts.IDeclared[];

    /** Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent. */
    count?: number;

    /** Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent. */
    hold?: number;

    /** The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`). */
    tangent?: AutoMovieMotionHumanTouchForm.Tangent;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** The share of the arm's length (upper arm and forearm) the wrist is kept within before the trunk leans in, so the elbow never locks straight on a region (provisional, as `operate.REACH`). */
  export const REACH: number = 0.97;

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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the touch stroke, the laid arm, the stance, the timing owner and the manner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the entry bones and the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const kind: AutoMovieMotionHumanTouchForm.Kind = p.kind ?? "pat";
    const still: boolean =
      kind === "press" || kind === "squeeze" || kind === "hold";
    const count: number = p.count ?? (kind === "stroke" || still ? 1 : 3);
    const hold: number = p.hold ?? (still ? 1.2 : 0.4);
    HumanBound.least("hold", hold, 0, "s");
    if (p.clear !== undefined) HumanBound.above("clear", p.clear, 0, "hand");
    const standoff: number = (p.clear ?? 0) * body.measure.hand;
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const first: HumanHand.Side = p.side ?? "right";
    const resting = AutoMovieMotionHumanTouchContacts.sided(
      p.rests,
      first,
      p.other !== undefined,
      context.subject,
    );

    // The hand part that touches, or the point of the prop the hand holds.
    const effector: AutoMovieMotionHumanTouchEffector.IEffector =
      p.prop === undefined
        ? AutoMovieMotionHumanTouchForm.curled(
            EFFECTORS[p.with ?? "palm"],
            kind,
          )
        : HumanHeld.effector(
            context,
            { effector: EFFECTORS[p.with ?? "palm"] },
            first,
            p.prop,
            p.point,
          );
    const entry: IHumanPosture = context.entry.posture;

    // A tool held for its use keeps the rotation its grasp presents it in at
    // the region; the first hand alone holds it.
    const kept: HumanGrasp.IKey | null = HumanHeldUse.kept(
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
    const hands: [HumanHand.Side, AutoMovieMotionTarget][] = [
      [first, p.target],
      ...(p.other === undefined
        ? []
        : [
            [first === "right" ? "left" : "right", p.other] as [
              HumanHand.Side,
              AutoMovieMotionTarget,
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

    const laid: touchHold.Lay = touchHold.lay(context, bones, effector, placed);
    const leading: touchHold.ILaid = laid(first, p.target);

    // The rise and the lean for a region beyond the standing arm, measured to
    // the first hand's wrist. Only a body on its own two feet rises.
    const grounded: boolean =
      context.carrier === undefined &&
      context.entry.feet.left.planted &&
      context.entry.feet.right.planted &&
      context.entry.supports.every((s: IHumanEntryState.ISupport): boolean =>
        /Foot$/.test(s.part),
      );
    // The first arm laid on its region at the stroke's start: its wrist is
    // what the stance reaches for, and the whole arm what the lean weighs.
    const laidOn = (posture: IHumanPosture): IHumanPosture.IGoal =>
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
    const stance: AutoMovieMotionHumanTouchStance.IStance =
      AutoMovieMotionHumanTouchStance.solve({
        body,
        standing: entry,
        ...(grounded ? { feet: context.entry.feet } : {}),
        side: first,
        share: REACH,
        wrist: (posture: IHumanPosture): IAutoMovieVector3 =>
          laidOn(posture).point,
        arm: laidOn,
        refuse: (beyond: number, limit: number): string =>
          `The touched region is ${(beyond * 1000).toFixed(0)} mm beyond the ${first} arm at a lean of ${limit} degrees`,
      });
    const leaning: boolean = stance.leaning;
    const region = (target: AutoMovieMotionTarget) => placed(target, leaning);

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
    const risen: IHumanPosture = stance.risen;
    const reached: IHumanPosture = stance.reached;

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
      touchReach.duration(body, context.entry.pose, reached, hands, effector, region, laid),
    );
    const repetition: number = AutoMovieMotionHumanTouchForm.period(
      body,
      kind,
      AutoMovieMotionHumanTiming.seconds(
        AutoMovieMotionHumanTouchForm.FORMS[kind].period,
      ),
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
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
        AutoMovieMotionHumanArm.carried({
          body,
          side: shown.side,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, shown.side),
          goal: (): IHumanPosture.IGoal => shown.goal,
          weight: (seconds: number): number =>
            clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        }),
      );
    // Two hands are planned as one trajectory.
    const together: AutoMovieMotionHumanArmPlanned.ITogether | undefined =
      hands.length > 1 ? AutoMovieMotionHumanArmPlanned.together() : undefined;
    for (const [side, target] of hands) {
      const disc: number | undefined = touchRegion.disc(context, target, side === first ? p.site : undefined);
      const support: IHumanContactWindow.Support | undefined =
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

      // A hand that meets its place end on runs from its elbow, so the
      // elbow's place is settled with the hand and serves as the hint too.
      const from: IAutoMovieVector3 | undefined =
        lay === "reach"
          ? AutoMovieMotionHumanTouchLaid.settled(
              body,
              reached,
              side,
              effector,
              region(target)(reached, 0),
              tangent,
              p.elbow,
            )
          : undefined;
      const own: HumanGrasp.IKey | null = side === first ? kept : null;
      const bend: IAutoMovieVector3 =
        from ??
        own?.bend ??
        AutoMovieMotionHumanTouchLaid.bend(
          body,
          reached,
          side,
          effector,
          region(target)(reached, 0),
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
                  region(target)(reached, 0),
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
          ...(target.kind === "self" ? { on: body.surfaces.regions[target.region].bone } : {}),
          ...(resting(side).length === 0 ? {} : { rests: resting(side) }),
          ...(p.prop !== undefined && side === first
            ? { fingers: "keep" as const }
            : {}),
          ...(standoff > 0 ? { standoff } : {}),
          ...(support === undefined || standoff > 0
            ? {}
            : { contact: support }),
          ...(target.kind === "person"
            ? { others: touchHold.others(context, target, clock), perceived: touchHold.perceived(context, target, clock, region(target)) }
            : {}),
        }),
      );
    }
    const plan: IHumanActionPlan = composeAutoMovieMotionHumanAction({
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
