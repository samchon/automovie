import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootToePulp } from "./AutoMovieHumanFootToePulp";
import { AutoMovieHumanFootToeRootFlare } from "./AutoMovieHumanFootToeRootFlare";
import { AutoMovieHumanFootToeShaft } from "./AutoMovieHumanFootToeShaft";
import { AutoMovieHumanFootToeSpacing } from "./AutoMovieHumanFootToeSpacing";
import { AutoMovieHumanFootToeTaper } from "./AutoMovieHumanFootToeTaper";
import type { AutoMovieHumanFootToeLines } from "./AutoMovieHumanFootToeLines";

type Vec3 = G.Vec3;

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
  /** What the breadth reads. */
  export interface IInput {
    /** The foot's frame. */
    frame: AutoMovieHumanFootFrame.IFrame;

    /** Every toe's line, hallux first. */
    lines: readonly AutoMovieHumanFootToeLines.ILine[];

    /** Which toe, 0 for the hallux. */
    index: number;
  }

  /** A toe's line and breadth. */
  export interface IBreadth {
    /** Metatarsal head centre, left frame. */
    head: Vec3;

    /** The apex. */
    tip: Vec3;

    /** The line's length, mm. */
    length: number;

    /** Unit direction of the line toward the tip. */
    tangent: Vec3;

    /** The point at a length along the line. */
    pointAt: (s: number) => Vec3;

    /** The toe's own half breadth at a length along the line, mm, before the neighbours. */
    shape: (s: number) => number;

    /** The half breadth at a length along the line, mm. */
    half: (s: number) => number;
  }

  /** A toe's breadth. */
  export function of(input: IInput): IBreadth {
    const head: Vec3 = input.lines[input.index]!.head;
    const tip: Vec3 = input.lines[input.index]!.tip;
    const length: number = Math.hypot(...G.sub(tip, head));
    const tangent: Vec3 = G.unit(G.sub(tip, head));
    const pointAt = (s: number): Vec3 => G.plus(head, G.scale(tangent, s));
    const neighbours: AutoMovieHumanFootToeLines.ILine[] = [input.index - 1, input.index + 1]
      .filter((i: number): boolean => i >= 0 && i < input.lines.length)
      .map((i: number): AutoMovieHumanFootToeLines.ILine => input.lines[i]!);
    const shaft: number = AutoMovieHumanFootToeShaft.half(input.frame, input.index);

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
      half: (s: number): number => AutoMovieHumanFootToeSpacing.limit(shape(s), pointAt(s), neighbours),
    };
  }
}
