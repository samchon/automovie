import type { IAutoMovieVector3 } from "@automovie/interface";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which slots these are, where the shared terms are defined and what the functions leave alone.
 * @evidence contracts/development/design.md#principled-representation The freedoms a hand's goal does not depend on vary with little regard to skill (Scholz and Schoner 1999; Todorov and Jordan 2002), and an amount varies in proportion to its size (Harris and Wolpert 1998).
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function per slot type; `AutoMovieMotionHumanBend` and `AutoMovieMotionHumanRange` keep the elbow's strain and the levels.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each result has the type and the unit of its input, so a law passes it on with no conversion.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the spread, the three bounds and the result's range.
   * @evidence contracts/development/implementation.md#principled-implementation Signal-dependent noise: a larger movement varies more, so the offset is a factor on the share (Harris and Wolpert 1998). Skill and variation never raise a range of motion, so the whole range bounds the result.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bound and one scalar offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped; a share of 0 or of the whole range has no room and stays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `LEVELS` of `AutoMovieMotionHumanRange` through the shared cell rule and the shared scalar offset.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function amount(
    source: AutoMovieMotionHumanVariation.ISource | undefined,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the axis, the spread, the bound and what stays.
   * @evidence contracts/development/implementation.md#principled-implementation The elbow's swivel does not change where the hand is, so it is a freedom the goal does not depend on and varies with little regard to skill (Scholz and Schoner 1999); the allowed arc is read on the same strain `solve` ranks by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The allowed arc on both sides, one scalar offset and one turn about the line.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arc ends at the first place the strain refuses, so an offset never passes through a refused place to an allowed one beyond it; an elbow on the line has no swivel and stays.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most `2 AutoMovieMotionHumanVariationDraw.TRUNCATE spread / STEP` strain reads, each one bounded sweep, once per slot at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanBend.strain` for legality and `AutoMovieMotionHumanBend.turn` for the rotation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function swivel(
    source: AutoMovieMotionHumanVariation.ISource | undefined,
    key: string,
    props: AutoMovieMotionHumanBend.ISolve,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the spread and the bound.
   * @evidence contracts/development/implementation.md#principled-implementation The elbow's width is a freedom the hand's goal does not depend on, so its spread narrows little with skill (Scholz and Schoner 1999).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared scalar offset.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function bend(
    source: AutoMovieMotionHumanVariation.ISource | undefined,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the spread and the bound.
   * @evidence contracts/development/implementation.md#principled-implementation How a hand's path bows between two places is a freedom the end place does not depend on, so its spread narrows little with skill (Todorov and Jordan 2002).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared scalar offset.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function curvature(
    source: AutoMovieMotionHumanVariation.ISource | undefined,
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
