import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { findHumanSourceLipMarginPairs } from "./findHumanSourceLipMarginPairs.ts";
import { buildHumanSourceLipMarginChain } from "./buildHumanSourceLipMarginChain.ts";
import type { IHumanSourceLipMarginChain } from "./structures/IHumanSourceLipMarginChain.ts";

/**
 * Register the contact owner's vermilion chains on the current source skin.
 * Current positions, lips-region incidence, jaw axis and central contact ports
 * are explicit prerequisites. The existing pair and edge-path owners retain
 * their authored sampling convention and all refusal conditions. Source
 * preparation and P1 publication call this same registration, so a legacy
 * face need not carry a field that P1 only creates after source preparation.
 * This registration does not seal lips or supply clinical resting geometry.
 */
export function registerHumanSourceLipMargin(face: IAutoMovieHumanFaceBasis, positions: readonly number[]): IHumanSourceLipMarginChain {
  const contact = face.contact;
  const surface = face.surfaces.find((one) => one.id === contact?.lips.surface);
  const region = surface?.regions.find((one) => one.id.endsWith("/lips"));
  if (contact === undefined || surface === undefined || region === undefined || face.articulation === undefined || positions.length !== surface.positions.length)
    throw new Error("Source lip margin registration needs current contact skin, vermilion incidence and articulation.");
  const margin = findHumanSourceLipMarginPairs(positions, region.indices, face.articulation.jaw.axis);
  return buildHumanSourceLipMarginChain(positions, region.indices, face.articulation.jaw.axis, margin, contact.lips);
}
