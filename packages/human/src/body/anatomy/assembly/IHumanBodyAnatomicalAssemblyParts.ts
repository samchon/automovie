import type { IAutoMovieModel } from "@automovie/interface";
import type { IHumanBodySourceQuantityReading } from "./IHumanBodySourceQuantityReading";

/** Actual posed anatomical boundary parts and their separate inspection finishes. @author Samchon */
export interface IHumanBodyAnatomicalAssemblyParts {
  /** Actual posed source members, with separate anatomical owner and subdivision IDs. */
  parts: IAutoMovieModel["parts"];
  /** Diagnostic tissue finishes referenced by those members; no biological color is inferred. */
  materials: IAutoMovieModel["materials"];

  /** Source-rest Float64/Float32 readings and emitted posed Float32 readings, with raw acquisition comparison availability preserved. */
  quantities: readonly IHumanBodySourceQuantityReading[];
}
