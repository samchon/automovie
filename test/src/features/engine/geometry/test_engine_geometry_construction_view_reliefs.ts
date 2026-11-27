import { AutoMovieEngineLoftChain, AutoMovieEngineViewAxis, AutoMovieEngineViewLoft, AutoMovieEngineViewSection, AutoMovieEngineConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieLoftChain,
  IAutoMovieLoftRelief,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A view part's reliefs reach the face a construction tree realizes from it as
 * a source leaf: the realized chain is the view loft's chain with the part's
 * reliefs composed onto it (`{ ...loft.chain, reliefs }`).
 *
 * Fixture: a tube of radius 20 mm along a horizontal course from station 0 to
 * 100 with one relief, a 7 by 7 height net over stations 30..70 and phases
 * -0.6..0.6 whose centre control rises 5 mm along +X.
 *
 * Scenarios:
 *
 * 1. The relief lifts the window centre (50, 0) more than 1 mm off the bare tube,
 *    so a dropped relief reads as another surface.
 * 2. No diagnostic; at stations 10, 35, 50, 65 and 90 and phases -0.5, 0, 0.3, 2
 *    and 4, inside and outside the window, the realized point equals the
 *    composed chain's within 1e-9 mm.
 */
export function test_engine_geometry_construction_view_reliefs(): void {
  const relief: IAutoMovieLoftRelief = {
    name: "made-relief",
    stations: { start: 30, end: 70 },
    phases: { start: -0.6, end: 0.6 },
    axis: [1, 0, 0],
    rows: 7,
    columns: 7,
    heights: Array.from({ length: 49 }, (_: unknown, k: number): number =>
      k === 24 ? 5 : 0,
    ),
  };
  const outline = (sign: number): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "bottom", station: 0, value: 20 * sign },
      { site: "top", station: 100, value: 20 * sign },
    ],
  });
  const tube: IAutoMovieViewPart = {
    name: "relief-tube",
    axis: AutoMovieEngineViewAxis.horizontal(),
    stations: [0, 25, 50, 75, 100],
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: {
      kind: "shoulder",
      shoulder: {
        knots: [
          { site: "bottom", station: 0, value: AutoMovieEngineViewSection.ELLIPSE },
          { site: "top", station: 100, value: AutoMovieEngineViewSection.ELLIPSE },
        ],
      },
    },
    order: 16,
    samples: 16,
  };
  const distance = (a: readonly number[], b: readonly number[]): number =>
    Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
  const bare: IAutoMovieLoftChain | null = AutoMovieEngineViewLoft.create(tube).chain;
  if (bare === null) throw new Error("the made tube did not loft");
  const composed: IAutoMovieLoftChain = { ...bare, reliefs: [relief] };

  // 1.
  TestValidator.predicate(
    "the relief lifts the centre",
    distance(
      AutoMovieEngineLoftChain.point(composed, 50, 0),
      AutoMovieEngineLoftChain.point(bare, 50, 0),
    ) > 1,
  );

  // 2.
  const part: IAutoMovieViewPart = { ...tube, reliefs: [relief] };
  const realized: IAutoMovieConstructionRealization.IWithoutSkin =
    AutoMovieEngineConstruction.realize(
      {
        name: "relief-tree",
        root: { type: "source", name: part.name, source: part.name },
      },
      { chord: 1e-4, skin: false, sources: new Map([[part.name, part]]) },
    );
  TestValidator.equals("diagnostics", realized.diagnostics, []);
  const chain: IAutoMovieLoftChain | undefined = realized.chains.find(
    (c: IAutoMovieLoftChain): boolean => c.name === part.name,
  );
  if (chain === undefined) throw new Error("no face for the part");
  for (const s of [10, 35, 50, 65, 90])
    for (const phi of [-0.5, 0, 0.3, 2, 4])
      TestValidator.predicate(
        `station ${s} phase ${phi}`,
        distance(
          AutoMovieEngineLoftChain.point(chain, s, phi),
          AutoMovieEngineLoftChain.point(composed, s, phi),
        ) <= 1e-9,
      );
}
