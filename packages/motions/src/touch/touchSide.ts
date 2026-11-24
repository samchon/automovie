import { ROM_TOLERANCE, getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import { poseBones } from "../posture/poseBones";
import { touchHold } from "./touchHold";
import { touchRegion } from "./touchRegion";

/**
 * Which hand a touch uses when its author names none.
 *
 * Both hands are candidates. A touch with a held prop takes the hand that holds
 * it at the entry (`IHumanEntryState.holds`), the only hand that can lay the
 * prop's point on the region. Otherwise each hand is laid on its region on the
 * entry posture as the plan lays it (`touchHold.lay`,
 * `AutoMovieMotionHumanTouchLaid.rest`), and the hand whose arm holds that goal
 * with an allowed elbow place and the least joint strain
 * (`AutoMovieMotionHumanBend.strain`, the measure the arm's elbow search ranks
 * by) is taken: a goal no elbow place allows, or beyond the arm, reads as
 * infinite strain, so feasibility decides first. With `other`, the two hands'
 * pairings are compared by their summed strain. A region on one of the
 * performer's own arms is never touched by that arm's own hand. Two strains
 * within the strain's own resolution (`resolution`, `ROM_TOLERANCE` carried
 * through the strain's terms) are one, and keep the right hand, the law's
 * default before this choice; a mirrored body's two strains differ only by
 * rounding.
 */
export namespace touchSide {
  /**
   * The touching hand.
   *
   * @param context The action's context.
   * @param effector The part of the hand that touches.
   * @returns The hand that takes `target`; `params.side` when the author names
   *   it.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
  ): AutoMovieHumanSide {
    const p: IAutoMovieMotionHumanTouch.IParams = context.params;
    if (p.hand !== undefined) return p.hand;
    if (p.prop !== undefined)
      return context.entry.holds.left === p.prop &&
        context.entry.holds.right !== p.prop
        ? "left"
        : "right";
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const other = (side: AutoMovieHumanSide): AutoMovieHumanSide =>
      side === "right" ? "left" : "right";

    // The strain of one hand laid on one region, as the plan lays it.
    const strain = (
      side: AutoMovieHumanSide,
      target: IAutoMovieMotionTarget,
    ): number => {
      if (target.kind === "self") {
        const bone: string = body.surfaces.regions[target.region].bone;
        if (
          bone === `${side}UpperArm` ||
          bone === `${side}LowerArm` ||
          bone === `${side}Hand`
        )
          return Infinity;
      }
      const placed: ReturnType<typeof touchRegion.reader> = touchRegion.reader(
        context,
        bones,
        side,
        p.target,
        p.site,
      );
      const laid: touchHold.ILaid = touchHold.lay(
        context,
        bones,
        effector,
        placed,
      )(side, target);
      const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanTouchLaid.rest(
        body,
        entry,
        side,
        effector,
        placed(target, false)(entry, 0),
        laid.tangent,
        AutoMovieMotionHumanBend.hang(body, entry, side),
        "arm",
      );
      const solve: IAutoMovieMotionHumanBend.ISolve = {
        body,
        posture: entry,
        side,
        point: goal.point,
        ...(goal.rotation === undefined ? {} : { rotation: goal.rotation }),
      };
      return AutoMovieMotionHumanBend.strain(
        solve,
        AutoMovieMotionHumanBend.solve({ ...solve, fallback: "hang" }),
      );
    };
    const cost = (side: AutoMovieHumanSide): number =>
      strain(side, p.target) +
      (p.other === undefined ? 0 : strain(other(side), p.other));
    const left: number = cost("left");
    const right: number = cost("right");
    // Feasibility first: a hand whose goal no elbow place allows loses to
    // one whose goal is held, whatever the other's strain. Its resolution is
    // infinite, so the tie below would keep it.
    if (Number.isFinite(left) !== Number.isFinite(right))
      return Number.isFinite(left) ? "left" : "right";
    return right - left >
      resolution(body, "left", left) + resolution(body, "right", right)
      ? "left"
      : "right";
  }

  /**
   * How far a strain can move while every angle it reads moves within
   * `ROM_TOLERANCE`, the resolution to which the elbow search and the fits
   * resolve a joint's angle, so two strains closer than the sum of theirs are
   * one strain. Each of the strain's `n` terms is `(d / H)^2`, `d` an angle's
   * distance from the hanging arm's and `H` its axis's half range
   * (`AutoMovieMotionHumanBend.solve`): a change `e` in `d` moves a term by at
   * most `2 |d| e / H^2 + e^2 / H^2`, and the whole strain `S`, by
   * Cauchy-Schwarz over the terms with the least half range `h`, by at most `2
   * sqrt(n S) e / h + n (e / h)^2`. The terms are the shoulder's three axes,
   * the forearm's twist and the wrist's flexion, their ranges read from the rig
   * (`getConstraint`) as the elbow search reads them.
   *
   * @param body The body.
   * @param side The arm.
   * @param strain The strain, unitless.
   * @returns The bound, unitless; `Infinity` for an infinite strain.
   */
  function resolution(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    strain: number,
  ): number {
    if (!Number.isFinite(strain)) return Infinity;
    const range = (
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieJointConstraint | null =>
      getConstraint(bone, readHumanBone(body, bone)?.constraint ?? null);
    const shoulder: IAutoMovieJointConstraint | null = range(`${side}UpperArm`);
    const halves: number[] = [
      shoulder?.flexion,
      shoulder?.abduction,
      shoulder?.twist,
      range(`${side}LowerArm`)?.twist,
      range(`${side}Hand`)?.flexion,
    ]
      .filter(
        (
          r: IAutoMovieAngleRange | null | undefined,
        ): r is IAutoMovieAngleRange =>
          r !== null && r !== undefined && r.max > r.min,
      )
      .map((r: IAutoMovieAngleRange): number => (r.max - r.min) / 2);
    if (halves.length === 0) return 0;
    const e: number = ROM_TOLERANCE / Math.min(...halves);
    const n: number = halves.length;
    return 2 * Math.sqrt(n * strain) * e + n * e * e;
  }
}
