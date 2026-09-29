import { measureAutoMovieMeshCrossings, validateMeshTopology } from "@automovie/engine";

import { HUMAN_BODY_SKIN_SITES } from "../../constants/HUMAN_BODY_SKIN_SITES";
import { humanBodyCappedSurface } from "../../simple/humanBodyCappedSurface";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import { assertSparseRows } from "../assertSparseRows";

/**
 * Admit connected skin surfaces and their material partitions as one source
 * of shared vertex identities in metres, right-handed Y-up/Z-forward.
 *
 * Topology, neutral skin self-crossings, sparse shape rows, soft-tissue sag
 * metadata, relief and skin-material overlays are checked before the builder
 * can skin or split material regions. A cap closes each authored boundary only
 * for solid admission
 * and volume measurement; it does not add skin to the rendered body.
 * Surfaces may have overlapping bounds but not overlapping interiors.
 * This returns the endpoint names that move some surface vertex; it
 * cannot prove tissue constitutive laws or pose contact.
 */
export function assertHumanBodyBasisSurface(
  basis: IAutoMovieHumanBodyBasis,
  endpoints: ReadonlySet<string>,
): Set<string> {
  const resident = new Set<string>();
  const materials = new Set(basis.materials.map((material) => material.id));
  const solids: ReturnType<typeof humanBodyCappedSurface>[] = [];
  if (basis.surfaces.length === 0)
    throw new Error("A body basis needs resident surfaces.");
  // a material's layers across every surface: one nail layer, and at most
  // four in all, the most a material composites
  const layers = new Map<string, { nails: number; all: number }>();
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
    if (surface.sag !== undefined) {
      const { lean, gain, sweeps, softness } = surface.sag;
      const channel = (id: string) =>
        basis.channels.find((one) => one.id === id);
      if (
        !Number.isFinite(gain) ||
        gain < 0 ||
        !Number.isInteger(sweeps) ||
        sweeps < 0 ||
        !Number.isFinite(softness.base) ||
        !(softness.range[0] >= 0 && softness.range[0] <= softness.range[1]) ||
        !Number.isFinite(softness.range[1]) ||
        Object.entries(lean).some(([id, weight]) => {
          const found = channel(id);
          return (
            found === undefined ||
            !(weight >= found.minimum && weight <= found.maximum)
          );
        }) ||
        Object.entries(softness.channels).some(
          ([id, value]) => channel(id) === undefined || !Number.isFinite(value),
        )
      )
        throw new Error(
          "Body surface sag needs declared lean weights in range, a finite nonnegative gain, whole sweeps and a finite softness over declared channels: " +
            surface.id,
        );
    }
    if (
      surface.relief !== undefined &&
      (!surface.relief.texture.startsWith("data:image/png;base64,") ||
        !surface.regions.some(
          (region) =>
            region.material === surface.relief!.material && region.uvs !== null,
        ))
    )
      throw new Error(
        "Body surface relief needs a PNG data URI over a textured region of its material: " +
          surface.id,
      );
    const png = (uri: unknown): boolean =>
      typeof uri === "string" && uri.startsWith("data:image/png;base64,");
    for (const overlay of surface.overlays ?? []) {
      const count = layers.get(overlay.material) ?? { nails: 0, all: 0 };
      count.all += 1;
      if (overlay.kind === "nails") count.nails += 1;
      layers.set(overlay.material, count);
      if (
        overlay.material !== HUMAN_BODY_SKIN_SITES.material ||
        count.nails > 1 ||
        count.all > 4 ||
        (overlay.kind === "veins" &&
          (surface.sag === undefined ||
            !(
              overlay.attenuation > 0 && Number.isFinite(overlay.attenuation)
            ) ||
            overlay.vertices.length === 0 ||
            !overlay.vertices.every(
              (v) =>
                Number.isInteger(v) &&
                v >= 0 &&
                v < surface.positions.length / 3,
            ))) ||
        !png(overlay.color) ||
        (overlay.normal !== undefined && !png(overlay.normal)) ||
        (overlay.kind === "nails" &&
          (!(overlay.roughness >= 0 && overlay.roughness <= 1) ||
            (overlay.cheek !== undefined &&
              !Object.values(overlay.cheek).every(
                (value) => value > 0 && value <= 1,
              )))) ||
        !surface.regions.some(
          (region) =>
            region.material === overlay.material && region.uvs !== null,
        )
      )
        throw new Error(
          "Body surface overlays need the skin material, at most one nail layer and four layers per material, PNG data URIs over a textured region of their material, a nails roughness in [0,1] and reference cheek in (0,1], and veins over existing vertices of a surface with a declared lean body at a finite positive attenuation: " +
            surface.id,
        );
    }
    const solid = humanBodyCappedSurface(surface.positions, surface.indices);
    solid.assertValid();
    const neutral = {
      positions: surface.positions,
      indices: surface.indices,
      normals: null,
      uvs: null,
      skin: null,
    };
    if (measureAutoMovieMeshCrossings(neutral, neutral).length > 0)
      throw new Error(
        "Body neutral skin surface cannot cross itself: " + surface.id,
      );
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
  return resident;
}
