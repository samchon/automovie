import { Quaternion, Vector3, physicalShapeSpan } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { everydayTake } from "../../features/internal/everydayTake";
import type { motionComplaints } from "../../features/internal/motionComplaints";
import { motionActionUnit } from "./motionActionUnit";

/**
 * One pickUp checked on its own (`.agents/skills/motion/laws/verification.md`):
 * the grasp's goal by the pickUp and grasp contracts, read on the displayed
 * hand and prop, with the pickUp's own shipped bounds (`motionActionUnit`).
 */
export namespace motionGraspUnit {
  /**
   * A handle's grasped width (`IAutoMovieMotionHumanGrasp`): the affordance's
   * `aperture`, or else the span along the approach (the affordance's `-Y`) of
   * the prop's collider whose centre lies nearest the grip point, read in the
   * prop's own frame with the engine's `physicalShapeSpan`, as the contract
   * defines it.
   *
   * @param model The prop's model.
   * @param id The handle.
   * @returns Metres.
   */
  export function width(model: everydayTake.IPosable, id: string): number {
    const site: IAutoMovieAffordance = (model.affordances ?? []).find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    )!;
    if (site.aperture !== undefined) return site.aperture;
    const shapes: readonly IAutoMoviePhysicalShape[] = model.shapes?.() ?? [];
    if (shapes.length === 0) return 0;
    const centre: (shape: IAutoMoviePhysicalShape) => number = (
      shape: IAutoMoviePhysicalShape,
    ): number =>
      Vector3.distance(shape.transform.position, site.frame.translation);
    const nearest: IAutoMoviePhysicalShape = shapes.reduce(
      (
        best: IAutoMoviePhysicalShape,
        shape: IAutoMoviePhysicalShape,
      ): IAutoMoviePhysicalShape =>
        centre(shape) < centre(best) ? shape : best,
    );
    const [low, high]: readonly [number, number] = physicalShapeSpan(
      { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
      nearest,
      Quaternion.rotateVector(site.frame.rotation, { x: 0, y: -1, z: 0 }),
    );
    return high - low;
  }

  /**
   * The closed hand's contact surfaces: the palm, and each digit's tip and pad,
   * any of which a grip of any kind closes on a part with.
   */
  const CONTACTS: readonly IAutoMovieMotionHumanHand.Surface[] = [
    "palm",
    "thumbTip",
    "thumbPad",
    "indexTip",
    "indexPad",
    "middleTip",
    "middlePad",
    "ringTip",
    "ringPad",
    "littleTip",
    "littlePad",
  ];

  /**
   * How near the closed hand comes to a world point at a second: the least
   * distance from it of the hand's contact surfaces as displayed.
   *
   * @param take The take.
   * @param body The performer's body.
   * @param subject The performer.
   * @param side The hand.
   * @param at The world point, metres.
   * @param seconds Film seconds.
   * @returns Metres.
   */
  export function contact(
    take: HumanPerformance,
    body: IAutoMovieMotionHumanBody,
    subject: string,
    side: AutoMovieHumanSide,
    at: IAutoMovieVector3,
    seconds: number,
  ): number {
    const bones: ReturnType<HumanPerformance["bones"]> = take.bones(
      subject,
      seconds,
    );
    return Math.min(
      ...CONTACTS.map((surface: IAutoMovieMotionHumanHand.Surface): number =>
        Vector3.distance(HumanHand.frame(body, bones, side, surface).point, at),
      ),
    );
  }

  /**
   * One pickUp a unit checks: who grasps what, by which handle, and how far the
   * wrist is asked to rise.
   */
  export interface IGrasp {
    /** The performer. */
    subject: string;

    /** The grasping hand. */
    side: AutoMovieHumanSide;

    /** The prop's subject. */
    prop: string;

    /** The prop's model, for its handle's place. */
    model: everydayTake.IPosable;

    /** The handle, the prop's affordance the grip closes on. */
    handle: string;

    /**
     * How far the wrist is asked to rise after the grasp, metres
     * (`IAutoMovieMotionHumanPickUp.lift`).
     */
    lift: number;

    /** Which pickUp of the chain, from 1; the first when absent. */
    occurrence?: number;
  }

  /**
   * Check one pickUp's own goal (`IAutoMovieMotionHumanPickUp`) and bounds: at
   * the closure the hand lies on the handle at its point, the nearest of its
   * contact surfaces within half the grasped width (`width`) plus the touch
   * contract's `GRIP`, since the grasp brings the grip onto the affordance
   * point and closes the fingers on the colliders until contact, whatever the
   * grip's kind or the side it closes from; the wrist rises the asked lift
   * within `GRIP` by the action's `lifted`; and the prop rides the hand within
   * `HOLD` from the closure to the action's end.
   *
   * @param checks The spec's gatherer.
   * @param label The case, for the failures.
   * @param take The take.
   * @param body The performer's body.
   * @param grasp What the pickUp grasps.
   */
  export function pickUp(
    checks: motionComplaints.IGatherer,
    label: string,
    take: HumanPerformance,
    body: IAutoMovieMotionHumanBody,
    grasp: IGrasp,
  ): void {
    const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
      take,
      grasp.subject,
      "pickUp",
      grasp.occurrence ?? 1,
    );
    const closed: number = motionActionUnit.event(act, "gripClosed");
    const lifted: number = motionActionUnit.event(act, "lifted");
    const off: number = contact(
      take,
      body,
      grasp.subject,
      grasp.side,
      everydayTake.point(take, grasp.model, grasp.prop, grasp.handle, closed),
      closed,
    );
    const half: number = width(grasp.model, grasp.handle) / 2;
    checks.check(
      `${label}: the ${grasp.side} hand closes on the ${grasp.prop}'s ${grasp.handle} (its nearest part ${(off * 1000).toFixed(1)} mm from the handle point, half the width ${(half * 1000).toFixed(1)} mm)`,
      off <= half + motionActionUnit.GRIP,
    );
    const wrist: (seconds: number) => number = (seconds: number): number =>
      take.bones(grasp.subject, seconds).get(`${grasp.side}Hand`)!.worldPosition
        .y;
    const rise: number = wrist(lifted) - wrist(closed);
    checks.check(
      `${label}: the wrist rises the asked ${(grasp.lift * 1000).toFixed(0)} mm (${(rise * 1000).toFixed(1)} mm)`,
      Math.abs(rise - grasp.lift) <= motionActionUnit.GRIP,
    );
    const drift: number = everydayTake.drift(
      take,
      grasp.side,
      grasp.prop,
      closed,
      act.end,
      grasp.subject,
    );
    checks.check(
      `${label}: the ${grasp.prop} rides the hand from the closure (${(drift * 1000).toFixed(1)} mm)`,
      drift <= motionActionUnit.HOLD,
    );
    motionActionUnit.bounds(checks, label, take, grasp.subject, act);
  }
}
