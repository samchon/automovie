
import type {
  IAutoMovieConstructionKnot,
  IAutoMovieConstructionOutline,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionView,
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A part whose fullness is its top view (`IAutoMovieConstructionTop`) draws
 * each quarter at that view's shoulder: every layer publishes it, and the
 * ellipse's shoulder sqrt 2 - 1 draws the box's ellipse (Liming's conic), a
 * circle for a square box.
 *
 * Fixture: a cylinder of radius 0.02 m and length 0.1 m whose four top
 * shoulders are constant outlines, realized without its skin. Bound: the
 * periodic cubic section's error (`ConstructionChecks.polarSpline`) plus 1e-9
 * of the length.
 *
 * Scenarios:
 *
 * 1. At shoulder sqrt 2 - 1: no diagnostic, every layer's four shoulders equal it
 *    within 1e-12, and the surface at every station and 64 phases stands the
 *    radius from the axis within the bound.
 * 2. At shoulder 0.6 some point departs from the circle past the bound.
 */
export function test_engine_geometry_construction_top(): void {
  const r: number = 0.02;
  const realize = (
    shoulder: number,
  ): {
    real: IAutoMovieConstructionRealization.IWithoutSkin;
    tube: IAutoMovieConstructionView;
    worst: number;
  } => {
    const tube: IAutoMovieConstructionView = ConstructionShapes.cylinder(
      "tube",
      ConstructionShapes.DOWN,
      r,
      0.1,
    );
    const flat = (): IAutoMovieConstructionOutline => ({
      knots: [0, 0.1].map(
        (station: number, i: number): IAutoMovieConstructionKnot => ({
          site: `top ${i}`,
          station,
          value: shoulder,
        }),
      ),
    });
    tube.fullness = {
      type: "top",
      shoulders: [flat(), flat(), flat(), flat()],
    };
    const real: IAutoMovieConstructionRealization.IWithoutSkin =
      AutoMovieEngineConstruction.realize(
        { name: "made", root: tube },
        { chord: 1e-4, skin: false },
      );
    const surface: IAutoMovieSolidSurface = ConstructionRead.metres(
      ConstructionRead.surface(real, "tube"),
    );
    let worst: number = 0;
    for (const s of tube.stations)
      for (let k: number = 0; k < 64; k++) {
        const p: readonly number[] = surface.jet(s, (2 * Math.PI * k) / 64).p;
        worst = Math.max(worst, Math.abs(Math.hypot(p[0]!, p[1]!) - r));
      }
    return { real, tube, worst };
  };

  // 1.
  const ellipse = realize(ConstructionShapes.ELLIPSE);
  const bound: number =
    ConstructionChecks.polarSpline(r, r, ellipse.tube.order) + 1e-9 * 0.1;
  TestValidator.equals("diagnostics", ellipse.real.diagnostics, []);
  const chain: IAutoMovieLoftChain | undefined = ellipse.real.chains.find(
    (c: IAutoMovieLoftChain): boolean => c.name === "tube",
  );
  if (chain === undefined) throw new Error("no tube chain");
  for (const layer of chain.layers)
    TestValidator.predicate(
      `layer ${layer.y} shoulders`,
      layer.view !== undefined &&
        layer.view.shoulders.every(
          (q: number): boolean =>
            Math.abs(q - ConstructionShapes.ELLIPSE) <= 1e-12,
        ),
    );
  TestValidator.predicate(
    `circle within ${bound}: ${ellipse.worst}`,
    ellipse.worst <= bound,
  );

  // 2.
  TestValidator.predicate("0.6 leaves the circle", realize(0.6).worst > bound);
}
