import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";
import { fitPortraitOralContact } from "./fitPortraitOralContact";

/**
 * Resolve an optional, explicit oral relationship after the component interiors
 * exist. Omission retains the parts verbatim; a declared relationship must name
 * distinct resident untransformed meshes. Only enamel and lining are replaced.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Applies an explicitly named lips/enamel/cavity relationship without changing unrelated parts.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Admits three distinct resident untransformed meshes and replaces only the fitted enamel and lining returned by the contact solver.
 */
export function applyPortraitOralContact(
  parts: IAutoMovieModelPart[],
  contact?: { lips: string; enamel: string; cavity: string; clearance: number },
): IAutoMovieModelPart[] {
  if (contact === undefined) return parts;
  if (new Set([contact.lips, contact.enamel, contact.cavity]).size !== 3)
    throw new Error("Oral contact needs three distinct part identities.");
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
  const fitted = fitPortraitOralContact(
    read(contact.lips),
    read(contact.enamel),
    read(contact.cavity),
    contact.clearance,
  );
  return parts.map((part) =>
    part.id === contact.enamel
      ? { ...part, geometry: { type: "mesh", mesh: fitted.enamel } }
      : part.id === contact.cavity
        ? { ...part, geometry: { type: "mesh", mesh: fitted.cavity } }
        : part,
  );
}
