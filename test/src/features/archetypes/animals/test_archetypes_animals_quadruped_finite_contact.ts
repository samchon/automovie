import {
  type AutoMovieEnginePhysicsFaceContactTypes,
  AutoMovieEngineQuaternion,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedFooting,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";

import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** The test fixtures are in one metre-scale world frame. */
const IDENTITY: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: AutoMovieEngineQuaternion.identity(),
};

/**
 * Read actual solid clearance against each finite support.
 *
 * Scenarios:
 *
 * 1. A narrow patch between sphere samples still reports penetration.
 * 2. A tipped box clears a distant patch despite penetration elsewhere.
 * 3. A resting circle and a broad sole retain finite material witnesses.
 * 4. Concave boundaries preserve cutouts and neighbouring plane names.
 */
export function test_archetypes_animals_quadruped_finite_contact(): void {
  const sphere: IAutoMoviePhysicalShape = {
    id: "sphere",
    kind: "sphere",
    material: "fixture",
    transform: { ...IDENTITY, position: { x: 0.5, y: 0.5, z: 0.5 } },
    radius: 1,
  };
  const patch: IAutoMovieVector3[] = rectangle(0.508, 0.51, 0.508, 0.51);
  const expected: number = 0.5 - Math.sqrt(1 - 2 * 0.008 ** 2);
  const gap: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContact> =
    AutoMovieEnginePhysics.physicalShapeFaceContact(IDENTITY, sphere, IDENTITY, patch);
  TestValidator.predicate(
    "narrow sphere clearance matches the analytic value",
    gap !== undefined && nclose(gap.clearance, expected, 1e-12),
  );
  const narrow: ReturnType<typeof AutoMovieArchetypeQuadrupedFooting.prepare> =
    AutoMovieArchetypeQuadrupedFooting.prepare(
      "fixture",
      {
        planes: [
          {
            id: "narrow",
            origin: { x: 0, y: 0, z: 0 },
            x: [0.508, 0.51],
            z: [0.508, 0.51],
            slope: { x: 0, z: 0 },
          },
        ],
      },
      false,
    );
  const part: IAutoMovieModelPart = {
    id: "sphere",
    name: null,
    attachedBone: null,
    geometry: {
      type: "primitive",
      shape: { type: "sphere", radius: sphere.radius },
    },
    transform: AutoMovieArchetypeFrame.upright(sphere.transform.position),
    material: null,
  };
  let penetration: unknown;
  try {
    narrow!.verify(
      { parts: [part] },
      AutoMovieArchetypeFrame.upright(IDENTITY.position),
    );
  } catch (error) {
    penetration = error;
  }
  TestValidator.predicate(
    "the quadruped path rejects actual penetration",
    penetration instanceof AutoMovieArchetypeRefusal &&
      penetration.value === "narrow",
  );

  const box: IAutoMoviePhysicalShape = {
    id: "box",
    material: "fixture",
    kind: "box",
    transform: {
      position: { x: 0, y: 0.3, z: 0 },
      rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 45),
    },
    halfExtents: { x: 1, y: 0.05, z: 0.25 },
  };
  const clipped: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContact> =
    AutoMovieEnginePhysics.physicalShapeFaceContact(
      IDENTITY,
      box,
      IDENTITY,
      rectangle(0.65, 0.7, -0.1, 0.1).reverse(),
    );
  TestValidator.predicate(
    "a tilted sole is clipped to the finite patch",
    clipped !== undefined &&
      nclose(clipped.clearance, 0.3 + 0.65 - 0.05 * Math.SQRT2, 1e-12),
  );
  const broad: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContact> =
    AutoMovieEnginePhysics.physicalShapeFaceContact(
      IDENTITY,
      { ...box, transform: IDENTITY },
      IDENTITY,
      rectangle(-0.05, 0.05, -0.1, 0.1),
    );
  TestValidator.predicate(
    "the full broad witness is retained",
    broad?.patch?.length === 4 && nclose(broad.clearance, -0.05, 1e-12),
  );

  const circle: AutoMovieEnginePhysicsFaceContactTypes.Shape = {
    kind: "cylinder",
    transform: { ...IDENTITY, position: { x: 0, y: 0.2, z: 0 } },
    height: 0.4,
    radius: 0.15,
  };
  TestValidator.predicate(
    "a finite flat cap touches a patch away from its centre",
    Math.abs(
      AutoMovieEnginePhysics.physicalShapeFaceContact(
        IDENTITY,
        circle,
        IDENTITY,
        rectangle(0.1, 0.12, -0.02, 0.02),
      )!.clearance,
    ) < 1e-12,
  );
  TestValidator.equals(
    "the same circle clears a disjoint diagonally offset patch",
    AutoMovieEnginePhysics.physicalShapeFaceContact(
      IDENTITY,
      circle,
      IDENTITY,
      rectangle(0.12, 0.14, 0.12, 0.14),
    ),
    undefined,
  );

  const concave: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 0, z: 0.3 },
    { x: 0.3, y: 0, z: 0.3 },
    { x: 0.3, y: 0, z: 1 },
    { x: 0, y: 0, z: 1 },
  ];
  TestValidator.equals(
    "a concave face leaves a cutout clear",
    AutoMovieEnginePhysics.physicalShapeFaceContact(
      IDENTITY,
      { ...sphere, radius: 0.1 },
      IDENTITY,
      concave,
    ),
    undefined,
  );
  const lobe: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContact> =
    AutoMovieEnginePhysics.physicalShapeFaceContact(
      IDENTITY,
      {
        ...sphere,
        radius: 0.1,
        transform: { ...IDENTITY, position: { x: 0.15, y: 0.1, z: 0.5 } },
      },
      IDENTITY,
      concave,
    );
  TestValidator.predicate(
    "one actual concave-face lobe still bears the sphere",
    lobe !== undefined && nclose(lobe.clearance, 0, 1e-12),
  );

  const seam: ReturnType<typeof AutoMovieArchetypeQuadrupedFooting.prepare> =
    AutoMovieArchetypeQuadrupedFooting.prepare(
      "fixture",
      {
        planes: [
          {
            id: "west",
            origin: IDENTITY.position,
            x: [-1, 0],
            z: [-1, 1],
            slope: { x: 0, z: 0 },
          },
          {
            id: "east",
            origin: IDENTITY.position,
            x: [0, 1],
            z: [-1, 1],
            slope: { x: 0, z: 0 },
          },
        ],
      },
      false,
    );
  for (const [x, name] of [
    [0.2, "east"],
    [-0.2, "west"],
    [0, "east"],
    [0.2, "east"],
  ] as const)
    TestValidator.equals(
      "the finite seam has deterministic named ownership",
      seam!.landing({ x, y: 0, z: 0 }, IDENTITY.rotation).surface,
      name,
    );
}

/** A closed rectangle in the fixture's material plane. */
function rectangle(
  x0: number,
  x1: number,
  z0: number,
  z1: number,
): IAutoMovieVector3[] {
  return [
    { x: x0, y: 0, z: z0 },
    { x: x1, y: 0, z: z0 },
    { x: x1, y: 0, z: z1 },
    { x: x0, y: 0, z: z1 },
  ];
}
