import type { IAutoMovieHumanTrunkLandmarks } from "../../../src/generation/IAutoMovieHumanTrunkLandmarks";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugTrunkKit } from "./HumanDebugTrunkKit";

/**
 * `trunk.landmarks`: the solved trunk's landmarks, one part each, and the column's axis.
 *
 * A height landmark (crotch, buttock, iliocristale, omphalion, waist, fold, bust, axilla,
 * cervicale) is a 4 mm marker on the midline at the column axis's forward place for its height;
 * the shoulder point, the glenohumeral centre and the bust point are markers at their own places,
 * left side. The axis is a 2 mm sagittal ribbon through the landmarks' `axis` samples, carrying
 * them as its curve. Every part is `human.skin.trunk.landmark.<name>/0`.
 */
export const HumanDebugPieceTrunkLandmarks: IHumanDebugPiece = {
  name: "trunk.landmarks",
  region: "trunk",
  description: "The trunk solve's landmark heights and points as markers, and the column's axis",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const kit: HumanDebugTrunkKit.IFixed = HumanDebugTrunkKit.of(person);
    const l: IAutoMovieHumanTrunkLandmarks = kit.solution.landmarks;
    const axis: IHumanDebugDocument.Point[] = l.axis.map(
      ([y, x]: [number, number]): IHumanDebugDocument.Point => [x, y, 0],
    );
    const heights: [string, number][] = [
      ["crotch", l.crotch],
      ["buttock", l.buttock],
      ["iliocristale", l.iliocristale],
      ["omphalion", l.omphalion],
      ["waist", l.waist],
      ["fold", l.fold],
      ["bust", l.bust],
      ["axilla", l.axilla],
      ["cervicale", l.cervicale],
    ];
    const points: [string, IHumanDebugDocument.Point][] = [
      ...heights.map(([name, y]: [string, number]): [string, IHumanDebugDocument.Point] => [name, [forward(l.axis, y), y, 0]]),
      ["shoulder", l.shoulder],
      ["glenohumeral", l.glenohumeral],
      ["bustPoint", l.bustPoint],
    ];
    return {
      parts: [
        ...points.map(
          ([name, p]: [string, IHumanDebugDocument.Point]): IHumanDebugDocument.IPart =>
            HumanDebugPieceMesh.part("human.skin.trunk.landmark." + name + "/0", HumanDebugPieceMesh.markers([p], 4)),
        ),
        HumanDebugPieceMesh.part("human.skin.trunk.landmark.axis/0", HumanDebugPieceMesh.ribbon(axis, [1, 0, 0], 2), [
          { id: "human.construction.trunk.landmark.axis/axis", closed: false, points: axis },
        ]),
      ],
      provenance: {
        piece: "trunk.landmarks",
        person: person.alias,
        heights: Object.fromEntries(heights),
        shoulder: l.shoulder,
        glenohumeral: l.glenohumeral,
        bustPoint: l.bustPoint,
        solveMilliseconds: kit.milliseconds,
      },
    };
  },
};

/**
 * The column axis's forward place at a height, linear between its samples and clamped at its ends.
 *
 * @param axis `[height, forward]` samples, rising.
 * @param y Height, mm.
 * @returns Forward place, mm.
 */
function forward(axis: readonly [number, number][], y: number): number {
  const first: [number, number] | undefined = axis[0];
  if (first === undefined) return 0;
  if (y <= first[0]) return first[1];
  for (let i: number = 1; i < axis.length; ++i) {
    const [y1, x1]: [number, number] = axis[i]!;
    if (y <= y1) {
      const [y0, x0]: [number, number] = axis[i - 1]!;
      return y1 === y0 ? x1 : x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
    }
  }
  return axis[axis.length - 1]![1];
}
