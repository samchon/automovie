import {
  AutoMovieLoftChain,
  type AutoMovieViewLoft,
  type IAutoMovieConstructionCurve,
  type IAutoMovieMark,
  markAutoMovieConstructionCurves,
} from "@automovie/engine";

import { AutoMovieHumanConicLoft } from "../generation/conic/AutoMovieHumanConicLoft";
import type { AutoMovieHumanF1 } from "../generation/f1/AutoMovieHumanF1";

/** Samples round a section ring; a multiple of four, so the guides' quarter phases are ring samples. */
const PHASES: number = 48;

/** Largest gap in millimetres between two stations a guide and the axis pass through. */
const STEP: number = 4;

/**
 * The construction of a person as inspection marks: each authored family's section rings at its knots, its four guide rails and its axis, so `marks=curve/*` draws what the figure is lofted from.
 *
 * Each family is lofted alone through `AutoMovieHumanConicLoft` at its knots and at stations at most 4 mm apart between them, as it is before the generator sews it into the body, and the curves are read only at those stations. A section is the closed ring of 48 samples at one authored knot; a guide is the rail at one quarter phase through every station; the axis joins the mean of each station's ring. A sample the chain cannot evaluate is left out and flags its curve, as does a diagnostic of the family's loft, and a curve left with fewer than two points is dropped. A mirrored family's curves are emitted again reflected in the median plane `z = 0` under the twin's name, `<family>.mirror`, the name its surface piece has. Points are metres in the figure's frame.
 *
 * The marks are anchored to the person's object at path `person`, so a curve's path is the person, the family and the curve, such as `f1/arm/section/2` or `f1/arm.mirror/guide/0`. A sewn family's surface is part of the person's `body` piece, so its curves are the only paths that name it apart.
 *
 * @param person The person's name, the path of its object in the scene.
 * @param members The person's authored families.
 * @returns The marks, family by family.
 */
export function markHumanCaptureCurves(
  person: string,
  members: readonly AutoMovieHumanF1.IMember[],
): IAutoMovieMark[] {
  const curves: IAutoMovieConstructionCurve[] = [];
  for (const { family, mirrored } of members) {
    // Stations: every knot, and enough between consecutive knots to keep them at most STEP apart.
    const stations: number[] = [];
    family.knots.forEach((knot: number, i: number): void => {
      stations.push(knot);
      const next: number | undefined = family.knots[i + 1];
      if (next === undefined) return;
      const count: number = Math.ceil((next - knot) / STEP);
      for (let k: number = 1; k < count; k++)
        stations.push(knot + ((next - knot) * k) / count);
    });
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, stations);
    if (loft.chain === null) continue;
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;

    // One ring per station, millimetres converted to metres; a sample the chain refuses is null.
    let flagged: boolean = loft.diagnostics.length !== 0;
    const rings: (number[] | null)[][] = stations.map((station: number): (number[] | null)[] =>
      Array.from({ length: PHASES }, (_: unknown, j: number): number[] | null => {
        try {
          const p: number[] = AutoMovieLoftChain.point(chain, station, (2 * Math.PI * j) / PHASES);
          if (![p[0], p[1], p[2]].every((v: number | undefined): boolean => Number.isFinite(v))) throw new Error("not finite");
          return [p[0]! / 1000, p[1]! / 1000, p[2]! / 1000];
        } catch {
          flagged = true;
          return null;
        }
      }),
    );
    const own: IAutoMovieConstructionCurve[] = [];
    const curve: (id: string, kind: IAutoMovieConstructionCurve.Kind, closed: boolean, points: (number[] | null)[]) => void = (
      id: string,
      kind: IAutoMovieConstructionCurve.Kind,
      closed: boolean,
      points: (number[] | null)[],
    ): void => {
      const kept: number[][] = points.filter((p: number[] | null): p is number[] => p !== null);
      if (kept.length >= 2)
        own.push({ id: `${family.name}/${id}`, kind, part: family.name, closed, points: kept.flat(), flagged: flagged || kept.length !== points.length });
    };
    family.knots.forEach((knot: number, i: number): void => curve(`section/${i}`, "section", true, rings[stations.indexOf(knot)]!));
    for (let quarter: number = 0; quarter < 4; quarter++)
      curve(`guide/${quarter}`, "guide", false, rings.map((ring: (number[] | null)[]): number[] | null => ring[(quarter * PHASES) / 4]!));
    curve(
      "axis",
      "axis",
      false,
      rings.map((ring: (number[] | null)[]): number[] | null => {
        if (ring.some((p: number[] | null): boolean => p === null)) return null;
        const sum: number[] = [0, 0, 0];
        for (const p of ring as number[][]) for (let c: number = 0; c < 3; c++) sum[c]! += p[c]! / PHASES;
        return sum;
      }),
    );
    curves.push(...own);
    if (mirrored)
      for (const original of own)
        curves.push({
          ...original,
          id: `${original.part}.mirror${original.id.slice(original.part.length)}`,
          part: `${original.part}.mirror`,
          points: original.points.map((value: number, i: number): number => (i % 3 === 2 ? -value : value)),
        });
  }
  return markAutoMovieConstructionCurves(curves, person);
}
