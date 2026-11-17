import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootToeBreadth,
  IAutoMovieHumanFootToeLines,
} from "@automovie/interface";

import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootToePulp } from "./AutoMovieHumanFootToePulp";
import { AutoMovieHumanFootToeRootFlare } from "./AutoMovieHumanFootToeRootFlare";
import { AutoMovieHumanFootToeShaft } from "./AutoMovieHumanFootToeShaft";
import { AutoMovieHumanFootToeSpacing } from "./AutoMovieHumanFootToeSpacing";
import { AutoMovieHumanFootToeTaper } from "./AutoMovieHumanFootToeTaper";

/**
 * A toe's breadth along its line, composed of its parts: the shaft
 * ({@link AutoMovieHumanFootToeShaft}) tapered by the digit span law
 * ({@link AutoMovieHumanFootToeTaper}), the root's flare
 * ({@link AutoMovieHumanFootToeRootFlare}), the pulp's widening
 * ({@link AutoMovieHumanFootToePulp}) and the neighbours' spacing
 * ({@link AutoMovieHumanFootToeSpacing}); the toe's own half breadth is their
 * product, the half breadth the spacing's limit of it.
 */
export namespace AutoMovieHumanFootToeBreadth {
  /** A toe's breadth. */
  export function of(
    input: IAutoMovieHumanFootToeBreadth.IInput,
  ): IAutoMovieHumanFootToeBreadth.IBreadth {
    const head: AutoMovieVector3Tuple = input.lines[input.index]!.head;
    const tip: AutoMovieVector3Tuple = input.lines[input.index]!.tip;
    const length: number = Math.hypot(...G.sub(tip, head));
    const tangent: AutoMovieVector3Tuple = G.unit(G.sub(tip, head));
    const pointAt = (s: number): AutoMovieVector3Tuple =>
      G.plus(head, G.scale(tangent, s));
    const neighbours: IAutoMovieHumanFootToeLines.ILine[] = [
      input.index - 1,
      input.index + 1,
    ]
      .filter((i: number): boolean => i >= 0 && i < input.lines.length)
      .map((i: number): IAutoMovieHumanFootToeLines.ILine => input.lines[i]!);
    const shaft: number = AutoMovieHumanFootToeShaft.half(
      input.frame,
      input.index,
    );

    // The toe's own half breadth: the shaft tapered by the span law, widened
    // by the root's flare and the pulp.
    const shape = (s: number): number =>
      shaft *
      AutoMovieHumanFootToeTaper.at(input.index, length, shaft, s)[0] *
      AutoMovieHumanFootToeRootFlare.factor(s, length) *
      AutoMovieHumanFootToePulp.factor(input.index, s / length);

    return {
      head,
      tip,
      length,
      tangent,
      pointAt,
      shape,
      half: (s: number): number =>
        AutoMovieHumanFootToeSpacing.limit(shape(s), pointAt(s), neighbours),
    };
  }
}
