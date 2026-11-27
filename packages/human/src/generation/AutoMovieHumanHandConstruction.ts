import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoft64,
  IAutoMovieHumanArmPrior,
  IAutoMovieHumanDigitCentreLine,
  IAutoMovieHumanHandConstruction,
  IAutoMovieHumanHandDigit,
  IAutoMovieHumanHandFinger,
  IAutoMovieHumanHandForm,
  IAutoMovieHumanHandWrist,
  IAutoMovieHumanNailWindow,
  IAutoMovieHumanSurfacePole,
  IAutoMovieLoftChain,
} from "@automovie/interface";

import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanHandDigitChain } from "./AutoMovieHumanHandDigitChain";
import { AutoMovieHumanHandFingers } from "./AutoMovieHumanHandFingers";
import { AutoMovieHumanHandForm } from "./AutoMovieHumanHandForm";
import { AutoMovieHumanHandMap } from "./AutoMovieHumanHandMap";
import { AutoMovieHumanHandPalm } from "./AutoMovieHumanHandPalm";
import { AutoMovieHumanHandSide } from "./AutoMovieHumanHandSide";
import { AutoMovieHumanHandSkinTargets } from "./AutoMovieHumanHandSkinTargets";
import { AutoMovieHumanHandSolve } from "./AutoMovieHumanHandSolve";

/**
 * The hand, composed from its pieces and nothing more: the form shared by
 * every person, the scales and the wrist's circle solved at their sites, every
 * digit on its bones, and the palm's and digits' chains reflected to the side
 * asked for. Each piece lives in its own file; this one only calls them in
 * order and hands their results on.
 *
 * The hand is built once in the left frame and the right side is its
 * reflection (`AutoMovieHumanHandSide`); each side reads its own measures into
 * the same construction.
 */
export namespace AutoMovieHumanHandConstruction {
  /** Restore exactly the declared contour coefficients and event incidence. */
  export function fixedContour(
    value: IAutoMovieHumanHandConstruction.IFixedContourInput,
  ): IAutoMovieContourLoft64 {
    const point: typeof AutoMovieHumanHandPalm.fixedPoint =
      AutoMovieHumanHandPalm.fixedPoint;
    return {
      ...value,
      sections: value.sections.map(
        (
          section: IAutoMovieHumanHandConstruction.IFixedContourInput["sections"][number],
        ): IAutoMovieContourLoft64.ISection => ({
          ...section,
          loops: section.loops.map(
            (
              loop: (typeof section.loops)[number],
            ): IAutoMovieContourLoft64.ISection["loops"][number] => {
              if (loop.winding !== 1 && loop.winding !== -1)
                throw new Error("A fixed F1 loop has no declared winding");
              return {
                ...loop,
                winding: loop.winding,
                curve: AutoMovieHumanHandPalm.fixedCurve(loop.curve),
              };
            },
          ),
        }),
      ),
      events: value.events.map(
        (
          event: IAutoMovieHumanHandConstruction.IFixedContourInput["events"][number],
        ): IAutoMovieContourLoft64.IEvent => {
          if (
            event.kind !== "saddle" &&
            event.kind !== "minimum" &&
            event.kind !== "maximum"
          )
            throw new Error(
              "A fixed F1 contour event has an unknown incidence",
            );
          return {
            ...event,
            kind: event.kind,
            terminal: event.terminal === null ? null : point(event.terminal),
          };
        },
      ),
    };
  }

  /** Points of a digit's centre line per point handed to the skeleton. */
  const LINE_EVERY: number = 8;

  /**
   * Build one side's hand.
   *
   * The order is the dependency order: the skin targets steer the solve (the
   * knuckle section read on the meshed skin), the solve gives the scales and
   * the joints, the joints give the digits' bones, and the bones give the
   * chains.
   */
  export function build<A extends IAutoMovieHumanHandWrist>(
    input: IAutoMovieHumanHandConstruction.IInput<A>,
  ): IAutoMovieHumanHandConstruction.IBuilt<A> {
    const prior: IAutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const sign: 1 | -1 = input.side === "left" ? 1 : -1;
    const hand: IAutoMovieHumanHandForm = AutoMovieHumanHandForm.form();

    // The knuckle section the solve meets is read on the meshed skin, not on
    // the chains, because the webs' columns carry the hand's border out to the
    // index and little fingers' roots (see the skin targets).
    const targets: { breadth: number; girth: number } =
      AutoMovieHumanHandSkinTargets.skinTargets(
        input.calibration,
        hand,
        input.given,
        input.circumference,
        input.wristTape,
        input.makeArm,
        input.key,
      );
    const { measures, law, joints } = AutoMovieHumanHandSolve.solve(
      hand,
      input.given,
      input.circumference,
      input.wristTape,
      input.makeArm,
      targets,
      input.calibration.diagnostics,
    );

    // Every digit stands on its bones: the thumb from its root through its MCP,
    // each finger from its knuckle, the middle one reaching the hand length.
    const fingers: IAutoMovieHumanHandFinger[] =
      AutoMovieHumanHandFingers.digitsOf(hand, measures, law, joints);
    const lines: IAutoMovieHumanDigitCentreLine[] = hand.digits.map(
      (
        _: IAutoMovieHumanHandDigit,
        i: number,
      ): IAutoMovieHumanDigitCentreLine => {
        const own: IAutoMovieHumanHandFinger = fingers[i]!;
        return {
          name: prior.digits[i]!.name.replace("{side}", input.side),
          line: own.points
            .filter(
              (_p: AutoMovieVector3Tuple, k: number): boolean =>
                k % LINE_EVERY === 0,
            )
            .map(
              (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple =>
                AutoMovieHumanHandSide.sided(p, sign),
            ),
          tip: AutoMovieHumanHandSide.sided(own.pole, sign),
          joint: AutoMovieHumanHandSide.sided(joints.mcps[i]!, sign),
          joints: [...own.joints, own.pole].map(
            (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple =>
              AutoMovieHumanHandSide.sided(p, sign),
          ),
        };
      },
    );
    const thumb: { cmc: AutoMovieVector3Tuple; mcp: AutoMovieVector3Tuple } = {
      cmc: AutoMovieHumanHandSide.sided(joints.cmc, sign),
      mcp: AutoMovieHumanHandSide.sided(joints.mcps[0]!, sign),
    };
    if (!input.lofted)
      return {
        measures,
        law,
        joints,
        lines,
        thumb,
        palm: null,
        digits: [],
        poles: [],
        nails: [],
      };

    // The chains, from the same bones, in the left frame reflected to the side.
    const map = (q: readonly [number, number, number]): AutoMovieVector3Tuple =>
      AutoMovieHumanHandMap.handPoint(q, measures, law.wrist);
    return {
      measures,
      law,
      joints,
      lines,
      thumb,
      palm: AutoMovieHumanHandPalm.palmOf(hand, map, input.side, sign),
      digits: hand.digits.map(
        (d: IAutoMovieHumanHandDigit, i: number): IAutoMovieLoftChain =>
          AutoMovieHumanHandDigitChain.fingerOf(
            d,
            i,
            fingers[i]!,
            input.side,
            sign,
          ),
      ),
      poles: hand.digits.map(
        (
          _: IAutoMovieHumanHandDigit,
          i: number,
        ): IAutoMovieHumanSurfacePole => ({
          chain: prior.digits[i]!.name.replace("{side}", input.side),
          end: "bottom",
          critical: true,
          point: AutoMovieHumanHandSide.sided(fingers[i]!.pole, sign),
        }),
      ),
      // A digit chain's station is the length back from its cap
      // (`AutoMovieHumanHandDigitChain`), along the straight distal line.
      nails: hand.digits.map(
        (_: IAutoMovieHumanHandDigit, i: number): IAutoMovieHumanNailWindow => {
          const own: IAutoMovieHumanHandFinger = fingers[i]!;
          return {
            chain: prior.digits[i]!.name.replace("{side}", input.side),
            root: own.cap - own.nail.root,
            edge: Math.max(0, own.cap - own.nail.edge),
            width: own.nail.width,
            dorsal: AutoMovieHumanHandSide.sided(own.nail.dorsal, sign),
          };
        },
      ),
    };
  }
}
