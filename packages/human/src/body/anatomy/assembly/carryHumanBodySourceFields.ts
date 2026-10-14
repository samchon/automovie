import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodySourcePartSurface } from "./IAutoMovieHumanBodySourcePartSurface";
import type { IAutoMovieHumanBodySourceShapeField } from "./IAutoMovieHumanBodySourceShapeField";
import type { IAutoMovieHumanBodySourceSurfaceShapeField } from "./IAutoMovieHumanBodySourceSurfaceShapeField";
import { assertHumanBodySourceSurfaceShapeField } from "./assertHumanBodySourceSurfaceShapeField";

/**
 * Carry a source baseline and its linear freedoms into one shaped exterior.
 *
 * The baseline and each field's unit endpoint take the same exterior map. Their difference defines a new linear field in the evaluated rest frame. This is authored endpoint retargeting, not the nonlinear map of every intermediate source coefficient. The producer's dimensionless coefficient interval remains the computational domain; the quantity solver rereads its actual volume reach and monotonicity in this frame. Clinical and tissue clearance support do not follow from that interval.
 *
 * Zero-displacement held vertices remain zero because their two endpoints coincide. Original source arrays, receipts and compiled geometry digests are retained at their original owner; these temporary meshes are consumed by the quantity solver before posing rather than warped after it.
 *
 * @evidence contracts/common.md#principled-implementation Mapping baseline/unit endpoints through one exterior gives a new linear difference field; original and carried held-zero attachments are admitted separately.
 * @evidence contracts/common.md#clear-and-simple-design A per-part baseline map joins fields to carried members, then the quantity owner rechecks actual volume reach before posing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint retargeting is an authored linear approximation, without asserting nonlinear coefficient images or retained clinical/clearance validity.
 * @evidence contracts/common.md#meaningful-documentation Comments explain computational coefficient support, held attachments, unchanged provenance and solve-before-pose ordering.
 * @evidence contracts/performance.md#efficient-algorithms Baseline/field vertex counts drive mapping work and output bytes; local member searches add surface scans, without rebuilding every intermediate coefficient mesh.
 * @evidence contracts/performance.md#reuse-equivalent-work Each carried baseline serves its member fields; the exterior mapper can reuse correspondence while endpoints retain distinct values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Baseline maps/endpoints are temporary; returned derivatives own new positions/displacements and original arrays/receipts retain their source owner.
 */
export function carryHumanBodySourceFields(
  parts: readonly IAutoMovieHumanBodySourcePart[],
  carry: (positions: readonly number[]) => number[],
): readonly IAutoMovieHumanBodySourcePart[] {
  return parts.map(
    (part: IAutoMovieHumanBodySourcePart): IAutoMovieHumanBodySourcePart => {
      const carrySurface: (
        surface: IAutoMovieHumanBodySourcePartSurface,
      ) => IAutoMovieHumanBodySourcePartSurface = (
        surface: IAutoMovieHumanBodySourcePartSurface,
      ): IAutoMovieHumanBodySourcePartSurface => {
        const positions: number[] = carry(surface.mesh.positions);
        // Source directions remain archival data here. The resident owner
        // computes geometric normals after selecting actual triangle vertices;
        // an unused source ordinal has no incident normal to compute.
        return { ...surface, mesh: { ...surface.mesh, positions } };
      };
      const surfaces: IAutoMovieHumanBodySourcePart["surfaces"] = [
        carrySurface(part.surfaces[0]),
        ...part.surfaces.slice(1).map(carrySurface),
      ];
      const baseline: Map<string, number[]> = new Map(
        surfaces.map(
          (
            surface: IAutoMovieHumanBodySourcePartSurface,
          ): [string, number[]] => [surface.id, surface.mesh.positions],
        ),
      );
      const shapeFields: IAutoMovieHumanBodySourceShapeField[] | undefined =
        part.shapeFields?.map(
          (
            field: IAutoMovieHumanBodySourceShapeField,
          ): IAutoMovieHumanBodySourceShapeField => ({
            ...field,
            domainAccount:
              field.domainAccount.trim() === ""
                ? field.domainAccount
                : field.domainAccount +
                  "; authored linear endpoint retargeting to the evaluated rest exterior; source coefficient interval retained as a computational domain, clinical and clearance support not established",
            surfaces: field.surfaces.map(
              (
                member: IAutoMovieHumanBodySourceSurfaceShapeField,
              ): IAutoMovieHumanBodySourceSurfaceShapeField => {
                const surface:
                  | IAutoMovieHumanBodySourcePartSurface
                  | undefined = part.surfaces.find(
                  (candidate: IAutoMovieHumanBodySourcePartSurface): boolean =>
                    candidate.id === member.member,
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
                const endpoint: number[] = carry(
                  surface.mesh.positions.map(
                    (value: number, at: number): number =>
                      value + member.displacements[at],
                  ),
                );
                const neutral: number[] = baseline.get(member.member)!;
                const carried: IAutoMovieHumanBodySourceSurfaceShapeField = {
                  ...member,
                  displacements: endpoint.map(
                    (value: number, at: number): number => value - neutral[at],
                  ),
                };
                assertHumanBodySourceSurfaceShapeField(
                  carried,
                  neutral.length / 3,
                );
                return carried;
              },
            ),
          }),
        );
      return { ...part, surfaces, shapeFields };
    },
  );
}
