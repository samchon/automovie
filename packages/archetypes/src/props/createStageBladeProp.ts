import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { createStageFencingProp } from "./createStageFencingProp";
import { createStagePracticeSwordProp } from "./createStagePracticeSwordProp";
import { createStageTwoHandedSwordProp } from "./createStageTwoHandedSwordProp";

/**
 * A digital padded blade silhouette for sport or theatrical staging.
 * The handle starts at the origin and the broad rounded end points along
 * +Y. The color bands identify the visual ends of the inert shaft. The point
 * and, on the cutting silhouettes, the edge of the striking part are the
 * contact regions a touch or a strike reads.
 *
 * @param params The silhouette, scene id, and optional overall length in metres.
 * @param seed The optional draw seed.
 * @returns The padded model, its named grip approached from -Z, its point and any edge.
 * @throws {AutoMovieArchetypeRefusal} When the silhouette or length is inadmissible.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the visual frame, size and handle, and names the two admission failures.
 * @evidence contracts/development/implementation.md#principled-implementation The saved kind selects its canonical producer and retains its original profile data and actor contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Validates the legacy selector and calls the selected profile once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Profiles are display choices. There are no flight, cutting or damage parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each admitted model creates a fixed number of primitives and at most three affordances.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The builder records the same padded surfaces for display and geometry queries.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result owns its generated data and the producer retains no per-model state.
 */
export function createStageBladeProp(
  params: createStageBladeProp.IParams,
  seed?: number | string,
): AutoMovieArchetype<
  createStageBladeProp.Affordance,
  createStageBladeProp.Dimension
> {
  const kind: createStageBladeProp.Kind = ArchetypeDraw.choice(
    "stageBladeProp",
    "kind",
    params.kind,
    createStageBladeProp.KINDS,
  );
  /** The legacy surface accepts a broad selector before runtime admission. */
  type Producer = {
    build(
      params: createStageBladeProp.IParams,
      seed?: number | string,
    ): AutoMovieArchetype<
      createStageBladeProp.Affordance,
      createStageBladeProp.Dimension
    >;
  }["build"];
  // The selected producer validates its options from the saved parameter union.
  const produce: Producer = createStageBladeProp.PRODUCERS[kind] as Producer;
  return produce(params, seed);
}

/**
 * Authoring controls for the padded blade silhouette.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the five forms, metre scale, named grip and contact regions.
 * @evidence contracts/development/design.md#principled-representation A closed silhouette union uses a single scale independent of scene identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the chosen form, its length, the common hold name and the point and edge the blade actions read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The shared draw session rejects inadmissible values. The form contains no material or striking properties.
 */
export namespace createStageBladeProp {
  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get foil(): typeof createStageFencingProp {
      return createStageFencingProp;
    },
    get epee(): typeof createStageFencingProp {
      return createStageFencingProp;
    },
    get sabre(): typeof createStageFencingProp {
      return createStageFencingProp;
    },
    get shinai(): typeof createStagePracticeSwordProp {
      return createStagePracticeSwordProp;
    },
    get longsword(): typeof createStageTwoHandedSwordProp {
      return createStageTwoHandedSwordProp;
    },
  } satisfies Readonly<Record<Kind, unknown>>;

  /** Ordered silhouette names in the digital prop catalogue. */
  export const KINDS = [
    "foil",
    "epee",
    "sabre",
    "shinai",
    "longsword",
  ] as const;

  /**
   * A foil, épée, sabre, shinai or longsword display silhouette.
   */
  export type Kind = (typeof KINDS)[number];

  /**
   * The affordance ids:
   *
   * - `grip`: the shaft handle for posing the performer, approached from `-Z`.
   * - `point`: the tip of the end cap, facing along `+Y`, the contact a thrust or a touch is read from.
   * - `edge`: on a sabre and a shinai only, the striking part's edge on the `+Z` side, facing `+Z`, as long as that part.
   */
  export type Affordance = "grip" | "point" | "edge";

  /**
   * Length in metres along the prop's +Y axis.
   */
  export type Dimension = "length";

  /**
   * A stage silhouette, optional size and model identity.
   */
  export interface IParams {
    /** The padded silhouette. */
    kind: Kind;

    /** Scene-unique model id. */
    id?: string;

    /** Overall length in metres. Defaults to the selected silhouette's length. */
    length?: number;
  }
}
