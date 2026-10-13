import type { IAutoMovieHumanBodyEndpointSource } from "../../body/structures/IAutoMovieHumanBodyEndpointSource";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";

/**
 * Project the person's actual head contributions for its body's gain owner. Source arrays are borrowed unchanged. The composition owns the driver lookup; the body owns exact body/partition/geometry admission without importing person.
 *
 * Contributions retain sparse [vertex,dx,dy,dz] rows and source metre positions. The first registered partition per view must match the generation. The body gain owner performs complete source admission; this projection supplies no clinical endpoint calibration or independent geometry validation.
 *
 * @evidence contracts/common.md#principled-implementation Actual positive face channels match each declared body endpoint driver, and their nonempty surface/landmark rows project as borrowed contributions beside same-generation partitions.
 * @evidence contracts/common.md#clear-and-simple-design Person composition resolves head driver/channel ownership while the body gain owner consumes its existing endpoint-source protocol without importing person implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing matching partitions or positive endpoint channels refuse; no requested endpoint is fabricated from names or calibrated clinical motion.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre/sparse-row conventions, borrowed arrays, first registered partition and downstream full admission.
 * @evidence contracts/performance.md#efficient-algorithms Partition discovery scans surfaces once; D drivers each search C channels and S surfaces, so O(S+D*(C+S)) descriptor work precedes the body owner's actual geometry checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This one-time projection builds distinct contribution descriptors for the supplied generation; it owns no cross-generation cache or effectful request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned driver/contribution arrays are newly owned but refer to unchanged generation/basis buffers; their lifetime follows the owning body compiler with no global resource.
 */
export function createHumanPersonBodyEndpointSource(
  generation: IAutoMovieHumanPersonGeneration,
): IAutoMovieHumanBodyEndpointSource {
  const partition: IAutoMovieHumanBodyEndpointSource["partition"] | undefined = generation.face.surfaces.find(
    (surface: IAutoMovieHumanPersonGeneration["face"]["surfaces"][number]): boolean => surface.sourcePartition !== undefined,
  )?.sourcePartition;
  const bodyPartition: IAutoMovieHumanPersonGeneration["body"]["surfaces"][number]["sourcePartition"] = generation.body.surfaces.find(
    (surface: IAutoMovieHumanPersonGeneration["body"]["surfaces"][number]): boolean => surface.sourcePartition !== undefined,
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
    const channel: IAutoMovieHumanPersonGeneration["face"]["channels"][number] | undefined = generation.face.channels.find(
      (channel: IAutoMovieHumanPersonGeneration["face"]["channels"][number]): boolean => channel.id === driver.channel,
    );
    if (channel === undefined || channel.positive !== driver.endpoint)
      throw new Error(
        "Endpoint source projection needs its actual head driver: " +
          driver.endpoint,
      );
    source.drivers.push({ ...driver, positive: channel.positive });
    const contributions: IAutoMovieHumanBodyEndpointSource["contributions"][string] = (source.contributions[driver.endpoint] ??= []);
    for (const surface of generation.face.surfaces) {
      const rows: number[] | undefined = surface.targets[driver.endpoint];
      if (rows !== undefined && rows.length !== 0)
        contributions.push({
          id: surface.id,
          positions: surface.positions,
          rows,
        });
    }
    const landmarks: IAutoMovieHumanPersonGeneration["face"]["landmarks"] = generation.face.landmarks;
    const rows: number[] | undefined = landmarks?.targets[driver.endpoint];
    if (landmarks !== undefined && rows !== undefined && rows.length !== 0)
      contributions.push({
        id: "source-landmarks",
        positions: landmarks.positions,
        rows,
      });
  }
  return source;
}
