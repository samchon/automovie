import type {
  ViolationCollector,
  compileCameraClearanceReports,
} from "@automovie/engine";

/** The original clearance reports and addressed diagnostic collector. */
export interface IFilmCameraClearanceAdapterResult {
  /** Reports returned by the original compiler. */
  reports: ReturnType<typeof compileCameraClearanceReports>;

  /** The same collector provided to that compiler. */
  out: ViolationCollector;
}
