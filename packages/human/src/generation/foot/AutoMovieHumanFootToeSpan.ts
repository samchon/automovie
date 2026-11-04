import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootToeBreadth } from "./AutoMovieHumanFootToeBreadth";
import { AutoMovieHumanFootToeCap } from "./AutoMovieHumanFootToeCap";
import type { AutoMovieHumanFootToeLines } from "./AutoMovieHumanFootToeLines";
import { AutoMovieHumanHandWindow } from "../hand/AutoMovieHumanHandWindow";
import { AutoMovieHumanNailPlate } from "../hand/AutoMovieHumanNailPlate";
import { AutoMovieHumanFootToeRoot } from "./AutoMovieHumanFootToeRoot";
import { AutoMovieHumanFootToeShaft } from "./AutoMovieHumanFootToeShaft";
import { AutoMovieHumanFootToeTaper } from "./AutoMovieHumanFootToeTaper";

type Vec3 = G.Vec3;

/**
 * A toe laid on its line from its metatarsal head to its apex: its breadth
 * ({@link AutoMovieHumanFootToeBreadth}), where its tip closes
 * ({@link AutoMovieHumanFootToeCap}) and where its own sections start
 * ({@link AutoMovieHumanFootToeRoot}), composed into the sizes the toe's chain
 * is built from.
 */
export namespace AutoMovieHumanFootToeSpan {
  /** What a toe's span reads. */
  export interface IInput {
    /** The foot's frame. */
    frame: AutoMovieHumanFootFrame.IFrame;

    /** Every toe's line, hallux first. */
    lines: readonly AutoMovieHumanFootToeLines.ILine[];

    /** Which toe, 0 for the hallux. */
    index: number;
  }

  /** A toe on its line, left frame. */
  export interface IToe {
    /** Chain name; `{side}` stands for the side. */
    name: string;

    /** Control points of a section. */
    order: number;

    /** Sections of the toe's chain (`AutoMovieHumanFootToeStations`). */
    sections: number;

    /** Metatarsal head centre, the line's start. */
    head: Vec3;

    /** Unit direction of the line toward the tip. */
    tangent: Vec3;

    /** Half breadth, dorsal and plantar half depths at a length along the line. */
    size: (s: number) => [number, number, number];

    /** Length along the line of the first own section. */
    first: number;

    /** Length along the line where the tip starts to close. */
    cap: number;

    /** The apex. */
    pole: Vec3;

    /** The foot's lateral direction. */
    lateral: Vec3;

    /** Its nail plate along the line: root and free edge lengths, and width, mm. */
    nail: { root: number; edge: number; width: number };
  }

  /** A toe's span. */
  export function of(input: IInput): IToe {
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;
    const t: AutoMovieHumanFootPrior.IToe = prior.toes[input.index]!;
    const breadth: AutoMovieHumanFootToeBreadth.IBreadth = AutoMovieHumanFootToeBreadth.of(input);
    const cap: number = AutoMovieHumanFootToeCap.of(breadth, input.index);

    // The toe's depths follow its own half breadth before its taper, each
    // half tapered by its own share; the distal pad adds the fingertip
    // pulp's fullness on the plantar side, its middle halfway from the last
    // joint to the apex. Past the cap the section stays the cap's: the dome
    // closes on it.
    const shaft: number = AutoMovieHumanFootToeShaft.half(input.frame, input.index);
    const joint: number = t.joints[t.joints.length - 1]! * breadth.length;
    const middle: number = (joint + breadth.length) / 2;
    const size = (s: number): [number, number, number] => {
      const at: number = Math.min(s, cap);
      const taper: [number, number, number] = AutoMovieHumanFootToeTaper.at(input.index, breadth.length, shaft, at);
      const depth: number = (2 * breadth.shape(at) * t.depth) / taper[0];
      const plantar: number = depth * (1 - prior.toeDorsal) * taper[1];
      const pad: number = AutoMovieHumanHandWindow.mass(
        AutoMovieHumanHandWindow.PULP,
        { length: breadth.length - joint, width: breadth.half(middle), depth: plantar },
        at - middle,
        0,
      );

      return [breadth.half(at), depth * prior.toeDorsal * taper[2], AutoMovieHumanSeamUnion.bump(plantar, pad)];
    };

    // The first own section from the toe's own clefts (the neighbours' gaps
    // on either side of it) and its own size, read at the toe's head height.
    const clefts: Vec3[] = [input.index - 1, input.index]
      .filter((c: number): boolean => c >= 0 && c < prior.clefts.length)
      .map((c: number): Vec3 => input.frame.at(prior.clefts[c]![0], prior.clefts[c]![1], breadth.head[1]));
    const first: number = AutoMovieHumanFootToeRoot.of(
      breadth,
      clefts,
      (s: number): number => {
        const q: [number, number, number] = size(s);

        return (q[1] + q[2]) / 2;
      },
      cap,
    );

    // The nail plate on the distal phalanx, from the joint to the apex: the
    // fingers' plate law (`AutoMovieHumanNailPlate`), its free edge at the cap.
    const plate: AutoMovieHumanNailPlate.ISize = AutoMovieHumanNailPlate.size({
      origin: [0, 0, 0],
      along: [1, 0, 0],
      normal: [0, 0, 1],
      phalanx: breadth.length - joint,
      width: 2 * size(cap - AutoMovieHumanNailPlate.LENGTH_SHARE * (breadth.length - joint))[0],
    });

    return {
      name: t.name,
      order: t.order,
      sections: t.sections,
      head: breadth.head,
      tangent: breadth.tangent,
      size,
      first,
      cap,
      pole: breadth.tip,
      lateral: input.frame.lateral,
      nail: { root: cap - plate.length, edge: cap, width: plate.width },
    };
  }
}
