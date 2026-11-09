import {
  type AutoMovieConstructionRealization,
  AutoMovieLoftChain,
  AutoMovieViewAxis,
  AutoMovieViewLoft,
  AutoMovieViewSection,
  type IAutoMovieLoftChain,
  type IAutoMovieLoftRelief,
  type IAutoMovieViewPart,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A view part's reliefs reach the face the construction tree realizes.
 *
 * Scenario: a tube of radius 20 mm along a horizontal course from station 0
 * to 100 carries one relief, a 7 by 7 height net over stations 30..70 and
 * phases -0.6..0.6 whose centre control rises 5 mm along +X. Realized as an
 * evaluated source leaf, the tree's chain is the view loft's chain with the
 * part's reliefs composed onto it, exactly as a region composes its own
 * (`{ ...loft.chain, reliefs }`): at every sampled station and phase, inside
 * and outside the window, the realized point equals that composed chain's.
 * The relief moves the window's centre off the bare tube, so a realization
 * that drops it is read as a different surface.
 *
 * @evidence contracts/testing.md#behavioral-verification Realizes a real source leaf through realizeAutoMovieConstruction and reads the realized chain through AutoMovieLoftChain.point, against the view loft's own chain with the reliefs composed.
 * @evidence contracts/testing.md#independent-expectations The expectation composes the reliefs onto AutoMovieViewLoft.create's chain the way the trunk's view loft does; the bare chain's point at the window centre differs from it by the relief height, so the sample set separates a dropped relief.
 * @evidence contracts/testing.md#distinguishing-cases Samples inside the window (where the relief lifts the skin) and outside it (where both coincide with the bare tube).
 * @evidence contracts/testing.md#execution-ownership One discoverable synchronous CPU question on a made part; no person, viewer or timing claim.
 */
export function test_construction_view_reliefs(): void {
  const failures: string[] = [];
  const part: IAutoMovieViewPart = Object.assign(tube(), { reliefs: [RELIEF] });
  const bare: IAutoMovieLoftChain | null = AutoMovieViewLoft.create(tube()).chain;
  if (bare === null) throw new Error("The made tube did not loft");
  const composed: IAutoMovieLoftChain = { ...bare, reliefs: [RELIEF] };
  const lift: number = distance(AutoMovieLoftChain.point(composed, 50, 0), AutoMovieLoftChain.point(bare, 50, 0));
  if (!(lift > 1)) failures.push(`proof: the relief lifts the window centre only ${lift} mm`);

  const realized: AutoMovieConstructionRealization.IWithoutSkin = realizeAutoMovieConstruction(
    { name: "relief-tree", root: { type: "source", name: part.name, source: part.name } },
    { chord: 1e-4, skin: false, sources: new Map([[part.name, part]]) },
  );
  if (realized.diagnostics.length !== 0) failures.push(`realization: ${JSON.stringify(realized.diagnostics)}`);
  const chain: IAutoMovieLoftChain | undefined = realized.chains.find((c: IAutoMovieLoftChain): boolean => c.name === part.name);
  if (chain === undefined) failures.push("the realized tree has no face for the part");
  else
    for (const s of [10, 35, 50, 65, 90])
      for (const phi of [-0.5, 0, 0.3, 2, 4]) {
        const d: number = distance(AutoMovieLoftChain.point(chain, s, phi), AutoMovieLoftChain.point(composed, s, phi));
        if (!(d <= 1e-9)) failures.push(`station ${s} phase ${phi}: the realized face stands ${d} mm off the part with its reliefs`);
      }
  TestValidator.predicate(failures.join("\n"), (): boolean => failures.length === 0);
}

/** One relief: a 7 by 7 net over stations 30..70 and phases -0.6..0.6, its centre control 5 mm along +X. */
const RELIEF: IAutoMovieLoftRelief = {
  name: "made-relief",
  stations: [30, 70],
  phases: [-0.6, 0.6],
  axis: [1, 0, 0],
  rows: 7,
  columns: 7,
  heights: Array.from({ length: 49 }, (_: unknown, k: number): number => (k === 24 ? 5 : 0)),
};

/** A 20 mm tube on the horizontal course, open at both ends. */
function tube(): IAutoMovieViewPart {
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (sign: number): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "bottom", station: 0, value: 20 * sign },
      { site: "top", station: 100, value: 20 * sign },
    ],
  });
  return {
    name: "relief-tube",
    axis: AutoMovieViewAxis.horizontal(),
    stations: [0, 25, 50, 75, 100],
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: {
      kind: "shoulder",
      shoulder: {
        knots: [
          { site: "bottom", station: 0, value: AutoMovieViewSection.ELLIPSE },
          { site: "top", station: 100, value: AutoMovieViewSection.ELLIPSE },
        ],
      },
    },
    order: 16,
    samples: 16,
  };
}

function distance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
}
