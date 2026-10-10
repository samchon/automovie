import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { fitPortraitOralContact } from "./fitPortraitOralContact";
import { retreatPortraitEnamel } from "./retreatPortraitEnamel";

/**
 * Resolve an optional, explicit oral relationship after the component interiors
 * exist. Omission retains the parts verbatim; a declared relationship must name
 * distinct resident untransformed meshes. Only enamel and lining are replaced.
 * A relationship without a cavity, as a closed mouth has none, retreats the
 * enamel behind the lips only.
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
  const named =
    contact.cavity === undefined
      ? [contact.lips, contact.enamel]
      : [contact.lips, contact.enamel, contact.cavity];
  if (new Set(named).size !== named.length)
    throw new Error("Oral contact needs distinct part identities.");
  const read = (id: string): IAutoMovieMesh => {
    const matches = parts.filter((part) => part.id === id);
    const part = matches[0];
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
  const enamel = read(contact.enamel);
  const fitted =
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
  return parts.map((part) =>
    part.id === contact.enamel
      ? { ...part, geometry: { type: "mesh", mesh: fitted.enamel } }
      : part.id === contact.cavity && fitted.cavity !== undefined
        ? { ...part, geometry: { type: "mesh", mesh: fitted.cavity } }
        : part,
  );
}
