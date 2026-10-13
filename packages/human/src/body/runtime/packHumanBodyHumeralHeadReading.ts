import type { IAutoMovieHumanBodyHumeralHead } from "../../index";

import type { ConnectedBodyResult } from "./ConnectedBodyResult";

type Reading = Extract<
  NonNullable<
    Extract<ConnectedBodyResult, { operation: "preview" }>["anatomy"]
  >,
  { status: "measured" }
>;

/**
 * Pair one radius source with exactly one clearance and retain acquisition.
 *
 * Results match by bone ID, so a reordered clearance cannot be attributed
 * to the opposite shoulder. The worker sends CT/MRI posture only for a
 * genuinely observed radius. A fictional target and a legacy radius cannot
 * acquire invented imaging provenance in the preview message.
 *
 * Inputs are read without mutation. Duplicate, mismatched or missing bone
 * identities throw before a reading is returned. Clearance and radius validity
 * remain with their numerical producers; this adapter neither remeasures skin
 * nor establishes clinical validity.
 */
export function packHumanBodyHumeralHeadReading(
  heads: readonly IAutoMovieHumanBodyHumeralHead[],
  clearances: readonly {
    /** The humeral bone identity paired with exactly one radius reading. */
    id: string;

    /** Whether the centre lies in exactly one admitted posed skin solid. */
    centerInside: boolean;

    /** Minimum Euclidean centre-to-skin distance in metres, including the skin owner's caps. */
    nearestMetres: number;

    /** Signed sphere-to-skin room in metres: positive inside, zero contact, negative protrusion. */
    clearanceMetres: number;
  }[],
): Reading {
  const byId = new Map(
    clearances.map((clearance) => [clearance.id, clearance]),
  );
  if (
    heads.length !== clearances.length ||
    byId.size !== clearances.length ||
    new Set(heads.map((head) => head.bone)).size !== heads.length
  )
    throw new Error(
      "Each humeral head needs exactly one skin-clearance result.",
    );
  return {
    status: "measured",
    heads: heads.map((head) => {
      const clearance = byId.get(head.bone);
      if (clearance === undefined)
        throw new Error("Missing skin-clearance result for " + head.bone);
      return {
        bone: head.bone,
        radiusMetres: head.radiusMetres,
        ...(head.source === "observed"
          ? { source: head.source, observation: { ...head.observation } }
          : { source: head.source }),
        centerInside: clearance.centerInside,
        nearestMetres: clearance.nearestMetres,
        clearanceMetres: clearance.clearanceMetres,
      };
    }),
  };
}
