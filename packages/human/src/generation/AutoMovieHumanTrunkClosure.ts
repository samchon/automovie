import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import type { IAutoMovieHumanTrunkContext } from "./IAutoMovieHumanTrunkContext";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";
import type { IAutoMovieHumanTrunkState } from "./IAutoMovieHumanTrunkState";
import type { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";
import { AutoMovieHumanTrunkCourses } from "./AutoMovieHumanTrunkCourses";
import { AutoMovieHumanTrunkFeatures } from "./AutoMovieHumanTrunkFeatures";
import { AutoMovieHumanTrunkGroinWidth } from "./AutoMovieHumanTrunkGroinWidth";
import { AutoMovieHumanTrunkGuideBustLine } from "./AutoMovieHumanTrunkGuideBustLine";
import { AutoMovieHumanTrunkKeys } from "./AutoMovieHumanTrunkKeys";
import { AutoMovieHumanTrunkShapes } from "./AutoMovieHumanTrunkShapes";
import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";
import { AutoMovieHumanTrunkTapes } from "./AutoMovieHumanTrunkTapes";

/**
 * The closure of the trunk's tapes and courses on its own surface: each tape
 * at its site on the hull of its own section, reliefs included, bisected until
 * the girth is the tape (generalization.md, Tapes), and each course input
 * moving the landmark it owns until the taut length over the surface reads it
 * (`neckToWaist` the waist, `shoulderToApex` the bust point, `acrossShoulder`
 * the shoulder points' breadth, `frontInterscyeLength` the anterior axillary
 * guide). Nothing here changes an input.
 */
export namespace AutoMovieHumanTrunkClosure {
  /** A function of the column giving the reliefs that act at a tape's site. */
  type Reliefs = (col: AutoMovieHumanTrunkColumn.IColumn) => IAutoMovieHumanRelief[];

  /**
   * A section's tape at a height on a state, reliefs included.
   *
   * @param ctx The context.
   * @param st The state.
   * @param y Height, mm.
   * @param reliefs The reliefs of the column at that state.
   * @returns The hull girth, mm.
   */
  export function girthAt(ctx: IAutoMovieHumanTrunkContext, st: IAutoMovieHumanTrunkState, y: number, reliefs: Reliefs): number {
    const col: AutoMovieHumanTrunkColumn.IColumn = AutoMovieHumanTrunkKeys.column(ctx, st);

    return AutoMovieHumanTrunkTapes.hull(AutoMovieHumanTrunkTapes.points(col.at(y), reliefs(col)));
  }

  /**
   * Close every tape at its site on its own section.
   *
   * @param ctx The context.
   * @param st The state, whose widths are moved.
   */
  export function tapes(ctx: IAutoMovieHumanTrunkContext, st: IAutoMovieHumanTrunkState): void {
    const inputs: IAutoMovieHumanTrunkInputs = ctx.fixed.inputs;
    const h: AutoMovieHumanTrunkKeys.Heights = AutoMovieHumanTrunkKeys.heights(ctx, st);
    const none: Reliefs = (): IAutoMovieHumanRelief[] => [];
    const close = (name: keyof IAutoMovieHumanTrunkState["widths"], tape: number, y: number, reliefs: Reliefs): void => {
      st.widths[name] = AutoMovieHumanTrunkTapes.solve(
        tape,
        (w: number): number => {
          st.widths[name] = w;

          return girthAt(ctx, st, y, reliefs);
        },
        st.widths[name],
      );
    };

    close("waist", inputs.waist, h.waist, none);
    close("highHip", inputs.highHip, h.highHip, none);
    close("fold", inputs.underbust, h.fold, none);
    close("bust", inputs.chest, h.bust, (col: AutoMovieHumanTrunkColumn.IColumn): IAutoMovieHumanRelief[] =>
      AutoMovieHumanTrunkFeatures.breasts(col, AutoMovieHumanTrunkKeys.sites(ctx, st, col)),
    );
    close("buttock", inputs.hip, ctx.buttock, (col: AutoMovieHumanTrunkColumn.IColumn): IAutoMovieHumanRelief[] =>
      AutoMovieHumanTrunkFeatures.buttocks(col, AutoMovieHumanTrunkKeys.sites(ctx, st, col)),
    );
  }

  /**
   * Move each landmark a course owns until the course reads its input.
   *
   * @param ctx The context.
   * @param st The state, whose landmarks are moved.
   */
  export function courses(ctx: IAutoMovieHumanTrunkContext, st: IAutoMovieHumanTrunkState): void {
    const inputs: IAutoMovieHumanTrunkInputs = ctx.fixed.inputs;
    const column = (): AutoMovieHumanTrunkColumn.IColumn => AutoMovieHumanTrunkKeys.column(ctx, st);
    const shoulder = (): [number, number, number] => [
      AutoMovieHumanTrunkShapes.SHOULDER.middle * ctx.fixed.stature,
      ctx.shoulderY,
      st.shoulderZ,
    ];
    const breasts = (col: AutoMovieHumanTrunkColumn.IColumn): IAutoMovieHumanRelief[] =>
      AutoMovieHumanTrunkFeatures.breasts(col, AutoMovieHumanTrunkKeys.sites(ctx, st, col));

    // Neck to waist: the waist moves down as the back's length grows.
    st.waist = AutoMovieHumanTrunkSolve.bisect(
      ctx.buttock + 0.1 * ctx.span,
      ctx.axilla - 0.25 * ctx.span,
      (y: number): number => {
        st.waist = y;
        const waist: number = AutoMovieHumanTrunkKeys.heights(ctx, st).waist;

        return AutoMovieHumanTrunkCourses.backNeckToWaist(column(), waist, ctx.cervicale) - inputs.neckToWaist;
      },
      -1,
    );

    // Shoulder to apex: the bust point moves down as the front's length grows.
    st.bust = AutoMovieHumanTrunkSolve.bisect(
      AutoMovieHumanTrunkKeys.heights(ctx, st).fold + 0.02 * ctx.span,
      ctx.axilla - 0.04 * ctx.span,
      (y: number): number => {
        st.bust = y;
        const col: AutoMovieHumanTrunkColumn.IColumn = column();
        const reliefs: IAutoMovieHumanRelief[] = breasts(col);
        const s: IAutoMovieHumanTrunkSection = col.at(AutoMovieHumanTrunkKeys.heights(ctx, st).bust);
        const lateral: number = Math.min(0.8 * s.width, inputs.bustSpan / 2);
        const point: [number, number, number] = AutoMovieHumanTrunkCourses.point(s, reliefs, lateral, "front");

        return AutoMovieHumanTrunkCourses.sideNeckToBust(col, reliefs, ctx.seat.side, point) - inputs.shoulderToApex;
      },
      -1,
    );

    // Across the back: the shoulder points move apart as the tape grows.
    st.shoulderZ = AutoMovieHumanTrunkSolve.bisect(
      ctx.seat.width + 10,
      3 * ctx.seat.width + 60,
      (z: number): number => {
        st.shoulderZ = z;

        return AutoMovieHumanTrunkCourses.acrossBack(column(), shoulder(), ctx.cervicale) - inputs.acrossShoulder;
      },
      1,
    );

    // Across the front: the anterior folds move apart as the length grows.
    st.anterior = AutoMovieHumanTrunkSolve.bisect(
      AutoMovieHumanTrunkGuideBustLine.SHARE + 0.05,
      0.97,
      (a: number): number => {
        st.anterior = a;
        const col: AutoMovieHumanTrunkColumn.IColumn = column();

        return AutoMovieHumanTrunkCourses.acrossFront(col.at(ctx.axilla), breasts(col)) - inputs.frontInterscyeLength;
      },
      1,
    );
  }

  /**
   * The crotch key's half width, from the thigh tape when the leg gives its ratio.
   *
   * @param ctx The context.
   * @param st The state.
   * @returns The half width, mm.
   */
  export function groin(ctx: IAutoMovieHumanTrunkContext, st: IAutoMovieHumanTrunkState): number {
    return AutoMovieHumanTrunkGroinWidth.width({
      buttock: st.widths.buttock,
      thigh: ctx.fixed.thigh,
      ratio: ctx.fixed.groinRatio,
      girth: (w: number): number => {
        st.groin = w;

        return girthAt(ctx, st, ctx.fixed.crotch, (): IAutoMovieHumanRelief[] => []);
      },
    });
  }
}
