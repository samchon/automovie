import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieRenderAnalysisGap, IAutoMovieRenderInventory, IAutoMovieRenderTarget } from "@automovie/interface";
import { simulatedRenderTargetFixture } from "../internal/simulatedRenderTargetFixture";
import { simulatedRenderSubjectFixture } from "../internal/simulatedRenderSubjectFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { simulatedRenderBudgetFixture as budget } from "../internal/simulatedRenderBudgetFixture";

/**
 * Measured, unmeasured and explicitly counted fluid resources retain distinct admission states.
 *
 * Scenarios:
 *
 * 1. A domain measures cells, an unbound pool remains unsupported, and host counts remain honoured without invented surface draws.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures bound, unbound and explicitly counted water records and evaluates the unbound report, asserting cell/particle totals, unsupported gaps, incomplete status and unchanged nonwater draws; this catches unknown fluid counted as zero or manual counts fabricating a surface.
 * @evidence contracts/testing.md#independent-expectations The bound grid is authored as three columns by two rows with no spray; the counted record supplies 2048 cells and 64 particles directly. A domainless and count-free record has no measured fluid authority, while two remaining drawable batches submitted twice explain the counted draw total. No simulated fluid output supplies an expectation.
 * @evidence contracts/testing.md#distinguishing-cases The three records distinguish domain-derived counts, explicit host counts and absent authority, including zero bound particles and the incomplete report's two fluid gaps. Actual surface topology and malformed material or prototype admission belong to the other simulated tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_simulated_fluid_measurement entry uses synchronous engine inventory and report operations over caller records, without integrating a fluid frame, reading a host counter, creating a renderer or installing a consumer.
 */
export function test_render_simulated_fluid_measurement(): void {
  const target: IAutoMovieRenderTarget = simulatedRenderTargetFixture();
  const subject: typeof simulatedRenderSubjectFixture = simulatedRenderSubjectFixture;

  // Opaque geometry is submitted more than once in a frame, and the inventory
  // reports the conservative one-frame peak rather than the beauty pass alone.
  // These scenes light nothing, so no shadow map re-submits the geometry and
  // the outline guide pass is the frame-wide peak instead: one further
  // complete pass over every opaque draw. Resident cost is not multiplied,
  // because vertices, memory, nodes and instance slots are allocated once and
  // reused by each pass.
  const PASSES: 2 = 2 as const;

  const inventory: IAutoMovieRenderInventory = measure(subject());

  // Fluid was permanently `unsupported` while the only way to state a cost was
  // to copy one in by hand. A bound domain states it from the record.
  const unbound: IAutoMovieRenderInventory = measure({
    ...subject(),
    waterBodies: [
      {
        id: "unknown-pool",
        owner: null,
        nodes: ["pool-surface"],
        domain: null,
        cells: null,
        particles: null,
        material: null,
      },
    ],
  });

  const counted: IAutoMovieRenderInventory = measure({
    ...subject(),
    waterBodies: [
      {
        id: "foreign-pool",
        owner: null,
        nodes: [],
        domain: null,
        cells: 2048,
        particles: 64,
        material: null,
      },
    ],
  });

  TestValidator.equals(
    "a bound domain measures fluid, an unbound one is unsupported, a counted one is honoured",
    {
      bound: [inventory.totals.fluidCells, inventory.totals.fluidParticles],
      unbound: [
        unbound.totals.fluidCells,
        unbound.totals.fluidParticles,
        unbound.gaps.map((gap: IAutoMovieRenderAnalysisGap): string[] => [gap.metric, gap.status]),
        report(unbound, budget(), target).status,
      ],
      counted: [counted.totals.fluidCells, counted.totals.fluidParticles],
      // A body with no domain draws no surface here, so it adds no geometry of
      // its own beyond whatever scene node happens to draw it.
      countedDraws: counted.totals.drawCalls,
    },
    {
      bound: [6, 0],
      unbound: [
        null,
        null,
        [
          ["fluidCells", "unsupported"],
          ["fluidParticles", "unsupported"],
        ],
        "incomplete",
      ],
      counted: [2048, 64],
      // The panel and the branch batch, each once per pass. A hand-counted
      // pool states cells without a surface to draw, so it adds none.
      countedDraws: PASSES * 2,
    },
  );
}
