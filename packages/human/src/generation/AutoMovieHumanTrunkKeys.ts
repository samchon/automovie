import type { IAutoMovieHumanTrunkContext } from "./IAutoMovieHumanTrunkContext";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkKey } from "./IAutoMovieHumanTrunkKey";
import type { IAutoMovieHumanTrunkState } from "./IAutoMovieHumanTrunkState";
import { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";
import type { AutoMovieHumanTrunkFeatures } from "./AutoMovieHumanTrunkFeatures";
import { AutoMovieHumanTrunkLandmarks } from "./AutoMovieHumanTrunkLandmarks";
import { AutoMovieHumanTrunkShapes } from "./AutoMovieHumanTrunkShapes";
import { AutoMovieHumanTrunkGuides } from "./AutoMovieHumanTrunkGuides";

/**
 * The column of a solve's state: the landmark heights the courses move, the
 * keys at the landmark stations, the column through them and what the
 * features stand on. A function of the context and the state alone.
 */
export namespace AutoMovieHumanTrunkKeys {
  /** The landmark heights the courses move. */
  export type Heights = Record<"fold" | "bust" | "waist" | "highHip", number>;

  /**
   * The landmark heights, kept apart so the sections stay ordered: the waist
   * between the buttock and the axilla, the fold under the bust point by the
   * breast's lower pole, and the high hip midway.
   *
   * @param ctx The context.
   * @param st The state.
   * @returns The waist, fold, bust and high hip heights, mm.
   */
  export function heights(ctx: IAutoMovieHumanTrunkContext, st: IAutoMovieHumanTrunkState): Heights {
    const w: number = Math.min(Math.max(st.waist, ctx.buttock + 0.08 * ctx.span), ctx.axilla - 0.25 * ctx.span);
    const top: number = Math.min(st.bust, ctx.axilla - 0.04 * ctx.span);
    const f: number = Math.max(w + 0.05 * ctx.span, top - AutoMovieHumanTrunkLandmarks.FOLD_DROP * ctx.span);
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
  export function keys(ctx: IAutoMovieHumanTrunkContext, st: IAutoMovieHumanTrunkState): IAutoMovieHumanTrunkKey[] {
    const h: Heights = heights(ctx, st);
    const K: typeof AutoMovieHumanTrunkShapes = AutoMovieHumanTrunkShapes;
    const S: number = ctx.fixed.stature;
    const share: number = AutoMovieHumanTrunkGuides.SHARE.anteriorAxillary;

    return [
      K.key(ctx.fixed.crotch, st.groin, K.CROTCH, S, share),

      // The buttock point's back at the buttock's depth over the hip breadth
      // (ANSUR II): the base reaches the gluteal mass's measured depth, so the
      // gluteal relief only adds what the base still lacks there. Without
      // this place the base's back ran through the crotch and the high hip,
      // far inside, and the relief's peaked profile carried the whole depth
      // as a cone with a folded band under it.
      K.key(ctx.buttock, st.widths.buttock, K.BUTTOCK, S, share),

      // No front place at the high hip: its tape fixes the girth there, and the
      // abdominal wall's front runs from the buttock row to the waist.
      { ...K.key(h.highHip, st.widths.highHip, K.HIGH_HIP, S, share), front: null },
      K.key(h.waist, st.widths.waist, K.WAIST, S, share),
      K.key(h.fold, st.widths.fold, K.FOLD, S, share),
      K.key(h.bust, st.widths.bust, K.BUST, S, share),
      K.key(ctx.axilla, K.AXILLA_WIDTH * st.widths.bust, K.AXILLA, S, st.anterior),
      {
        y: ctx.shoulderY,
        width: st.shoulderZ,
        middle: K.SHOULDER.middle * S,
        front: K.SHOULDER.front * S,
        back: K.SHOULDER.back * S,
        squareFront: K.SHOULDER.squareFront,
        squareBack: K.SHOULDER.squareBack,
        anterior: share,
      },
      {
        y: ctx.seat.y,
        width: ctx.seat.width,
        middle: ctx.seat.middle,
        front: ctx.seat.front[0],
        back: ctx.seat.back[0],
        squareFront: K.SHOULDER.squareFront,
        squareBack: K.SHOULDER.squareBack,
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
  export function column(ctx: IAutoMovieHumanTrunkContext, st: IAutoMovieHumanTrunkState): AutoMovieHumanTrunkColumn.IColumn {
    return AutoMovieHumanTrunkColumn.create(keys(ctx, st), ctx.fixed.crotch, ctx.soft);
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
    col: AutoMovieHumanTrunkColumn.IColumn,
  ): AutoMovieHumanTrunkFeatures.ISites {
    const inputs: IAutoMovieHumanTrunkInputs = ctx.fixed.inputs;
    const h: Heights = heights(ctx, st);
    const target: IAutoMovieHumanTrunkKey = AutoMovieHumanTrunkShapes.key(
      ctx.buttock,
      st.widths.buttock,
      AutoMovieHumanTrunkShapes.BUTTOCK,
      ctx.fixed.stature,
      AutoMovieHumanTrunkGuides.SHARE.anteriorAxillary,
    );

    return {
      crotch: ctx.fixed.crotch,
      buttock: ctx.buttock,
      iliocristale: ctx.iliocristale,
      omphalion: ctx.omphalion,
      waist: h.waist,
      fold: h.fold,
      bust: h.bust,
      axilla: ctx.axilla,
      furrowFrom: ctx.buttock + 0.05 * ctx.span,
      bustSpan: inputs.bustSpan,
      projection: st.projection,
      buttockProjection: col.at(ctx.buttock).back - target.back!,
      span: ctx.span,
      neck: ctx.seat.y,
    };
  }
}
