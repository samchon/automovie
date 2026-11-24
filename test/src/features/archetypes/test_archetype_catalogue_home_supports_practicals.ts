import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  createAshtray,
  createBowl,
  createCandle,
  createCargoPod,
  createCarryBasket,
  createCookingPot,
  createFireTorch,
  createLantern,
  createLight,
  createMoldedCrate,
  createPendantLamp,
  createPlankCoffer,
  createScenicBasket,
  createScenicContainer,
  createServingTray,
  createStandingLamp,
  createTray,
  createVase,
  createVessel,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  compilePracticalLightMotion,
  physicalShapePairDistance,
  resolveShotLighting,
  stageScene,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieClip,
  IAutoMovieLight,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieSceneNode,
  IAutoMovieStagedSet,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose, qclose, vclose } from "../internal/predicates";

/** An arithmetic tolerance for static placement in metres. */
const TOLERANCE: number = 1e-6;

/** The model poses supplied to a scene unless a carrier supplies the pose. */
const UNPLACED: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/**
 * Canonical vessels, hand carriers, practical lights and scenic containers
 * preserve legacy appearance and carry the proper site to production.
 *
 * Scenarios:
 *
 * 1. Seedless, zero and nonzero seeds produce equal legacy and canonical models
 *    including dimensions and provenance. The new cargo mount is the sole
 *    additive model field for its route.
 * 2. The carry basket's handle follows the real carry bar and its interior
 *    placement is on the real floor. The cargo pod seats on a translated and
 *    turned coffer with its base and mount touching the supported lid.
 * 3. A pendant passes its model contact to the existing emitter compiler and light
 *    resolver. The spot starts the switching interval at the shade mouth, aims
 *    down and switches off at the interval end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the compatibility, support, grasp and light binding observations.
 * @evidence contracts/development/testing.md#behavioral-verification Creates named producers, submits the actual model affordances to staged prop mounting and practical lighting, samples the results and measures the lid and base colliders.
 * @evidence contracts/development/testing.md#independent-expectations The carried mount must coincide with the physical lid plane at the authored height. The practical must appear on the shade's observable lower face, looking down, with the authored half-open switch. Legacy equality only witnesses compatibility.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers fixed and selected sizes, open and closed placements, supporting and attached cargo, and switch boundaries. The older container test separately constrains the legacy scene geometry and fixed-dimension refusal.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable in-memory SDK and production composition test without a browser or graphics host.
 */
export function test_archetype_catalogue_home_supports_practicals(): void {
  for (const seed of [undefined, 0, 1042]) {
    const pairs: readonly (readonly [
      AutoMovieArchetype,
      AutoMovieArchetype,
    ])[] = [
      [createVessel({ kind: "bowl" }, seed), createBowl({}, seed)],
      [createVessel({ kind: "ashtray" }, seed), createAshtray({}, seed)],
      [
        createVessel({ kind: "saucepan" }, seed),
        createCookingPot({ kind: "saucepan" }, seed),
      ],
      [
        createVessel({ kind: "stockpot" }, seed),
        createCookingPot({ kind: "stockpot" }, seed),
      ],
      [createVessel({ kind: "vase" }, seed), createVase({}, seed)],
      [createTray({ kind: "tray" }, seed), createServingTray({}, seed)],
      [createTray({ kind: "basket" }, seed), createCarryBasket({}, seed)],
      [createLight({ kind: "candle" }, seed), createCandle({}, seed)],
      [createLight({ kind: "fireTorch" }, seed), createFireTorch({}, seed)],
      [createLight({ kind: "pendant" }, seed), createPendantLamp({}, seed)],
      [
        createLight({ kind: "tableLamp" }, seed),
        createStandingLamp({ kind: "tableLamp" }, seed),
      ],
      [
        createLight({ kind: "floorLamp" }, seed),
        createStandingLamp({ kind: "floorLamp" }, seed),
      ],
      [createLight({ kind: "lantern" }, seed), createLantern({}, seed)],
      [
        createScenicContainer({ kind: "coilBasket" }, seed),
        createScenicBasket({ kind: "coilBasket" }, seed),
      ],
      [
        createScenicContainer({ kind: "woodenFishBasket" }, seed),
        createScenicBasket({ kind: "woodenFishBasket" }, seed),
      ],
      [
        createScenicContainer({ kind: "plankCoffer" }, seed),
        createPlankCoffer({}, seed),
      ],
      [
        createScenicContainer({ kind: "moldedCrate" }, seed),
        createMoldedCrate({}, seed),
      ],
      [
        createScenicContainer({ kind: "cargoPod" }, seed),
        createCargoPod({}, seed),
      ],
    ];
    for (const [legacy, canonical] of pairs)
      TestValidator.equals(
        `${legacy.name} seed ${String(seed)} replays its model and dimensions`,
        JSON.stringify([legacy, legacy.dimensions, legacy.provenance]),
        JSON.stringify([
          canonical.name === "cargo pod"
            ? {
                ...canonical,
                affordances: canonical.affordances.filter(
                  (affordance: IAutoMovieAffordance): boolean =>
                    affordance.id !== "mount",
                ),
              }
            : canonical,
          canonical.dimensions,
          canonical.provenance,
        ]),
      );
  }

  const basket: ReturnType<typeof createCarryBasket> = createCarryBasket({
    model: "risatorp25",
  });
  const grasp: IAutoMovieAffordance = basket.affordance("handle");
  const bar: ReturnType<typeof archetypeExtent> = archetypeExtent(basket, "y", [
    "handle",
  ]);
  TestValidator.predicate(
    "interior contact uses the visible floor and the basket is grasped across the bar",
    nclose(
      basket.affordance("inside").frame.translation.y,
      archetypeExtent(basket, "y", ["floor"]).high,
      TOLERANCE,
    ) &&
      nclose(grasp.frame.translation.y, (bar.low + bar.high) / 2, TOLERANCE) &&
      nclose(grasp.aperture!, bar.size, TOLERANCE),
  );

  const carrier: ReturnType<typeof createPlankCoffer> = createPlankCoffer({
    id: "carrier",
    width: 0.92,
    depth: 0.52,
    height: 0.4,
  });
  const cargo: ReturnType<typeof createCargoPod> = createCargoPod(
    {
      id: "cargo",
      width: 0.68,
      depth: 0.45,
    },
    2,
  );
  const mount: IAutoMovieAffordance = cargo.affordance("mount");
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(
    mount.frame.rotation,
  );
  const performance: HumanPerformance = new HumanPerformance({
    seed: "loaded-platform",
    performers: [
      {
        subject: "porter",
        body: motionHumanBody("m-average"),
        at: { x: 0, y: 0, z: 2 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("porter").stand({
      hold: 1,
      sway: 0,
    }).node,
    props: [
      {
        subject: carrier.id,
        frame: UNPLACED,
        points: {},
        affordances: carrier.affordances,
        motion: (seconds: number): IAutoMovieRigidTransform => ({
          position: { x: 1 + seconds, y: 0, z: -2 },
          rotation: Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            90 * seconds,
          ),
        }),
      },
      {
        subject: cargo.id,
        frame: UNPLACED,
        points: {},
        affordances: cargo.affordances,
        mounted: {
          prop: carrier.id,
          point: "top",
          offset: {
            position: Quaternion.rotateVector(
              inverse,
              Vector3.scale(mount.frame.translation, -1),
            ),
            rotation: inverse,
          },
        },
      },
    ],
  });
  const lid: IAutoMoviePhysicalShape | undefined = carrier
    .shapes()
    .find((shape: IAutoMoviePhysicalShape): boolean => shape.id === "lid");
  const foot: IAutoMoviePhysicalShape | undefined = cargo
    .shapes()
    .find((shape: IAutoMoviePhysicalShape): boolean => shape.id === "base");
  if (lid === undefined || foot === undefined)
    throw new Error("Expected the carrier lid and the mounted pod base");
  TestValidator.predicate(
    "the pod mount is on the visible bottom face and the cap still stacks",
    mount.kind === "socket" &&
      nclose(
        mount.frame.translation.y,
        archetypeExtent(cargo, "y", ["base"]).low,
        TOLERANCE,
      ) &&
      cargo.affordance("top").kind === "stack-top" &&
      nclose(
        cargo.affordance("top").frame.translation.y,
        archetypeExtent(cargo, "y", ["cap"]).high,
        TOLERANCE,
      ),
  );
  for (const seconds of [0, 0.5, 1]) {
    const placed: IAutoMovieRigidTransform = performance.prop(
      cargo.id,
      seconds,
    );
    const under: IAutoMovieRigidTransform = performance.prop(
      carrier.id,
      seconds,
    );
    TestValidator.predicate(
      `cargo stays seated and upright at ${seconds} s`,
      vclose(placed.position, { x: 1 + seconds, y: 0.4, z: -2 }, TOLERANCE) &&
        qclose(placed.rotation, under.rotation) &&
        nclose(
          physicalShapePairDistance(placed, foot, under, lid),
          0,
          TOLERANCE,
        ),
    );
  }

  const pendant: ReturnType<typeof createPendantLamp> = createPendantLamp({
    id: "hanging-lamp",
  });
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      set: [
        {
          node: "lamp",
          model: pendant.id,
          position: { x: 1, y: 3.5, z: -1 },
        },
      ],
      lights: [
        {
          node: "emitter",
          type: "spot",
          position: { x: 1, y: 3.5, z: -1 },
          direction: { x: 1, y: 0, z: 0 },
          color: { r: 1, g: 0.8, b: 0.6, a: null, hex: null },
          intensity: 7,
          range: 12,
          coneAngle: 15,
        },
      ],
    }),
  );
  if (!staged.success) throw new Error(JSON.stringify(staged.violations));
  const prop: IAutoMovieSceneNode | undefined = staged.scene.nodes.find(
    (node: IAutoMovieSceneNode): boolean => node.id === "lamp",
  );
  const spot: IAutoMovieLight | undefined = staged.scene.lights.find(
    (light: IAutoMovieLight): boolean => light.id === "emitter",
  );
  if (prop === undefined || spot?.type !== "spot")
    throw new Error("Expected a staged lamp and its spotlight");
  const emitter: IAutoMovieAffordance = pendant.affordance("light");
  const clip: IAutoMovieClip = compilePracticalLightMotion({
    id: "pendant-spot",
    duration: 1,
    light: spot,
    prop,
    emitter,
    on: [0.2, 0.8],
  });
  const at = (seconds: number): IAutoMovieLight =>
    resolveShotLighting({ lights: [spot], clips: [clip], seconds })[0]!;
  const beam: IAutoMovieLight = at(0.2);
  const down: IAutoMovieVector3 = Quaternion.rotateVector(
    beam.transform.rotation,
    Vector3.create(0, 0, -1),
  );
  TestValidator.predicate(
    "the spotlight leaves the physical shade downward and switches at the authored interval",
    vclose(
      beam.transform.translation,
      {
        x: 1,
        y: 3.5 + archetypeExtent(pendant, "y", ["shade"]).low,
        z: -1,
      },
      TOLERANCE,
    ) &&
      vclose(down, { x: 0, y: -1, z: 0 }, TOLERANCE) &&
      vclose(
        AutoMovieArchetypeFrame.axis(emitter.frame, "y"),
        down,
        TOLERANCE,
      ) &&
      nclose(at(0).intensity, 0, TOLERANCE) &&
      nclose(beam.intensity, 7, TOLERANCE) &&
      nclose(at(0.8).intensity, 0, TOLERANCE),
  );
}
