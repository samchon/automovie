import { validateMeshTopology } from "@automovie/engine";
import type { IAutoMovieMaterial as IAutoMovieMaterialImported } from "@automovie/interface";

import { assertHumanSkinLandmarks } from "../../common/basis/assertHumanSkinLandmarks";
import { assertHumanSkinRegions } from "../../common/basis/assertHumanSkinRegions";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported } from "../structures/IAutoMovieHumanFaceBasisChannel";
import type { IAutoMovieHumanFaceBasisCorrective as IAutoMovieHumanFaceBasisCorrectiveImported } from "../structures/IAutoMovieHumanFaceBasisCorrective";
import type { IAutoMovieHumanFaceBasisCorrectiveInput as IAutoMovieHumanFaceBasisCorrectiveInputImported } from "../structures/IAutoMovieHumanFaceBasisCorrectiveInput";
import type { IAutoMovieHumanFaceBasisEye as IAutoMovieHumanFaceBasisEyeImported } from "../structures/IAutoMovieHumanFaceBasisEye";
import type { IAutoMovieHumanFaceBasisEyeGaze as IAutoMovieHumanFaceBasisEyeGazeImported } from "../structures/IAutoMovieHumanFaceBasisEyeGaze";
import type { IAutoMovieHumanFaceBasisJaw as IAutoMovieHumanFaceBasisJawImported } from "../structures/IAutoMovieHumanFaceBasisJaw";
import type { IAutoMovieHumanFaceBasisRegion as IAutoMovieHumanFaceBasisRegionImported } from "../structures/IAutoMovieHumanFaceBasisRegion";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../structures/IAutoMovieHumanFaceBasisSurface";
import { assertHumanFaceArticulation } from "./assertHumanFaceArticulation";
import { assertHumanFaceContact } from "./assertHumanFaceContact";

/**
 * Admit immutable connectivity, endpoint correspondence and triangle partitions,
 * then the landmarks, articulation and attachments that ride on them.
 * Called once by the basis builder after schema admission and ownership cloning.
 * This rejects broken data before an edit can allocate a partially formed model.
 * A valid topological surface may still self-intersect; this is not collision
 * detection or anatomical acceptance of the supplied artistic prior.
 * This initial topology view omits physical correspondence and uses the
 * engine's legacy coordinate incidence. Later resident gathering/model
 * admission separately checks the registered physical source population.
 *
 * @evidence contracts/common.md#principled-implementation Schema-admitted cloned basis populations establish finite native buffer/layout premises, oriented topology, named endpoint/corrective dependencies and exact region triangle partition before articulation/contact admission.
 * @evidence contracts/common.md#clear-and-simple-design One source admission orders immutable identity/connectivity, sparse response and partition checks, delegating landmarks/regions, articulation and coupled contact to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing effects refuse rather than silently evaluating zero; only actual articulated positive endpoints may omit sparse rows. Region ownership uses original oriented triples and topology acceptance proves no self-intersection or anatomy.
 * @evidence contracts/common.md#meaningful-documentation Prose gives builder schema/clone boundary, preallocation refusal and topology-versus-collision/anatomy distinction; malformed numeric layouts are checked before engine topology assumptions.
 * @evidence contracts/performance.md#efficient-algorithms Identity/dependency sets and sparse rows scan their populations once; each surface includes native topology-validation cost and expected-linear triangle partition deletion, followed by actual articulation/contact work.
 * @evidence contracts/performance.md#reuse-equivalent-work Endpoint/channel/material sets serve all source rows/regions; each original triangle is consumed once by its owning partition instead of searching every region repeatedly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source-sized sets/maps are invocation-local; no model, cache, task or external handle is allocated and all refusals leave the cloned basis unchanged.
 */
export function assertHumanFaceBasis(basis: IAutoMovieHumanFaceBasis): void {
  assertHumanSkinLandmarks(basis);
  assertHumanSkinRegions(basis);
  const unique: (ids: string[]) => void = (ids: string[]): void => {
    if (
      ids.some((id: string): boolean => id.trim() === "") ||
      new Set(ids).size !== ids.length
    )
      throw new Error("Facial basis identities must be nonempty and unique.");
  };
  unique([basis.id]);
  unique(
    basis.channels.map(
      (channel: IAutoMovieHumanFaceBasisChannelImported): string => channel.id,
    ),
  );
  unique(
    basis.surfaces.map(
      (surface: IAutoMovieHumanFaceBasisSurfaceImported): string => surface.id,
    ),
  );
  unique(
    basis.materials.map(
      (material: IAutoMovieMaterialImported): string => material.id,
    ),
  );
  unique(
    basis.surfaces.flatMap(
      (surface: IAutoMovieHumanFaceBasisSurfaceImported): string[] =>
        surface.regions.map(
          (region: IAutoMovieHumanFaceBasisRegionImported): string => region.id,
        ),
    ),
  );
  const endpoints: Set<string> = new Set<string>();
  for (const channel of basis.channels) {
    if (channel.description !== undefined && channel.description.trim() === "")
      throw new Error(
        "A supplied facial channel description must be nonempty.",
      );
    if (
      ![channel.minimum, channel.maximum].every(Number.isFinite) ||
      channel.minimum > 0 ||
      channel.maximum <= 0 ||
      channel.positive.trim() === "" ||
      (channel.minimum < 0 &&
        (channel.negative === null || channel.negative.trim() === "")) ||
      (channel.minimum === 0 && channel.negative !== null)
    )
      throw new Error(
        "Facial channels need a finite neutral-containing envelope and named endpoints.",
      );
    endpoints.add(channel.positive);
    if (channel.negative !== null) endpoints.add(channel.negative);
  }
  // A corrective is admitted against the channels it drives off, not merely
  // parsed: a driver that is not a channel, or a side a channel does not have,
  // would evaluate to a silent zero and look like a corrective that was
  // authored badly rather than one that names something absent.
  const correctives: IAutoMovieHumanFaceBasisCorrectiveImported[] =
    basis.correctives ?? [];
  unique([
    ...basis.channels.map(
      (channel: IAutoMovieHumanFaceBasisChannelImported): string => channel.id,
    ),
    ...correctives.map(
      (corrective: IAutoMovieHumanFaceBasisCorrectiveImported): string =>
        corrective.id,
    ),
  ]);
  const sides: Map<string, { positive: string; negative: string | null }> =
    new Map(
      basis.channels.map(
        (
          channel: IAutoMovieHumanFaceBasisChannelImported,
        ): [string, { positive: string; negative: string | null }] => [
          channel.id,
          { positive: channel.positive, negative: channel.negative },
        ],
      ),
    );
  for (const corrective of correctives) {
    if (
      corrective.inputs.length === 0 ||
      !Number.isFinite(corrective.weight) ||
      corrective.weight <= 0 ||
      corrective.weight > 1 ||
      corrective.target.trim() === "" ||
      new Set(
        corrective.inputs.map(
          (input: IAutoMovieHumanFaceBasisCorrectiveInputImported): string =>
            input.channel + "/" + input.side,
        ),
      ).size !== corrective.inputs.length
    )
      throw new Error(
        "A facial corrective needs distinct drivers, a gain in (0,1] and a named endpoint.",
      );
    for (const input of corrective.inputs) {
      const channel: { positive: string; negative: string | null } | undefined =
        sides.get(input.channel);
      if (channel === undefined || channel[input.side] === null)
        throw new Error(
          "A facial corrective drives off a side no channel carries: " +
            input.channel +
            "." +
            input.side,
        );
      // A peak at zero would divide the driver by it, and one past the driver
      // envelope's unit would never be reached; both name an in-between that
      // cannot exist.
      if (
        input.peak !== undefined &&
        (!Number.isFinite(input.peak) || input.peak <= 0 || input.peak > 1)
      )
        throw new Error(
          "A facial corrective in-between peaks in (0,1]: " +
            input.channel +
            "." +
            input.side,
        );
      // A span has to hold the peak strictly above its lower end, or the
      // rise would divide by nothing, and its upper end has to reach the peak
      // and stay inside the envelope.
      const peak: number = input.peak ?? 1;
      if (
        input.between !== undefined &&
        (!input.between.every(Number.isFinite) ||
          input.between[0] < 0 ||
          input.between[0] >= peak ||
          input.between[1] < peak ||
          input.between[1] > 1)
      )
        throw new Error(
          "A facial corrective in-between spans [below, above] with 0 <= below < peak <= above <= 1: " +
            input.channel +
            "." +
            input.side,
        );
    }
    endpoints.add(corrective.target);
  }
  const residentEndpoints: Set<string> = new Set<string>();
  const materials: Set<string> = new Set(
    basis.materials.map(
      (material: IAutoMovieMaterialImported): string => material.id,
    ),
  );
  if (basis.surfaces.length === 0)
    throw new Error("A facial basis needs resident surfaces.");
  for (const surface of basis.surfaces) {
    // The topology checker assumes structurally valid buffers and deliberately
    // leaves malformed-buffer reporting to its caller. Establish that premise
    // before welding positions or compiling sparse vertex correspondence.
    const vertices: number = surface.positions.length / 3;
    if (
      vertices === 0 ||
      !Number.isInteger(vertices) ||
      !surface.positions.every(Number.isFinite) ||
      surface.indices.length === 0 ||
      surface.indices.length % 3 !== 0 ||
      surface.indices.some(
        (index: number): boolean =>
          !Number.isInteger(index) || index < 0 || index >= vertices,
      )
    )
      throw new Error(
        "Facial neutral buffers need finite XYZ and resident triangles.",
      );
    const mesh: {
      positions: number[];
      indices: number[];
      normals: null;
      uvs: null;
      skin: null;
    } = {
      positions: surface.positions,
      indices: surface.indices,
      normals: null,
      uvs: null,
      skin: null,
    };
    if (!validateMeshTopology({ mesh }).success)
      throw new Error(
        "Facial basis connectivity must be a valid oriented surface: " +
          surface.id,
      );
    for (const [name, rows] of Object.entries(surface.targets)) {
      if (
        !endpoints.has(name) ||
        rows.length === 0 ||
        rows.length % 4 !== 0 ||
        !rows.every(Number.isFinite)
      )
        throw new Error("Facial endpoints need named finite sparse XYZ rows.");
      let previous: number = -1;
      for (let i: number = 0; i < rows.length; i += 4) {
        const vertex: number = rows[i];
        if (
          !Number.isInteger(vertex) ||
          vertex <= previous ||
          vertex >= surface.positions.length / 3
        )
          throw new Error(
            "Sparse endpoint vertices must be resident and strictly increasing.",
          );
        if (rows[i + 1] === 0 && rows[i + 2] === 0 && rows[i + 3] === 0)
          throw new Error(
            "Sparse facial endpoint rows must describe a nonzero displacement.",
          );
        previous = vertex;
      }
      residentEndpoints.add(name);
    }
    const triangles: Set<string> = new Set<string>();
    for (let i: number = 0; i < surface.indices.length; i += 3) {
      const key: string = surface.indices.slice(i, i + 3).join(",");
      triangles.add(key);
    }
    for (const region of surface.regions) {
      if (
        !materials.has(region.material) ||
        region.indices.length === 0 ||
        region.indices.length % 3 !== 0 ||
        (region.uvs !== null &&
          (region.uvs.length !== region.indices.length * 2 ||
            !region.uvs.every(Number.isFinite)))
      )
        throw new Error(
          "Facial regions need a resident material, triangles and aligned finite corner UVs.",
        );
      for (let i: number = 0; i < region.indices.length; i += 3) {
        const key: string = region.indices.slice(i, i + 3).join(",");
        if (!triangles.delete(key))
          throw new Error(
            "Facial regions must partition the original oriented triangles exactly.",
          );
      }
    }
    if (triangles.size !== 0)
      throw new Error("Facial regions cannot omit resident triangles.");
  }
  // An endpoint whose whole effect is a joint motion has no residual row to
  // publish: the articulation is what it moves. Every other endpoint must
  // reach a surface, or a channel would evaluate to a silent no-op.
  const jaw: IAutoMovieHumanFaceBasisJawImported | undefined =
    basis.articulation?.jaw;
  const articulated: Set<string> = new Set(
    jaw === undefined
      ? []
      : [
          jaw.opening.channel,
          jaw.protrusion.channel,
          jaw.laterotrusion.left.channel,
          jaw.laterotrusion.right.channel,
          ...basis.articulation!.eyes.flatMap(
            (eye: IAutoMovieHumanFaceBasisEyeImported): string[] =>
              eye.gaze.map(
                (gaze: IAutoMovieHumanFaceBasisEyeGazeImported): string =>
                  gaze.channel,
              ),
          ),
        ],
  );
  const drivenEndpoints: Set<string> = new Set(
    basis.channels
      .filter((channel: IAutoMovieHumanFaceBasisChannelImported): boolean =>
        articulated.has(channel.id),
      )
      .map(
        (channel: IAutoMovieHumanFaceBasisChannelImported): string =>
          channel.positive,
      ),
  );
  if (
    [...endpoints].some(
      (name: string): boolean =>
        !residentEndpoints.has(name) && !drivenEndpoints.has(name),
    )
  )
    throw new Error(
      "Every declared facial endpoint must move at least one resident surface or drive a joint.",
    );
  assertHumanFaceArticulation(basis, endpoints);
  assertHumanFaceContact(basis);
}
