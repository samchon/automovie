import type { IAutoMovieHumanBodyHumeralHead } from "../anatomy/shoulder/IAutoMovieHumanBodyHumeralHead";
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
 *
 * @evidence contracts/common.md#principled-implementation A unique bone-ID map pairs each source radius with exactly one clearance and copies acquisition metadata only from the observed radius branch.
 * @evidence contracts/common.md#clear-and-simple-design This transport adapter owns identity pairing; sphere/radius producers retain numerical validation and skin measurement responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reordered clearances cannot switch shoulders, duplicate or missing identities refuse, and unobserved sources receive no invented imaging record.
 * @evidence contracts/common.md#meaningful-documentation The prose states identity failures, source provenance, input immutability and the difference between numerical fit and clinical validity.
 * @evidence contracts/performance.md#efficient-algorithms Building the ID map and unique-head set and packing H heads cost expected O(H) time and O(H) storage rather than repeated linear clearance searches.
 * @evidence contracts/performance.md#reuse-equivalent-work One map serves all heads in the call; completed clearance values are reused without remeasuring skin, and mutable input arrays prevent cross-call caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned scalar/source records and copied observation objects belong to the caller; temporary map/set storage expires on completion or refusal and no geometry handle is retained.
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
  const byId: Map<string, (typeof clearances)[number]> = new Map(
    clearances.map(
      (
        clearance: (typeof clearances)[number],
      ): [string, (typeof clearances)[number]] => [clearance.id, clearance],
    ),
  );
  if (
    heads.length !== clearances.length ||
    byId.size !== clearances.length ||
    new Set(
      heads.map(
        (
          head: IAutoMovieHumanBodyHumeralHead,
        ): IAutoMovieHumanBodyHumeralHead["bone"] => head.bone,
      ),
    ).size !== heads.length
  )
    throw new Error(
      "Each humeral head needs exactly one skin-clearance result.",
    );
  return {
    status: "measured",
    heads: heads.map(
      (head: IAutoMovieHumanBodyHumeralHead): Reading["heads"][number] => {
        const clearance: (typeof clearances)[number] | undefined = byId.get(
          head.bone,
        );
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
      },
    ),
  };
}
