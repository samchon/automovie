import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceMaterialAttachment } from "../structures/IHumanFaceMaterialAttachment";
import type { IHumanFaceLipMarginPoints } from "./IHumanFaceLipMarginPoints";
import type { IHumanFaceLipPhysicalSources } from "./IHumanFaceLipPhysicalSources";

/**
 * Register both native lip courses as physical source points for one instance.
 * Native vertices keep their existing canonical skin IDs. Nonvertex seats use
 * a separate material domain and ordinals of all exact identities in sorted
 * order. Sorting assigns IDs only: original parent/coefficient order remains
 * untouched for the engine's represented interpolation on final Person skin.
 * A shared-edge exact identity can have two zero-weight third corners; the
 * first source course witness supplies its original represented triangle.
 * No coordinate welding, hash-to-integer conversion or source vertex insertion
 * enters. The supplied reader population must contain both complete courses.
 *
 * @evidence contracts/common.md#principled-implementation The admitted lip reader supplies canonical native samples or exact material identities; one instance/generation domain preserves native IDs while sorted material identities receive a separate ordinal domain. First original support is retained when a shared-edge identity has multiple triangle witnesses; coordinates are not identity.
 * @evidence contracts/common.md#clear-and-simple-design One registry returns the physical point map and upstream material-attachment map together so oral finish and Person skin placement share the same registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing canonical IDs, wrong-generation material support or native/material identity collision refuses. This trusts the preceding reader's exact identity/weight validation and complete course population; it does not silently validate arbitrary fabricated point records.
 * @evidence contracts/common.md#meaningful-documentation Prose explains separate domains, sorted ordinal identity, preserved parent order and first witness, plus the requirement to supply both complete admitted courses.
 * @evidence contracts/performance.md#efficient-algorithms M course points populate maps in linear expected work, then K unique material identities sort lexically in O(K log K) comparisons whose string lengths also matter. No coordinate search or source insertion occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Duplicate identities share the first material support and one source entry across courses; both returned maps serve the same instance/generation and are rebuilt when that registration changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned maps retain O(M) source and attachment records; sorting temporaries are local and source arrays are borrowed, with no global registry, hash cache or external resource.
 */
export function registerHumanFaceLipPhysicalSources(
  surface: IAutoMovieHumanFaceBasisSurface,
  points: IHumanFaceLipMarginPoints,
  instance: string,
  generation: string,
): IHumanFaceLipPhysicalSources {
  const domain: string = humanPhysicalSourceDomain(instance, generation);
  const materialDomain: string = domain + ":material-skin";
  const sources: Map<string, IAutoMovieMeshPhysicalSource> = new Map<
    string,
    IAutoMovieMeshPhysicalSource
  >();
  const material: Map<string, IHumanFaceMaterialAttachment> = new Map<
    string,
    IHumanFaceMaterialAttachment
  >();
  for (const point of [...points.upper, ...points.lower]) {
    if (point.nativeVertex !== null) {
      const id: number =
        surface.sourcePartition?.samples[point.nativeVertex] ??
        point.nativeVertex;
      if (!Number.isSafeInteger(id) || id < 0)
        throw new Error(
          "Native lip physical source has no canonical sample ID.",
        );
      sources.set(point.identity, { domain, id });
      continue;
    }
    if (
      surface.sourcePartition?.generation !== generation ||
      point.vertices.length !== 3 ||
      point.weights.length !== 3
    )
      throw new Error(
        "Material lip physical source needs its same-generation native triangle.",
      );
    const parents: [number, number, number] = [
      surface.sourcePartition.samples[point.vertices[0]],
      surface.sourcePartition.samples[point.vertices[1]],
      surface.sourcePartition.samples[point.vertices[2]],
    ];
    const weights: [number, number, number] = [
      point.weights[0],
      point.weights[1],
      point.weights[2],
    ];
    if (
      parents.some(
        (id: number): boolean => !Number.isSafeInteger(id) || id < 0,
      ) ||
      weights.some(
        (weight: number): boolean => !Number.isFinite(weight) || weight < 0,
      )
    )
      throw new Error(
        "Material lip physical source has invalid native support.",
      );
    if (!material.has(point.identity))
      material.set(point.identity, {
        surface: surface.id,
        parents,
        weights,
        identity: point.identity,
      });
  }
  const attachments: Map<number, IHumanFaceMaterialAttachment> = new Map<
    number,
    IHumanFaceMaterialAttachment
  >();
  const identities: string[] = [...material.keys()].sort(
    (a: string, b: string): 0 | 1 | -1 => (a < b ? -1 : a > b ? 1 : 0),
  );
  identities.forEach((identity: string, id: number): void => {
    if (sources.has(identity))
      throw new Error("Native and material lip physical identities collide.");
    sources.set(identity, { domain: materialDomain, id });
    attachments.set(id, material.get(identity)!);
  });
  return {
    sources,
    materialAttachments:
      attachments.size === 0
        ? new Map()
        : new Map([[materialDomain, attachments]]),
  };
}
