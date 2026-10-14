import {
  fluidSurfaceGeometry,
  sampleFluidSpray,
  simulateFluidDomain,
} from "@automovie/engine";
import type {
  AutoMovieGuidePass,
  IAutoMovieFluidDomain,
  IAutoMovieFluidSurface,
  IAutoMovieFluidSurfaceBounds,
} from "@automovie/interface";
import {
  applyRenderMode,
  buildFluidSprayObject,
  buildFluidSurfaceObject,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { flatBasin } from "../internal/fluidFixtures";
import { observeThrownValue } from "../internal/observeThrownValue";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

const pool: (
  overrides?: Partial<IAutoMovieFluidDomain>,
) => IAutoMovieFluidDomain = (
  overrides: Partial<IAutoMovieFluidDomain> = {},
): IAutoMovieFluidDomain =>
  flatBasin({
    columns: 4,
    rows: 4,
    depth: 0.25,
    overrides: {
      id: "atrium-pool",
      sprays: [
        {
          id: "mist",
          column: 1,
          row: 1,
          rate: 8,
          lifetime: 1,
          speed: 2,
          direction: { x: 0, y: 1, z: 0 },
          spread: 0,
          size: 0.05,
          seed: 5,
          maxParticles: 16,
          lodDistance: 10,
        },
      ],
      sources: [
        { id: "jet", column: 1, row: 1, flowRate: 0.05, start: 0, end: null },
      ],
      ...overrides,
    },
  });

const surfaceAt: (
  domain: IAutoMovieFluidDomain,
  step: number,
) => IAutoMovieFluidSurface = (
  domain: IAutoMovieFluidDomain,
  step: number,
): IAutoMovieFluidSurface =>
  fluidSurfaceGeometry({ domain, state: simulateFluidDomain(domain, step) });

/**
 * The Viewer places the Engine's water arrays in a mesh whose material participates in beauty, normal, depth and mask projection. This unit observes CPU-side attributes, material swaps and visibility, without drawing pixels.
 *
 * Structural passes replace the water mesh's material and hide its spray Points. The assertions establish the scene state supplied to a draw, rather than depth values or segmentation coverage.
 *
 * Scenarios:
 *
 * 1. Buffer attributes preserve the Engine's vertex count, index count, first position and each flow X value; the name, step and wet-surface bounding extent remain attached to the projection. Flow Y values are not independently compared here.
 * 2. Flowing mode records flow metadata, while a still surface omits it. The default material's animated ripple appearance is not asserted.
 * 3. Depth, normal and mask replace the material and restore the original; beauty retains it.
 * 4. A structural pass hides the spray and restores its visibility.
 * 5. Updating replaces the attributes on the existing mesh, a drained pool hides it and another domain's surface refuses.
 * 6. Disposal attempts owned geometry and default material independently in that order, preserves borrowed materials and retains original failure causes; events measure public retirement attempts.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds water/spray projections from Engine-derived surface and particle records, updates them and reads real Three attributes, bounds, visibility and disposal events; catches omitted upload fields, wrong pass participation, borrowed-material disposal and geometry failure skipping owned material retirement.
 * @evidence contracts/testing.md#independent-expectations Engine arrays are the reference for Viewer projection, while independent attribute sizes, Float32 tolerance, wet-bound arithmetic and counted disposal events pin adaptation. Matching the solver's output does not independently validate fluid physics, shader appearance or hardware release.
 * @evidence contracts/testing.md#distinguishing-cases Covers wet/drained surfaces, later steps, missing optional buffers, foreign-domain refusal, beauty/structural particle visibility, supplied versus owned materials and single/ordered multiple retirement causes on the same existing owners; constructor rollback and terminal update refusal are outside this contract.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit calls maintained Engine/Viewer source and existing numerical fixtures with CPU-side Three objects; it starts no browser, GPU, worker or process and declares all cases locally.
 */
export function test_viewer_fluid_surface(): void {
  const domain: IAutoMovieFluidDomain = pool();
  const surface: IAutoMovieFluidSurface = surfaceAt(domain, 40);
  const water: ReturnType<typeof buildFluidSurfaceObject> =
    buildFluidSurfaceObject({ surface, mode: "flowing" });
  const plain: ReturnType<typeof buildFluidSurfaceObject> =
    buildFluidSurfaceObject({ surface: surfaceAt(domain, 0) });
  const position:
    | THREE.BufferAttribute<THREE.BufferAttributeEventMap>
    | THREE.InterleavedBufferAttribute =
    water.object.geometry.getAttribute("position");
  const flow:
    | THREE.BufferAttribute<THREE.BufferAttributeEventMap>
    | THREE.InterleavedBufferAttribute =
    water.object.geometry.getAttribute("aFlow");

  TestValidator.equals(
    "the stored mesh attributes preserve the observed Engine surface fields",
    namedFacts([
      ["vertexCount", (): boolean => position.count === 16],
      [
        "indexCount",
        (): boolean =>
          (water.object.geometry.getIndex()?.count ?? 0) ===
          (surface.mesh.indices ?? []).length,
      ],
      [
        "firstPosition",
        (): boolean =>
          nclose(position.getX(0), surface.mesh.positions[0], 1e-6) &&
          nclose(position.getY(0), surface.mesh.positions[1], 1e-6) &&
          nclose(position.getZ(0), surface.mesh.positions[2], 1e-6),
      ],
      ["flowItems", (): boolean => flow.itemSize === 2 && flow.count === 16],
      [
        "flowValues",
        (): boolean =>
          Array.from({ length: 16 }, (_: unknown, at: number): boolean =>
            nclose(flow.getX(at), surface.flow[at * 2], 1e-6),
          ).every(Boolean),
      ],
      [
        "boundsFromEngine",
        (): boolean => {
          const sphere: THREE.Sphere | null =
            water.object.geometry.boundingSphere;
          const bounds: IAutoMovieFluidSurfaceBounds | null = surface.bounds;
          if (sphere === null || bounds === null) return false;
          const min: THREE.Vector3 = new THREE.Vector3(
            bounds.min.x,
            bounds.min.y,
            bounds.min.z,
          );
          const max: THREE.Vector3 = new THREE.Vector3(
            bounds.max.x,
            bounds.max.y,
            bounds.max.z,
          );
          return (
            nclose(sphere.center.x, (bounds.min.x + bounds.max.x) / 2, 1e-9) &&
            nclose(sphere.center.z, (bounds.min.z + bounds.max.z) / 2, 1e-9) &&
            nclose(sphere.radius, min.distanceTo(max) / 2, 1e-9)
          );
        },
      ],
      ["name", (): boolean => water.object.name === "water:atrium-pool"],
      ["domain", (): boolean => water.object.userData.domain === "atrium-pool"],
      ["step", (): boolean => water.object.userData.step === 40],
      ["visible", (): boolean => water.object.visible === true],
      ["flowing", (): boolean => water.object.userData.flowing === true],
      ["notFlowing", (): boolean => plain.object.userData.flowing === false],
    ]),
    {
      vertexCount: true,
      indexCount: true,
      firstPosition: true,
      flowItems: true,
      flowValues: true,
      boundsFromEngine: true,
      name: true,
      domain: true,
      step: true,
      visible: true,
      flowing: true,
      notFlowing: true,
    },
  );

  const spray: ReturnType<typeof buildFluidSprayObject> = buildFluidSprayObject(
    {
      sample: sampleFluidSpray({
        domain,
        state: simulateFluidDomain(domain, 64),
      }),
    },
  );
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  scene.add(water.object);
  scene.add(spray.object);
  const original:
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[] = water.object.material;

  const passes: {
    overridden: boolean;
    sprayHidden: boolean;
    restored: boolean;
    sprayShown: boolean;
  }[] = (["depth", "normal", "mask"] as const).map(
    (
      mode: AutoMovieGuidePass,
    ): {
      overridden: boolean;
      sprayHidden: boolean;
      restored: boolean;
      sprayShown: boolean;
    } => {
      const handle: ReturnType<typeof applyRenderMode> = applyRenderMode(
        scene,
        mode,
      );
      const overridden: boolean = water.object.material !== original;
      const sprayHidden: boolean = spray.object.visible === false;
      handle.restore();
      return {
        overridden,
        sprayHidden,
        restored: water.object.material === original,
        sprayShown: spray.object.visible === true,
      };
    },
  );
  const beauty: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "beauty",
  );
  const untouched: boolean = water.object.material === original;
  beauty.restore();

  TestValidator.equals(
    "the three requested structural modes swap water materials and hide mist",
    namedFacts([
      [
        "overridden",
        (): boolean =>
          passes.every(
            (pass: {
              overridden: boolean;
              sprayHidden: boolean;
              restored: boolean;
              sprayShown: boolean;
            }): boolean => pass.overridden,
          ),
      ],
      [
        "restored",
        (): boolean =>
          passes.every(
            (pass: {
              overridden: boolean;
              sprayHidden: boolean;
              restored: boolean;
              sprayShown: boolean;
            }): boolean => pass.restored,
          ),
      ],
      [
        "sprayHidden",
        (): boolean =>
          passes.every(
            (pass: {
              overridden: boolean;
              sprayHidden: boolean;
              restored: boolean;
              sprayShown: boolean;
            }): boolean => pass.sprayHidden,
          ),
      ],
      [
        "sprayShown",
        (): boolean =>
          passes.every(
            (pass: {
              overridden: boolean;
              sprayHidden: boolean;
              restored: boolean;
              sprayShown: boolean;
            }): boolean => pass.sprayShown,
          ),
      ],
      ["beautyUntouched", (): boolean => untouched],
      ["sprayCount", (): boolean => spray.count() === 8],
      ["sprayName", (): boolean => spray.object.name === "water-spray"],
      ["sprayStep", (): boolean => spray.object.userData.step === 64],
      [
        "sprayAttributes",
        (): boolean =>
          spray.object.geometry.getAttribute("position").count === 8 &&
          spray.object.geometry.getAttribute("aSize").count === 8 &&
          spray.object.geometry.getAttribute("aAge").count === 8,
      ],
    ]),
    {
      overridden: true,
      restored: true,
      sprayHidden: true,
      sprayShown: true,
      beautyUntouched: true,
      sprayCount: true,
      sprayName: true,
      sprayStep: true,
      sprayAttributes: true,
    },
  );

  water.update(surfaceAt(domain, 120));
  const drained: IAutoMovieFluidDomain = pool({
    depth: new Array(16).fill(0),
    sources: [],
  });
  const empty: ReturnType<typeof buildFluidSurfaceObject> =
    buildFluidSurfaceObject({ surface: surfaceAt(drained, 0) });
  const emptySpray: ReturnType<typeof buildFluidSprayObject> =
    buildFluidSprayObject({
      sample: { step: 0, time: 0, particles: [] },
    });
  // `IAutoMovieMesh` allows a normal-less, UV-less, non-indexed surface, so a caller that hands one over must get empty attributes rather than a throw.
  const bare: ReturnType<typeof buildFluidSurfaceObject> =
    buildFluidSurfaceObject({
      surface: {
        domain: "hand-built",
        step: 3,
        mesh: {
          positions: [0, 0, 0],
          normals: null,
          uvs: null,
          indices: null,
          skin: null,
        },
        bounds: null,
        flow: [0, 0],
      },
    });
  TestValidator.equals(
    "a later step replaces attributes on the same mesh and a drained pool is hidden",
    namedFacts([
      ["updatedStep", (): boolean => water.object.userData.step === 120],
      [
        "updatedGeometry",
        (): boolean =>
          water.object.geometry.getAttribute("position").count === 16,
      ],
      ["emptyHidden", (): boolean => empty.object.visible === false],
      [
        "emptyIndices",
        (): boolean => (empty.object.geometry.getIndex()?.count ?? 0) === 0,
      ],
      ["emptySprayHidden", (): boolean => emptySpray.object.visible === false],
      ["emptySprayCount", (): boolean => emptySpray.count() === 0],
      [
        "bareAttributes",
        (): boolean =>
          bare.object.geometry.getAttribute("normal").count === 0 &&
          bare.object.geometry.getAttribute("uv").count === 0 &&
          (bare.object.geometry.getIndex()?.count ?? 0) === 0,
      ],
      ["bareHidden", (): boolean => bare.object.visible === false],
      [
        "bareEmptySphere",
        (): boolean =>
          nclose(bare.object.geometry.boundingSphere?.radius ?? -1, 0, 0),
      ],
      [
        "foreignUpload",
        (): boolean =>
          throwsError(
            (): void => bare.update(surfaceAt(domain, 0)),
            ["hand-built", "atrium-pool"],
          ),
      ],
      ["foreignName", (): boolean => bare.object.name === "water:hand-built"],
    ]),
    {
      updatedStep: true,
      updatedGeometry: true,
      emptyHidden: true,
      emptyIndices: true,
      emptySprayHidden: true,
      emptySprayCount: true,
      bareAttributes: true,
      bareHidden: true,
      bareEmptySphere: true,
      foreignUpload: true,
      foreignName: true,
    },
  );

  let ownedDisposed: number = 0;
  let borrowedDisposed: number = 0;
  (water.object.material as THREE.Material).addEventListener(
    "dispose",
    (): void => {
      ownedDisposed += 1;
    },
  );
  const borrowed: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  borrowed.addEventListener("dispose", (): void => {
    borrowedDisposed += 1;
  });
  const guest: ReturnType<typeof buildFluidSurfaceObject> =
    buildFluidSurfaceObject({
      surface: surfaceAt(domain, 0),
      material: borrowed,
    });
  const borrowedPoints: THREE.PointsMaterial = new THREE.PointsMaterial();
  let borrowedPointsDisposed: number = 0;
  borrowedPoints.addEventListener("dispose", (): void => {
    borrowedPointsDisposed += 1;
  });
  const guestSpray: ReturnType<typeof buildFluidSprayObject> =
    buildFluidSprayObject({
      sample: sampleFluidSpray({
        domain,
        state: simulateFluidDomain(domain, 64),
      }),
      material: borrowedPoints,
    });
  const waterGeometryFailure: Error = new Error(
    "Water geometry retirement listener refused.",
  );
  const sprayGeometryFailure: Error = new Error(
    "Spray geometry retirement listener refused.",
  );
  const sprayMaterialFailure: Error = new Error(
    "Spray material retirement listener refused.",
  );
  const retirementOrder: string[] = [];
  water.object.geometry.addEventListener("dispose", (): never => {
    retirementOrder.push("water geometry");
    throw waterGeometryFailure;
  });
  (water.object.material as THREE.Material).addEventListener(
    "dispose",
    (): void => {
      retirementOrder.push("water material");
    },
  );
  spray.object.geometry.addEventListener("dispose", (): never => {
    retirementOrder.push("spray geometry");
    throw sprayGeometryFailure;
  });
  (spray.object.material as THREE.PointsMaterial).addEventListener(
    "dispose",
    (): never => {
      retirementOrder.push("spray material");
      throw sprayMaterialFailure;
    },
  );
  const waterRetirement: ReturnType<typeof observeThrownValue> =
    observeThrownValue((): void => water.dispose());
  guest.dispose();
  guestSpray.dispose();
  const sprayRetirement: ReturnType<typeof observeThrownValue> =
    observeThrownValue((): void => spray.dispose());
  empty.dispose();
  emptySpray.dispose();
  plain.dispose();
  bare.dispose();
  TestValidator.equals(
    "geometry failure still attempts each default-owned material once in order",
    retirementOrder,
    ["water geometry", "water material", "spray geometry", "spray material"],
  );
  TestValidator.predicate(
    "one retirement cause retains its actual original object",
    waterRetirement.threw && waterRetirement.error === waterGeometryFailure,
  );
  TestValidator.predicate(
    "independent spray failures retain their original order",
    sprayRetirement.threw &&
      sprayRetirement.error instanceof AggregateError &&
      sprayRetirement.error.errors.length === 2 &&
      sprayRetirement.error.errors[0] === sprayGeometryFailure &&
      sprayRetirement.error.errors[1] === sprayMaterialFailure,
  );
  TestValidator.equals(
    "disposal attempts the owned material and leaves supplied materials borrowed",
    namedFacts([
      ["ownedDisposed", (): boolean => ownedDisposed === 1],
      ["borrowedKept", (): boolean => borrowedDisposed === 0],
      ["borrowedInUse", (): boolean => guest.object.material === borrowed],
      ["borrowedPointsKept", (): boolean => borrowedPointsDisposed === 0],
      [
        "borrowedPointsInUse",
        (): boolean => guestSpray.object.material === borrowedPoints,
      ],
    ]),
    {
      ownedDisposed: true,
      borrowedKept: true,
      borrowedInUse: true,
      borrowedPointsKept: true,
      borrowedPointsInUse: true,
    },
  );
}
