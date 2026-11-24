import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  createAppliance,
  createAtm,
  createBathtub,
  createBollard,
  createCrosstie,
  createCrowdBarrier,
  createFireHydrant,
  createJerseyBarrier,
  createLampPost,
  createMachine,
  createMicrowave,
  createObstacle,
  createPayStation,
  createRange,
  createRefrigerator,
  createRopeStanchions,
  createSandbag,
  createSanitary,
  createShower,
  createSignPost,
  createStreetFixture,
  createToilet,
  createTrafficCone,
  createVendingMachine,
  createWashbasin,
  createWashingMachine,
} from "@automovie/archetypes";
import * as architecture from "@automovie/archetypes/architecture";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** The scene identity every named fixture accepts. */
interface IIdentity {
  /** The model's scene id. */
  id?: string;
}

/** A named fixture producer reached through one import path. */
type NamedProducer = (params?: IIdentity, seed?: number) => AutoMovieArchetype;

/** A saved recipe replayed at one seed. */
type SavedRecipe = (seed: number) => AutoMovieArchetype;

/**
 * The 21 named architectural fixtures use the saved kinds' exact seeded
 * recipes.
 *
 * Scenarios:
 *
 * 1. Every named producer resolves from the root, the architecture subpath and the
 *    saved kind table. Two seeds, 0 and 1048, preserve the model, parts and
 *    contact frames of its old recipe.
 * 2. Historical seed zero reproduces the refrigerator pull height, Merchant model,
 *    shower control height, bollard pipe and both crosstie size axes.
 * 3. Explicit manufacturer and crosstie model choices preserve custom IDs. Fields
 *    from other models or fixed measured axes remain typed refusals.
 */
export function test_unit_archetypes_props_catalogue_architecture_compatibility(): void {
  const rows: readonly [
    named: NamedProducer,
    subpath: NamedProducer,
    mapped: NamedProducer,
    saved: SavedRecipe,
  ][] = [
    [
      createRefrigerator,
      architecture.createRefrigerator,
      createAppliance.PRODUCERS.refrigerator,
      (seed: number): AutoMovieArchetype =>
        createAppliance({ kind: "refrigerator" }, seed),
    ],
    [
      createRange,
      architecture.createRange,
      createAppliance.PRODUCERS.cooker,
      (seed: number): AutoMovieArchetype =>
        createAppliance({ kind: "cooker" }, seed),
    ],
    [
      createMicrowave,
      architecture.createMicrowave,
      createAppliance.PRODUCERS.microwave,
      (seed: number): AutoMovieArchetype =>
        createAppliance({ kind: "microwave" }, seed),
    ],
    [
      createWashingMachine,
      architecture.createWashingMachine,
      createAppliance.PRODUCERS.washingMachine,
      (seed: number): AutoMovieArchetype =>
        createAppliance({ kind: "washingMachine" }, seed),
    ],
    [
      createVendingMachine,
      architecture.createVendingMachine,
      createMachine.PRODUCERS.vendingMachine,
      (seed: number): AutoMovieArchetype =>
        createMachine({ kind: "vendingMachine" }, seed),
    ],
    [
      createPayStation,
      architecture.createPayStation,
      createMachine.PRODUCERS.payStation,
      (seed: number): AutoMovieArchetype =>
        createMachine({ kind: "payStation" }, seed),
    ],
    [
      createAtm,
      architecture.createAtm,
      createMachine.PRODUCERS.atm,
      (seed: number): AutoMovieArchetype =>
        createMachine({ kind: "atm" }, seed),
    ],
    [
      createWashbasin,
      architecture.createWashbasin,
      createSanitary.PRODUCERS.washbasin,
      (seed: number): AutoMovieArchetype =>
        createSanitary({ kind: "washbasin" }, seed),
    ],
    [
      createToilet,
      architecture.createToilet,
      createSanitary.PRODUCERS.toilet,
      (seed: number): AutoMovieArchetype =>
        createSanitary({ kind: "toilet" }, seed),
    ],
    [
      createBathtub,
      architecture.createBathtub,
      createSanitary.PRODUCERS.bathtub,
      (seed: number): AutoMovieArchetype =>
        createSanitary({ kind: "bathtub" }, seed),
    ],
    [
      createShower,
      architecture.createShower,
      createSanitary.PRODUCERS.shower,
      (seed: number): AutoMovieArchetype =>
        createSanitary({ kind: "shower" }, seed),
    ],
    [
      createTrafficCone,
      architecture.createTrafficCone,
      createStreetFixture.PRODUCERS.trafficCone,
      (seed: number): AutoMovieArchetype =>
        createStreetFixture({ kind: "trafficCone" }, seed),
    ],
    [
      createBollard,
      architecture.createBollard,
      createStreetFixture.PRODUCERS.bollard,
      (seed: number): AutoMovieArchetype =>
        createStreetFixture({ kind: "bollard" }, seed),
    ],
    [
      createFireHydrant,
      architecture.createFireHydrant,
      createStreetFixture.PRODUCERS.hydrant,
      (seed: number): AutoMovieArchetype =>
        createStreetFixture({ kind: "hydrant" }, seed),
    ],
    [
      createLampPost,
      architecture.createLampPost,
      createStreetFixture.PRODUCERS.lampPost,
      (seed: number): AutoMovieArchetype =>
        createStreetFixture({ kind: "lampPost" }, seed),
    ],
    [
      createSignPost,
      architecture.createSignPost,
      createStreetFixture.PRODUCERS.signPost,
      (seed: number): AutoMovieArchetype =>
        createStreetFixture({ kind: "signPost" }, seed),
    ],
    [
      createCrosstie,
      architecture.createCrosstie,
      createObstacle.PRODUCERS.crosstie,
      (seed: number): AutoMovieArchetype =>
        createObstacle({ kind: "crosstie" }, seed),
    ],
    [
      createSandbag,
      architecture.createSandbag,
      createObstacle.PRODUCERS.sandbag,
      (seed: number): AutoMovieArchetype =>
        createObstacle({ kind: "sandbag" }, seed),
    ],
    [
      createJerseyBarrier,
      architecture.createJerseyBarrier,
      createObstacle.PRODUCERS.jerseyBarrier,
      (seed: number): AutoMovieArchetype =>
        createObstacle({ kind: "jerseyBarrier" }, seed),
    ],
    [
      createCrowdBarrier,
      architecture.createCrowdBarrier,
      createObstacle.PRODUCERS.crowdBarrier,
      (seed: number): AutoMovieArchetype =>
        createObstacle({ kind: "crowdBarrier" }, seed),
    ],
    [
      createRopeStanchions,
      architecture.createRopeStanchions,
      createObstacle.PRODUCERS.ropeAndPosts,
      (seed: number): AutoMovieArchetype =>
        createObstacle({ kind: "ropeAndPosts" }, seed),
    ],
  ];
  for (const [named, subpath, mapped, saved] of rows) {
    TestValidator.predicate(
      named.name + " public identity",
      named === subpath && named === mapped,
    );
    for (const seed of [0, 1048]) {
      const after: AutoMovieArchetype = named({}, seed);
      const before: AutoMovieArchetype = saved(seed);
      const label: string = named.name + " at " + seed;
      TestValidator.equals(
        label + " identity",
        [after.id, after.archetype, after.name],
        [before.id, before.archetype, before.name],
      );
      TestValidator.equals(
        label + " part IDs",
        after.parts.map((part) => part.id),
        before.parts.map((part) => part.id),
      );
      TestValidator.equals(
        label + " model choices",
        after.provenance.models,
        before.provenance.models,
      );
      TestValidator.equals(
        label + " model-owned dimensions",
        after.provenance.figures,
        before.provenance.figures,
      );
      TestValidator.equals(
        label + " dimension IDs",
        Object.keys(after.dimensions),
        Object.keys(before.dimensions),
      );
      TestValidator.predicate(
        label + " mass and dimensions",
        nclose(after.body.mass, before.body.mass) &&
          Object.entries(before.dimensions).every(([id, value]) =>
            nclose(after.dimensions[id]!, value!),
          ),
      );
      TestValidator.equals(
        label + " contact IDs and kinds",
        after.affordances.map(({ id, kind }) => [id, kind]),
        before.affordances.map(({ id, kind }) => [id, kind]),
      );
      for (const contact of after.affordances) {
        const historical = before.affordance(contact.id);
        TestValidator.predicate(
          label + " frame " + contact.id,
          vclose(contact.frame.translation, historical.frame.translation) &&
            qclose(contact.frame.rotation, historical.frame.rotation),
        );
      }
    }
  }

  const fridge: ReturnType<typeof createRefrigerator> = createRefrigerator(
    {},
    0,
  );
  const vending: ReturnType<typeof createVendingMachine> = createVendingMachine(
    {},
    0,
  );
  const shower: ReturnType<typeof createShower> = createShower({}, 0);
  const bollard: ReturnType<typeof createBollard> = createBollard({}, 0);
  const crosstie: ReturnType<typeof createCrosstie> = createCrosstie({}, 0);
  TestValidator.predicate(
    "pre-split seed zero replay",
    nclose(fridge.dimensions.pullHeight!, 0.9598062394431387) &&
      nclose(vending.dimensions.width!, 1.18) &&
      vending.provenance.models.model === "Merchant 6" &&
      nclose(shower.dimensions.control!, 1.1495918163718262) &&
      nclose(bollard.dimensions.diameter!, 0.27305) &&
      bollard.provenance.models.model === "R-1007-10" &&
      nclose(crosstie.dimensions.height!, 0.1524) &&
      nclose(crosstie.dimensions.length!, 2.7432) &&
      crosstie.provenance.models.section === "6x8in" &&
      crosstie.provenance.models.tieLength === "9ft",
  );
  const selected: ReturnType<typeof createCrosstie> = createCrosstie(
    { section: "7x9in", tieLength: "8ft", id: "station-crossing" },
    0,
  );
  const selectedMachine: ReturnType<typeof createVendingMachine> =
    createVendingMachine({ model: "Merchant 4", id: "break-room" }, 0);
  TestValidator.predicate(
    "explicit models and custom IDs",
    selected.id === "station-crossing" &&
      nclose(selected.dimensions.length!, 2.4384) &&
      nclose(selected.dimensions.height!, 0.1778) &&
      selectedMachine.id === "break-room" &&
      nclose(selectedMachine.dimensions.width!, 0.895),
  );

  const refusals: readonly [
    run: () => AutoMovieArchetype,
    family: string,
    axis: string,
  ][] = [
    [() => createAppliance({} as createAppliance.IParams), "appliance", "kind"],
    [
      () => createAppliance({ kind: "refrigerator", cavityHeight: 0.18 }),
      "appliance",
      "cavityHeight",
    ],
    [
      () => createMachine({ kind: "atm", model: "Merchant 4" }),
      "machine",
      "model",
    ],
    [
      () => createSanitary({ kind: "shower", wellLength: 1.238 }),
      "sanitary",
      "wellLength",
    ],
    [
      () => createStreetFixture({ kind: "trafficCone", model: "STOP 30 in" }),
      "streetFixture",
      "model",
    ],
    [
      () => createObstacle({ kind: "crosstie", length: 2.4384 }),
      "obstacle",
      "length",
    ],
    [
      () => createObstacle({ kind: "sandbag", section: "7x9in" }),
      "obstacle",
      "section",
    ],
  ];
  for (const [run, family, axis] of refusals) {
    let caught: unknown;
    try {
      run();
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      family + " refuses " + axis,
      caught instanceof AutoMovieArchetypeRefusal &&
        caught.archetype === family &&
        caught.axis === axis,
    );
  }
}
