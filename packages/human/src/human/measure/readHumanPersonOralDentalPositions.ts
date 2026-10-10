import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanFaceOralMeasurementRegistration } from "../../face/anatomy/oral/IHumanFaceOralMeasurementRegistration";
import { humanFaceOralDentalDomain } from "../../face/anatomy/oral/humanFaceOralDentalDomain";
import { meshOfHumanPart } from "../build/meshOfHumanPart";

/**
 * Scatter generated dental geometry through its emitter's native physical IDs.
 *
 * Only vertices referenced by the actual final mesh are readings. The dental
 * domain is owned by the oral emitter, independently of the skin partition;
 * positions never supply correspondence. Missing or deliberately absent native
 * samples remain NaN, so individual registry instruments report unavailable.
 * The supplied conversion is the person's actual Float32 world-to-head carry.
 * A native reference map cannot replace missing performed geometry.
 */
export function readHumanPersonOralDentalPositions(
  model: IAutoMovieModel,
  instance: string,
  registration: IHumanFaceOralMeasurementRegistration,
  coordinateCount: number,
  canonicalPositions: (world: readonly number[]) => number[],
): number[] {
  const domain = humanFaceOralDentalDomain(
    instance,
    registration.generation,
    registration.dentalNativeSha256,
  );
  const absent = new Set(registration.absentDentalVertices);
  const result = new Array<number>(coordinateCount).fill(Number.NaN);
  for (const part of model.parts) {
    const mesh = meshOfHumanPart(part);
    const physical = mesh.physicalVertices;
    if (
      physical === undefined ||
      !physical.sources.some((source) => source.domain === domain)
    )
      continue;
    const used =
      mesh.indices === null
        ? new Set(
            Array.from(
              { length: mesh.positions.length / 3 },
              (_, vertex) => vertex,
            ),
          )
        : new Set(mesh.indices);
    const positions = canonicalPositions(mesh.positions);
    for (const vertex of used) {
      const index = physical.vertices[vertex];
      if (index === null || index === undefined) continue;
      const source = physical.sources[index];
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
      for (let axis = 0; axis < 3; axis++)
        result[3 * source.id + axis] = positions[3 * vertex + axis];
    }
  }
  return result;
}
