import type { IAutoMovieHumanBodyEndpointSource } from "../../body/structures/IAutoMovieHumanBodyEndpointSource";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";

/**
 * Project the person's actual head contributions for its body's gain owner.
 * Source arrays are borrowed unchanged. The composition owns the driver lookup;
 * the body owns exact body/partition/geometry admission without importing person.
 *
 * @evidence contracts/common.md#principled-implementation Reads bindings and nonzero contributions from the same compiled generation supplied to the person builder.
 * @evidence contracts/common.md#clear-and-simple-design One projection bridges composition ownership to the body-owned constructor input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No empty marker, inferred point or copied gain equation replaces source geometry.
 * @evidence contracts/common.md#meaningful-documentation States array ownership and the dependency direction.
 * @evidence contracts/modeling.md#parameter-channels Actual head channel bindings preserve the body's signed endpoint gain owner.
 * @evidence contracts/modeling.md#shared-boundaries Both actual source partitions must identify this generation.
 * @evidence contracts/modeling.md#spatial-conventions Borrowed positions and displacement rows retain their source metre frame.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Preserves existing source member identities.
 * @evidenceExclude contracts/modeling.md#rendered-observation Establishes no rendered acceptance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source channels own bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Converts no personal input.
 */
export function createHumanPersonBodyEndpointSource(
  generation: IAutoMovieHumanPersonGeneration,
): IAutoMovieHumanBodyEndpointSource {
  const partition = generation.face.surfaces.find(surface => surface.sourcePartition !== undefined)?.sourcePartition;
  const bodyPartition = generation.body.surfaces.find(surface => surface.sourcePartition !== undefined)?.sourcePartition;
  if (partition === undefined || partition.generation !== generation.id || bodyPartition?.generation !== generation.id)
    throw new Error("Endpoint source projection needs both actual same-generation partitions.");
  const source: IAutoMovieHumanBodyEndpointSource = {
    generation: generation.id, body: generation.body, partition, drivers: [], contributions: {},
  };
  for (const driver of generation.drivers ?? []) {
    const channel = generation.face.channels.find(channel => channel.id === driver.channel);
    if (channel === undefined || channel.positive !== driver.endpoint)
      throw new Error("Endpoint source projection needs its actual head driver: " + driver.endpoint);
    source.drivers.push({ ...driver, positive: channel.positive });
    const contributions = source.contributions[driver.endpoint] ??= [];
    for (const surface of generation.face.surfaces) {
      const rows = surface.targets[driver.endpoint];
      if (rows !== undefined && rows.length !== 0)
        contributions.push({ id: surface.id, positions: surface.positions, rows });
    }
    const landmarks = generation.face.landmarks;
    const rows = landmarks?.targets[driver.endpoint];
    if (landmarks !== undefined && rows !== undefined && rows.length !== 0)
      contributions.push({ id: "source-landmarks", positions: landmarks.positions, rows });
  }
  return source;
}
