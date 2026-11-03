import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import { AutoMovieHumanShoulderCap } from "./AutoMovieHumanShoulderCap";
import { AutoMovieHumanShoulderLine } from "./AutoMovieHumanShoulderLine";
import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkContext } from "./IAutoMovieHumanTrunkContext";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";
import type { IAutoMovieHumanTrunkState } from "./IAutoMovieHumanTrunkState";
import type { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";
import { AutoMovieHumanTrunkClosure } from "./AutoMovieHumanTrunkClosure";
import { AutoMovieHumanTrunkCourses } from "./AutoMovieHumanTrunkCourses";
import { AutoMovieHumanTrunkFeatures } from "./AutoMovieHumanTrunkFeatures";
import { AutoMovieHumanTrunkGuideAnteriorAxillary } from "./AutoMovieHumanTrunkGuideAnteriorAxillary";
import { AutoMovieHumanTrunkInguinalFold } from "./AutoMovieHumanTrunkInguinalFold";
import { AutoMovieHumanTrunkKeys } from "./AutoMovieHumanTrunkKeys";
import { AutoMovieHumanTrunkLandmarks } from "./AutoMovieHumanTrunkLandmarks";
import { AutoMovieHumanTrunkNeckSeat } from "./AutoMovieHumanTrunkNeckSeat";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkRows } from "./AutoMovieHumanTrunkRows";
import { AutoMovieHumanTrunkShapes } from "./AutoMovieHumanTrunkShapes";

/**
 * The trunk solved from the person's inputs, the crotch height and the neck's
 * chain alone: the tapes and the courses closed together on its own surface
 * (`AutoMovieHumanTrunkClosure`), and the pieces the chains and the skeleton
 * are built from published. A tape and a course share sections, so two passes
 * close them together. Nothing here changes an input: a course built to its
 * definition that the skin cannot honour is the input's fault, which the
 * anatomy test reports.
 */
export namespace AutoMovieHumanTrunkSolver {
  /** The fixed inputs of a solve. */
  export interface IFixed {
    /** The person's tapes, courses and controls in calibration millimetres. */
    inputs: IAutoMovieHumanTrunkInputs;

    /** Stature in calibration millimetres. */
    stature: number;

    /** Height of the crotch ring, mm. */
    crotch: number;

    /** The neck chain, named `head`. */
    neck: IAutoMovieHumanLoftChain;

    /** The thigh tape, mm, for the groin width; absent, the references' median ratio is used. */
    thigh?: number;

    /** The crotch ring's half girth over the thigh tape, as the leg reports it. */
    groinRatio?: number;
  }

  /** What the solve moves; saved, it replays a solved trunk without solving again. */
  export type IState = IAutoMovieHumanTrunkState;

  /** The lowest the shoulder point stands under the neck's ring, mm: the line needs a run to copy the ring's slope over. Conventional. */
  const SHOULDER_GAP: number = 6;

  /** Passes closing the tapes and the courses together; the second only corrects what the first moved. */
  const PASSES: number = 2;

  /**
   * Solve the trunk.
   *
   * @param fixed The inputs, crotch height and neck chain.
   * @returns The column, landmarks, reliefs and shoulder pieces.
   */
  export function solve(fixed: IFixed): IAutoMovieHumanTrunkSolution {
    return replay(fixed, converge(fixed));
  }

  /**
   * Close the tapes and the courses and give the state that closes them.
   *
   * @param fixed The inputs, crotch height and neck chain.
   * @returns The solved state.
   */
  export function converge(fixed: IFixed): IState {
    const ctx: IAutoMovieHumanTrunkContext = context(fixed);
    const st: IState = start(ctx);

    for (let pass: number = 0; pass < PASSES; pass++) {
      AutoMovieHumanTrunkClosure.tapes(ctx, st);
      AutoMovieHumanTrunkClosure.courses(ctx, st);
    }
    st.groin = AutoMovieHumanTrunkClosure.groin(ctx, st);

    return st;
  }

  /**
   * The pieces of a solved state, without solving again: what a saved state
   * costs to read back.
   *
   * @param fixed The inputs, crotch height and neck chain.
   * @param st The solved state of `converge`.
   * @returns The column, landmarks, reliefs and shoulder pieces.
   */
  export function replay(fixed: IFixed, st: IState): IAutoMovieHumanTrunkSolution {
    return solution(context(fixed), st);
  }

  /**
   * The fixed landmarks of a solve.
   *
   * @param fixed The fixed inputs.
   * @returns The context.
   */
  function context(fixed: IFixed): IAutoMovieHumanTrunkContext {
    const seat: AutoMovieHumanTrunkNeckSeat.ISeat = AutoMovieHumanTrunkNeckSeat.read(fixed.neck);
    const cervicale: [number, number, number] = [
      seat.back[0],
      Math.max(seat.y + 1, AutoMovieHumanTrunkLandmarks.CERVICALE * fixed.stature),
      0,
    ];
    const at = (share: number): number => AutoMovieHumanTrunkLandmarks.at(fixed.crotch, cervicale[1], share);
    const pitch: number = ringPitch(fixed.inputs.hip / (2 * Math.PI));

    return {
      fixed,
      seat,
      cervicale,
      span: cervicale[1] - fixed.crotch,
      buttock: at(AutoMovieHumanTrunkLandmarks.BUTTOCK),
      iliocristale: at(AutoMovieHumanTrunkLandmarks.ILIOCRISTALE),
      omphalion: at(AutoMovieHumanTrunkLandmarks.OMPHALION),
      axilla: at(AutoMovieHumanTrunkLandmarks.AXILLA),
      shoulderY: Math.min(at(AutoMovieHumanTrunkLandmarks.ACROMION), seat.y - SHOULDER_GAP),
      soft: AutoMovieHumanTrunkInguinalFold.softness(pitch, AutoMovieHumanTrunkRows.MAX_GAP),
    };
  }

  /**
   * The control pitch of the crotch ring: its perimeter over its 256 controls.
   *
   * @param radius The hip tape over 2 pi, mm.
   * @returns The pitch, mm.
   */
  function ringPitch(radius: number): number {
    return (2 * Math.PI * AutoMovieHumanTrunkShapes.CROTCH_WIDTH * radius * 1.1) / AutoMovieHumanTrunkQuadrant.ORDER;
  }

  /**
   * The start of the solve: the population's landmark places and rings a
   * tenth wider than circles of the tapes.
   *
   * @param ctx The context.
   * @returns The initial state.
   */
  function start(ctx: IAutoMovieHumanTrunkContext): IState {
    const inputs: IAutoMovieHumanTrunkInputs = ctx.fixed.inputs;
    const at = (share: number): number => AutoMovieHumanTrunkLandmarks.at(ctx.fixed.crotch, ctx.cervicale[1], share);
    const round = (tape: number): number => (tape / (2 * Math.PI)) * 1.1;

    return {
      waist: at(AutoMovieHumanTrunkLandmarks.WAIST),
      bust: at(AutoMovieHumanTrunkLandmarks.CHEST),
      shoulderZ: Math.max(ctx.seat.width + 20, (0.5 * inputs.acrossShoulder) / 1.1),
      anterior: AutoMovieHumanTrunkGuideAnteriorAxillary.SHARE,
      groin: AutoMovieHumanTrunkShapes.CROTCH_WIDTH * round(inputs.hip),
      widths: {
        buttock: round(inputs.hip),
        highHip: round(inputs.highHip),
        waist: round(inputs.waist),
        fold: round(inputs.underbust),
        bust: round(inputs.chest),
      },
    };
  }

  /**
   * The solved trunk's published pieces.
   *
   * @param ctx The context.
   * @param st The solved state.
   * @returns The solution.
   */
  function solution(ctx: IAutoMovieHumanTrunkContext, st: IState): IAutoMovieHumanTrunkSolution {
    const inputs: IAutoMovieHumanTrunkInputs = ctx.fixed.inputs;
    const col: AutoMovieHumanTrunkColumn.IColumn = AutoMovieHumanTrunkKeys.column(ctx, st);
    const h: AutoMovieHumanTrunkKeys.Heights = AutoMovieHumanTrunkKeys.heights(ctx, st);
    const where: AutoMovieHumanTrunkFeatures.ISites = AutoMovieHumanTrunkKeys.sites(ctx, st, col);
    const reliefs: IAutoMovieHumanRelief[] = AutoMovieHumanTrunkFeatures.all(col, where);
    const shoulder: [number, number, number] = [
      AutoMovieHumanTrunkShapes.SHOULDER.middle * ctx.fixed.stature,
      ctx.shoulderY,
      st.shoulderZ,
    ];
    const glenohumeral: [number, number, number] = AutoMovieHumanTrunkLandmarks.glenohumeral(shoulder, inputs.upperArm);
    const line: IAutoMovieHumanShoulderOutline = AutoMovieHumanShoulderLine.create(
      { y: ctx.shoulderY, z: st.shoulderZ },
      ctx.seat.lateral,
    );
    const radius: number = inputs.bicep / (2 * Math.PI);
    const cap: IAutoMovieHumanShoulderOutline = AutoMovieHumanShoulderCap.create(line.at(ctx.shoulderY), ctx.shoulderY, {
      y: glenohumeral[1],
      z: glenohumeral[2],
      radius,
    });
    const bustS: IAutoMovieHumanTrunkSection = col.at(h.bust);
    const bustPoint: [number, number, number] = AutoMovieHumanTrunkCourses.point(
      bustS,
      reliefs,
      Math.min(0.8 * bustS.width, inputs.bustSpan / 2),
      "front",
    );

    return {
      column: col,
      reliefs,
      sites: where,
      seat: ctx.seat,
      neck: ctx.fixed.neck,
      line,
      oval: { glenohumeral, radius, cap },
      pitch: ringPitch(inputs.hip / (2 * Math.PI)),
      landmarks: {
        crotch: ctx.fixed.crotch,
        cervicale: ctx.cervicale[1],
        buttock: ctx.buttock,
        iliocristale: ctx.iliocristale,
        omphalion: ctx.omphalion,
        waist: h.waist,
        fold: h.fold,
        bust: h.bust,
        axilla: ctx.axilla,
        shoulder,
        glenohumeral,
        bustPoint,
        axis: Array.from({ length: 65 }, (_: unknown, i: number): [number, number] => {
          const y: number = ctx.fixed.crotch + (i / 64) * (ctx.seat.y - ctx.fixed.crotch);
          const s: IAutoMovieHumanTrunkSection = col.at(y);

          return [y, (s.front + s.back) / 2];
        }),
      },
    };
  }
}
