import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import type { IAutoMovieHumanTrunkContext } from "./IAutoMovieHumanTrunkContext";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";
import type { IAutoMovieHumanTrunkState } from "./IAutoMovieHumanTrunkState";
import type { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";
import { AutoMovieHumanTrunkCourses } from "./AutoMovieHumanTrunkCourses";
import { AutoMovieHumanTrunkFeatures } from "./AutoMovieHumanTrunkFeatures";
import { AutoMovieHumanTrunkGroinWidth } from "./AutoMovieHumanTrunkGroinWidth";
import { AutoMovieHumanTrunkKeys } from "./AutoMovieHumanTrunkKeys";
import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";
import { AutoMovieHumanTrunkTapes } from "./AutoMovieHumanTrunkTapes";

/**
 * The closure of the trunk's tapes and courses on its own surface: each tape
 * at its site on the hull of its own section, reliefs included, bisected until
 * the girth is the tape (generalization.md, Tapes), and each course input
 * moving the landmark it owns until the taut length over the surface reads it
 * (`neckToWaist` the waist, `shoulderToApex` the bust point). The shoulder points
 * stand on the measured biacromial breadth and acromial height, so
 * `acrossShoulder` is a reading of the skin over them. Nothing here changes
 * an input.
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

    // The chest tape passes over the breasts and the blades, both standing on
    // the wall, which a man's chest tape measures whole. A woman's wall at the
    // bust row is the thorax the underbust tape closes at the fold, carried
    // up: the size of the breasts is the chest tape's excess over the
    // underbust (EN 13402-3 sizes a bra by those two girths), so the breasts
    // close all of that excess. The tape bridges between the bust points, so
    // the domes' projection is what their hull adds that excess with, not the
    // excess spread round the torso.
    const chest = (col: AutoMovieHumanTrunkColumn.IColumn): IAutoMovieHumanRelief[] => {
      const sites: AutoMovieHumanTrunkFeatures.ISites = AutoMovieHumanTrunkKeys.sites(ctx, st, col);

      return [...optional("trunk.breast", (): IAutoMovieHumanRelief[] => AutoMovieHumanTrunkFeatures.breasts(col, sites)), ...optional("trunk.scapula", (): IAutoMovieHumanRelief[] => AutoMovieHumanTrunkFeatures.scapulae(col, sites))];
    };
    const wall: number = inputs.underbust;
    st.projection = 0;
    close("bust", inputs.female ? Math.min(inputs.chest, wall) : inputs.chest, h.bust, chest);
    if (inputs.female && inputs.chest > girthAt(ctx, st, h.bust, chest))
      st.projection = AutoMovieHumanTrunkSolve.bisect(
        0,
        inputs.chest / (2 * Math.PI),
        (p: number): number => {
          st.projection = p;

          return girthAt(ctx, st, h.bust, chest) - inputs.chest;
        },
        1,
      );
    close("buttock", inputs.hip, ctx.buttock, (col: AutoMovieHumanTrunkColumn.IColumn): IAutoMovieHumanRelief[] =>
      optional("trunk.buttock", (): IAutoMovieHumanRelief[] => AutoMovieHumanTrunkFeatures.buttocks(col, AutoMovieHumanTrunkKeys.sites(ctx, st, col))),
    );
  }

  /**
   * An optional feature's windows while the tapes and courses close, or none
   * when it breaks its contract: the closure then reads the base there, as
   * the figure will, and the final feature list records the break once.
   *
   * @param producer The feature's name.
   * @param make The feature's windows.
   * @returns The windows, or none.
   */
  function optional(producer: string, make: () => IAutoMovieHumanRelief[]): IAutoMovieHumanRelief[] {
    return AutoMovieHumanTrunkFeatures.guarded(producer, 0, [], make);
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
    const breasts = (col: AutoMovieHumanTrunkColumn.IColumn): IAutoMovieHumanRelief[] =>
      optional("trunk.breast", (): IAutoMovieHumanRelief[] => AutoMovieHumanTrunkFeatures.breasts(col, AutoMovieHumanTrunkKeys.sites(ctx, st, col)));

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

    // The shoulder points stand on the biacromial breadth, the acromia
    // projected to the skin (ISO 8559-1 3.1.1), set at the start; the across
    // back course over them is a reading of the skin, not a solve. The
    // anterior folds keep the start's population share: no input fixes the
    // armpit's front fold points, which ISO 8559-1 3.1.13 sets by a rule
    // pressed under the arm.
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
