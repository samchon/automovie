import type {
  IAutoMovieHumanShoulderOutline,
  IAutoMovieHumanTrunkColumn,
  IAutoMovieHumanTrunkContext,
  IAutoMovieHumanTrunkFeatures,
  IAutoMovieHumanTrunkInputs,
  IAutoMovieHumanTrunkKeys,
  IAutoMovieHumanTrunkNeckSeat,
  IAutoMovieHumanTrunkSection,
  IAutoMovieHumanTrunkSolution,
  IAutoMovieHumanTrunkSolver,
  IAutoMovieHumanTrunkState,
  IAutoMovieLoftContract,
  IAutoMovieLoftRelief,
} from "@automovie/interface";

import { AutoMovieHumanBreastProfile } from "./AutoMovieHumanBreastProfile";
import { AutoMovieHumanShoulderCap } from "./AutoMovieHumanShoulderCap";
import { AutoMovieHumanShoulderDatum } from "./AutoMovieHumanShoulderDatum";
import { AutoMovieHumanShoulderLine } from "./AutoMovieHumanShoulderLine";
import { AutoMovieHumanTrunkClosure } from "./AutoMovieHumanTrunkClosure";
import { AutoMovieHumanTrunkCourses } from "./AutoMovieHumanTrunkCourses";
import { AutoMovieHumanTrunkFeatures } from "./AutoMovieHumanTrunkFeatures";
import { AutoMovieHumanTrunkGuides } from "./AutoMovieHumanTrunkGuides";
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
  /*
   * Passes closing the tapes and the courses together; the second only corrects
   * what the first moved.
   */
  const PASSES: number = 2;

  /**
   * Solve the trunk.
   *
   * @param fixed The inputs, crotch height and neck chain.
   * @returns The column, landmarks, reliefs and shoulder pieces.
   */
  export function solve(
    fixed: IAutoMovieHumanTrunkSolver.IFixed,
  ): IAutoMovieHumanTrunkSolution {
    if ((fixed.neck === undefined) === (fixed.neckBoundary === undefined))
      throw new Error(
        "Trunk preparation needs exactly one actual neck chain or original boundary",
      );

    // The old trunk's construction and the body lane's interim solve the
    // same person's trunk from the same inputs object; the second takes the
    // first's solution, which its readers never change.
    const kept:
      | {
          fixed: IAutoMovieHumanTrunkSolver.IFixed;
          solution: IAutoMovieHumanTrunkSolution;
        }
      | undefined = SOLVED.get(fixed.inputs);
    if (
      kept !== undefined &&
      kept.fixed.stature === fixed.stature &&
      kept.fixed.crotch === fixed.crotch &&
      kept.fixed.neck === fixed.neck &&
      kept.fixed.neckBoundary === fixed.neckBoundary &&
      kept.fixed.rawNeck === fixed.rawNeck &&
      kept.fixed.thigh === fixed.thigh &&
      kept.fixed.groinRatio === fixed.groinRatio
    )
      return kept.solution;
    const solution: IAutoMovieHumanTrunkSolution = replay(
      fixed,
      converge(fixed),
    );
    SOLVED.set(fixed.inputs, { fixed: { ...fixed }, solution });
    return solution;
  }

  /*
   * The last solution per inputs object, with what it was solved from.
   */
  const SOLVED: WeakMap<
    IAutoMovieHumanTrunkInputs,
    {
      fixed: IAutoMovieHumanTrunkSolver.IFixed;
      solution: IAutoMovieHumanTrunkSolution;
    }
  > = new WeakMap();

  /**
   * Close the tapes and the courses and give the state that closes them.
   *
   * @param fixed The inputs, crotch height and neck chain.
   * @returns The solved state.
   */
  export function converge(
    fixed: IAutoMovieHumanTrunkSolver.IFixed,
  ): IAutoMovieHumanTrunkState {
    const ctx: IAutoMovieHumanTrunkContext = context(fixed);
    const st: IAutoMovieHumanTrunkState = start(ctx);

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
  export function replay(
    fixed: IAutoMovieHumanTrunkSolver.IFixed,
    st: IAutoMovieHumanTrunkState,
  ): IAutoMovieHumanTrunkSolution {
    return solution(context(fixed), st);
  }

  /*
   * The fixed landmarks of a solve.
   * Parameter fixed: The fixed inputs.
   * Returns: The context.
   */
  function context(
    fixed: IAutoMovieHumanTrunkSolver.IFixed,
  ): IAutoMovieHumanTrunkContext {
    // The cervicale at the person's own height (ANSUR II cervicale height),
    // on the back of the neck's ring.
    const seat: IAutoMovieHumanTrunkNeckSeat.ISeat =
      fixed.neckBoundary ?? AutoMovieHumanTrunkNeckSeat.read(fixed.neck!);
    const cervicale: [number, number, number] = [
      seat.back[0],
      fixed.inputs.cervicale,
      0,
    ];
    function at(share: number): number {
      return AutoMovieHumanTrunkLandmarks.at(fixed.crotch, cervicale[1], share);
    }
    const pitch: number = ringPitch(fixed.inputs.hip / (2 * Math.PI));

    return {
      fixed,
      seat,
      cervicale,
      span: cervicale[1] - fixed.crotch,
      buttock: at(AutoMovieHumanTrunkLandmarks.BUTTOCK),
      iliocristale: at(AutoMovieHumanTrunkLandmarks.ILIOCRISTALE),
      omphalion: at(AutoMovieHumanTrunkLandmarks.OMPHALION),
      axilla: fixed.inputs.axilla,
      shoulderY: AutoMovieHumanShoulderDatum.overlapStation(
        fixed.inputs.acromion,
        seat.y,
      ),
      soft: AutoMovieHumanTrunkInguinalFold.softness(
        pitch,
        AutoMovieHumanTrunkRows.MAX_GAP,
      ),
    };
  }

  /*
   * The control pitch of the crotch ring: its perimeter over its 256 controls.
   * Parameter radius: The hip tape over 2 pi, mm.
   * Returns: The pitch, mm.
   */
  function ringPitch(radius: number): number {
    return (
      (2 * Math.PI * AutoMovieHumanTrunkShapes.CROTCH_WIDTH * radius * 1.1) /
      AutoMovieHumanTrunkQuadrant.ORDER
    );
  }

  /*
   * The start of the solve: the population's landmark places and rings a tenth
   * wider than circles of the tapes.
   * Parameter ctx: The context.
   * Returns: The initial state.
   */
  function start(ctx: IAutoMovieHumanTrunkContext): IAutoMovieHumanTrunkState {
    const inputs: IAutoMovieHumanTrunkInputs = ctx.fixed.inputs;
    function at(share: number): number {
      return AutoMovieHumanTrunkLandmarks.at(
        ctx.fixed.crotch,
        ctx.cervicale[1],
        share,
      );
    }
    function round(tape: number): number {
      return (tape / (2 * Math.PI)) * 1.1;
    }

    return {
      waist: at(AutoMovieHumanTrunkLandmarks.WAIST),
      bust: at(AutoMovieHumanTrunkLandmarks.CHEST),
      shoulderZ: inputs.biacromial / 2,
      anterior: AutoMovieHumanTrunkGuides.SHARE.anteriorAxillary,
      groin: AutoMovieHumanTrunkShapes.CROTCH_WIDTH * round(inputs.hip),
      projection: AutoMovieHumanBreastProfile.start(
        inputs.chest,
        inputs.underbust,
      ),
      widths: {
        buttock: round(inputs.hip),
        highHip: round(inputs.highHip),
        waist: round(inputs.waist),
        fold: round(inputs.underbust),
        bust: round(inputs.chest),
      },
    };
  }

  /*
   * The solved trunk's published pieces.
   * Parameter ctx: The context.
   * Parameter st: The solved state.
   * Returns: The solution.
   */
  function solution(
    ctx: IAutoMovieHumanTrunkContext,
    st: IAutoMovieHumanTrunkState,
  ): IAutoMovieHumanTrunkSolution {
    const inputs: IAutoMovieHumanTrunkInputs = ctx.fixed.inputs;
    const col: IAutoMovieHumanTrunkColumn.IColumn =
      AutoMovieHumanTrunkKeys.column(ctx, st);
    const h: IAutoMovieHumanTrunkKeys.Heights = AutoMovieHumanTrunkKeys.heights(
      ctx,
      st,
    );
    const where: IAutoMovieHumanTrunkFeatures.ISites =
      AutoMovieHumanTrunkKeys.sites(ctx, st, col);
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    const reliefs: IAutoMovieLoftRelief[] = AutoMovieHumanTrunkFeatures.all(
      col,
      where,
      diagnostics,
    );
    const {
      shoulder,
      glenohumeral,
    }: ReturnType<typeof AutoMovieHumanShoulderDatum.create> =
      AutoMovieHumanShoulderDatum.create(
        inputs,
        ctx.fixed.stature,
        ctx.seat.side,
        st.shoulderZ,
      );
    const line: IAutoMovieHumanShoulderOutline =
      AutoMovieHumanShoulderLine.create(
        { y: ctx.shoulderY, z: st.shoulderZ },
        ctx.seat.lateral,
      );
    const radius: number = inputs.bicep / (2 * Math.PI);
    const cap: IAutoMovieHumanShoulderOutline =
      AutoMovieHumanShoulderCap.create(line.at(ctx.shoulderY), ctx.shoulderY, {
        y: glenohumeral[1],
        z: glenohumeral[2],
        radius,
      });
    const bustS: IAutoMovieHumanTrunkSection = col.at(h.bust);
    const bustPoint: [number, number, number] =
      AutoMovieHumanTrunkCourses.point(
        bustS,
        reliefs,
        Math.min(0.8 * bustS.width, inputs.bustSpan / 2),
        "front",
      );

    return {
      column: col,
      reliefs,
      diagnostics,
      sites: where,
      seat: ctx.seat,
      neck: ctx.fixed.neck ?? null,
      rawNeck: ctx.fixed.rawNeck,
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
        axis: Array.from(
          { length: 65 },
          (_: unknown, i: number): [number, number] => {
            const y: number =
              ctx.fixed.crotch + (i / 64) * (ctx.seat.y - ctx.fixed.crotch);
            const s: IAutoMovieHumanTrunkSection = col.at(y);

            return [y, (s.front + s.back) / 2];
          },
        ),
      },
    };
  }
}
