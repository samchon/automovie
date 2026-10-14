import type {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
  IAutoMovieModel,
} from "@automovie/interface";

import type { IHumanFaceOralMeasurementRegistration } from "../../face/anatomy/oral/IHumanFaceOralMeasurementRegistration";
import { humanFaceOralDentalDomain } from "../../face/anatomy/oral/humanFaceOralDentalDomain";
import { meshOfHumanPart } from "../build/meshOfHumanPart";

/**
 * Scatter actual final referenced dental vertices through the oral emitter's native physical domain. Missing/deliberately absent ordinals remain NaN for named unavailable instruments. The supplied conversion must be the actual Float32 world-to-head carry. Repeated aliases use last-write scatter under the already-admitted correspondence premise; this reader does not recheck alias agreement or recompute the raw source digest.
 *
 * @evidence contracts/common.md#principled-implementation Instance/generation/native-digest domain and actual referenced source IDs select performed dental coordinates independently of skin partitions.
 * @evidence contracts/common.md#clear-and-simple-design This reader owns native-ordinal scatter only; emitter registration owns correspondence and the face instruments own measurement availability/qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positions cannot invent IDs, missing geometry stays NaN, and native reference/digest metadata is not substituted for performed crowns or new source authentication.
 * @evidence contracts/common.md#meaningful-documentation Prose states referenced-vertex population, absent ordinals, carry premise, repeated-alias behavior and source digest boundary.
 * @evidence contracts/performance.md#efficient-algorithms Parts/source tables are scanned, actual index sets bound each scatter population, and canonical conversion pays included mesh coordinates; the output initializes the native coordinate count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each performed model is scattered anew; no native geometry, reading or conversion-result cache is owned by this adapter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One owned coordinate array escapes; per-part referenced sets/conversion buffers and absent set are call-local with no asset task or worker retained.
 */
export function readHumanPersonOralDentalPositions(
  model: IAutoMovieModel,
  instance: string,
  registration: IHumanFaceOralMeasurementRegistration,
  coordinateCount: number,
  canonicalPositions: (world: readonly number[]) => number[],
): number[] {
  const domain: string = humanFaceOralDentalDomain(
    instance,
    registration.generation,
    registration.dentalNativeSha256,
  );
  const absent: Set<number> = new Set(registration.absentDentalVertices);
  const result: number[] = new Array<number>(coordinateCount).fill(Number.NaN);
  for (const part of model.parts) {
    const mesh: IAutoMovieMesh = meshOfHumanPart(part);
    const physical: IAutoMovieMesh["physicalVertices"] = mesh.physicalVertices;
    if (
      physical === undefined ||
      !physical.sources.some(
        (source: IAutoMovieMeshPhysicalSource): boolean =>
          source.domain === domain,
      )
    )
      continue;
    const used: Set<number> =
      mesh.indices === null
        ? new Set(
            Array.from(
              { length: mesh.positions.length / 3 },
              (_: unknown, vertex: number): number => vertex,
            ),
          )
        : new Set(mesh.indices);
    const positions: number[] = canonicalPositions(mesh.positions);
    for (const vertex of used) {
      const index: number | null | undefined = physical.vertices[vertex];
      if (index === null || index === undefined) continue;
      const source: IAutoMovieMeshPhysicalSource | undefined =
        physical.sources[index];
      if (
        source === undefined ||
        source.domain !== domain ||
        absent.has(source.id)
      )
        continue;
      if (
        !Number.isSafeInteger(source.id) ||
        source.id < 0 ||
        3 * source.id + 2 >= coordinateCount
      )
        throw new Error(
          "Final dental physical correspondence names a nonresident native ordinal: " +
            source.id +
            ".",
        );
      for (let axis: number = 0; axis < 3; axis++)
        result[3 * source.id + axis] = positions[3 * vertex + axis];
    }
  }
  return result;
}
