import {
  type AutoMovieArchetype,
  createBed,
  createBookcase,
  createBunkBed,
  createCane,
  createCrib,
  createDrawerUnit,
  createGurney,
  createHingedCabinet,
  createHospitalBed,
  createInfusionStand,
  createMattress,
  createMobilityAid,
  createPlatformBed,
  createStorage,
  createWalker,
} from "@automovie/archetypes";
import { Vector3, physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";
import { nclose, vclose } from "../../../internal/predicates";

/** Tolerance for a promised contact on an actual part, in metres. */
const MILLIMETRE: number = 0.001;

/** An unplaced collider is measured in the scene axes. */
const IDENTITY: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/**
 * Whether an advertised contact is on the top of a named solid with free space
 * above it.
 */
function onTop(
  model: AutoMovieArchetype,
  site: IAutoMovieAffordance,
  part: string,
): boolean {
  const solid: IAutoMoviePhysicalShape | undefined = model
    .shapes()
    .find((shape: IAutoMoviePhysicalShape): boolean => shape.id === part);
  if (solid === undefined) return false;
  const point: IAutoMovieVector3 = site.frame.translation;
  const above: IAutoMovieVector3 = Vector3.add(
    point,
    Vector3.create(0, 0.02, 0),
  );
  return (
    nclose(
      physicalShapeSegmentDistance(IDENTITY, solid, point, point),
      0,
      MILLIMETRE,
    ) &&
    nclose(
      physicalShapeSegmentDistance(IDENTITY, solid, above, above),
      0.02,
      MILLIMETRE,
    )
  );
}

/**
 * The named mobility, bed and storage producers replay old recipes and expose
 * their own physical contacts.
 *
 * Scenarios:
 *
 * 1. Every old selector and canonical route has the same serialized model, seed
 *    dimensions and provenance when no feature is added.
 * 2. The cane and walker put their support at floor level. The stretcher and open
 *    shelf supply real horizontal supports with clear space above them.
 * 3. A wardrobe carries its pull through a 90 degree rotation and a chest carries
 *    its pull along a 12 cm slide. Refuse travel beyond the measured hinge
 *    option and old dimensions that belong to a selected model.
 */
export function test_unit_archetypes_props_catalogue_home_supports(): void {
  for (const seed of [undefined, 0, 1041]) {
    const pairs: readonly (readonly [
      AutoMovieArchetype,
      AutoMovieArchetype,
    ])[] = [
      [createMobilityAid({ kind: "cane" }, seed), createCane({}, seed)],
      [
        createMobilityAid(
          { kind: "walker", model: "junior", height: 0.73 },
          seed,
        ),
        createWalker({ model: "junior", height: 0.73 }, seed),
      ],
      [
        createMobilityAid({ kind: "infusionStand" }, seed),
        createInfusionStand({}, seed),
      ],
      [
        createBed({ kind: "single", id: "bed1", height: 0.5 }, seed),
        createPlatformBed({ kind: "single", id: "bed1", height: 0.5 }, seed),
      ],
      [
        createBed({ kind: "double" }, seed),
        createPlatformBed({ kind: "double" }, seed),
      ],
      [
        createBed({ kind: "mattress", size: "double" }, seed),
        createMattress({ size: "double" }, seed),
      ],
      [createBed({ kind: "hospital" }, seed), createHospitalBed({}, seed)],
      [createBed({ kind: "gurney" }, seed), createGurney({}, seed)],
      [createBed({ kind: "crib" }, seed), createCrib({}, seed)],
      [createBed({ kind: "bunk" }, seed), createBunkBed({}, seed)],
      [
        createStorage({ kind: "wardrobe" }, seed),
        createHingedCabinet({ kind: "wardrobe" }, seed),
      ],
      [
        createStorage({ kind: "locker" }, seed),
        createHingedCabinet({ kind: "locker" }, seed),
      ],
      [
        createStorage({ kind: "chest" }, seed),
        createDrawerUnit({ kind: "chest" }, seed),
      ],
      [
        createStorage({ kind: "filingCabinet" }, seed),
        createDrawerUnit({ kind: "filingCabinet" }, seed),
      ],
      [createStorage({ kind: "bookcase" }, seed), createBookcase({}, seed)],
    ];
    for (const [legacy, canonical] of pairs)
      TestValidator.equals(
        `${legacy.name} seed ${String(seed)} replays its model and dimensions`,
        JSON.stringify([legacy, legacy.dimensions, legacy.provenance]),
        JSON.stringify([canonical, canonical.dimensions, canonical.provenance]),
      );
  }

  const cane: ReturnType<typeof createCane> = createCane({ height: 0.9 }, 3);
  const walker: ReturnType<typeof createWalker> = createWalker(
    { model: "adult" },
    3,
  );
  const gurney: ReturnType<typeof createGurney> = createGurney(
    { litter: 0.7 },
    3,
  );
  const bookcase: ReturnType<typeof createBookcase> = createBookcase({}, 3);
  TestValidator.predicate(
    "cane tip and standing rails use the modeled floor",
    nclose(
      cane.affordance("tip").frame.translation.y,
      archetypeExtent(cane, "y").low,
      MILLIMETRE,
    ) &&
      nclose(
        walker.affordance("tip").frame.translation.y,
        archetypeExtent(walker, "y").low,
        MILLIMETRE,
      ) &&
      walker.affordance("leftGrip").frame.translation.x > 0 &&
      walker.affordance("rightGrip").frame.translation.x < 0,
  );
  TestValidator.predicate(
    "stretcher support is on its pad at the authored transport height",
    nclose(
      gurney.affordance("surface").frame.translation.y,
      0.84,
      MILLIMETRE,
    ) && onTop(gurney, gurney.affordance("surface"), "mattress"),
  );
  TestValidator.predicate(
    "open shelf offers a supported floor to a placed object",
    onTop(bookcase, bookcase.affordance("shelf1"), "shelf-1"),
  );

  const wardrobe: ReturnType<typeof createHingedCabinet> = createHingedCabinet({
    kind: "wardrobe",
    model: "CLIP top 95",
  });
  const pivot: IAutoMovieVector3 =
    wardrobe.affordance("leftDoor").frame.translation;
  const pull: IAutoMovieVector3 =
    wardrobe.affordance("leftPull").frame.translation;
  const hingeOffset: IAutoMovieVector3 = Vector3.subtract(pull, pivot);
  const open: ReturnType<typeof createHingedCabinet> = wardrobe.articulate({
    leftDoor: 90,
  });
  const chest: ReturnType<typeof createDrawerUnit> = createDrawerUnit({
    kind: "chest",
    model: "3832-E12",
  });
  const drawn: ReturnType<typeof createDrawerUnit> = chest.articulate({
    drawer2: 0.12,
  });
  TestValidator.predicate(
    "wardrobe pull follows the leaf around a vertical quarter-turn",
    vclose(
      open.affordance("leftPull").frame.translation,
      Vector3.add(
        pivot,
        Vector3.create(hingeOffset.z, hingeOffset.y, -hingeOffset.x),
      ),
      MILLIMETRE,
    ),
  );
  TestValidator.predicate(
    "drawer pull follows a 12 cm shift along positive Z",
    vclose(
      drawn.affordance("pull2").frame.translation,
      Vector3.add(
        chest.affordance("pull2").frame.translation,
        Vector3.create(0, 0, 0.12),
      ),
      MILLIMETRE,
    ),
  );
  TestValidator.error("the 95 degree hinge rejects 110 degrees", () =>
    wardrobe.articulate({ leftDoor: 110 }),
  );
  TestValidator.error(
    "the legacy walker rejects a fixed mass on a measured model",
    () => createMobilityAid({ kind: "walker", model: "adult", mass: 3.5 }),
  );
}
