import typia from "typia";

import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanPersonHeadShapeSource } from "../structures/IAutoMovieHumanPersonHeadShapeSource";
import { humanPersonHeadShapeFieldUnit } from "./humanPersonHeadShapeFieldUnit";

/**
 * Resolve numerical head differences through one registered body-channel owner.
 *
 * The provider's positive/negative source-unit magnitudes define signed weights.
 * Existing generation drivers carry the same endpoint into both partitions and
 * attached parts; this conversion copies no body gain or deformation equation.
 * Every present field, including zero, needs actual source registration.
 * Unsupported source bounds or duplicate raw channel authorship refuse without
 * changing the caller. The effective copy contains resolved body weights while
 * saving retains the original numerical request and clinical observations.
 */
export function createHumanPersonHeadShapeResolver(
  generation: IAutoMovieHumanPersonGeneration,
): (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonDocument {
  const source = generation.headShapeSource;
  if (source !== undefined) {
    typia.assertEquals<IAutoMovieHumanPersonHeadShapeSource>(source);
    if (source.generation !== generation.id)
      throw new Error(
        "Head numerical source registration belongs to a different generation.",
      );
  }
  const fields = new Map(source?.fields.map((field) => [field.id, field]));
  if (fields.size !== (source?.fields.length ?? 0))
    throw new Error(
      "Head numerical source registration repeats a trait identity.",
    );
  if (
    new Set([...fields.values()].map((field) => field.bodyChannel)).size !==
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
    const channel = generation.body.channels.find(
      (channel) => channel.id === field.bodyChannel,
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
  return (document) => {
    if (
      document.headShape === undefined ||
      Object.keys(document.headShape).length === 0
    )
      return document;
    const shape = { ...document.body.shape };
    for (const [id, units] of Object.entries(document.headShape)) {
      const field = source?.fields.find((field) => field.id === id);
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
    const { headShape: _resolved, ...effective } = document;
    return { ...effective, body: { ...document.body, shape } };
  };
}
