import type { IAutoMovieHumanBodyHumeralHead } from "@automovie/human";

import type { ConnectedBodyResult } from "./connectedBodyProtocol";

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
 */
export function packHumanBodyHumeralHeadReading(
  heads: readonly IAutoMovieHumanBodyHumeralHead[],
  clearances: readonly {
    id: string;
    centerInside: boolean;
    nearestMetres: number;
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
