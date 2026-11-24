import type {
  IAutoMovieHumanTrunkColumn,
  IAutoMovieHumanTrunkContext,
  IAutoMovieHumanTrunkFeatures,
  IAutoMovieHumanTrunkInputs,
  IAutoMovieHumanTrunkKey,
  IAutoMovieHumanTrunkKeys,
  IAutoMovieHumanTrunkState,
} from "@automovie/interface";

import { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";
import { AutoMovieHumanTrunkGuides } from "./AutoMovieHumanTrunkGuides";
import { AutoMovieHumanTrunkLandmarks } from "./AutoMovieHumanTrunkLandmarks";
import { AutoMovieHumanTrunkShapes } from "./AutoMovieHumanTrunkShapes";
import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/**
 * The column of a solve's state: the landmark heights the courses move, the
 * keys at the landmark stations, the column through them and what the features
 * stand on. A function of the context and the state alone.
 */
export namespace AutoMovieHumanTrunkKeys {
  /**
   * The landmark heights, kept apart so the sections stay ordered: the waist
   * between the buttock and the axilla, the fold under the bust point by the
   * breast's lower pole, and the high hip midway.
   *
   * @param ctx The context.
   * @param st The state.
   * @returns The waist, fold, bust and high hip heights, mm.
   */
  export function heights(
    ctx: IAutoMovieHumanTrunkContext,
    st: IAutoMovieHumanTrunkState,
  ): IAutoMovieHumanTrunkKeys.Heights {
    const w: number = Math.min(
      Math.max(st.waist, ctx.buttock + 0.08 * ctx.span),
      ctx.axilla - 0.25 * ctx.span,
    );
    const top: number = Math.min(st.bust, ctx.axilla - 0.04 * ctx.span);
    const f: number = Math.max(
      w + 0.05 * ctx.span,
      top - AutoMovieHumanTrunkLandmarks.FOLD_DROP * ctx.span,
    );
    const b: number = Math.max(f + 0.02 * ctx.span, top);

    return { waist: w, fold: f, bust: b, highHip: (ctx.buttock + w) / 2 };
  }

  /**
   * The column's keys at the landmark stations.
   *
   * @param ctx The context.
   * @param st The state.
   * @returns The keys by rising height, from the crotch to the neck's ring.
   */
  export function keys(
    ctx: IAutoMovieHumanTrunkContext,
    st: IAutoMovieHumanTrunkState,
  ): IAutoMovieHumanTrunkKey[] {
    const h: IAutoMovieHumanTrunkKeys.Heights = heights(ctx, st);
    const K: typeof AutoMovieHumanTrunkShapes = AutoMovieHumanTrunkShapes;
    const share: number = AutoMovieHumanTrunkGuides.SHARE.anteriorAxillary;
    const bicepsRadius: number = ctx.fixed.inputs.bicep / (2 * Math.PI);
    const axillaWidth: number = st.shoulderZ - bicepsRadius;
    const neckDepth: number = ctx.seat.front[0] - ctx.seat.back[0];
    const axillaDepth: number = 2 * axillaWidth * ctx.chestWallDepth;
    const weight: number = AutoMovieHumanTrunkSolve.window(
      ctx.shoulderY,
      ctx.axilla,
      ctx.seat.y,
    );
    const shoulderDepth: number =
      neckDepth + weight * (axillaDepth - neckDepth);
    const at = (
      y: number,
      width: number,
      ratio: number,
      anterior: number = share,
    ): IAutoMovieHumanTrunkKey => K.key(y, width, ratio, ctx.back(y), anterior);

    return [
      // ESTIMATE: the unmeasured adjacent crotch keeps the hip's aspect ratio.
      at(ctx.fixed.crotch, st.groin, K.BUTTOCK_DEPTH),
      at(ctx.buttock, st.widths.buttock, K.BUTTOCK_DEPTH),

      // No front place at the high hip: its tape fixes the girth there, and the
      // abdominal wall's front runs from the buttock row to the waist.
      {
        // ESTIMATE: carry the nearest lumbar aspect ratio to high hip.
        ...at(h.highHip, st.widths.highHip, K.WAIST_DEPTH),
        front: null,
      },
      at(h.waist, st.widths.waist, K.WAIST_DEPTH),
      at(h.fold, st.widths.fold, ctx.chestWallDepth),
      at(h.bust, st.widths.bust, ctx.chestWallDepth),
      // ESTIMATE: reserve the person's upper-arm circle medial to the acromion.
      at(ctx.axilla, axillaWidth, ctx.chestWallDepth, st.anterior),
      // ESTIMATE: blend observed neck depth with the axillary wall ellipse.
      at(ctx.shoulderY, st.shoulderZ, shoulderDepth / (2 * st.shoulderZ)),
      {
        y: ctx.seat.y,
        width: ctx.seat.width,
        middle: ctx.seat.middle,
        front: ctx.seat.front[0],
        back: ctx.seat.back[0],
        squareFront: 2,
        squareBack: 2,
        anterior: share,
      },
    ];
  }

  /**
   * The column of a state.
   *
   * @param ctx The context.
   * @param st The state.
   * @returns The column.
   */
  export function column(
    ctx: IAutoMovieHumanTrunkContext,
    st: IAutoMovieHumanTrunkState,
  ): IAutoMovieHumanTrunkColumn.IColumn {
    return AutoMovieHumanTrunkColumn.create(keys(ctx, st));
  }

  /**
   * What the features stand on, for a state and its column.
   *
   * @param ctx The context.
   * @param st The state.
   * @param col The column.
   * @returns The landmark heights and the tapes that size the features.
   */
  export function sites(
    ctx: IAutoMovieHumanTrunkContext,
    st: IAutoMovieHumanTrunkState,
    col: IAutoMovieHumanTrunkColumn.IColumn,
  ): IAutoMovieHumanTrunkFeatures.ISites {
    const inputs: IAutoMovieHumanTrunkInputs = ctx.fixed.inputs;
    const h: IAutoMovieHumanTrunkKeys.Heights = heights(ctx, st);

    return {
      crotch: ctx.fixed.crotch,
      buttock: ctx.buttock,
      iliocristale: ctx.iliocristale,
      omphalion: ctx.omphalion,
      waist: h.waist,
      fold: h.fold,
      bust: h.bust,
      axilla: ctx.axilla,
      bustSpan: inputs.bustSpan,
      projection: st.projection,
      buttockProjection: col.at(ctx.buttock).back - ctx.back(ctx.buttock),
      span: ctx.span,
      neck: ctx.seat.y,
    };
  }
}
