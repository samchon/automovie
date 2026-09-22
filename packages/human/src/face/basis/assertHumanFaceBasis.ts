import { validateMeshTopology } from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import { assertHumanFaceArticulation } from "./assertHumanFaceArticulation";
import { assertHumanFaceContact } from "./assertHumanFaceContact";

/**
 * Admit immutable connectivity, endpoint correspondence and triangle partitions,
 * then the landmarks, articulation and attachments that ride on them.
 * Called once by the basis builder after schema admission and ownership cloning.
 * This rejects broken data before an edit can allocate a partially formed model.
 * A valid topological surface may still self-intersect; this is not collision
 * detection or anatomical acceptance of the supplied artistic prior.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Refuses invalid reusable correspondence and missing or duplicated material triangles.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Checks shared topology, sparse endpoint ordering, channel domains and complete oriented partitions.
 */
export function assertHumanFaceBasis(basis: IAutoMovieHumanFaceBasis): void {
  const unique = (ids: string[]): void => {
    if (ids.some((id) => id.trim() === "") || new Set(ids).size !== ids.length)
      throw new Error("Facial basis identities must be nonempty and unique.");
  };
  unique([basis.id]);
  unique(basis.channels.map((channel) => channel.id));
  unique(basis.surfaces.map((surface) => surface.id));
  unique(basis.materials.map((material) => material.id));
  unique(
    basis.surfaces.flatMap((surface) =>
      surface.regions.map((region) => region.id),
    ),
  );
  const endpoints = new Set<string>();
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
  const correctives = basis.correctives ?? [];
  unique([
    ...basis.channels.map((channel) => channel.id),
    ...correctives.map((corrective) => corrective.id),
  ]);
  const sides = new Map(
    basis.channels.map((channel) => [
      channel.id,
      { positive: channel.positive, negative: channel.negative },
    ]),
  );
  for (const corrective of correctives) {
    if (
      corrective.inputs.length === 0 ||
      !Number.isFinite(corrective.weight) ||
      corrective.weight <= 0 ||
      corrective.weight > 1 ||
      corrective.target.trim() === "" ||
      new Set(
        corrective.inputs.map((input) => input.channel + "/" + input.side),
      ).size !== corrective.inputs.length
    )
      throw new Error(
        "A facial corrective needs distinct drivers, a gain in (0,1] and a named endpoint.",
      );
    for (const input of corrective.inputs) {
      const channel = sides.get(input.channel);
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
      const peak = input.peak ?? 1;
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
  const residentEndpoints = new Set<string>();
  const materials = new Set(basis.materials.map((material) => material.id));
  if (basis.surfaces.length === 0)
    throw new Error("A facial basis needs resident surfaces.");
  for (const surface of basis.surfaces) {
    // The topology checker assumes structurally valid buffers and deliberately
    // leaves malformed-buffer reporting to its caller. Establish that premise
    // before welding positions or compiling sparse vertex correspondence.
    const vertices = surface.positions.length / 3;
    if (
      vertices === 0 ||
      !Number.isInteger(vertices) ||
      !surface.positions.every(Number.isFinite) ||
      surface.indices.length === 0 ||
      surface.indices.length % 3 !== 0 ||
      surface.indices.some(
        (index) => !Number.isInteger(index) || index < 0 || index >= vertices,
      )
    )
      throw new Error(
        "Facial neutral buffers need finite XYZ and resident triangles.",
      );
    const mesh = {
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
      let previous = -1;
      for (let i = 0; i < rows.length; i += 4) {
        const vertex = rows[i];
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
    const triangles = new Set<string>();
    for (let i = 0; i < surface.indices.length; i += 3) {
      const key = surface.indices.slice(i, i + 3).join(",");
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
      for (let i = 0; i < region.indices.length; i += 3) {
        const key = region.indices.slice(i, i + 3).join(",");
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
  const jaw = basis.articulation?.jaw;
  const articulated = new Set(
    jaw === undefined
      ? []
      : [
          jaw.opening.channel,
          jaw.protrusion.channel,
          jaw.laterotrusion.left.channel,
          jaw.laterotrusion.right.channel,
          ...basis.articulation!.eyes.flatMap((eye) =>
            eye.gaze.map((gaze) => gaze.channel),
          ),
        ],
  );
  const drivenEndpoints = new Set(
    basis.channels
      .filter((channel) => articulated.has(channel.id))
      .map((channel) => channel.positive),
  );
  if (
    [...endpoints].some(
      (name) => !residentEndpoints.has(name) && !drivenEndpoints.has(name),
    )
  )
    throw new Error(
      "Every declared facial endpoint must move at least one resident surface or drive a joint.",
    );
  assertHumanFaceArticulation(basis, endpoints);
  assertHumanFaceContact(basis);
}
