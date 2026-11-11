import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import { HumanSkill } from "../skill/HumanSkill";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanVariation } from "./AutoMovieMotionHumanVariation";
import { AutoMovieMotionHumanVariationDraw } from "./AutoMovieMotionHumanVariationDraw";

/**
 * The seeded offset of a place of the air: where a hand arrives within what
 * its named place allows.
 *
 * `AutoMovieMotionHumanVariation` states what a slot, a spread and a source
 * are and owns `SPREADS` and `ACROSS`; `AutoMovieMotionHumanVariationDraw`
 * owns `TRUNCATE` and the cell rule. A place is the one slot whose offset has three components and whose
 * bound differs by axis, so it reads how the hand arrives and bounds each
 * axis by that axis's names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what varies, where the shared terms are defined and what sets a place apart from the other slots.
 * @evidence contracts/development/design.md#principled-representation An end point ellipse lying along the arrival (Gordon et al. 1994; van Beers et al. 2004), stated in the share record a place already is.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function and the record of an arrival it reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The offset is added to the place's own share record, so no second place type or frame enters.
 */
export namespace AutoMovieMotionHumanVariationPlace {
  /**
   * How a hand arrives on a place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member states its unit, its frame and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The distance and the time of the arriving phase, the two inputs of the impulse variability law, and the direction the end point's ellipse is longest along.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `vary`; the phrase that arrives already has all three.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The direction is stated in the nudge frame the offset is read in, so no second frame enters.
   */
  export interface ITravel {
    /** The distance the hand travels in the arriving phase, metres. */
    distance: number;

    /** The length of the arriving phase, seconds; positive. */
    seconds: number;

    /** The direction of arrival in the nudge frame (`out`, `up`, `forward`); forward when absent. */
    direction?: AutoMovieMotionHumanTarget.INudge;
  }

  /**
   * A place of the air with its offset.
   *
   * The offset is in arm lengths, along and across the arrival and read in
   * the nudge frame. Its spread on each axis is `sqrt(intent^2 + (a k D / (T
   * arm))^2)`: `intent` is `SPREADS.place`, the second term is
   * `HumanSkill.scatter` of the travel, and `a` is 1 along the arrival and
   * `ACROSS` across it. On each axis the bound is the smaller of
   * `AutoMovieMotionHumanTarget.NUDGE` and the cell rule over that axis's
   * names, and each axis has its own factor, so an axis whose names stand
   * close together flattens the ellipse across it and takes nothing from the
   * other two. An axis with no room, such as the height of a place on the
   * floor, drops out of the offset.
   *
   * @param source The action's variation; absent, the record itself is returned.
   * @param key The slot key.
   * @param body The body whose measure the shares are of.
   * @param side The acting hand, which the lateral names mirror by.
   * @param record The place's share record.
   * @param travel How the hand arrives; absent, only the intent varies.
   * @returns The varied share record, facing as the input faces.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the frame, the spread, the bound and every input's meaning when absent.
   * @evidence contracts/development/implementation.md#principled-implementation Two terms because two things vary: where the performer means to arrive within the name, and how far the arm misses that, which alone grows with speed (Schmidt et al. 1979; Harris and Wolpert 1998). The ellipse lies along the arrival (Gordon et al. 1994; van Beers et al. 2004).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The spreads, the basis, the bounds, one factor per axis and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No component is clamped: an axis's factor is the largest for which the offset at `TRUNCATE` on every component stays inside that axis's bound.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the height, the share tables and `NUDGE` of `AutoMovieMotionHumanTarget`, and `HumanSkill.scatter`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work over three axes and eighteen names.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function vary(
    source: AutoMovieMotionHumanVariation.ISource | undefined,
    key: string,
    body: Pick<IHumanBody, "measure">,
    side: HumanHand.Side,
    record: AutoMovieMotionHumanTarget.IDefault,
    travel?: ITravel,
  ): AutoMovieMotionHumanTarget.IDefault {
    if (source === undefined) return record;
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const sign: number = side === "left" ? 1 : -1;
    const intent: number = AutoMovieMotionHumanVariationDraw.quantity(
      source,
      "path",
      AutoMovieMotionHumanVariation.SPREADS.place,
    );
    const miss: number =
      travel === undefined
        ? 0
        : HumanSkill.scatter(source.skill, travel.distance, travel.seconds) /
          arm;
    const spreads: number[] = [
      1,
      AutoMovieMotionHumanVariation.ACROSS,
      AutoMovieMotionHumanVariation.ACROSS,
    ].map(
      (a: number): number => source.variation * Math.hypot(intent, a * miss),
    );
    const axes: IAutoMovieVector3[] = AutoMovieMotionHumanVariationDraw.basis({
      x: travel?.direction?.out ?? 0,
      y: travel?.direction?.up ?? 0,
      z:
        travel?.direction?.forward ?? (travel?.direction === undefined ? 1 : 0),
    });
    // Each axis's bound in arm lengths: out, up, forward. A place on the
    // floor has no room upward or downward.
    const bounds: IAutoMovieVector3 = {
      x:
        (AutoMovieMotionHumanVariationDraw.cell(
          Object.values(AutoMovieMotionHumanTarget.LATERALS),
          sign * (record.lateral ?? 0),
        ) *
          m.shoulderHalfWidth) /
        arm,
      y:
        (Math.min(
          record.height,
          AutoMovieMotionHumanVariationDraw.cell(
            AutoMovieMotionHumanTarget.HEIGHTS.map(
              (name: AutoMovieMotionHumanTarget.Height): number =>
                AutoMovieMotionHumanTarget.height(body, name),
            ),
            record.height,
          ),
        ) *
          m.stature) /
        arm,
      z: AutoMovieMotionHumanVariationDraw.cell(
        Object.values(AutoMovieMotionHumanTarget.DISTANCES),
        record.range,
      ),
    };
    // Each axis's own factor: 1 while the offset at `TRUNCATE` fits its
    // bound, the share that fits otherwise, and 0 with no room.
    const fit: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };
    for (const axis of ["x", "y", "z"] as const) {
      const reach: number =
        AutoMovieMotionHumanVariationDraw.TRUNCATE *
        axes.reduce(
          (sum: number, e: IAutoMovieVector3, i: number): number =>
            sum + Math.abs(e[axis]) * spreads[i]!,
          0,
        );
      const bound: number = Math.min(
        AutoMovieMotionHumanTarget.NUDGE,
        bounds[axis],
      );
      if (!(bound > 0)) fit[axis] = 0;
      else if (reach > bound) fit[axis] = bound / reach;
    }
    const z: number[] = AutoMovieMotionHumanVariationDraw.normals(
      source.series(key),
      3,
    );
    const drawn: IAutoMovieVector3 = axes.reduce(
      (sum: IAutoMovieVector3, e: IAutoMovieVector3, i: number) =>
        Vector3.add(sum, Vector3.scale(e, spreads[i]! * z[i]!)),
      { x: 0, y: 0, z: 0 },
    );
    const offset: IAutoMovieVector3 = {
      x: drawn.x * fit.x,
      y: drawn.y * fit.y,
      z: drawn.z * fit.z,
    };
    return {
      ...record,
      height: record.height + (offset.y * arm) / m.stature,
      range: record.range + offset.z,
      lateral:
        (record.lateral ?? 0) + (sign * offset.x * arm) / m.shoulderHalfWidth,
    };
  }
}
