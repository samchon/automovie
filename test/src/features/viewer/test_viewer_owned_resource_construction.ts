import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  type IAutoMovieModelObject,
  buildGeometry,
  buildMaterial,
  buildModel,
} from "@automovie/viewer";
import { constructAutoMovieOwnedResources } from "@automovie/viewer/constructAutoMovieOwnedResources";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import {
  boxModel,
  material as materialDefinition,
} from "../internal/renderFixtures";

/**
 * Owned-resource construction registers every resource a producer acquires, rolls them back independently when the producer fails, and hands them to the caller when it succeeds. The material and model producers built on it refuse a native cache-copy failure without partial output. Public dispose events count attempts, not physical GPU release.
 *
 * Scenarios:
 * 1. Producer initialization registers geometry, material and skeleton before a later failure; rollback attempts each distinct resource once and keeps the initialization cause before the rollback failure.
 * 2. A successful producer transfers the actual resource identity without retiring it, and a failure before any allocation keeps its original identity.
 * 3. The material and model producers preserve a native texture cache-copy refusal, then build the normal part population once the metadata is ordinary; the geometry producer keeps its position attribute.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the actual owned-resource constructor and the material, model and geometry producers with real dispose listeners and a real texture cache; catches partial rollback, repeated disposal of a shared resource, premature retirement of a transferred resource and a swallowed cache-copy failure.
 * @evidence contracts/testing.md#independent-expectations The initialization-before-cleanup cause order, one dispose event per distinct owner and the identity of the transferred resource are observed independently of the constructor; the native cache-copy failure is the getter's own Error instance.
 * @evidence contracts/testing.md#distinguishing-cases Covers failure after duplicate and distinct acquisitions, success, failure before acquisition, nested material and model cache-copy refusal and a repaired cache.
 * @evidence contracts/testing.md#execution-ownership The asynchronous unit imports maintained source directly and owns its local resources; it launches no renderer, browser, worker or process and registers no dynamic tests.
 */
export async function test_viewer_owned_resource_construction(): Promise<void> {
  const caught: (operation: () => void) => unknown = (
    operation: () => void,
  ): unknown => {
    try {
      operation();
      return undefined;
    } catch (error) {
      return error;
    }
  };
  const image: THREE.DataTexture = new THREE.DataTexture(
    new Uint8Array(4),
    1,
    1,
  );
  const initialization: Error = new Error("owned producer initialization");
  const cleanupFailure: Error = new Error("owned producer rollback");
  const geometryOwned: THREE.BoxGeometry = new THREE.BoxGeometry();
  const materialOwned: THREE.MeshStandardMaterial =
    new THREE.MeshStandardMaterial({ map: image });
  const skeletonOwned: THREE.Skeleton = new THREE.Skeleton([new THREE.Bone()]);
  skeletonOwned.computeBoneTexture();
  const boneTexture: THREE.DataTexture = skeletonOwned.boneTexture!;
  const producerAttempts: string[] = [];
  geometryOwned.addEventListener("dispose", (): never => {
    producerAttempts.push("geometry");
    throw cleanupFailure;
  });
  materialOwned.addEventListener("dispose", (): void => {
    producerAttempts.push("material");
  });
  boneTexture.addEventListener("dispose", (): void => {
    producerAttempts.push("skeleton-table");
  });
  const rollbackFailure: unknown = caught((): never =>
    constructAutoMovieOwnedResources(
      (
        own: <Resource extends { dispose(): void }>(
          resource: Resource,
        ) => Resource,
      ): never => {
        own(geometryOwned);
        own(geometryOwned);
        own(materialOwned);
        own(skeletonOwned);
        throw initialization;
      },
    ),
  );
  TestValidator.predicate(
    "producer preserves initialization before independent rollback failures",
    rollbackFailure instanceof AggregateError &&
      rollbackFailure.errors.length === 2 &&
      rollbackFailure.errors[0] === initialization &&
      rollbackFailure.errors[1] === cleanupFailure,
  );
  TestValidator.equals(
    "producer rollback attempts each distinct owned resource once",
    producerAttempts,
    ["geometry", "material", "skeleton-table"],
  );
  const transferred: THREE.BoxGeometry = new THREE.BoxGeometry();
  let transferredAttempts: number = 0;
  transferred.addEventListener("dispose", (): void => {
    transferredAttempts++;
  });
  TestValidator.predicate(
    "successful producer transfers actual resource identity",
    constructAutoMovieOwnedResources(
      (
        own: <Resource extends { dispose(): void }>(
          resource: Resource,
        ) => Resource,
      ): THREE.BoxGeometry => own(transferred),
    ) === transferred,
  );
  TestValidator.equals(
    "successful construction does not prematurely retire",
    transferredAttempts,
    0,
  );
  transferred.dispose();
  TestValidator.predicate(
    "failure before any allocation preserves original identity",
    caught((): never =>
      constructAutoMovieOwnedResources((): never => {
        throw initialization;
      }),
    ) === initialization,
  );

  const original: THREE.DataTexture = new THREE.DataTexture(
    new Uint8Array(4),
    1,
    1,
  );
  const nativeCopyFailure: Error = new Error("native Texture.copy metadata");
  original.userData = {
    get record(): void {
      throw nativeCopyFailure;
    },
  };
  const cache: AutoMovieTextureCache = new AutoMovieTextureCache(
    async (): Promise<THREE.DataTexture> => original,
  );
  await cache.prime(["producer-image"]);
  const textured: IAutoMovieMaterial = materialDefinition(
    "finish",
    "producer-image",
  );
  const model: IAutoMovieModel = boxModel({
    id: "generic-box-producer",
    materials: [textured],
  });
  TestValidator.predicate(
    "actual material producer preserves native cache-copy refusal",
    caught((): void => {
      buildMaterial(textured, cache.resolve);
    }) === nativeCopyFailure,
  );
  TestValidator.predicate(
    "actual model producer preserves nested native cache-copy refusal",
    caught((): void => {
      buildModel(model, cache.resolve);
    }) === nativeCopyFailure,
  );
  original.userData = { record: "ordinary metadata" };
  const repaired: IAutoMovieModelObject = buildModel(model, cache.resolve);
  TestValidator.equals(
    "supported adjacent producer retains its normal part population",
    repaired.parts.size,
    model.parts.length,
  );
  const returned: Set<{ dispose(): void }> = new Set<{ dispose(): void }>();
  repaired.object.traverse(
    (object: THREE.Object3D<THREE.Object3DEventMap>): void => {
      if (object instanceof THREE.Mesh) {
        returned.add(object.geometry);
        for (const finish of Array.isArray(object.material)
          ? object.material
          : [object.material])
          returned.add(finish);
      }
    },
  );
  for (const resource of returned) resource.dispose();
  await cache.dispose();
  const ordinaryGeometry: THREE.BufferGeometry<
    THREE.NormalBufferAttributes,
    THREE.BufferGeometryEventMap
  > = buildGeometry(model.parts[0].geometry);
  TestValidator.predicate(
    "normal geometry producer keeps its actual position attribute",
    ordinaryGeometry.hasAttribute("position"),
  );
  ordinaryGeometry.dispose();
  image.dispose();
}
