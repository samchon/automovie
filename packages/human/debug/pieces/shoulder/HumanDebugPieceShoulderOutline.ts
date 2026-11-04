import { AutoMovieHumanArmRootOval } from "../../../src/generation/AutoMovieHumanArmRootOval";
import type { AutoMovieHumanTrunkSolve } from "../../../src/generation/AutoMovieHumanTrunkSolve";
import type { IAutoMovieHumanTrunkSolution } from "../../../src/generation/IAutoMovieHumanTrunkSolution";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugTrunkKit } from "../trunk/HumanDebugTrunkKit";

/**
 * `shoulder.outline`: the left shoulders' frontal outline from the trunk solve, one part per
 * outline piece.
 *
 * The pieces are the lateral extreme `z(y)` the solve publishes: the trapezius line (`line`, from
 * the shoulder point to the neck's ring), the cap's fillet (`oval.cap`, from the glenohumeral
 * centre's height to the shoulder point) and the arm's outer edge below the centre
 * (`AutoMovieHumanArmRootOval.outline`, down to the axilla). Each is sampled at 97 heights in the
 * frontal plane through the glenohumeral centre and drawn as a 1.5 mm ribbon lying in that plane,
 * so the front camera sees the outline whole; its curve carries the same samples. The parts are
 * `human.skin.shoulder.left.outline.<line|cap|arm>/0`.
 */
export const HumanDebugPieceShoulderOutline: IHumanDebugPiece = {
  name: "shoulder.outline",
  region: "shoulder",
  description: "Left shoulder's frontal outline pieces (trapezius line, cap fillet, arm edge) from the trunk solve",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const kit: HumanDebugTrunkKit.IFixed = HumanDebugTrunkKit.of(person);
    const s: IAutoMovieHumanTrunkSolution = kit.solution;
    const x: number = s.oval.glenohumeral[0];
    const pieces: [string, number, number, (y: number) => AutoMovieHumanTrunkSolve.IJet][] = [
      ["line", s.line.from, s.line.to, s.line.at],
      ["cap", s.oval.cap.from, s.oval.cap.to, s.oval.cap.at],
      [
        "arm",
        s.landmarks.axilla,
        s.oval.glenohumeral[1],
        (y: number): AutoMovieHumanTrunkSolve.IJet => AutoMovieHumanArmRootOval.outline(s.oval, y),
      ],
    ];
    return {
      parts: pieces.map(
        ([name, from, to, at]: [string, number, number, (y: number) => AutoMovieHumanTrunkSolve.IJet]): IHumanDebugDocument.IPart => {
          const chain: string = "shoulder.left.outline." + name;
          const samples: [IHumanDebugDocument.Point, number][] = Array.from(
            { length: SAMPLES },
            (_: unknown, i: number): [IHumanDebugDocument.Point, number] => {
              const y: number = from + ((to - from) * i) / (SAMPLES - 1);
              const jet: AutoMovieHumanTrunkSolve.IJet = at(y);
              return [[x, y, jet.value], jet.slope];
            },
          );
          const line: IHumanDebugDocument.Point[] = samples.map(
            ([p]: [IHumanDebugDocument.Point, number]): IHumanDebugDocument.Point => p,
          );
          return HumanDebugPieceMesh.part("human.skin." + chain + "/0", frontal(samples, 1.5), [
            { id: "human.construction." + chain + "/g0", closed: false, points: line },
          ]);
        },
      ),
      provenance: {
        piece: "shoulder.outline",
        person: person.alias,
        intervals: Object.fromEntries(
          pieces.map(([name, from, to]: [string, number, number, unknown]): [string, [number, number]] => [name, [from, to]]),
        ),
        glenohumeral: s.oval.glenohumeral,
        radius: s.oval.radius,
        solveMilliseconds: kit.milliseconds,
      },
    };
  },
};

/** Heights each outline piece is sampled at. */
const SAMPLES: number = 97;

/**
 * A ribbon in the frontal plane along an outline: each sample widens along the in-plane normal of
 * its slope `dz/dy`.
 *
 * @param samples Points with their slope.
 * @param width Ribbon width, mm.
 * @returns The mesh.
 */
function frontal(samples: readonly [IHumanDebugDocument.Point, number][], width: number): HumanDebugPieceMesh.IMesh {
  const half: number = width / 2;
  return HumanDebugPieceMesh.grid(
    samples.map(([p, slope]: [IHumanDebugDocument.Point, number]): IHumanDebugDocument.Point[] => {
      const norm: number = Math.hypot(1, slope);
      const dy: number = (-slope / norm) * half;
      const dz: number = (1 / norm) * half;
      return [
        [p[0], p[1] - dy, p[2] - dz],
        [p[0], p[1] + dy, p[2] + dz],
      ];
    }),
    false,
  );
}
