import { IAutoMovieRenderSubject, deriveAutoMovieSemanticMask } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
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
 */
export const test_render_simulated_mask_identity = (): void => {
  const scene = simulatedRenderSceneFixture;
  const subject = simulatedRenderSubjectFixture;

  // The mask joins by the name each viewer builder assigns its own object, so
  // a curtain, a bed and a pond resolve to their own colour instead of painting
  // the reserved background as unaddressed geometry.
  const mask = deriveAutoMovieSemanticMask(subject());

  const entry = (id: string): Record<string, unknown> => {
    const found = mask.entries.find((item) => item.id === id);
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

  const crowded = (reverse: boolean): IAutoMovieRenderSubject => {
    const panels = [
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
    const pools = [
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
};
