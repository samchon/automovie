import { IAutoMovieRenderSubject, deriveAutoMovieSemanticMask } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import { modelsFixture } from "../internal/renderFixtures";
import { softPanel } from "../internal/softFixtures";
import { simulatedRenderSceneFixture } from "../internal/simulatedRenderSceneFixture";
import { simulatedRenderSubjectFixture } from "../internal/simulatedRenderSubjectFixture";

/**
 * Simulated drawables preserve their stable semantic identities independently of list order.
 *
 * Scenarios:
 *
 * 1. Panel, bed and pool names bind to their owners; reordered simulated lists retain the mask digest.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives actual semantic masks and asserts each simulated entry's kind, logical owner and drawable node names, then compares digests after reversing panel and water lists; this catches missing simulated claims, incorrect naming joins or input-order-dependent palette identity.
 * @evidence contracts/testing.md#independent-expectations Literal semantic ids, tower owner and canonical soft, planting and water node names follow the declared naming contract and fixture domain ids. Reordering the same two panels and two counted pools changes no semantic meaning, so digest equality is a metamorphic expectation rather than a recorded hash or pixel oracle.
 * @evidence contracts/testing.md#distinguishing-cases The composed subject distinguishes cloth, planting and bound-water ownership; the reordered subject distinguishes two cloth grids and two domainless counted pools while preserving their identities. This unit checks metadata and identity, while capacity, collisions and rendered segmentation have separate owners.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_simulated_mask_identity entry derives palette metadata synchronously from numerical records and owns its direct entry and order assertions, starting no viewer, GPU, browser, simulation task or installed consumer.
 */
export function test_render_simulated_mask_identity(): void {
  const scene: typeof simulatedRenderSceneFixture = simulatedRenderSceneFixture;
  const subject: typeof simulatedRenderSubjectFixture = simulatedRenderSubjectFixture;

  // The mask joins by the name each viewer builder assigns its own object, so
  // a curtain, a bed and a pond resolve to their own colour instead of painting
  // the reserved background as unaddressed geometry.
  const mask: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask(subject());

  const entry: (id: string) => Record<string, unknown> = (id: string): Record<string, unknown> => {
    const found: IAutoMovieSemanticMaskEntry | undefined = mask.entries.find((item: IAutoMovieSemanticMaskEntry): boolean => item.id === id);
    TestValidator.predicate(`arranged semantic entry ${id}`, found !== undefined);
    return { kind: found!.kind, owner: found!.owner, nodes: found!.nodes };
  };

  TestValidator.equals(
    "each simulated drawable is addressable under its own stable id",
    {
      panel: entry("soft-body:panel"),
      bed: entry("planting:atrium-bed"),
      pool: entry("water-body:atrium-pool"),
    },
    {
      panel: {
        kind: "soft-body",
        owner: "space:tower/ground-hall",
        nodes: ["soft:panel"],
      },
      bed: {
        kind: "planting",
        owner: "space:tower/ground-hall",
        nodes: ["planting:atrium-bed"],
      },
      pool: {
        kind: "water-body",
        owner: "space:tower/ground-hall",
        nodes: ["water:basin"],
      },
    },
  );

  const crowded: (reverse: boolean) => IAutoMovieRenderSubject = (reverse: boolean): IAutoMovieRenderSubject => {
    const panels: NonNullable<IAutoMovieRenderSubject["softBodies"]> = [
      {
        domain: softPanel({ columns: 2, rows: 2 }),
        owner: null,
        material: null,
      },
      {
        domain: softPanel({ columns: 3, rows: 2, overrides: { id: "sheer" } }),
        owner: null,
        material: null,
      },
    ];
    const pools: NonNullable<IAutoMovieRenderSubject["waterBodies"]> = [
      {
        id: "north-pool",
        owner: null,
        nodes: [],
        domain: null,
        cells: 4,
        particles: 0,
        material: null,
      },
      {
        id: "south-pool",
        owner: null,
        nodes: [],
        domain: null,
        cells: 8,
        particles: 0,
        material: null,
      },
    ];
    return {
      scene: scene(),
      models: modelsFixture(),
      softBodies: reverse ? [...panels].reverse() : panels,
      waterBodies: reverse ? [...pools].reverse() : pools,
    };
  };

  TestValidator.equals(
    "reordering the simulated lists reproduces a byte-identical mask",
    deriveAutoMovieSemanticMask(crowded(true)).digest,
    deriveAutoMovieSemanticMask(crowded(false)).digest,
  );
}
