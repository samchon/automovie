import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { AutoMovieArchetypeStageFencingProp } from "./AutoMovieArchetypeStageFencingProp";
import { AutoMovieArchetypeStagePracticeSwordProp } from "./AutoMovieArchetypeStagePracticeSwordProp";
import { AutoMovieArchetypeStageTwoHandedSwordProp } from "./AutoMovieArchetypeStageTwoHandedSwordProp";
import type { IArchetypeDispatch } from "../core/IArchetypeDispatch";

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
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      createStageBladeProp.Kind,
      IArchetypeDispatch<
        Omit<createStageBladeProp.IParams, "kind">,
        AutoMovieArchetype<createStageBladeProp.Affordance, createStageBladeProp.Dimension>
      >
    >
  > = {
    foil: { build: AutoMovieArchetypeStageFencingProp.create },
    epee: { build: AutoMovieArchetypeStageFencingProp.create },
    sabre: { build: AutoMovieArchetypeStageFencingProp.create },
    shinai: { build: AutoMovieArchetypeStagePracticeSwordProp.create },
    longsword: { build: AutoMovieArchetypeStageTwoHandedSwordProp.create },
  };
  return variants[kind].build(params, seed);
}

/** Authoring controls for the padded blade silhouette. */
export namespace createStageBladeProp {
  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get foil(): typeof AutoMovieArchetypeStageFencingProp.create {
      return AutoMovieArchetypeStageFencingProp.create;
    },
    get epee(): typeof AutoMovieArchetypeStageFencingProp.create {
      return AutoMovieArchetypeStageFencingProp.create;
    },
    get sabre(): typeof AutoMovieArchetypeStageFencingProp.create {
      return AutoMovieArchetypeStageFencingProp.create;
    },
    get shinai(): typeof AutoMovieArchetypeStagePracticeSwordProp.create {
      return AutoMovieArchetypeStagePracticeSwordProp.create;
    },
    get longsword(): typeof AutoMovieArchetypeStageTwoHandedSwordProp.create {
      return AutoMovieArchetypeStageTwoHandedSwordProp.create;
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
