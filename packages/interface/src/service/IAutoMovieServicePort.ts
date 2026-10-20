import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieServiceMedium } from "./AutoMovieServiceMedium";
import { AutoMovieServicePortDirection } from "./AutoMovieServicePortDirection";
import { AutoMovieServiceUnit } from "./AutoMovieServiceUnit";

/**
 * One typed connection point on a node.
 *
 * Direction is stated **relative to the node**: `in` means the medium arrives from the network, `out` means the node puts it into the network. A tap has an `in` cold water port and a floor gully has an `out` waste port, so the same word means the same thing whether the medium is water, air, power or signal, and segments use that direction convention, also admitting explicitly bidirectional fitting ports.
 *
 * @evidence contracts/common.md#principled-implementation Ports repeat their system medium and unit, declare node-relative direction and terminal demand and anchor segment endpoints to world positions; section compatibility enforces stated cross-sectional requirements.
 * @evidence contracts/common.md#clear-and-simple-design Typed connection facts stay on the port while the node owns equipment placement and the system owns root, capacity and traversal direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Passing fittings declare zero demand to avoid counting terminal load twice, and null section imposes no inferred cross-section; port/world position must not silently move into another logical space.
 * @evidence contracts/common.md#meaningful-documentation Defines network-unique id, system/medium/unit equality, node-relative flow, demand ownership and units, nullable square-meter section and exact world anchoring.
 */
export interface IAutoMovieServicePort {
  /** Stable port identity, unique across the whole network. */
  id: string;

  /** Id of the system this port belongs to. */
  system: string;

  /** What the port carries. It must equal its system's medium. */
  medium: AutoMovieServiceMedium;

  /** Which way the port faces, relative to the node that owns it. */
  direction: AutoMovieServicePortDirection;

  /** Unit {@link demand} is stated in. It must equal its system's unit. */
  unit: AutoMovieServiceUnit;

  /**
   * Finite nonnegative terminal flow, load or bandwidth in unit. A passing tee, valve, damper or switch declares zero to avoid counting the downstream terminal's demand twice.
   *
   * It is the port's own terminal that states it: a basin states what it draws on its `in` supply port and what it discharges on its `out` waste port, so a supply system and a drainage system are each loaded by the end that actually loads them.
   */
  demand: number;

  /**
   * Internal cross-section in square metres a joining segment must match; a finite number greater than `0`, or `null` when the port imposes none.
   */
  section: number | null;

  /**
   * World position of the connection point, in metres.
   *
   * It stands inside the same logical space its node stands in. A run is anchored to this point at both ends, and a wall crossing is read between consecutive route points, so a port allowed to sit in another room would let a run terminate where its fitting is not and never appear to cross anything.
   */
  position: IAutoMovieVector3;
}
