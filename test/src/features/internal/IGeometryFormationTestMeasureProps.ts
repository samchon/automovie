import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieFormationDesign,
  IAutoMovieProductionDesign,
  IAutoMovieWorldDesign,
} from "@automovie/interface";

import type { IGeometryFormationTestContract } from "./IGeometryFormationTestContract";

/** Current records and optional selectors for the existing formation measurements.
 *
 * @author Samchon
 */
export interface IGeometryFormationTestMeasureProps {
  /** Current compiled shots keyed by their authored identity. */
  compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;

  /** Participation contracts; omission uses the two existing scenario contracts. */
  contracts?: ReadonlyMap<string, IGeometryFormationTestContract>;

  /** Formation declaration; omission uses the existing two rank unit. */
  design?: IAutoMovieFormationDesign;

  /** World geometry; null explicitly models an unavailable world. */
  world?: Pick<
    IAutoMovieWorldDesign,
    "landmarks" | "surfaces" | "routes"
  > | null;

  /** Frame format; null explicitly models missing production configuration. */
  production?: Pick<IAutoMovieProductionDesign, "frameFormat"> | null;

  /** Requested formation identity; omission selects the existing unit. */
  formation?: string;

  /** Requested participating shot; omission uses the query's normal selection. */
  shot?: string;

  /** Sample time in seconds; omission preserves the query's zero time default. */
  time?: number;
}
