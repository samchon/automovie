import type { IAutoMovieHumanBodyEndpointSource } from "../../body/structures/IAutoMovieHumanBodyEndpointSource";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";

/**
 * Project the person's actual head contributions for its body's gain owner.
 * Source arrays are borrowed unchanged. The composition owns the driver lookup;
 * the body owns exact body/partition/geometry admission without importing person.
 */
export function createHumanPersonBodyEndpointSource(
  generation: IAutoMovieHumanPersonGeneration,
): IAutoMovieHumanBodyEndpointSource {
  const partition = generation.face.surfaces.find(
    (surface) => surface.sourcePartition !== undefined,
  )?.sourcePartition;
  const bodyPartition = generation.body.surfaces.find(
    (surface) => surface.sourcePartition !== undefined,
  )?.sourcePartition;
  if (
    partition === undefined ||
    partition.generation !== generation.id ||
    bodyPartition?.generation !== generation.id
  )
    throw new Error(
      "Endpoint source projection needs both actual same-generation partitions.",
    );
  const source: IAutoMovieHumanBodyEndpointSource = {
    generation: generation.id,
    body: generation.body,
    partition,
    drivers: [],
    contributions: {},
  };
  for (const driver of generation.drivers ?? []) {
    const channel = generation.face.channels.find(
      (channel) => channel.id === driver.channel,
    );
    if (channel === undefined || channel.positive !== driver.endpoint)
      throw new Error(
        "Endpoint source projection needs its actual head driver: " +
          driver.endpoint,
      );
    source.drivers.push({ ...driver, positive: channel.positive });
    const contributions = (source.contributions[driver.endpoint] ??= []);
    for (const surface of generation.face.surfaces) {
      const rows = surface.targets[driver.endpoint];
      if (rows !== undefined && rows.length !== 0)
        contributions.push({
          id: surface.id,
          positions: surface.positions,
          rows,
        });
    }
    const landmarks = generation.face.landmarks;
    const rows = landmarks?.targets[driver.endpoint];
    if (landmarks !== undefined && rows !== undefined && rows.length !== 0)
      contributions.push({
        id: "source-landmarks",
        positions: landmarks.positions,
        rows,
      });
  }
  return source;
}
