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
 *
 * @evidence contracts/common.md#principled-implementation Mapping both endpoints defines a linear retargeted field whose volume remains a cubic in the same coefficient, so the existing solver can prove reach and monotonicity on the actual evaluated geometry.
 * @evidence contracts/common.md#clear-and-simple-design One exterior map carries baseline and unit endpoint before the existing quantity solve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same rule applies to every member and field; no requested quantity changes the exterior map or the coefficient interval.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes endpoint retargeting from nonlinear coefficient transport and computational support from clinical clearance.
 * @evidence contracts/modeling.md#parameter-channels Dimensionless field coefficients preserve zero and their source interval while their metre displacements are derived in the evaluated exterior frame.
 * @evidence contracts/modeling.md#spatial-conventions Baseline, endpoint and difference use common rest metres.
 * @evidence contracts/modeling.md#shared-boundaries Held vertices whose source displacement is zero take the identical exterior point at both endpoints.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Existing part and member identities pass through unchanged.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function moves existing source vertices and retains all indices.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly and person consumers observe these fields.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source recipe owns tissue quantities and field meaning.
 * @evidenceExclude contracts/anatomy.md#permitted-range The quantity solver checks computational reach and monotonicity; anatomical support remains with the source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This runtime preparation exposes no personal source arrays.
 */
export function carryHumanBodySourceFields(
  parts: readonly IAutoMovieHumanBodySourcePart[],
  carry: (positions: readonly number[]) => number[],
): readonly IAutoMovieHumanBodySourcePart[] {
  return parts.map((part) => {
    const carrySurface = (surface: IAutoMovieHumanBodySourcePartSurface): IAutoMovieHumanBodySourcePartSurface => {
      const positions = carry(surface.mesh.positions);
      // Source directions remain archival data here. The resident owner
      // computes geometric normals after selecting actual triangle vertices;
      // an unused source ordinal has no incident normal to compute.
      return { ...surface, mesh: { ...surface.mesh, positions } };
    };
    const surfaces: IAutoMovieHumanBodySourcePart["surfaces"] = [carrySurface(part.surfaces[0]), ...part.surfaces.slice(1).map(carrySurface)];
    const baseline = new Map(surfaces.map((surface) => [surface.id, surface.mesh.positions]));
    const shapeFields = part.shapeFields?.map((field) => ({
      ...field,
      domainAccount: field.domainAccount.trim() === "" ? field.domainAccount : field.domainAccount + "; authored linear endpoint retargeting to the evaluated rest exterior; source coefficient interval retained as a computational domain, clinical and clearance support not established",
      surfaces: field.surfaces.map((member) => {
        const surface = part.surfaces.find((candidate) => candidate.id === member.member);
        if (surface === undefined) throw new Error("Source exterior field has no matching member: " + part.id + "/" + member.member);
        assertHumanBodySourceSurfaceShapeField(member, surface.mesh.positions.length / 3);
        const endpoint = carry(surface.mesh.positions.map((value, at) => value + member.displacements[at]));
        const neutral = baseline.get(member.member)!;
        const carried = { ...member, displacements: endpoint.map((value, at) => value - neutral[at]) };
        assertHumanBodySourceSurfaceShapeField(carried, neutral.length / 3);
        return carried;
      }),
    }));
    return { ...part, surfaces, shapeFields };
  });
}
