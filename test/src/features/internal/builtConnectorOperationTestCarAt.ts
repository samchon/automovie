import { AutoMovieEngineBuiltEnvironment } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

/** The world Y of one carriage of the lift, at one named state. */
export const builtConnectorOperationTestCarAt = (
  environment: IAutoMovieBuiltEnvironment,
  carriage: string,
  state?: string,
): number =>
  AutoMovieEngineBuiltEnvironment.connectorCarriagePlacements(environment, "lift", state).find(
    (placement) => placement.carriage === carriage,
  )!.position.y;
