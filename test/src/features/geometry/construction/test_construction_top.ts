import { type AutoMovieConstructionRealization, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, realizeAutoMovieConstruction } from "@automovie/engine";
import type { IAutoMovieConstructionKnot, IAutoMovieConstructionOutline, IAutoMovieConstructionView } from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A part whose fullness is owned by its top view reads each quarter's shoulder from that view: every layer publishes the declared shoulders, and shoulders at the ellipse's value draw the box's ellipse.
 *
 * Scenarios:
 * 1. A cylinder of radius 0.02 m and length 0.1 m whose top view gives every quarter the ellipse's shoulder `sqrt(2) - 1` at both ends: every layer's published shoulders are that value to rounding, and every realized point stands the radius from the axis within the section spline's bound.
 * 2. Red: the same cylinder with every quarter's shoulder 0.6 departs from the circle by more than that bound.
 *
 * @evidence contracts/testing.md#behavioral-verification Realizes each part with `realizeAutoMovieConstruction` and reads its chain's layers (`IAutoMovieLoftChain.ILayer.view.shoulders`) and its surface's points. It catches a top fullness ignored for another owner, quarters read in the wrong order, and a shoulder that does not reach the section; any construction that draws each quarter at the top view's shoulder passes.
 * @evidence contracts/testing.md#independent-expectations The top fullness's document (`IAutoMovieConstructionTop`): each quarter's shoulder is the natural spline of its knots, here constant, and the conic at the shoulder `sqrt(2) - 1` is the box's ellipse (Liming's conic, `AutoMovieConstructionFullness`), a circle for a square box. Points are read within the periodic cubic section spline's bound (`ConstructionChecks.polarSpline`) plus 1e-9 of the part's size; shoulders to 1e-12.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the ellipse's shoulder from the top. Negative: a fuller shoulder. Girth and stated-shoulder fullness belong to `test_construction_view_girth` and `test_construction_operator_view_section`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_top`; it realizes made trees in process and starts no host, browser or GPU.
 */
export function test_construction_top(): void {
  const failures: string[] = [];
  const r: number = 0.02;
  const read: (shoulder: number) => { misses: string[]; layers: string[] } = (shoulder: number): { misses: string[]; layers: string[] } => {
    const tube: IAutoMovieConstructionView = ConstructionShapes.cylinder("tube", ConstructionShapes.DOWN, r, 0.1);
    const flat: () => IAutoMovieConstructionOutline = (): IAutoMovieConstructionOutline => ({
      knots: [0, 0.1].map((s: number, i: number): IAutoMovieConstructionKnot => ({ site: `top ${i}`, station: s, value: shoulder })),
    });
    tube.fullness = { type: "top", shoulders: [flat(), flat(), flat(), flat()] };
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "made", root: tube }, { chord: 1e-4 });
    const layers: string[] = real.diagnostics.map((d: { contract: string; detail: string }): string => `diagnostic ${d.contract}: ${d.detail}`);
    const chain: IAutoMovieLoftChain | undefined = real.chains.find((c: IAutoMovieLoftChain): boolean => c.name === "tube");
    if (chain === undefined) return { misses: ["no chain"], layers };
    chain.layers.forEach((l: IAutoMovieLoftChain.ILayer): void => {
      (l.view?.shoulders ?? []).forEach((q: number, k: number): void => {
        if (!(Math.abs(q - shoulder) <= 1e-12)) layers.push(`layer at ${l.y} mm: quarter ${k} shoulder ${q} against ${shoulder}`);
      });
    });
    const surface: IAutoMovieSolidSurface = ConstructionRead.metres(ConstructionRead.surface(real, "tube"));
    const bound: number = ConstructionChecks.polarSpline(r, r, tube.order) + 1e-9 * 0.1;
    const misses: string[] = [];
    for (const s of tube.stations)
      for (let k: number = 0; k < 64; k++) {
        const p: V3 = surface.jet(s, (2 * Math.PI * k) / 64).p as V3;
        const off: number = Math.abs(Math.hypot(p[0], p[1]) - r);
        if (!(off <= bound)) misses.push(`station ${s} phase ${k}: ${off} m off the circle`);
      }
    return { misses, layers };
  };
  const ellipse: { misses: string[]; layers: string[] } = read(ConstructionShapes.ELLIPSE);
  failures.push(...ellipse.layers, ...ellipse.misses);
  if (read(0.6).misses.length === 0) failures.push("proof: a top shoulder of 0.6 draws the circle");
  if (failures.length !== 0) throw new Error(`${failures.length} top failures:\n${failures.join("\n")}`);
}
