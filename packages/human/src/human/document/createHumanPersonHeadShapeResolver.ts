import typia from "typia";

import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanPersonHeadShapeSource } from "../structures/IAutoMovieHumanPersonHeadShapeSource";
import { humanPersonHeadShapeFieldUnit } from "./humanPersonHeadShapeFieldUnit";

/**
 * Resolve numerical head differences through one registered body-channel owner.
 *
 * Registered positive/negative source-unit magnitudes convert finite signed millimetre/degree differences into one body channel's signed weight. Actual unit identity, finite source support, unique trait/channel ownership and endpoint envelope are admitted when compiling. Every present field, including zero, needs registration; unsupported differences or simultaneous raw-channel authorship refuse.
 *
 * Inputs remain unchanged. Empty requests return the original document; nonempty requests return shallow document/body wrappers and a copied shape with headShape removed after conversion. Registration records and channels remain borrowed and must not mutate during resolver lifetime. A nonempty provider qualification is metadata, not a re-evaluated clinical or geometric proof; actual deformation and driver propagation stay downstream.
 *
 * @evidence contracts/common.md#principled-implementation Public trait units and actual signed endpoint magnitudes map source-supported differences to the registered body's single channel owner.
 * @evidence contracts/common.md#clear-and-simple-design Registration/envelope admission compiles separately from per-document conversion; body endpoint gains, geometry and attached-part propagation stay with existing generation owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit zero still needs a registered field, duplicate raw authorship refuses, and provider qualification text is not advertised as reproduced clinical/geometry validation.
 * @evidence contracts/common.md#meaningful-documentation Prose states source units, signed magnitudes, request removal in effective output, borrowed-registration purity and validation boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Compile-time field admission scans K fields and searches C body channels per field; each document copies shape keys and searches K registrations for each requested trait before fixed conversion.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted registration serves all unchanged-generation requests; the existing body channel remains the sole deformation owner rather than duplicating its gain equations here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains generation/source fields and compiled trait map until dropped; effective wrappers/shape belong to the caller, with no task, mesh cache or independently retained clinical data.
 */
export function createHumanPersonHeadShapeResolver(
  generation: IAutoMovieHumanPersonGeneration,
): (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonDocument {
  const source: IAutoMovieHumanPersonGeneration["headShapeSource"] = generation.headShapeSource;
  if (source !== undefined) {
    typia.assertEquals<IAutoMovieHumanPersonHeadShapeSource>(source);
    if (source.generation !== generation.id)
      throw new Error(
        "Head numerical source registration belongs to a different generation.",
      );
  }
  const fields: Map<IAutoMovieHumanPersonHeadShapeSource["fields"][number]["id"], IAutoMovieHumanPersonHeadShapeSource["fields"][number]> = new Map(source?.fields.map((field: IAutoMovieHumanPersonHeadShapeSource["fields"][number]): [typeof field.id, typeof field] => [field.id, field]));
  if (fields.size !== (source?.fields.length ?? 0))
    throw new Error(
      "Head numerical source registration repeats a trait identity.",
    );
  if (
    new Set([...fields.values()].map((field: IAutoMovieHumanPersonHeadShapeSource["fields"][number]): string => field.bodyChannel)).size !==
    fields.size
  )
    throw new Error(
      "Head numerical source traits must have distinct body-channel owners.",
    );
  for (const field of fields.values()) {
    if (field.unit !== humanPersonHeadShapeFieldUnit(field.id))
      throw new Error(
        "Head numerical trait unit disagrees with its public input: " +
          field.id +
          ".",
      );
    if (
      ![
        field.minimum,
        field.maximum,
        field.positiveUnitsPerWeight,
        field.negativeUnitsPerWeight,
      ].every(Number.isFinite) ||
      field.minimum > 0 ||
      field.maximum < 0 ||
      field.minimum > field.maximum ||
      field.positiveUnitsPerWeight <= 0 ||
      field.negativeUnitsPerWeight <= 0
    )
      throw new Error(
        "Head numerical trait needs finite signed support and positive unit magnitudes: " +
          field.id +
          ".",
      );
    const channel: IAutoMovieHumanPersonGeneration["body"]["channels"][number] | undefined = generation.body.channels.find(
      (channel: IAutoMovieHumanPersonGeneration["body"]["channels"][number]): boolean => channel.id === field.bodyChannel,
    );
    if (
      channel === undefined ||
      channel.positive !== field.positiveEndpoint ||
      channel.negative !== field.negativeEndpoint
    )
      throw new Error(
        "Head numerical trait needs its actual body endpoint owner: " +
          field.id +
          ".",
      );
    if (
      field.minimum / field.negativeUnitsPerWeight < channel.minimum ||
      field.maximum / field.positiveUnitsPerWeight > channel.maximum ||
      (field.minimum < 0 && field.negativeEndpoint === null)
    )
      throw new Error(
        "Head numerical source support exceeds its actual signed channel envelope: " +
          field.id +
          ".",
      );
    if (field.qualification.trim() === "")
      throw new Error(
        "Head numerical trait must declare its source qualification: " +
          field.id +
          ".",
      );
  }
  return (document: IAutoMovieHumanPersonDocument): IAutoMovieHumanPersonDocument => {
    if (
      document.headShape === undefined ||
      Object.keys(document.headShape).length === 0
    )
      return document;
    const shape: IAutoMovieHumanPersonDocument["body"]["shape"] = { ...document.body.shape };
    for (const [id, units] of Object.entries(document.headShape)) {
      const field: IAutoMovieHumanPersonHeadShapeSource["fields"][number] | undefined = source?.fields.find((field: IAutoMovieHumanPersonHeadShapeSource["fields"][number]): boolean => field.id === id);
      if (field === undefined)
        throw new Error(
          "Head numerical field unavailable in this source generation: " +
            id +
            ".",
        );
      if (
        typeof units !== "number" ||
        !Number.isFinite(units) ||
        units < field.minimum ||
        units > field.maximum
      )
        throw new Error(
          `Head numerical field ${id} lies outside source support [${field.minimum}, ${field.maximum}] ${field.unit}.`,
        );
      if (document.body.shape[field.bodyChannel] !== undefined)
        throw new Error(
          "Head numerical field and raw body channel cannot author the same trait: " +
            id +
            ".",
        );
      if (units < 0 && field.negativeEndpoint === null)
        throw new Error(
          "Head numerical field has no negative source endpoint: " + id + ".",
        );
      shape[field.bodyChannel] =
        units /
        (units < 0
          ? field.negativeUnitsPerWeight
          : field.positiveUnitsPerWeight);
    }
    const { headShape: _resolved, ...effective }: IAutoMovieHumanPersonDocument = document;
    return { ...effective, body: { ...document.body, shape } };
  };
}
