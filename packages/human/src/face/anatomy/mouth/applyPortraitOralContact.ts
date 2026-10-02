import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { fitPortraitOralContact } from "./fitPortraitOralContact";
import { retreatPortraitEnamel } from "./retreatPortraitEnamel";

/**
 * Resolve an optional, explicit oral relationship after the component interiors
 * exist. Omission retains the parts verbatim; a declared relationship must name
 * distinct resident untransformed meshes. Only enamel and lining are replaced.
 * A relationship without a cavity, as a closed mouth has none, retreats the
 * enamel behind the lips only.
 *
 * @evidence contracts/common.md#principled-implementation It resolves an explicit relationship by part identity: the lips, the enamel and, when named, the cavity are read as distinct resident head-frame meshes, fitted by `fitPortraitOralContact` (or, with no cavity, by `retreatPortraitEnamel`) and only the enamel and cavity parts are replaced, so the fit cannot touch any other part. Omission returns the parts verbatim.
 * @evidence contracts/common.md#clear-and-simple-design One adapter from part identities to the fit; no policy beyond admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No part name is special-cased: the caller names the parts.
 * @evidence contracts/common.md#meaningful-documentation The comment states omission, the admission of distinct resident untransformed meshes, which parts are replaced and the cavity-less relationship of a closed mouth.
 * @evidence contracts/modeling.md#spatial-conventions Meshes are in the head frame in metres, as the fit requires, and only untransformed, unattached meshes are admitted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function replaces two parts by identity and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary; the fit it calls does.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function beyond a named clearance.
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
