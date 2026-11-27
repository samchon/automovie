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

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTouchLaid } from "../../compose/internal/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchUpright } from "../../compose/internal/AutoMovieMotionHumanTouchUpright";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHeldEffector } from "./HumanHeldEffector";

/*
 * An act performed with the prop the hand already holds: the prop's own point
 * (a glass's lip, a phone's screen, a cigarette's mouth end) as the effector,
 * in place of a bare hand surface or an implied tool, and the hold kept through
 * the act. A drink from a held glass and two glasses clinked in a toast read
 * it.
 *
 * A held prop rides the hand rigidly, so its point and its axes are fixed in
 * the hand's frame from the instant the act starts. The effector is that point,
 * stated as the tool offset the touch generator already takes, with the two
 * directions the act lays against its region read off the prop:
 *
 * - A vessel (an act that stands it `upright`) lays its own axis, the point's
 *   normal, on the world's up. Its rim is a ring about that axis, so the region
 *   meets the rim on the side the act's facing direction points to (the palm's
 *   side of a drinking hand), and the effector faces outward there: the vessel
 *   then stands before a face, never in it. The prop's origin is read as a
 *   point of the vessel's axis, as a vessel that stands on its base at its
 *   origin has it.
 * - Any other prop turns its point's normal into the region (a screen faces the
 *   ear, a filter end enters the lips) and keeps the act's along direction as
 *   nearly as that normal allows.
 */
export namespace HumanHeld {
  /*
   * The effector that lays a held prop's point on the act's region.
   * Parameter context: The action's context; the prop is read in the hand at the
   * action's entry (`AutoMovieMotionHumanHeld`).
   * Parameter row: The act's use of the prop.
   * Parameter side: The holding hand.
   * Parameter subject: The prop's subject id.
   * Parameter point: The prop's point; the row's own when absent.
   * Parameter turn: For an upright vessel, how far round its rim from the side the
   * act's facing direction points to the region meets it, degrees about the
   * vessel's axis; 0 when absent. A round rim meets a mouth on any side, so a
   * caller may try several and keep the one its arm holds upright best.
   * Returns: The effector.
   * When neither the parameters nor the row name a
   * point, the prop has no such contact, or that hand does not hold the prop
   * at the entry.
   */
  export function effector(
    context: Pick<IAutoMovieMotionHumanActionContext, EffectorContext>,
    row: IAutoMovieMotionHumanHeld.IUse,
    side: AutoMovieHumanSide,
    subject: string,
    point?: string,
    turn: number = 0,
  ): IAutoMovieMotionHumanTouchEffector.IEffector {
    return HumanHeldEffector(context, row, side, subject, point)(turn);
  }

  /*
   * The most an upright vessel may tilt where it is brought, degrees (a held
   * container stays level within 10 degrees outside a sip, the acceptance of
   * the hand-to-face family).
   */
  export const LEVEL: number = 10;

  /*
   * The sides of an upright vessel's rim tried for a region, degrees round its
   * axis from the side the act's facing direction points to (provisional: every
   * eighth of the rim).
   */
  export const SIDES: readonly number[] = [0, 45, -45, 90, -90, 135, -135, 180];

  /*
   * The effectors of an upright vessel at every side of its rim the search
   * tries (`SIDES`, the act's own side first), for an act that searches the
   * side with its own admission, as a drink does (`handToFaceVessel`).
   * Parameter context: The action's context; the prop is read in the hand at the
   * action's entry.
   * Parameter row: The act's use of the prop.
   * Parameter side: The holding hand.
   * Parameter subject: The prop's subject id.
   * Parameter point: The prop's point; the row's own when absent.
   * Returns: One effector per side, in `SIDES`' order for the right hand and in
   * its mirror's for the left.
   * As `effector`.
   */
  export function sides(
    context: Pick<IAutoMovieMotionHumanActionContext, SidesContext>,
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

  /*
   * The effector of a held prop on the side its arm holds best: for an upright
   * vessel, whose round rim meets a region on any side, the side of `SIDES` at
   * which the arm that brings the rim to the region leaves the vessel least
   * tilted, the act's own side on a tie; for any other prop, `effector` as it
   * is.
   * Parameter context: The action's context.
   * Parameter row: The act's use of the prop.
   * Parameter side: The holding hand.
   * Parameter subject: The prop's subject id.
   * Parameter point: The prop's point; the row's own when absent.
   * Parameter posture: The posture the arm is solved on at the region.
   * Parameter place: The region there.
   * Parameter leans: Whether the act leans the vessel toward the region as it
   * arrives, as a drink does (`AutoMovieMotionHumanTouchDrink`, which admits
   * the lean or refuses it): the side is still the one held most nearly
   * upright, but a tilt there is no refusal, since the vessel is not brought
   * upright. False when absent.
   * Returns: The effector.
   * As `effector`; and, unless the act leans the vessel,
   * a `reach` refusal on `prop` when the arm leaves the vessel tilted more
   * than `LEVEL` on every side.
   */
  export function steadiest(
    context: Pick<IAutoMovieMotionHumanActionContext, SteadiestContext>,
    row: IAutoMovieMotionHumanHeld.IUse,
    side: AutoMovieHumanSide,
    subject: string,
    point: string | undefined,
    posture: IAutoMovieMotionHumanPosture,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, SteadiestPlace>,
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
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      context.body,
      posture,
      side,
    );
    let least: number = Infinity;
    for (const turn of turns(side)) {
      const candidate: IAutoMovieMotionHumanTouchEffector.IEffector =
        effect(turn);
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
      throw new AutoMovieMotionHumanRefusal({
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

  /*
   * A plan whose hand grips its prop through the whole act and keeps it after:
   * the grip window that takes the hand over from the hold the prop came with,
   * and the hold the act leaves.
   * Parameter context: The action's context; the fingers are read at the entry.
   * Parameter plan: The act's plan, whose arm was built with the fingers kept.
   * Parameter side: The holding hand.
   * Parameter subject: The prop's subject id.
   * Returns: The plan.
   */
  export function kept(
    context: Pick<IAutoMovieMotionHumanActionContext, KeptContext>,
    plan: IAutoMovieMotionHumanActionPlan,
    side: AutoMovieHumanSide,
    subject: string,
  ): IAutoMovieMotionHumanActionPlan {
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
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

  /*
   * The rim's sides in the order a hand tries them: `SIDES` for the right hand
   * and their mirror for the left. A turn is measured in the hand's own frame
   * from its facing toward `normal x facing`, and a left hand's frame is the
   * right's mirrored, where that cross product points the other way: one list
   * for both hands had the left hand try the mirror of -45 where the right
   * tries 45, so of two sides that hold the vessel alike the two hands took
   * sides that are not each other's mirror.
   */
  function turns(side: AutoMovieHumanSide): readonly number[] {
    return side === "right"
      ? SIDES
      : SIDES.map((turn: number): number => (turn === 0 ? 0 : -turn));
  }
}

/*
 * The alternatives of `KeptContext`'s site.
 */
type KeptContext = "body" | "entry" | "prop";

/*
 * The alternatives of `SteadiestPlace`'s site.
 */
type SteadiestPlace = "point" | "normal";

/*
 * The alternatives of `SteadiestContext`'s site.
 */
type SteadiestContext = "body" | "entry" | "prop";

/*
 * The alternatives of `SidesContext`'s site.
 */
type SidesContext = "body" | "entry" | "prop";

/*
 * The alternatives of `EffectorContext`'s site.
 */
type EffectorContext = "body" | "entry" | "prop";
