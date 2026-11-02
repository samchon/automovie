import type { AutoMovieHumanMeasurementProtocol as Protocol } from "./AutoMovieHumanMeasurementProtocol";
import type { AutoMovieHumanThoracicCourse as Course } from "./AutoMovieHumanThoracicCourse";
import type { AutoMovieHumanSkinCourse as SkinCourse } from "./AutoMovieHumanSkinCourse";
import type { AutoMovieHumanBodySurface as Surface } from "./AutoMovieHumanBodySurface";
import type { AutoMovieHumanSurfaceCorrespondence as Correspondence } from "./AutoMovieHumanSurfaceCorrespondence";
import type { IAutoMovieHumanBodyCalibration as Body } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain as Chain } from "../lofting/IAutoMovieHumanLoftChain";

/** Read-only observation of actual column candidates; persistence belongs to a local consumer. */
export namespace AutoMovieHumanTrunkObservation {
  /** Actual generated state, not a fitted substitute or an admitted person. */
  export interface IState {
    /** Producer-owned raw chains before the final body composition. */
    readonly chains: readonly Chain[];
    /** Once-composed chains used by this exact closure attempt. */
    readonly finished: readonly Chain[];
    /** Original fixed model measurement addresses. */
    readonly sites: Protocol.ISites;
  }

  /** One actual solver candidate and an optional completed surface reading. */
  export interface IEvent {
    /** Candidate completion precedes reading, so a refusal still has source state. */
    readonly kind: "candidate" | "course";
    /** The caller's solver stage, never an acceptance label. */
    readonly stage: "initial" | "lower" | "upper" | "bisect";
    /** Actual bounded iteration ordinal within that stage. */
    readonly iteration: number;
    /** Actual normalized material bracket at the time of observation. */
    readonly bracket: readonly [number, number];
    /** Actual source state; observers must not mutate any nested data. */
    readonly state: IState;
    /** Actual upstream neck used by this same course evaluation. */
    readonly neck: Chain;
    /** Declared side-neck material address. */
    readonly from: Course.IAddress;
    /** Actual model apex material address. */
    readonly to: Course.IAddress;
    /** Unchanged public course input, mm. */
    readonly expected: number;
    /** Actual source route, present only after successful evaluation. */
    readonly reading?: Course.IReading | SkinCourse.IReading;
    /** Actual physical candidate buffers, without unnecessary shading-normal preparation. */
    readonly surface?: Surface.IGeometry;
    /** Exact calibration and event ownership used by these physical buffers. */
    readonly physicalBody?: Body;
    /** Exact source/mesh correspondence consumed by this same mesher invocation. */
    readonly boundaries?: readonly Correspondence.IBoundary[];
  }

  /** Observation only: no evaluator, return replacement, I/O or global subscription. */
  export type Listener = (event: IEvent) => void;
}
