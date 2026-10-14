import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { fitPortraitOralContact } from "./fitPortraitOralContact";
import { retreatPortraitEnamel } from "./retreatPortraitEnamel";

/**
 * Resolve an optional, explicit oral relationship after the component interiors exist. Omission retains the parts verbatim; a declared relationship must name distinct resident untransformed meshes. Only enamel and lining are replaced. A relationship without a cavity, as a closed mouth has none, retreats the enamel behind the lips only.
 *
 * @evidence contracts/common.md#principled-implementation Distinct resident untransformed oral meshes select directional enamel retreat and optional cavity fitting.
 * @evidence contracts/common.md#clear-and-simple-design Omitted relationships return original parts; declared relationships replace only owned enamel/lining geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/duplicate/attached parts refuse rather than changing frames, and directional fitting does not prove arbitrary volume nonintersection.
 * @evidence contracts/common.md#meaningful-documentation Head-frame metre meshes and explicit construction clearance remain authoritative.
 * @evidence contracts/performance.md#efficient-algorithms Named lookup scans parts per relationship, followed by triangle directional measurement and one result map.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared retreat/fitting owners supply the same relationship policy to standalone and assembled calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Unchanged parts stay borrowed; fitted enamel/cavity meshes are owned copies and caller buffers remain unchanged.
 */
export function applyPortraitOralContact(
  parts: IAutoMovieModelPart[],
  contact?: {
    lips: string;
    enamel: string;
    cavity?: string;
    clearance: number;
  },
): IAutoMovieModelPart[] {
  if (contact === undefined) return parts;
  const named: string[] =
    contact.cavity === undefined
      ? [contact.lips, contact.enamel]
      : [contact.lips, contact.enamel, contact.cavity];
  if (new Set(named).size !== named.length)
    throw new Error("Oral contact needs distinct part identities.");
  const read: (id: string) => IAutoMovieMesh = (id: string): IAutoMovieMesh => {
    const matches: IAutoMovieModelPart[] = parts.filter(
      (part: IAutoMovieModelPart): boolean => part.id === id,
    );
    const part: IAutoMovieModelPart = matches[0];
    if (
      matches.length !== 1 ||
      part.geometry.type !== "mesh" ||
      part.transform !== null ||
      part.attachedBone !== null
    )
      throw new Error(
        `Oral contact needs resident mesh ${id} in the head frame.`,
      );
    return part.geometry.mesh;
  };
  const enamel: IAutoMovieMesh = read(contact.enamel);
  const fitted:
    | { enamel: IAutoMovieMesh; cavity: IAutoMovieMesh }
    | { enamel: IAutoMovieMesh; cavity: undefined } =
    contact.cavity === undefined
      ? {
          enamel: retreatPortraitEnamel(
            read(contact.lips),
            enamel,
            contact.clearance,
          ),
          cavity: undefined,
        }
      : fitPortraitOralContact(
          read(contact.lips),
          enamel,
          read(contact.cavity),
          contact.clearance,
        );
  return parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart =>
      part.id === contact.enamel
        ? { ...part, geometry: { type: "mesh", mesh: fitted.enamel } }
        : part.id === contact.cavity && fitted.cavity !== undefined
          ? { ...part, geometry: { type: "mesh", mesh: fitted.cavity } }
          : part,
  );
}
