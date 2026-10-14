import { selectFormationLod, srgbHexToLinearColor } from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieCompiledFormationLod,
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieDeliveryCrop,
  IAutoMovieInstanceChunk,
  IAutoMovieInstanceSlot,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import type { IAutoMovieInstanceSetViewerObject } from "./IAutoMovieInstanceSetViewerObject.js";
import type { IAutoMovieInstanceSetViewerStats } from "./IAutoMovieInstanceSetViewerStats.js";
import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation.js";
import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import type { IBuildInstancedInstanceSetProps } from "./IBuildInstancedInstanceSetProps.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";
import { readAutoMovieDeliveryCrop } from "./deliveryCrop.js";
import {
  flattenInstancedModel,
  flattenInstancedObject,
} from "./formation/index.js";
import { regenerateInstanceSlot } from "./regenerateInstanceSlot.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/**
 * One chunk's prototype tier meshes and the hysteretic tier selected by its last update.
 *
 * @author Samchon
 */
interface IInstancePrototypeChunkObject {
  /** Supplied unscaled prototype radius estimate used by projected-size LOD. */
  projectionRadius: number;

  /** Visible authored slots assigned to this prototype in the chunk. */
  count: number;

  /** Compiled tier policy read by the existing selector. */
  lod: IAutoMovieCompiledInstanceSet["lod"];

  /** Chunk-owned meshes toggled in place when the selected tier changes. */
  tiers: Map<IAutoMovieCompiledFormationLod["tier"], THREE.InstancedMesh>;

  /** Previous selected tier for hysteresis; null before the first update. */
  selected: IAutoMovieCompiledFormationLod["tier"] | null;
}

/**
 * One flattened prototype tier ready to be cloned into a chunk batch.
 *
 * @author Samchon
 */
interface IInstanceRepresentation {
  /** Flattened rest geometry cloned separately for each chunk batch. */
  geometry: THREE.BufferGeometry;

  /** Owned instance-only materials shared by the prototype's chunk meshes. */
  materials: THREE.Material[];
}

/**
 * One compiled chunk and its persistent prototype visibility state.
 *
 * @author Samchon
 */
interface IInstanceChunkObject {
  /** Immutable compiled member span, bounds and centroid. */
  runtime: IAutoMovieCompiledInstanceSet["chunks"][number];

  /** Metre radius of the chunk's slot-origin bounds before prototype enlargement. */
  radius: number;

  /** Chunk-owned tier meshes and selection state, updated in the existing order. */
  prototypes: IInstancePrototypeChunkObject[];
}

/**
 * Build one non-formation crowd, vegetation, prop, facade, or ornament set.
 *
 * Matrices, colors, scales, and numeric trait attributes are regenerated from
 * compact runtime data. No slot is promoted into a scene node: a set of a
 * hundred thousand members holds one batch per chunk, prototype and LOD tier,
 * and each member costs one instance matrix rather than one object.
 *
 * A prototype is either the builder's generated recipe or a host-loaded
 * object; passing `prototypeObjects` is what lets a registered static glTF be
 * the prototype, and it is flattened by the same rigid path a generated recipe
 * takes. Rigid is the whole condition: a skinned, morphed, or multi-material
 * source mesh is refused by name rather than instanced as something else.
 * Generated prototype materials are owned and reused as white instance-only
 * variants; loaded prototype materials are borrowed and cloned before whitening.
 *
 * The Medieval Manor's createManorInstanceConsumer calls this builder during scene assembly and supplies a camera-update route. Its website also bakes supported meshes before mounting; this source connection establishes neither an observed instanced frame nor compiled-shot capture integration.
 *
 * @evidence contracts/common.md#principled-implementation Regenerates seeded compact slots, admitted static prototypes, scales/traits and sRGB-decoded palettes, then uses engine crop-aware culling/LOD with native instance matrices; rigid representation requirements and finite admitted transforms are premises. Supplied projection-radius estimates drive culling and projected size; coverage of mesh offsets and depth remains a producer premise, and fixed radius/depth floors do not independently certify containment.
 * @evidence contracts/common.md#clear-and-simple-design Separates prototype-id and tier keys, one shared flattened representation per pair and chunk-owned instance buffers; generated materials stay owned while borrowed loaded materials receive white clones. The Manor assembly consumes the result through its existing instance consumer, while website baking and final draw/capture observations have their own owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual seeded slots/prototypes and standard sRGB transfer determine transforms/colors, with no global ColorManagement mutation, fixture colors or hidden placeholder prototype; unsupported skin/morph/multi-material sources refuse instead of appearing frozen.
 * @evidence contracts/common.md#meaningful-documentation Gives compact population purpose, supported prototype boundary, loaded/generated ownership, regenerated attribute/color roles and the existing Manor assembly connection, without certifying actual raster or compiled-shot delivery from constructor reach.
 * @evidence contracts/performance.md#efficient-algorithms Regenerates N slots and filters them by P prototypes per chunk, then fills matrices/colors/traits across resident LOD tiers; construction is O(N*P plus resident buffer filling/prototype flattening), update visits chunk/prototype tiers and scans supported visibility state without creating member objects. Buffers grow with admitted members times resident tiers and authored trait count.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares flattened geometry and instance-only materials by prototype/tier, decoded swatches by exact authored palette string and resident meshes/hysteresis across updates; separate prototype identities retain distinct geometry and mutable per-runtime retirement state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Construction scope registers prototype/chunk geometry, owned generated or cloned materials and native instance meshes from acquisition; refusal independently rolls back them while loaded sources/textures remain borrowed. Returned dispose closes updates, deduplicates/attempts all resources once, clears healthy registries and retains failure/operation references for uncertain retirement until owner lifetime ends.
 */
export const buildInstancedInstanceSet: (
  input: IBuildInstancedInstanceSetProps,
) => IAutoMovieInstanceSetViewerObject = (
  input: IBuildInstancedInstanceSetProps,
): IAutoMovieInstanceSetViewerObject => {
  return constructAutoMovieOwnedResources(
    (
      own: <Resource extends { dispose(): void }>(
        resource: Resource,
      ) => Resource,
    ): IAutoMovieInstanceSetViewerObject => {
      const root: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
      // One decoded carrier per authored swatch. `setColorAt` copies its
      // components, and a block may hold a hundred thousand slots, so neither the
      // transfer function nor its temporary label belongs in the per-slot cost.
      const paletteColors: Map<string, THREE.Color> = new Map<
        string,
        THREE.Color
      >();
      root.name = `instance-set:${input.instanceSet.id}`;
      root.position.copy(vector(input.instanceSet.anchor));
      const prototypes: IAutoMovieCompiledInstancePrototype[] = input
        .instanceSet.prototypes ?? [
        {
          id: "default",
          modelRecipe: input.instanceSet.modelRecipe,
          weight: 1,
          lod: input.instanceSet.lod,
          projectionRadius: input.instanceSet.projectionRadius,
        },
      ];
      // Keyed by prototype and then by tier rather than by one joined string: a
      // prototype id is author-owned text, so `"panel:near"` and a `"panel"` tier
      // named `"near"` would otherwise be the same entry and one prototype would
      // silently draw the other's geometry.
      const representations: Map<
        string,
        Map<"hero" | "near" | "far", IInstanceRepresentation>
      > = new Map<
        string,
        Map<IAutoMovieCompiledFormationLod["tier"], IInstanceRepresentation>
      >(
        prototypes.map(
          (
            prototype: IAutoMovieCompiledInstancePrototype,
          ): [
            string,
            Map<
              IAutoMovieCompiledFormationLod["tier"],
              IInstanceRepresentation
            >,
          ] => [
            prototype.id,
            new Map(
              prototype.lod.map(
                (
                  lod: IAutoMovieCompiledFormationLod,
                ): readonly [
                  IAutoMovieCompiledFormationLod["tier"],
                  IInstanceRepresentation,
                ] => {
                  const model: IAutoMovieModel | undefined = input.models.get(
                    lod.model,
                  );
                  if (model === undefined)
                    throw new Error(
                      `Instance set "${input.instanceSet.id}" prototype "${prototype.id}" LOD "${lod.tier}" references missing runtime model "${lod.model}".`,
                    );
                  const owner: string = `Instance set "${input.instanceSet.id}" prototype "${prototype.id}" LOD "${lod.tier}"`;
                  const loaded: IAutoMovieModelObject | undefined =
                    input.prototypeObjects?.get(lod.model);
                  const representation: IAutoMovieInstancedModelRepresentation<IAutoMovieFormationCycle | null> =
                    loaded === undefined
                      ? flattenInstancedModel(model, owner)
                      : flattenInstancedObject(loaded, owner);
                  own(representation.geometry);
                  if (loaded === undefined)
                    for (const material of representation.materials)
                      own(material);
                  return [
                    lod.tier,
                    {
                      geometry: representation.geometry,
                      materials: representation.materials.map(
                        (material: THREE.Material): THREE.Material =>
                          own(
                            exactPaletteMaterial(
                              material,
                              loaded !== undefined,
                            ),
                          ),
                      ),
                    },
                  ] as const;
                },
              ),
            ),
          ],
        ),
      );
      // The largest axis scale any slot of this set can reach, measured once. It is
      // read for every chunk of every frame, and an explicit block may hold a
      // hundred thousand transforms, so measuring it per frame would both cost the
      // set's own size each frame and blow the argument limit of a spread.
      const maximumScale: number = maximumInstanceScale(input.instanceSet);
      const traitNames: string[] = input.instanceSet.variation.traits.map(
        (trait: { name: string; min: number; max: number }): string =>
          trait.name,
      );
      const chunks: IInstanceChunkObject[] = input.instanceSet.chunks.map(
        (chunk: IAutoMovieInstanceChunk): IInstanceChunkObject => {
          const slots: IAutoMovieInstanceSlot[] = Array.from(
            { length: chunk.count },
            (_: unknown, index: number): IAutoMovieInstanceSlot =>
              regenerateInstanceSlot(input.instanceSet, chunk.start + index),
          );
          const visibleSlots: IAutoMovieInstanceSlot[] = slots.filter(
            (slot: IAutoMovieInstanceSlot): boolean => slot.visible !== false,
          );
          const prototypeObjects: IInstancePrototypeChunkObject[] =
            prototypes.flatMap(
              (
                prototype: IAutoMovieCompiledInstancePrototype,
              ): IInstancePrototypeChunkObject[] => {
                const selectedSlots: IAutoMovieInstanceSlot[] =
                  visibleSlots.filter(
                    (slot: IAutoMovieInstanceSlot): boolean =>
                      (slot.prototype ?? "default") === prototype.id,
                  );
                if (selectedSlots.length === 0) return [];
                const tiers: Map<
                  "hero" | "near" | "far",
                  THREE.InstancedMesh<
                    THREE.BufferGeometry<
                      THREE.NormalBufferAttributes,
                      THREE.BufferGeometryEventMap
                    >,
                    | THREE.Material<THREE.MaterialEventMap>
                    | THREE.Material<THREE.MaterialEventMap>[],
                    THREE.Object3DEventMap
                  >
                > = new Map<
                  IAutoMovieCompiledFormationLod["tier"],
                  THREE.InstancedMesh
                >();
                const tierRepresentations: Map<
                  "hero" | "near" | "far",
                  IInstanceRepresentation
                > = representations.get(prototype.id)!;
                for (const lod of prototype.lod) {
                  const representation: IInstanceRepresentation =
                    tierRepresentations.get(lod.tier)!;
                  const geometry: THREE.BufferGeometry<
                    THREE.NormalBufferAttributes,
                    THREE.BufferGeometryEventMap
                  > = own(representation.geometry.clone());
                  for (const [traitIndex, traitName] of traitNames.entries())
                    geometry.setAttribute(
                      `automovieTrait${traitIndex}`,
                      new THREE.InstancedBufferAttribute(
                        // Every declared trait is regenerated for every slot, so a
                        // declared name always names a value on the slot it came from.
                        new Float32Array(
                          selectedSlots.map(
                            (slot: IAutoMovieInstanceSlot): number =>
                              slot.traits[traitName]!,
                          ),
                        ),
                        1,
                      ),
                    );
                  const mesh: THREE.InstancedMesh<
                    THREE.BufferGeometry<
                      THREE.NormalBufferAttributes,
                      THREE.BufferGeometryEventMap
                    >,
                    THREE.Material<THREE.MaterialEventMap>[],
                    THREE.Object3DEventMap
                  > = own(
                    new THREE.InstancedMesh(
                      geometry,
                      representation.materials,
                      selectedSlots.length,
                    ),
                  );
                  mesh.name = `${input.instanceSet.id}:${chunk.index}:${prototype.id}:${lod.tier}`;
                  mesh.userData.automovieTraitNames = [...traitNames];
                  mesh.userData.automoviePrototype = prototype.id;
                  mesh.userData.automovieSlots = selectedSlots.map(
                    (slot: IAutoMovieInstanceSlot): number => slot.slot,
                  );
                  selectedSlots.forEach(
                    (slot: IAutoMovieInstanceSlot, index: number): void => {
                      mesh.setMatrixAt(
                        index,
                        instanceMatrix(slot, input.instanceSet.anchor),
                      );
                      // A palette entry is an sRGB swatch, so it is decoded here by the
                      // engine's own transfer function rather than by handing the string
                      // to `THREE.Color`. Both decodes agree to every bit this attribute
                      // can hold, but three's runs only while the global
                      // `ColorManagement.enabled` is true, and a host that switches it
                      // off would silently brighten every instanced set while materials
                      // built from an `IAutoMovieColor` triple stayed where they were.
                      // Decoding explicitly is also what makes the two authoring paths
                      // one conversion: the builder decodes a recipe palette with this
                      // same function on its way into `baseColor`.
                      let paint: THREE.Color | undefined = paletteColors.get(
                        slot.palette,
                      );
                      if (paint === undefined) {
                        const linear: IAutoMovieColor = srgbHexToLinearColor(
                          slot.palette,
                        );
                        paint = new THREE.Color(linear.r, linear.g, linear.b);
                        paletteColors.set(slot.palette, paint);
                      }
                      mesh.setColorAt(index, paint);
                    },
                  );
                  mesh.instanceMatrix.needsUpdate = true;
                  // A batch is only built for a prototype that owns at least one slot,
                  // so `setColorAt` above has already allocated the color attribute.
                  mesh.instanceColor!.needsUpdate = true;
                  mesh.computeBoundingBox();
                  mesh.computeBoundingSphere();
                  mesh.frustumCulled = false;
                  mesh.visible = false;
                  root.add(mesh);
                  tiers.set(lod.tier, mesh);
                }
                return [
                  {
                    projectionRadius: prototype.projectionRadius,
                    count: selectedSlots.length,
                    lod: prototype.lod,
                    tiers,
                    selected: null,
                  },
                ];
              },
            );
          return {
            runtime: chunk,
            radius: boundsRadius(chunk.bounds, chunk.centroid),
            prototypes: prototypeObjects,
          };
        },
      );
      const drawn: number = chunks.reduce(
        (count: number, chunk: IInstanceChunkObject): number =>
          count +
          chunk.prototypes.reduce(
            (
              prototypeCount: number,
              prototype: IInstancePrototypeChunkObject,
            ): number => prototypeCount + prototype.count,
            0,
          ),
        0,
      );
      const stats: IAutoMovieInstanceSetViewerStats = {
        visible: { hero: 0, near: 0, far: 0 },
        culled: 0,
        hidden: input.instanceSet.count - drawn,
      };
      let disposed: boolean = false;
      let disposalFailure: { error: unknown } | undefined;
      let retirements: (() => void)[] | undefined;
      return {
        object: root,
        stats,
        dispose(): void {
          if (disposed) {
            if (disposalFailure !== undefined) throw disposalFailure.error;
            return;
          }
          disposed = true;
          const geometries: Set<THREE.BufferGeometry> =
            new Set<THREE.BufferGeometry>();
          const materials: Set<THREE.Material> = new Set<THREE.Material>();
          const meshes: Set<THREE.InstancedMesh> =
            new Set<THREE.InstancedMesh>();
          for (const chunk of chunks)
            for (const prototype of chunk.prototypes)
              for (const mesh of prototype.tiers.values()) {
                geometries.add(mesh.geometry);
                meshes.add(mesh);
              }
          for (const tiers of representations.values())
            for (const representation of tiers.values()) {
              geometries.add(representation.geometry);
              for (const material of representation.materials)
                materials.add(material);
            }
          retirements = [
            (): void => {
              root.removeFromParent();
            },
            ...[...geometries].map(
              (geometry: THREE.BufferGeometry): (() => void) =>
                (): void =>
                  geometry.dispose(),
            ),
            ...[...meshes].map(
              (mesh: THREE.InstancedMesh): (() => void) =>
                (): void =>
                  mesh.dispose(),
            ),
            ...[...materials].map(
              (material: THREE.Material): (() => void) =>
                (): void =>
                  material.dispose(),
            ),
            (): void => {
              root.clear();
            },
          ];
          try {
            reportAutoMovieResourceRetirement(retirements);
            chunks.length = 0;
            representations.clear();
            paletteColors.clear();
            retirements = undefined;
          } catch (error) {
            disposalFailure = { error };
            throw error;
          }
        },
        update(camera: THREE.PerspectiveCamera, viewportHeight: number): void {
          if (disposed)
            throw new Error(
              `Instance set "${input.instanceSet.id}" is disposed.`,
            );
          stats.visible = { hero: 0, near: 0, far: 0 };
          stats.culled = 0;
          root.updateMatrixWorld(true);
          camera.updateMatrixWorld(true);
          camera.updateProjectionMatrix();
          const projection: THREE.Matrix4 =
            new THREE.Matrix4().multiplyMatrices(
              camera.projectionMatrix,
              camera.matrixWorldInverse,
            );
          const frustum: THREE.Frustum =
            new THREE.Frustum().setFromProjectionMatrix(projection);
          const cameraPosition: THREE.Vector3 = new THREE.Vector3();
          camera.getWorldPosition(cameraPosition);
          const halfY: number = Math.tan(
            THREE.MathUtils.degToRad(camera.fov) / 2,
          );
          const deliveryCrop: IAutoMovieDeliveryCrop | undefined =
            readAutoMovieDeliveryCrop(camera);
          const effectiveHalfY: number =
            halfY *
            (deliveryCrop === undefined
              ? 1
              : deliveryCrop.bottom - deliveryCrop.top);
          for (const chunk of chunks) {
            const center: THREE.Vector3 = root.localToWorld(
              new THREE.Vector3(
                chunk.runtime.centroid.x - input.instanceSet.anchor.x,
                chunk.runtime.centroid.y - input.instanceSet.anchor.y,
                chunk.runtime.centroid.z - input.instanceSet.anchor.z,
              ),
            );
            // Chunk bounds describe slot origins. Expand their sphere by the
            // supplied projection-radius estimate times the largest slot scale.
            // Containment requires that estimate to cover the prototype's offsets
            // and depth; a fallback estimate cannot independently guarantee that
            // a rotated or scaled near-frustum instance remains visible.
            const sphere: THREE.Sphere = new THREE.Sphere(
              center,
              chunk.radius + input.instanceSet.projectionRadius * maximumScale,
            );
            if (frustum.intersectsSphere(sphere) === false) {
              for (const prototype of chunk.prototypes)
                for (const mesh of prototype.tiers.values())
                  mesh.visible = false;
              stats.culled += chunk.prototypes.reduce(
                (
                  count: number,
                  prototype: IInstancePrototypeChunkObject,
                ): number => count + prototype.count,
                0,
              );
              continue;
            }
            const distance: number = Math.max(
              0.001,
              cameraPosition.distanceTo(center),
            );
            const cameraDepth: number = Math.max(
              0.001,
              -center.clone().applyMatrix4(camera.matrixWorldInverse).z,
            );
            for (const prototype of chunk.prototypes) {
              const projectedPixels: number =
                (prototype.projectionRadius * maximumScale * viewportHeight) /
                (effectiveHalfY * cameraDepth);
              const selected: IAutoMovieCompiledFormationLod =
                selectFormationLod({
                  lod: prototype.lod,
                  distance,
                  projectedPixels,
                  previous: prototype.selected,
                }).lod;
              prototype.selected = selected.tier;
              for (const [tier, mesh] of prototype.tiers)
                mesh.visible = tier === selected.tier;
              stats.visible[selected.tier] += prototype.count;
            }
          }
        },
      };
    },
  );
};

const instanceMatrix: (
  slot: IAutoMovieInstanceSlot,
  anchor: IAutoMovieCompiledInstanceSet["anchor"],
) => THREE.Matrix4 = (
  slot: IAutoMovieInstanceSlot,
  anchor: IAutoMovieCompiledInstanceSet["anchor"],
): THREE.Matrix4 =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(
      slot.position.x - anchor.x,
      slot.position.y - anchor.y,
      slot.position.z - anchor.z,
    ),
    slot.rotation === undefined
      ? new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          instanceHeadingRadians(slot.facingDeg),
        )
      : new THREE.Quaternion(
          slot.rotation.x,
          slot.rotation.y,
          slot.rotation.z,
          slot.rotation.w,
        ),
    slot.scale3 === undefined
      ? new THREE.Vector3(slot.scale, slot.scale, slot.scale)
      : vector(slot.scale3),
  );

/**
 * The largest axis scale any slot of one set can reach.
 *
 * An explicit block states each slot's scale outright, so its own transforms
 * are the answer and the seeded ranges never apply. The reduction is a loop
 * rather than a spread because a set may declare a hundred thousand explicit
 * transforms, and spreading three hundred thousand arguments into `Math.max`
 * exceeds the engine's argument limit and throws instead of measuring.
 */
const maximumInstanceScale: (
  instanceSet: IAutoMovieCompiledInstanceSet,
) => number = (instanceSet: IAutoMovieCompiledInstanceSet): number => {
  if (instanceSet.layout.kind === "explicit") {
    let maximum: number = Number.EPSILON;
    for (const transform of instanceSet.layout.transforms)
      maximum = Math.max(
        maximum,
        transform.scale.x,
        transform.scale.y,
        transform.scale.z,
      );
    return maximum;
  }
  const range: { min: IAutoMovieVector3; max: IAutoMovieVector3 } | undefined =
    instanceSet.variation.scale3;
  return range === undefined
    ? instanceSet.variation.scale.max
    : Math.max(range.max.x, range.max.y, range.max.z);
};

const boundsRadius: (
  bounds: IAutoMovieCompiledInstanceSet["bounds"],
  centroid: IAutoMovieCompiledInstanceSet["centroid"],
) => number = (
  bounds: IAutoMovieCompiledInstanceSet["bounds"],
  centroid: IAutoMovieCompiledInstanceSet["centroid"],
): number =>
  Math.max(
    0.01,
    ...[bounds.min.x, bounds.max.x].flatMap((x: number): number[] =>
      [bounds.min.y, bounds.max.y].flatMap((y: number): number[] =>
        [bounds.min.z, bounds.max.z].map((z: number): number =>
          Math.hypot(x - centroid.x, y - centroid.y, z - centroid.z),
        ),
      ),
    ),
  );

/**
 * One instance set's base heading in radians, to the last bit.
 *
 * Not `THREE.MathUtils.degToRad`. That multiplies by a rounded `PI / 180`,
 * while the engine divides by 180 after multiplying by `Math.PI`, and the two
 * disagree in the final ulp for a great many headings. A member of a set that
 * declares no rotation carries no quaternion, so its batch matrix is turned by
 * this heading, which has to be the one the engine placed the member with
 * rather than a neighbouring double.
 */
const instanceHeadingRadians: (facingDeg: number) => number = (
  facingDeg: number,
): number => (facingDeg * Math.PI) / 180;

const vector: (value: IAutoMovieVector3) => THREE.Vector3 = (
  value: IAutoMovieVector3,
): THREE.Vector3 => new THREE.Vector3(value.x, value.y, value.z);

/**
 * Instance colors multiply the material's diffuse color in Three.js. General
 * instance palettes are exact overrides, so instance-only materials use
 * white as the neutral multiplier while retaining roughness and other
 * channels.
 */
const exactPaletteMaterial: (
  material: THREE.Material,
  borrowed: boolean,
) => THREE.Material = (
  material: THREE.Material,
  borrowed: boolean,
): THREE.Material => {
  // A three.js material either carries a diffuse `color` or has none at all;
  // there is no third state to test for, so the presence of the channel is the
  // whole question.
  const clone: THREE.Material<THREE.MaterialEventMap> &
    Partial<Pick<THREE.MeshStandardMaterial, "color">> = (
    borrowed ? material.clone() : material
  ) as THREE.Material & Partial<Pick<THREE.MeshStandardMaterial, "color">>;
  clone.color?.set(0xffffff);
  return clone;
};
