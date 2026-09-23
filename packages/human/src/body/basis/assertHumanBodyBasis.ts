import { validateMeshTopology } from "@automovie/engine";

import { humanBodyCappedSurface } from "../simple/humanBodyCappedSurface";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { assertHumanBodyRig } from "./assertHumanBodyRig";
import { assertSparseRows } from "./assertSparseRows";

/**
 * Admit immutable connectivity, endpoint correspondence, partitions and the rig.
 *
 * Called once by the basis builder after schema admission and ownership
 * cloning, and by any tool that reads a basis payload directly. It rejects
 * broken data before an edit can allocate a partially formed model. The
 * surface half mirrors the face basis admission (identities, envelopes,
 * correctives, topology, sparse rows, region partitions); the rig half is
 * `assertHumanBodyRig`. A valid basis may still self-intersect; this is not
 * collision detection or anatomical acceptance of the supplied prior. Each
 * independently capped surface must bound one measurable solid; two surfaces
 * may have overlapping bounds, but their capped interiors must not overlap.
 *
 * The endpoint population is the union of channel sides and corrective
 * targets. Every declared endpoint must move at least one resident vertex or
 * landmark, and every target row set must belong to a declared endpoint, so a
 * misspelled endpoint cannot evaluate to a silent zero.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Refuses unsupported or malformed geometry, endpoints, mirrors and partitions instead of clamping or skipping them.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Checks the topology, strictly increasing nonzero sparse rows, neutral-containing envelopes, mirror reciprocity and exact region partitions the specification lists.
 */
export function assertHumanBodyBasis(basis: IAutoMovieHumanBodyBasis): void {
  const unique = (ids: string[], what: string): void => {
    if (ids.some((id) => id.trim() === "") || new Set(ids).size !== ids.length)
      throw new Error("Body basis " + what + " must be nonempty and unique.");
  };
  unique([basis.id], "identities");
  unique(
    basis.channels.map((channel) => channel.id),
    "channel identities",
  );
  unique(
    basis.surfaces.map((surface) => surface.id),
    "surface identities",
  );
  unique(
    basis.materials.map((material) => material.id),
    "material identities",
  );
  unique(
    basis.surfaces.flatMap((surface) =>
      surface.regions.map((region) => region.id),
    ),
    "region identities",
  );
  const channels = new Map(
    basis.channels.map((channel) => [channel.id, channel]),
  );
  const endpoints = new Set<string>();
  for (const channel of basis.channels) {
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
        "Body channels need a finite neutral-containing envelope and named endpoints.",
      );
    // A mirror is a claim both channels make about each other, in the same
    // group; a one-sided mirror would let an editor pair a control with one
    // that does not pair back.
    if (channel.mirror !== null) {
      const mate = channels.get(channel.mirror);
      if (
        mate === undefined ||
        mate.id === channel.id ||
        mate.mirror !== channel.id ||
        mate.group !== channel.group
      )
        throw new Error(
          "Body channel mirrors must be reciprocal within one group: " +
            channel.id,
        );
    }
    endpoints.add(channel.positive);
    if (channel.negative !== null) endpoints.add(channel.negative);
  }
  const correctives = basis.correctives ?? [];
  unique(
    [
      ...basis.channels.map((channel) => channel.id),
      ...correctives.map((corrective) => corrective.id),
    ],
    "channel and corrective identities",
  );
  for (const corrective of correctives) {
    if (
      corrective.inputs.length === 0 ||
      !Number.isFinite(corrective.weight) ||
      corrective.weight <= 0 ||
      corrective.weight > 1 ||
      corrective.target.trim() === "" ||
      new Set(
        corrective.inputs.map((input) =>
          "bone" in input
            ? input.bone + "." + input.axis + "/" + input.side
            : input.channel + "/" + input.side,
        ),
      ).size !== corrective.inputs.length
    )
      throw new Error(
        "A body corrective needs distinct drivers, a gain in (0,1] and a named endpoint.",
      );
    for (const input of corrective.inputs) {
      if ("bone" in input) continue; // joint drivers are admitted with the rig
      const channel = channels.get(input.channel);
      if (channel === undefined || channel[input.side] === null)
        throw new Error(
          "A body corrective drives off a side no channel carries: " +
            input.channel +
            "." +
            input.side,
        );
      // a weight ramp lies inside the envelope on its side, so no admitted
      // weight arms a corrective past its end and every ramp can reach one
      const onset = input.onset ?? 0;
      const full = input.full ?? 1;
      const extent =
        input.side === "positive" ? channel.maximum : -channel.minimum;
      if (
        !Number.isFinite(onset) ||
        !Number.isFinite(full) ||
        onset < 0 ||
        full <= onset ||
        full > extent + 1e-9
      )
        throw new Error(
          "A body channel driver needs a ramp inside its envelope: " +
            corrective.id +
            " " +
            input.channel +
            `.${input.side} onset ${onset} full ${full} extent ${extent}`,
        );
    }
    endpoints.add(corrective.target);
  }
  const resident = new Set<string>();
  const materials = new Set(basis.materials.map((material) => material.id));
  const solids: ReturnType<typeof humanBodyCappedSurface>[] = [];
  if (basis.surfaces.length === 0)
    throw new Error("A body basis needs resident surfaces.");
  for (const surface of basis.surfaces) {
    // The topology checker assumes structurally valid buffers and leaves
    // malformed-buffer reporting to its caller, so establish that premise first.
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
        "Body neutral buffers need finite XYZ and resident triangles.",
      );
    if (
      !validateMeshTopology({
        mesh: {
          positions: surface.positions,
          indices: surface.indices,
          normals: null,
          uvs: null,
          skin: null,
        },
      }).success
    )
      throw new Error(
        "Body basis connectivity must be a valid oriented surface: " +
          surface.id,
      );
    const solid = humanBodyCappedSurface(surface.positions, surface.indices);
    solid.assertValid();
    solids.push(solid);
    for (const [name, rows] of Object.entries(surface.targets)) {
      if (!endpoints.has(name))
        throw new Error(
          "Body surface rows name an undeclared endpoint: " + name,
        );
      assertSparseRows(rows, vertices, "surface " + surface.id + " " + name);
      resident.add(name);
    }
    const triangles = new Set<string>();
    for (let i = 0; i < surface.indices.length; i += 3)
      triangles.add(surface.indices.slice(i, i + 3).join(","));
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
          "Body regions need a resident material, triangles and aligned finite corner UVs.",
        );
      for (let i = 0; i < region.indices.length; i += 3)
        if (!triangles.delete(region.indices.slice(i, i + 3).join(",")))
          throw new Error(
            "Body regions must partition the original oriented triangles exactly.",
          );
    }
    if (triangles.size !== 0)
      throw new Error("Body regions cannot omit resident triangles.");
  }
  for (let first = 0; first < solids.length; first++)
    for (let second = first + 1; second < solids.length; second++)
      if (solids[first].overlaps(solids[second]))
        throw new Error(
          "Body basis capped surface interiors must not overlap: " +
            basis.surfaces[first].id +
            ", " +
            basis.surfaces[second].id,
        );
  const landmarks = basis.landmarks.ids.length;
  for (const [name, rows] of Object.entries(basis.landmarks.targets)) {
    if (!endpoints.has(name))
      throw new Error(
        "Body landmark rows name an undeclared endpoint: " + name,
      );
    assertSparseRows(rows, landmarks, "landmark " + name);
    resident.add(name);
  }
  if ([...endpoints].some((name) => !resident.has(name)))
    throw new Error(
      "Every declared body endpoint must move at least one resident vertex or landmark.",
    );
  assertHumanBodyRig(basis);
}
