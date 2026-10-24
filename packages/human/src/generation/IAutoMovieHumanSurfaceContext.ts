import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanSurfaceBoundary } from "./IAutoMovieHumanSurfaceBoundary";

/** Mutable buffers and shared boundary ownership for one body generation. */
export interface IAutoMovieHumanSurfaceContext {
  /** Skin buffers shared by all chains, in calibration millimetres. */
  mesh: AutoMovieHumanLoftMesh.IContext;
  /** Calibration chains indexed by their source graph identity. */
  chains: Map<string, IAutoMovieHumanLoftChain>;
  /** Parent/child contact events. */
  events: IAutoMovieHumanBodyCalibration.IEvent[];
  /** Calibrated poles indexed by chain name and end. */
  poles: Map<string, IAutoMovieHumanBodyCalibration.IPole>;
  /** Resolved shared boundaries indexed by chain name and end. */
  boundaries: Map<string, IAutoMovieHumanSurfaceBoundary>;
  /** Station bisection chord tolerance, millimetres. */
  tolerance: number;
  /** Opening outlines and seated eyelids prepared once for this generation. */
  apertures: AutoMovieHumanBodyApertures.IPrepared[];
  /** Original calibration index of each chain. */
  indices: Map<string, number>;
  /** Flat chain-index, station-mm and phase-radian triples per generated vertex. */
  coordinates: number[];
}
