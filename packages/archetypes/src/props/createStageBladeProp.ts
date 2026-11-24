import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { createStageFencingProp } from "./createStageFencingProp";
import { createStagePracticeSwordProp } from "./createStagePracticeSwordProp";
import { createStageTwoHandedSwordProp } from "./createStageTwoHandedSwordProp";

/**
 * A digital padded blade silhouette for sport or theatrical staging. The handle
 * starts at the origin and the broad rounded end points along +Y. The color
 * bands identify the visual ends of the inert shaft. The point and, on the
 * cutting silhouettes, the edge of the striking part are the contact regions a
 * touch or a strike reads.
 *
 * @param params The silhouette, scene id, and optional overall length in
 *   metres.
 * @param seed The optional draw seed.
 * @returns The padded model, its named grip approached from -Z, its point and
 *   any edge.
 * @throws {AutoMovieArchetypeRefusal} When the silhouette or length is
 *   inadmissible.
 */
export function createStageBladeProp(
  params: createStageBladeProp.IParams,
  seed?: number,
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
      seed?: number,
    ): AutoMovieArchetype<
      createStageBladeProp.Affordance,
      createStageBladeProp.Dimension
    >;
  }["build"];
  // The selected producer validates its options from the saved parameter union.
  const produce: Producer = createStageBladeProp.PRODUCERS[kind] as Producer;
  return produce(params, seed);
}

/** Authoring controls for the padded blade silhouette. */
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

  /** A foil, épée, sabre, shinai or longsword display silhouette. */
  export type Kind = (typeof KINDS)[number];

  /**
   * The affordance ids:
   *
   * - `grip`: the shaft handle for posing the performer, approached from `-Z`.
   * - `point`: the tip of the end cap, facing along `+Y`, the contact a thrust or
   *   a touch is read from.
   * - `edge`: on a sabre and a shinai only, the striking part's edge on the `+Z`
   *   side, facing `+Z`, as long as that part.
   */
  export type Affordance = "grip" | "point" | "edge";

  /** Length in metres along the prop's +Y axis. */
  export type Dimension = "length";

  /** A stage silhouette, optional size and model identity. */
  export interface IParams {
    /** The padded silhouette. */
    kind: Kind;

    /** Scene-unique model id. */
    id?: string;

    /** Overall length in metres. Defaults to the selected silhouette's length. */
    length?: number;
  }
}
