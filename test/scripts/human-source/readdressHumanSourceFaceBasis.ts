import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceMidlinePair } from "@automovie/human/face/structures/IAutoMovieHumanFaceMidlinePair";

import type { IHumanSourceAuthoredFaceInput } from "./structures/IHumanSourceAuthoredFaceInput.ts";

/**
 * Readdress surviving facial ports by exact original-to-current lineage.
 * The provider owns coordinates, triangles, UV/material regions and endpoint
 * rows. This transports only anatomical registrations whose native identities
 * survive; a retired contact, hair root or landmark refuses by its role rather
 * than being guessed from a nearby point. Dental/proxy vertex domains stay
 * separate from the skin domain. Existing source pose/closure registrations
 * require their own source owner to reauthor them on the new root first.
 * Biological fit and performed contact remain actual-consumer observations.
 *
 */
export function readdressHumanSourceFaceBasis(
  input: IHumanSourceAuthoredFaceInput,
): IAutoMovieHumanFaceBasis {
  const old = input.face.surfaces.find((surface) => surface.id === "Human");
  if (old === undefined)
    throw new Error("Source face readdressing needs its original Human skin.");
  if (
    old.sourcePosePlan !== undefined ||
    old.sourcePartition !== undefined ||
    input.face.contact?.closure.sourceSpan !== undefined ||
    input.face.periocular !== undefined ||
    input.face.opticalSupport !== undefined ||
    input.face.oralSupport !== undefined
  )
    throw new Error(
      "New source pose/partition/closure plans must be authored by their generation owner before face readdressing.",
    );
  const current = input.skin.partition;
  const vertex = (index: number, role: string): number => {
    const mapped = current.originalFaceToHead[index];
    if (!Number.isSafeInteger(mapped) || mapped < 0)
      throw new Error(
        `Face ${role} addresses retired or absent original vertex ${index}.`,
      );
    return mapped;
  };
  const triangle = (index: number, role: string): number => {
    const cell = current.originalFaceTriangleToHead[index];
    if (!Number.isSafeInteger(cell) || cell < 0)
      throw new Error(
        `Face ${role} needs reauthoring on changed original triangle ${index}.`,
      );
    return cell;
  };
  const pair = (
    source: IAutoMovieHumanFaceMidlinePair,
    role: string,
  ): IAutoMovieHumanFaceMidlinePair =>
    source.surface !== "Human"
      ? source
      : {
          ...source,
          upper: vertex(source.upper, role),
          lower: vertex(source.lower, role),
        };
  const contact = input.face.contact;
  const surfaceIndex = input.face.surfaces.indexOf(old);
  return {
    ...input.face,
    id: `human-source-${input.generation.slice(0, 12)}-face-authoring`,
    skinLandmarks:
      input.face.skinLandmarks === undefined
        ? undefined
        : Object.fromEntries(
            Object.entries(input.face.skinLandmarks).map(([name, point]) => [
              name,
              point.surface !== surfaceIndex
                ? point
                : { ...point, vertex: vertex(point.vertex, name) },
            ]),
          ),
    skinRegions:
      input.face.skinRegions === undefined
        ? undefined
        : Object.fromEntries(
            Object.entries(input.face.skinRegions).map(([name, region]) => [
              name,
              region.surface !== surfaceIndex
                ? region
                : {
                    ...region,
                    vertices: region.vertices
                      .map((point) => vertex(point, name))
                      .sort((a, b) => a - b),
                  },
            ]),
          ),
    contact:
      contact === undefined
        ? undefined
        : {
            ...contact,
            lips: pair(contact.lips, "lip midline"),
            incisors: pair(contact.incisors, "incisor midline"),
            margin:
              contact.margin === undefined || contact.lips.surface !== "Human"
                ? contact.margin
                : {
                    upper: contact.margin.upper.map((point) =>
                      vertex(point, "upper lip margin"),
                    ),
                    lower: contact.margin.lower.map((point) =>
                      vertex(point, "lower lip margin"),
                    ),
                  },
            colliders: contact.colliders.map((collider) =>
              collider.surface !== "Human"
                ? collider
                : {
                    ...collider,
                    closure: collider.closure.map((point) =>
                      vertex(point, "collider closure"),
                    ),
                  },
            ),
          },
    surfaces: input.face.surfaces.map((surface) =>
      surface !== old
        ? surface
        : {
            ...surface,
            positions: Array.from(input.skin.headPositions),
            indices: Array.from(current.headIndices),
            targets: input.targets,
            regions: input.regions,
            hairDomains: surface.hairDomains?.map((domain) => ({
              ...domain,
              triangles: domain.triangles
                .map((cell) => triangle(cell, `hair domain ${domain.id}`))
                .sort((a, b) => a - b),
            })),
            hairContactClosure: surface.hairContactClosure?.map((point) =>
              vertex(point, "hair contact closure"),
            ),
            attachments: surface.attachments?.map((attachment) => {
              if (attachment.owner !== "jaw")
                throw new Error(
                  `Current skin attachment ${attachment.owner} lacks its native source owner.`,
                );
              const rows: number[] = [];
              input.skin.headAttachments.forEach((support, vertex) => {
                const weight =
                  support.find(([owner]) => owner === "jaw")?.[1] ?? 0;
                if (weight > 0) rows.push(vertex, weight);
              });
              return { ...attachment, rows };
            }),
          },
    ),
  };
}
