import type { IAutoMovieRenderSubject } from "@automovie/engine";
import type {
  IAutoMovieRenderReport,
  IAutoMovieScene,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { flatBasin } from "../internal/fluidFixtures";
import {
  BOX_TRIANGLES,
  instanceSetFixture,
} from "../internal/renderFixtures";
import { renderBudgetEditableOwnerFixtures } from "../internal/renderBudgetEditableOwnerFixtures";

const { pose, models, staged, staging, report, shape }: Pick<
  typeof renderBudgetEditableOwnerFixtures,
  "pose" | "models" | "staged" | "staging" | "report" | "shape"
> = renderBudgetEditableOwnerFixtures;

/**
 * An over-limit refusal names somewhere the production can actually be edited.
 *
 * A frame pass draws the opaque geometry again, so its cost is the sum of every
 * drawable that preceded it. Ranked among the owners it therefore wins the two
 * metrics a pass multiplies in these positive two-drawable cases,
 * ties in the one-drawable case, and for the outline guide pass it wins under a
 * name no production declares and no author can open: the refusal read "edited
 * at render.pass.outline". The peak itself is not in dispute. The spec wants
 * frame-pass work inside the conservative one-frame bound, so the accounting
 * is unchanged here and only the ranking moves.
 *
 * Every number is hand arithmetic over the box tessellation and the documented
 * pass model: a three-part model is `3 x 12` triangles and three draws, a
 * one-part model is twelve and one, a `3 x 2` water grid is `2 * 2 * 1`
 * triangles in one draw, and one pass repeats every opaque draw once.
 *
 * Scenarios:
 *
 * 1. Two drawables and no light: the outline pass doubles triangles and draw
 *    calls, and both refusals name the larger drawable and the scene path that
 *    holds it.
 * 2. The measured total, the listed owners and the omitted cost still add up,
 *    pass included, so the ranking moved and the accounting did not.
 * 3. A production that lights nothing casting a shadow is the case that has no
 *    remedy at all: the outline pass is assumed regardless, so no ranking may
 *    offer a `render-pass:` id as somewhere to edit.
 * 4. One drawable is the equality boundary. The pass costs exactly what the
 *    single drawable costs, and the drawable is still what gets named.
 * 5. A shadow caster is stated as a pass in the recovery rather than ranked as
 *    the largest owner, while the `lights` and `shadowMaps` rankings, which are
 *    the light's own cost, still name the light.
 * 6. Regression: the resident metrics no pass multiplies, `instanceSlots` and
 *    `fluidCells`, rank exactly as before and carry no pass clause.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures actual inventories and evaluates budget findings for unlit/lit pairs, a one-drawable tie, shadow/light costs and resident instance/fluid counts. Exact verdict/accounting/owner/source/recovery projections require editable owners to rank while frame-pass work remains measured and disclosed separately.
 * @evidence contracts/testing.md#independent-expectations Hand arithmetic uses twelve triangles per box, three versus one model parts, a 3-by-2 water grid's four triangles and one additional opaque submission. Literal limits, owner/source identities and complete recovery text distinguish a wrong ranking from changed accounting; tested recovery substrings are product diagnostic contract, not authored-prose grading.
 * @evidence contracts/testing.md#distinguishing-cases Preserves six numbered groups: unequal unlit geometry, full accounting, nonshadowing light, one-drawable equality, shadow caster versus its own light/map costs and unchanged resident instanceSlots/fluidCells ranking. Other metrics, partial masks, resource bounds and target admission have adjacent render-budget units; these cases assert over-limit behavior rather than all within-limit admission.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_editable_owner owns six portable synchronous groups through its original factories/observation helpers in one canonical internal module. Each report keeps original fresh factory results, inventory-before-evaluation order and target premises; no renderer, browser, GPU, native output or filesystem is opened.
 */
export function test_render_budget_editable_owner(): void {
  // A three-part hall and a one-part stool, so the two drawables differ and the
  // ranking has something to choose between.
  const HALL_TRIANGLES: number = 3 * BOX_TRIANGLES;
  const HALL_DRAWS: number = 3;
  const STOOL_TRIANGLES: number = BOX_TRIANGLES;
  const STOOL_DRAWS: number = 1;
  // A 3 x 2 basin: two quads, two triangles each, submitted as one surface.
  const WATER_TRIANGLES: number = 4;
  // The outline guide pass, or one shadow map's depth pass, is one further
  // complete submission of every opaque draw.
  const PASSES: number = 2;

  const pair: IAutoMovieRenderReport["findings"][number] = report({
    subject: staging({ nodes: [staged("hall"), staged("stool")], lights: [] }),
    metric: "triangles",
    limit: 50,
  });
  const pairDraws: IAutoMovieRenderReport["findings"][number] = report({
    subject: staging({ nodes: [staged("hall"), staged("stool")], lights: [] }),
    metric: "drawCalls",
    limit: 5,
  });
  TestValidator.equals(
    "an unlit pair is refused at the larger drawable, not at the pass that doubles it",
    { triangles: shape(pair), drawCalls: shape(pairDraws) },
    {
      triangles: {
        status: "over",
        measured: PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES),
        excess: PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES) - 50,
        owner: "node:hall",
        source: 'scene.nodes["hall"]',
        cost: HALL_TRIANGLES,
        // The pass is one owner the report declines to name, and it carries
        // exactly the opaque total it redraws.
        omittedContributors: 1,
        omittedCost: HALL_TRIANGLES + STOOL_TRIANGLES,
        accounted: PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES),
        namesTheOwner: true,
        namesThePass: true,
        sendsNobodyToAPass: true,
      },
      drawCalls: {
        status: "over",
        measured: PASSES * (HALL_DRAWS + STOOL_DRAWS),
        excess: PASSES * (HALL_DRAWS + STOOL_DRAWS) - 5,
        owner: "node:hall",
        source: 'scene.nodes["hall"]',
        cost: HALL_DRAWS,
        omittedContributors: 1,
        omittedCost: HALL_DRAWS + STOOL_DRAWS,
        accounted: PASSES * (HALL_DRAWS + STOOL_DRAWS),
        namesTheOwner: true,
        namesThePass: true,
        sendsNobodyToAPass: true,
      },
    },
  );
  TestValidator.equals(
    "the recovery states the owner to edit and the pass cost as separate facts",
    pair.recovery,
    `"triangles" measures ${PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES)} against a limit of 50, ${
      PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES) - 50
    } over; the largest owner is "node:hall" at ${HALL_TRIANGLES}, edited at scene.nodes["hall"]; a further ${
      HALL_TRIANGLES + STOOL_TRIANGLES
    } of that total is frame passes redrawing the opaque owners, the largest "render-pass:outline" at ${
      HALL_TRIANGLES + STOOL_TRIANGLES
    }`,
  );

  // The production the defect had no remedy for. A light that casts no shadow
  // leaves the outline pass as the frame-wide peak, and `IAutoMovieRenderBudget`
  // declares no passes, so an author told to edit `render.pass.outline` has
  // nowhere to go.
  const shadowless: IAutoMovieRenderReport["findings"][number] = report({
    subject: staging({
      nodes: [staged("hall"), staged("stool")],
      lights: [
        {
          id: "key",
          type: "directional",
          transform: pose(),
          color: { r: 1, g: 1, b: 1, a: 1, hex: null },
          intensity: 1,
          castShadow: false,
        },
      ],
    }),
    metric: "triangles",
    limit: 50,
  });
  TestValidator.equals(
    "a lit production casting no shadow is still refused at a drawable",
    shape(shadowless),
    {
      status: "over",
      measured: PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES),
      excess: PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES) - 50,
      owner: "node:hall",
      source: 'scene.nodes["hall"]',
      cost: HALL_TRIANGLES,
      omittedContributors: 1,
      omittedCost: HALL_TRIANGLES + STOOL_TRIANGLES,
      accounted: PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES),
      namesTheOwner: true,
      namesThePass: true,
      sendsNobodyToAPass: true,
    },
  );

  // The boundary the old ranking decided on an identifier: with one drawable
  // the pass costs exactly what that drawable costs, and `render-pass:outline`
  // sorts before `water-body:pool`, so the tie went to the pass.
  const single: IAutoMovieRenderReport["findings"][number] = report({
    subject: {
      scene: staging({ nodes: [], lights: [] }).scene,
      models: models(),
      waterBodies: [
        {
          id: "pool",
          owner: null,
          nodes: [],
          domain: flatBasin({ columns: 3, rows: 2, depth: 1 }),
          cells: null,
          particles: null,
          material: null,
        },
      ],
    },
    metric: "triangles",
    limit: PASSES * WATER_TRIANGLES - 1,
  });
  TestValidator.equals(
    "one drawable ties the pass exactly and the drawable is still named",
    {
      ...shape(single),
      // The tie the ranking used to lose: an owner id sorting after the pass.
      tied: single.contributors[0]?.cost === single.omittedCost,
    },
    {
      status: "over",
      measured: PASSES * WATER_TRIANGLES,
      excess: 1,
      owner: "water-body:pool",
      source: 'waterBodies["pool"]',
      cost: WATER_TRIANGLES,
      omittedContributors: 1,
      omittedCost: WATER_TRIANGLES,
      accounted: PASSES * WATER_TRIANGLES,
      namesTheOwner: true,
      namesThePass: true,
      sendsNobodyToAPass: true,
      tied: true,
    },
  );

  const sun: () => IAutoMovieScene["lights"][number] = (): IAutoMovieScene["lights"][number] => ({
    id: "sun",
    type: "directional",
    transform: pose(),
    color: { r: 1, g: 1, b: 1, a: 1, hex: null },
    intensity: 1,
    castShadow: true,
    shadow: { mapSize: 512, bias: 0, normalBias: 0, near: 0.1, far: 20 },
  });
  const lit: IAutoMovieRenderSubject = staging({
    nodes: [staged("hall"), staged("stool")],
    lights: [sun()],
  });
  const caster: IAutoMovieRenderReport["findings"][number] = report({ subject: lit, metric: "triangles", limit: 50 });
  const maps: IAutoMovieRenderReport["findings"][number] = report({ subject: lit, metric: "shadowMaps", limit: 0 });
  const sources: IAutoMovieRenderReport["findings"][number] = report({ subject: lit, metric: "lights", limit: 0 });
  TestValidator.equals(
    "a shadow caster is stated as a pass, and still ranked for its own cost",
    {
      triangles: {
        ...shape(caster),
        namesTheCaster: (caster.recovery ?? "").includes(
          `the largest "light:sun" at ${HALL_TRIANGLES + STOOL_TRIANGLES}`,
        ),
      },
      shadowMaps: shape(maps),
      lights: shape(sources),
    },
    {
      triangles: {
        status: "over",
        measured: PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES),
        excess: PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES) - 50,
        owner: "node:hall",
        source: 'scene.nodes["hall"]',
        cost: HALL_TRIANGLES,
        omittedContributors: 1,
        omittedCost: HALL_TRIANGLES + STOOL_TRIANGLES,
        accounted: PASSES * (HALL_TRIANGLES + STOOL_TRIANGLES),
        namesTheOwner: true,
        namesThePass: true,
        sendsNobodyToAPass: true,
        namesTheCaster: true,
      },
      // The shadow map itself, and the light that exists at all, are the
      // light's own cost rather than a redraw of anyone else's, so they are
      // ranked and the author is sent to the light.
      shadowMaps: {
        status: "over",
        measured: 1,
        excess: 1,
        owner: "light:sun",
        source: 'scene.lights["sun"]',
        cost: 1,
        omittedContributors: 0,
        omittedCost: 0,
        accounted: 1,
        namesTheOwner: true,
        namesThePass: false,
        sendsNobodyToAPass: true,
      },
      lights: {
        status: "over",
        measured: 1,
        excess: 1,
        owner: "light:sun",
        source: 'scene.lights["sun"]',
        cost: 1,
        omittedContributors: 0,
        omittedCost: 0,
        accounted: 1,
        namesTheOwner: true,
        namesThePass: false,
        sendsNobodyToAPass: true,
      },
    },
  );

  // Regression. A resident cost is allocated once and reused by every pass, so
  // no pass row competes with the drawable that owns it and these two rankings
  // were never wrong. They must not move.
  const resident: () => IAutoMovieRenderSubject = (): IAutoMovieRenderSubject => ({
    scene: staging({ nodes: [], lights: [] }).scene,
    models: models(),
    instanceSets: [instanceSetFixture({ id: "windows", count: 12, chunks: 3 })],
    waterBodies: [
      {
        id: "pool",
        owner: null,
        nodes: [],
        domain: null,
        cells: 4096,
        particles: 0,
        material: null,
      },
    ],
  });
  TestValidator.equals(
    "the metrics no pass multiplies rank exactly as before",
    {
      instanceSlots: shape(
        report({ subject: resident(), metric: "instanceSlots", limit: 11 }),
      ),
      fluidCells: shape(
        report({ subject: resident(), metric: "fluidCells", limit: 4000 }),
      ),
    },
    {
      instanceSlots: {
        status: "over",
        measured: 12,
        excess: 1,
        owner: "instance-set:windows",
        source: 'world.instanceSets["windows"]',
        cost: 12,
        omittedContributors: 0,
        omittedCost: 0,
        accounted: 12,
        namesTheOwner: true,
        namesThePass: false,
        sendsNobodyToAPass: true,
      },
      fluidCells: {
        status: "over",
        measured: 4096,
        excess: 96,
        owner: "water-body:pool",
        source: 'waterBodies["pool"]',
        cost: 4096,
        omittedContributors: 0,
        omittedCost: 0,
        accounted: 4096,
        namesTheOwner: true,
        namesThePass: false,
        sendsNobodyToAPass: true,
      },
    },
  );
}
