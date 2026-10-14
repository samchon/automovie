import type { IAutoMovieMeshGeometry } from "@automovie/interface";

/**
 * The mesh payload of a face part whose vertex colours can be folded into
 * its material. No geometry discriminator is required by this colour stage;
 * the caller retains the original mesh and its mutable colour buffer.
 *
 * @evidence contracts/common.md#principled-implementation Picking the mesh payload preserves resident geometry and optional RGB multipliers consumed by liftHumanFaceColours.
 * @evidence contracts/common.md#clear-and-simple-design The colour stage needs mesh buffers, so it requires no geometry discriminator or unrelated part fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This view neither converts geometry nor claims immutable colours; the folding owner mutates only caller-owned colour/material channels.
 * @evidence contracts/common.md#meaningful-documentation Prose states payload purpose, discriminator omission and caller ownership of mutable colours.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type performs no colour scan; liftHumanFaceColours owns buffer traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This view schedules no work; folding reuses each material's shared maximum channel gain.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased view acquires no resource; original part buffers remain caller-owned.
 *
 * @author Samchon
 */
export type IHumanFaceColourMesh = Pick<IAutoMovieMeshGeometry, "mesh">;
