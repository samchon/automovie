import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchUpright } from "../compose/AutoMovieMotionHumanTouchUpright";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHeldEffector } from "./HumanHeldEffector";

/**
 * An act performed with the prop the hand already holds: the prop's own
 * point (a glass's lip, a phone's screen, a cigarette's mouth end) as the
 * effector, in place of a bare hand surface or an implied tool, and the
 * hold kept through the act. A drink from a held glass and two glasses
 * clinked in a toast read it.
 *
 * A held prop rides the hand rigidly, so its point and its axes are fixed
 * in the hand's frame from the instant the act starts. The effector is that
 * point, stated as the tool offset the touch generator already takes, with
 * the two directions the act lays against its region read off the prop:
 *
 * - a vessel (an act that stands it `upright`) lays its own axis, the
 *   point's normal, on the world's up. Its rim is a ring about that axis,
 *   so the region meets the rim on the side the act's facing direction
 *   points to (the palm's side of a drinking hand), and the effector faces
 *   outward there: the vessel then stands before a face, never in it. The prop's origin
 *   is read as a point of the vessel's axis, as a vessel that stands on its
 *   base at its origin has it.
 * - any other prop turns its point's normal into the region (a screen faces
 *   the ear, a filter end enters the lips) and keeps the act's along
 *   direction as nearly as that normal allows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what replaces the implied tool, why the hand's frame fixes it, how each kind of prop is laid and the premise on a vessel's origin.
 * @evidence contracts/development/design.md#principled-representation A held prop's point is a point and two directions in the hand's frame, which is what an effector is.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What an act states of its use, the effector, its steadiest side and the kept hold; read by `handToFace` and `highFive`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop kind is named: a vessel is the act's `upright`, and the point is any the prop declares.
 */
export namespace HumanHeld {
  /**
   * The effector that lays a held prop's point on the act's region.
   *
   * @param context The action's context; the prop is read in the hand at the action's entry (`AutoMovieMotionHumanHeld.of`).
   * @param row The act's use of the prop.
   * @param side The holding hand.
   * @param subject The prop's subject id.
   * @param point The prop's point; the row's own when absent.
   * @param turn For an upright vessel, how far round its rim from the side the act's facing direction points to the region meets it, degrees about the vessel's axis; 0 when absent. A round rim meets a mouth on any side, so a caller may try several and keep the one its arm holds upright best.
   * @returns The effector.
   * @throws {HumanRefusal} When neither the parameters nor the row name a point, the prop has no such contact, or that hand does not hold the prop at the entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the prop is read, each input and the three refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The held prop's owner gives the contact's point from the grip socket and its direction in the hand bone's axes, the offset a grip keeps fixed; the socket's own offset from the wrist is added, and the tool's shares are that point's components along the hand's three orthonormal axes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates held/contact admission and the actual turn to HumanHeldEffector's shared fixed-geometry owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Whether the hand holds the prop is the entry state's fact, read by the owner, which refuses otherwise; a direction too near the normal to be laid across it falls back to the hand axis least along it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Cold effectors and steadiest's explicit fixed-prop search share HumanHeldEffector's same geometry and output arithmetic, without another point/axis formula.
   * @evidence contracts/development/implementation.md#efficient-algorithms One demanded entry FK/contact reading and constant vector work per cold call; the shared owner permits repeated fixed-prop turns to reuse only geometry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function effector(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop">,
    row: IAutoMovieMotionHumanHeld.IUse,
    side: AutoMovieHumanSide,
    subject: string,
    point?: string,
    turn: number = 0,
  ): IAutoMovieMotionHumanTouchEffector.IEffector {
    return HumanHeldEffector(context, row, side, subject, point)(turn);
  }

  /** The most an upright vessel may tilt where it is brought, degrees (a held container stays level within 10 degrees outside a sip, the acceptance of the hand-to-face family, #3361). */
  export const LEVEL: number = 10;

  /** The sides of an upright vessel's rim tried for a region, degrees round its axis from the side the act's facing direction points to (provisional: every eighth of the rim). */
  export const SIDES: readonly number[] = [0, 45, -45, 90, -90, 135, -135, 180];

  /**
   * The rim's sides in the order a hand tries them: `SIDES` for the right
   * hand and their mirror for the left. A turn is measured in the hand's own
   * frame from its facing toward `normal x facing`, and a left hand's frame
   * is the right's mirrored, where that cross product points the other way:
   * one list for both hands had the left hand try the mirror of -45 where
   * the right tries 45, so of two sides that hold the vessel alike the two
   * hands took sides that are not each other's mirror.
   */
  function turns(side: AutoMovieHumanSide): readonly number[] {
    return side === "right"
      ? SIDES
      : SIDES.map((turn: number): number => (turn === 0 ? 0 : -turn));
  }

  /**
   * The effectors of an upright vessel at every side of its rim the search
   * tries (`SIDES`, the act's own side first), for an act that searches the
   * side with its own admission, as a drink does (`handToFaceVessel`).
   *
   * @param context The action's context; the prop is read in the hand at the action's entry.
   * @param row The act's use of the prop.
   * @param side The holding hand.
   * @param subject The prop's subject id.
   * @param point The prop's point; the row's own when absent.
   * @returns One effector per side, in `SIDES`' order for the right hand and in its mirror's for the left.
   * @throws {HumanRefusal} As `effector`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sides, their order, who reads them and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A round rim meets a region on any side, so the side is a free turn of the vessel about its own axis in the hand, each one the shared effector owner's turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One held reading, one turn per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No side is chosen here; the act's search admits one or refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry FK/contact reading and constant vector work per side, no arm solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed held prop and row share one `HumanHeldEffector` geometry across the sides, as `steadiest` does.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh effector weights and retains nothing.
   */
  export function sides(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop">,
    row: IAutoMovieMotionHumanHeld.IUse,
    side: AutoMovieHumanSide,
    subject: string,
    point: string | undefined,
  ): IAutoMovieMotionHumanTouchEffector.IEffector[] {
    const effect: ReturnType<typeof HumanHeldEffector> = HumanHeldEffector(
      context,
      row,
      side,
      subject,
      point,
    );
    return turns(side).map(
      (turn: number): IAutoMovieMotionHumanTouchEffector.IEffector =>
        effect(turn),
    );
  }

  /**
   * The effector of a held prop on the side its arm holds best: for an
   * upright vessel, whose round rim meets a region on any side, the side of
   * `SIDES` at which the arm that brings the rim to the region leaves the
   * vessel least tilted, the act's own side on a tie; for any other prop,
   * `effector` as it is.
   *
   * @param context The action's context.
   * @param row The act's use of the prop.
   * @param side The holding hand.
   * @param subject The prop's subject id.
   * @param point The prop's point; the row's own when absent.
   * @param posture The posture the arm is solved on at the region.
   * @param place The region there.
   * @param leans Whether the act leans the vessel toward the region as it arrives, as a drink does (`AutoMovieMotionHumanTouchDrink`, which admits the lean or refuses it): the side is still the one held most nearly upright, but a tilt there is no refusal, since the vessel is not brought upright. False when absent.
   * @returns The effector.
   * @throws {HumanRefusal} As `effector`; and, unless the act leans the vessel, a `reach` refusal on `prop` when the arm leaves the vessel tilted more than `LEVEL` on every side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the freedom used, the choice, the tie and each input.
   * @evidence contracts/development/implementation.md#principled-implementation A pick-up takes the grip its reach allows, so which side of the rim then faces a region is not the act's to assume; each side is solved by the upright search and its reached tilt compared.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop of effector, search and compare.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No side is preferred for any prop or hand beyond the tie; the tilt is the resolver's reached one, and a vessel no side holds level is refused, never brought tilted, unless the act leans it, whose own search then admits the lean or refuses it.
   * @evidence contracts/development/implementation.md#efficient-algorithms One held-entry FK/contact/hand-geometry and hanging hint serve at most eight actual rim sides. All at-most-thirteen arm solves per side remain; the original nonnegative-tip early exit is unchanged and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The synchronous unchanged body/entry/held prop/row fixes only local geometry and hanging hint; each actual side still runs its own Upright solve and displayed Laid-bend tilt fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local geometry producer/hint are released on return or throw; only the best fresh effector weights escape, without body/prop readers, fits, time history or handles.
   */
  export function steadiest(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop">,
    row: IAutoMovieMotionHumanHeld.IUse,
    side: AutoMovieHumanSide,
    subject: string,
    point: string | undefined,
    posture: IAutoMovieMotionHumanPosture,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    leans: boolean = false,
  ): IAutoMovieMotionHumanTouchEffector.IEffector {
    const effect: ReturnType<typeof HumanHeldEffector> = HumanHeldEffector(
      context,
      row,
      side,
      subject,
      point,
    );
    let best: IAutoMovieMotionHumanTouchEffector.IEffector = effect();
    if (row.upright !== true) return best;
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(context.body, posture, side);
    let least: number = Infinity;
    for (const turn of turns(side)) {
      const candidate: IAutoMovieMotionHumanTouchEffector.IEffector = effect(turn);
      const facing: IAutoMovieVector3 = AutoMovieMotionHumanTouchUpright.solve(
        context.body,
        posture,
        side,
        candidate,
        place,
        bend,
      ).facing;

      // The tilt the stroke itself will show: the arm laid with the elbow
      // hint the stroke solves for this side and facing.
      const tilt: number = AutoMovieMotionHumanTouchUpright.tilt(
        context.body,
        posture,
        side,
        candidate,
        place,
        AutoMovieMotionHumanTouchLaid.bend(
          context.body,
          posture,
          side,
          candidate,
          place,
          "up",
          "upright",
          facing,
        ),
        facing,
      );

      // Two tilts within the joints' tolerance (the resolution a fit meets a
      // rotation to) are one, as the drink's facings read them
      // (`AutoMovieMotionHumanTouchDrink`), so a rounding-sized difference
      // between a hand's fit and its mirror's never chooses another side.
      if (tilt < least - ROM_TOLERANCE) {
        least = tilt;
        best = candidate;
      }

      // A tilt is an angle, never below 0, so once the best is within the
      // tolerance of 0 no later side can replace it.
      if (least <= ROM_TOLERANCE) break;
    }

    // A vessel the arm cannot hold level there is not brought tilted, unless
    // the act leans it there: a drinker tips the glass at the lips with the
    // elbow low (Murphy, Willen and Sunnerhagen 2011), and a drink over a
    // walk was refused at 13.5 degrees by the level a toast keeps.
    if (!leans && least > LEVEL)
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: least,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: LEVEL,
          unit: "degrees",
        },
        reason: `the ${side} hand cannot hold ${subject} upright there with the grip it took: at its best side the arm leaves it tilted ${least.toFixed(1)} degrees`,
        fix: `take ${subject} by a grip the arm can hold upright there (another handle, or from another side), or use the other hand`,
      });
    return best;
  }

  /**
   * A plan whose hand grips its prop through the whole act and keeps it
   * after: the grip window that takes the hand over from the hold the prop
   * came with, and the hold the act leaves.
   *
   * @param context The action's context; the fingers are read at the entry.
   * @param plan The act's plan, whose arm was built with the fingers kept.
   * @param side The holding hand.
   * @param subject The prop's subject id.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two declarations added and what they do in a performance.
   * @evidence contracts/development/implementation.md#principled-implementation A performance carries a prop by a grip window on its hand and lets a held hand be driven only by an action that declares one; the hold left keeps the entry's closed fingers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One window and one hold appended.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The window spans the whole act, so the prop never leaves the hand in it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the held prop owner's grip window and hold.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the plan it wraps and nothing else.
   */
  export function kept(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop">,
    plan: IAutoMovieMotionHumanActionPlan,
    side: AutoMovieHumanSide,
    subject: string,
  ): IAutoMovieMotionHumanActionPlan {
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      side,
      subject,
    );
    return {
      ...plan,
      contacts: [...plan.contacts, AutoMovieMotionHumanHeld.grip(held)],
      holds: [AutoMovieMotionHumanHeld.hold(context, held)],
    };
  }
}
