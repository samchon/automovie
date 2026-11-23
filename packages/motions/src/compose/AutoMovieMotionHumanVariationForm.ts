import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanVariation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanVariation } from "./AutoMovieMotionHumanVariation";
import { AutoMovieMotionHumanVariationDraw } from "./AutoMovieMotionHumanVariationDraw";

/**
 * The seeded offsets of a movement's form: how far a joint goes, where the
 * elbow sits and how a hand's path bows.
 *
 * `AutoMovieMotionHumanVariation` states what a slot, a spread and a source
 * are and owns `SPREADS` and `BOUNDS`; `AutoMovieMotionHumanVariationDraw`
 * owns `TRUNCATE`, the cell rule and the scalar offset. Each function here varies one number or one elbow place and leaves
 * the place a hand arrives on as it is.
 */
export namespace AutoMovieMotionHumanVariationForm {
  /**
   * An amount with its offset.
   *
   * The amount is a share of a joint's range, as a level resolves to. The
   * offset is a factor on the share with spread `SPREADS.amount`. Its bound
   * is the smallest of the cell rule over `AutoMovieMotionHumanRange.LEVELS`,
   * half the share (the scale rung's [0.5, 1.5]) and what is left of the
   * whole range.
   *
   * @param source The action's variation; absent, the share itself is returned.
   * @param key The slot key.
   * @param share The share of the range, in [0, 1].
   * @returns The varied share, in [0, 1].
   */
  export function amount(
    source: IAutoMovieMotionHumanVariation.ISource | undefined,
    key: string,
    share: number,
  ): number {
    if (source === undefined) return share;
    return (
      share +
      AutoMovieMotionHumanVariationDraw.scalar(
        source,
        key,
        "path",
        AutoMovieMotionHumanVariation.SPREADS.amount,
        Math.abs(share),
        Math.min(
          AutoMovieMotionHumanVariationDraw.cell(
            Object.values(AutoMovieMotionHumanRange.LEVELS),
            share,
          ),
          0.5 * Math.abs(share),
          1 - Math.abs(share),
        ),
      )
    );
  }

  /**
   * A solved elbow place with its offset.
   *
   * The offset is a turn in degrees about the line from the shoulder to the
   * wrist, from the place of least strain, with spread `SPREADS.swivel`. Its
   * bound is the smaller of `TRUNCATE` spreads and the arc of allowed places
   * on either side of the solved one, found in steps of `STEP` degrees. The
   * wrist's place does not change.
   *
   * @param source The action's variation; absent, the elbow place itself is returned.
   * @param key The slot key.
   * @param props The request `AutoMovieMotionHumanBend.solve` answered.
   * @param elbow The solved elbow place, world metres.
   * @returns The turned elbow place, world metres, usable as a bend hint.
   */
  export function swivel(
    source: IAutoMovieMotionHumanVariation.ISource | undefined,
    key: string,
    props: IAutoMovieMotionHumanBend.ISolve,
    elbow: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (source === undefined) return elbow;
    const turned = (degrees: number): IAutoMovieVector3 =>
      AutoMovieMotionHumanBend.turn(props, elbow, degrees);
    const spread: number =
      source.variation *
      AutoMovieMotionHumanVariationDraw.quantity(
        source,
        "path",
        AutoMovieMotionHumanVariation.SPREADS.swivel,
      );
    const reach: number = AutoMovieMotionHumanVariationDraw.TRUNCATE * spread;
    let arc: number = 0;
    while (
      arc + STEP <= reach &&
      Number.isFinite(
        AutoMovieMotionHumanBend.strain(props, turned(arc + STEP)),
      ) &&
      Number.isFinite(
        AutoMovieMotionHumanBend.strain(props, turned(-arc - STEP)),
      )
    )
      arc += STEP;
    const degrees: number = AutoMovieMotionHumanVariationDraw.scalar(
      source,
      key,
      "path",
      AutoMovieMotionHumanVariation.SPREADS.swivel,
      1,
      Math.min(reach, arc),
    );
    return degrees === 0 ? elbow : turned(degrees);
  }

  /**
   * A preset bend's outward share with its offset.
   *
   * The offset is a share of the upper arm added to the preset's `out`, with
   * spread `SPREADS.bend` and bound `BOUNDS.bend`.
   *
   * @param source The action's variation; absent, the share itself is returned.
   * @param key The slot key.
   * @param out The outward share.
   * @returns The varied outward share.
   */
  export function bend(
    source: IAutoMovieMotionHumanVariation.ISource | undefined,
    key: string,
    out: number,
  ): number {
    if (source === undefined) return out;
    return (
      out +
      AutoMovieMotionHumanVariationDraw.scalar(
        source,
        key,
        "path",
        AutoMovieMotionHumanVariation.SPREADS.bend,
        1,
        AutoMovieMotionHumanVariation.BOUNDS.bend,
      )
    );
  }

  /**
   * A path's curvature with its offset.
   *
   * The offset is a share of the path's length added to the manner's
   * `curvature`, with spread `SPREADS.curvature` and bound
   * `BOUNDS.curvature`.
   *
   * @param source The action's variation; absent, the share itself is returned.
   * @param key The slot key.
   * @param share The curvature, a share of the path's length.
   * @returns The varied curvature.
   */
  export function curvature(
    source: IAutoMovieMotionHumanVariation.ISource | undefined,
    key: string,
    share: number,
  ): number {
    if (source === undefined) return share;
    return (
      share +
      AutoMovieMotionHumanVariationDraw.scalar(
        source,
        key,
        "path",
        AutoMovieMotionHumanVariation.SPREADS.curvature,
        1,
        AutoMovieMotionHumanVariation.BOUNDS.curvature,
      )
    );
  }
}

/** The step the allowed arc of an elbow is walked in, degrees. */
const STEP: number = 2;
