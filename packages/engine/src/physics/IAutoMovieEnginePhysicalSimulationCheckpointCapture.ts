import type { IAutoMovieContactReceipt, IAutoMoviePhysicsCache } from "@automovie/interface";

import type { AutoMovieEngineXpbdWorld } from "./AutoMovieEngineXpbdWorld";
import type { IAutoMovieEnginePhysicalBinding } from "./IAutoMovieEnginePhysicalBinding";

/** The data the solver keeps at one completed fixed step. */
export interface IAutoMovieEnginePhysicalSimulationCheckpointCapture {
  /** Cache that receives the world, controller and balance snapshots. */
  cache: IAutoMoviePhysicsCache;
  /** Native world after the completed step. */
  world: AutoMovieEngineXpbdWorld;
  /** Binding data copied into the controller snapshot. */
  bound: Pick<
    IAutoMovieEnginePhysicalBinding,
    | "released"
    | "contactReleased"
    | "planned"
    | "supportPlanned"
    | "contactTargets"
    | "handoffs"
  >;
  /** Open contact episodes keyed by pair. */
  active: ReadonlyMap<string, IAutoMovieContactReceipt>;
  /** Tracking's softening end seconds keyed by body and bone. */
  softened: ReadonlyMap<string, number>;
  /** Completed fixed step that keys the snapshots. */
  step: number;
}
