import { type AutoMovieArchetype } from "../core/index";
import { createHoseLine as createHoseLineImplementation } from "./internal/createHoseLine";

/** Public operations for Auto Movie Archetype Hose Line. */
export namespace AutoMovieArchetypeHoseLine {
  /**
   * A straight run of charged hose ending in a nozzle.
   *
   * The line runs along `+Z` from its tail at the origin to the nozzle's tip at
   * its length, at the hose's own height. `nozzle` is the nozzle operator's grip
   * on the nozzle's body; `bail` is the shut-off bail on the nozzle, a hinge
   * swung back toward the operator to open the flow, and `bailTip` its handle,
   * riding it; `backup` is the backup member's grip, `spacing` behind the nozzle,
   * riding `flex`, the line's bend at the operator's hold, which turns the run
   * behind it about the vertical to either side; `tip` is the outlet, its `+Y`
   * the stream's direction along `+Z`.
   *
   * @param params The optional scene id.
   * @returns The hose line and its contacts, metres.
   */
  export function create(params?: AutoMovieArchetypeHoseLine.IParams): AutoMovieArchetype<AutoMovieArchetypeHoseLine.Affordance, AutoMovieArchetypeHoseLine.Dimension> {
    return createHoseLineImplementation(params);
  }

  /** The nozzle grip, the bail and its handle, the backup grip and the outlet. */
  export type Affordance =
    | "nozzle"
    | "bail"
    | "bailTip"
    | "backup"
    | "tip"
    | "flex"
    | "flexPitch";

  /** The bore, the length and the mass. */
  export type Dimension = "bore" | "length" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `hose` when absent. */
    id?: string;
  }

  /** The line's size. */
  export interface ISize {
    /** The hose's trade bore, metres. */
    bore: number;

    /** The hose's outer diameter, metres. */
    outer: number;

    /** The modelled run, tail to tip, metres. */
    length: number;

    /** The nozzle's length, metres. */
    nozzle: number;

    /** The backup's grip behind the nozzle, metres. */
    spacing: number;

    /** The line's bend at the operator's hold to either side, degrees. */
    flex: number;

    /** The bail's swing, degrees. */
    bail: number;

    /** The charged run's mass, kilograms. */
    mass: number;
  }}
