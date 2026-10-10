import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodySourcePartSurface } from "./IAutoMovieHumanBodySourcePartSurface";
import { assertHumanBodySourceSurfaceShapeField } from "./assertHumanBodySourceSurfaceShapeField";

/**
 * Carry a source baseline and its linear freedoms into one shaped exterior.
 *
 * The baseline and each field's unit endpoint take the same exterior map.
 * Their difference defines a new linear field in the evaluated rest frame.
 * This is authored endpoint retargeting, not the nonlinear map of every
 * intermediate source coefficient. The producer's dimensionless coefficient
 * interval remains the computational domain; the quantity solver rereads its
 * actual volume reach and monotonicity in this frame. Clinical and tissue
 * clearance support do not follow from that interval.
 *
 * Zero-displacement held vertices remain zero because their two endpoints
 * coincide. Original source arrays, receipts and compiled geometry digests
 * are retained at their original owner; these temporary meshes are consumed
 * by the quantity solver before posing rather than warped after it.
 */
export function carryHumanBodySourceFields(
  parts: readonly IAutoMovieHumanBodySourcePart[],
  carry: (positions: readonly number[]) => number[],
): readonly IAutoMovieHumanBodySourcePart[] {
  return parts.map((part) => {
    const carrySurface = (
      surface: IAutoMovieHumanBodySourcePartSurface,
    ): IAutoMovieHumanBodySourcePartSurface => {
      const positions = carry(surface.mesh.positions);
      // Source directions remain archival data here. The resident owner
      // computes geometric normals after selecting actual triangle vertices;
      // an unused source ordinal has no incident normal to compute.
      return { ...surface, mesh: { ...surface.mesh, positions } };
    };
    const surfaces: IAutoMovieHumanBodySourcePart["surfaces"] = [
      carrySurface(part.surfaces[0]),
      ...part.surfaces.slice(1).map(carrySurface),
    ];
    const baseline = new Map(
      surfaces.map((surface) => [surface.id, surface.mesh.positions]),
    );
    const shapeFields = part.shapeFields?.map((field) => ({
      ...field,
      domainAccount:
        field.domainAccount.trim() === ""
          ? field.domainAccount
          : field.domainAccount +
            "; authored linear endpoint retargeting to the evaluated rest exterior; source coefficient interval retained as a computational domain, clinical and clearance support not established",
      surfaces: field.surfaces.map((member) => {
        const surface = part.surfaces.find(
          (candidate) => candidate.id === member.member,
        );
        if (surface === undefined)
          throw new Error(
            "Source exterior field has no matching member: " +
              part.id +
              "/" +
              member.member,
          );
        assertHumanBodySourceSurfaceShapeField(
          member,
          surface.mesh.positions.length / 3,
        );
        const endpoint = carry(
          surface.mesh.positions.map(
            (value, at) => value + member.displacements[at],
          ),
        );
        const neutral = baseline.get(member.member)!;
        const carried = {
          ...member,
          displacements: endpoint.map((value, at) => value - neutral[at]),
        };
        assertHumanBodySourceSurfaceShapeField(carried, neutral.length / 3);
        return carried;
      }),
    }));
    return { ...part, surfaces, shapeFields };
  });
}
