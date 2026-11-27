import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieMotionHumanVariation,
  IAutoMovieMotionHumanVariationPlace,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSkill } from "../../skill/internal/HumanSkill";
import { AutoMovieMotionHumanTargetGrid } from "./AutoMovieMotionHumanTargetGrid";
import { motionHumanVariation } from "./motionHumanVariation";
import { AutoMovieMotionHumanVariationDraw } from "./AutoMovieMotionHumanVariationDraw";

/*
 * The seeded offset of a place of the air: where a hand arrives within what its
 * named place allows.
 *
 * `motionHumanVariation` states what a slot, a spread and a source are
 * and owns `SPREADS` and `ACROSS`; `AutoMovieMotionHumanVariationDraw` owns
 * `TRUNCATE` and the cell rule. A place is the one slot whose offset has three
 * components and whose bound differs by axis, so it reads how the hand arrives
 * and bounds each axis by that axis's names.
 */
export namespace AutoMovieMotionHumanVariationPlace {
  /*
   * A place of the air with its offset.
   *
   * The offset is in arm lengths, along and across the arrival and read in the
   * nudge frame. Its spread on each axis is `sqrt(intent^2 + (a k D / (T
   * arm))^2)`: `intent` is `SPREADS.place`, the second term is
   * `HumanSkill.scatter` of the travel, and `a` is 1 along the arrival and
   * `ACROSS` across it. On each axis the bound is the smaller of
   * `AutoMovieMotionHumanTargetGrid.NUDGE` and the cell rule over that axis's
   * names, and each axis has its own factor, so an axis whose names stand close
   * together flattens the ellipse across it and takes nothing from the other
   * two. An axis with no room, such as the height of a place on the floor,
   * drops out of the offset.
   * Parameter source: The action's variation; absent, the record itself is
   * returned.
   * Parameter key: The slot key.
   * Parameter body: The body whose measure the shares are of.
   * Parameter side: The acting hand, which the lateral names mirror by.
   * Parameter record: The place's share record.
   * Parameter travel: How the hand arrives; absent, only the intent varies.
   * Returns: The varied share record, facing as the input faces.
   */
  export function vary(
    source: IAutoMovieMotionHumanVariation.ISource | undefined,
    key: string,
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    side: AutoMovieHumanSide,
    record: IAutoMovieMotionHumanTarget.IDefault,
    travel?: IAutoMovieMotionHumanVariationPlace.ITravel,
  ): IAutoMovieMotionHumanTarget.IDefault {
    if (source === undefined) return record;
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const sign: number = side === "left" ? 1 : -1;
    const intent: number = AutoMovieMotionHumanVariationDraw.quantity(
      source,
      "path",
      motionHumanVariation.SPREADS.place,
    );
    const miss: number =
      travel === undefined
        ? 0
        : HumanSkill.scatter(source.skill, travel.distance, travel.seconds) /
          arm;
    const spreads: number[] = [
      1,
      motionHumanVariation.ACROSS,
      motionHumanVariation.ACROSS,
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
          Object.values(AutoMovieMotionHumanTargetGrid.LATERALS),
          sign * (record.lateral ?? 0),
        ) *
          m.shoulderHalfWidth) /
        arm,
      y:
        (Math.min(
          record.height,
          AutoMovieMotionHumanVariationDraw.cell(
            AutoMovieMotionHumanTargetGrid.HEIGHTS.map(
              (name: IAutoMovieMotionHumanTargetGrid.Height): number =>
                AutoMovieMotionHumanTargetGrid.height(body, name),
            ),
            record.height,
          ),
        ) *
          m.stature) /
        arm,
      z: AutoMovieMotionHumanVariationDraw.cell(
        Object.values(AutoMovieMotionHumanTargetGrid.DISTANCES),
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
        AutoMovieMotionHumanTargetGrid.NUDGE,
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
        AutoMovieEngineVector3.add(sum, AutoMovieEngineVector3.scale(e, spreads[i]! * z[i]!)),
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
