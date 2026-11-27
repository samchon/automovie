import { type AutoMovieArchetype } from "../core/index";
import { createStageBayonet as createStageBayonetImplementation } from "./internal/createStageBayonet";
import { AutoMovieArchetypeLongGun } from "./AutoMovieArchetypeLongGun";

/** Public operations for Auto Movie Archetype Stage Bayonet. */
export namespace AutoMovieArchetypeStageBayonet {
  /**
   * Fit an inert socket bayonet to a separately generated musket's muzzle.
   *
   * The blade runs along `+Y` from its shoulder at the origin to the `tip`. The
   * socket tube lies one crank toward `-Z`, behind the shoulder, with its bore
   * sized from the musket's barrel. Its `socket` frame shares the blade's axes
   * and sits on the tube's axis at its front end, so placing it on the musket's
   * `bayonet` frame slides the tube over the muzzle and hangs the blade below the
   * barrel, parallel to it. The `handle` is the tube a hand closes on to draw or
   * fix the bayonet.
   *
   * @param params A generated musket and an optional bayonet id.
   * @returns The bayonet and its model-space contact frames, in metres.
   * @throws {AutoMovieArchetypeRefusal} If the gun is not a generated musket with
   *   a barrel, or the ids coincide.
   */
  export function create(params: AutoMovieArchetypeStageBayonet.IParams): AutoMovieArchetype<
  AutoMovieArchetypeStageBayonet.Affordance,
  AutoMovieArchetypeStageBayonet.Dimension
> {
    return createStageBayonetImplementation(params);
  }

  /**
   * The socket that mates with the musket's bayonet frame, the tube a hand
   * holds, and the blade's tip.
   */
  export type Affordance = "socket" | "handle" | "tip";

  /** The blade length, the socket length and the socket's bore diameter, metres. */
  export type Dimension = "blade" | "socket" | "bore";

  /** The separately generated musket the socket fits and the bayonet's own id. */
  export interface IParams {
    /** A `createLongGun` musket whose barrel the socket slides over. */
    gun: ReturnType<typeof AutoMovieArchetypeLongGun.create>;

    /** The bayonet's own id, distinct from the musket's id. */
    id?: string;
  }

  /** The bayonet's provisional proportions, metres. */
  export interface IEstimates {
    /** The blade, shoulder to tip. */
    blade: number;

    /** The socket tube's length. */
    socket: number;

    /** The offset between the socket's axis and the blade's. */
    crank: number;

    /** The blade's width at the shoulder. */
    width: number;

    /** The socket tube's wall thickness. */
    wall: number;

    /** The clearance between the barrel and the socket's bore. */
    gap: number;
  }

  /**
   * A gallery reference fitted to the default musket.
   *
   * @returns A fresh musket input for standalone bayonet inspection.
   */
  export function REFERENCE(): Readonly<IParams> {
    return {
      gun: AutoMovieArchetypeLongGun.create({ kind: "musket", id: "bayonet-reference-musket" }),
    };
  }}
