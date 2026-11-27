import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

/*
 * The connector one id names, or a thrown `Error` naming both the environment
 * and the missing id.
 *
 * Every connector-addressed query refuses an undeclared id with this one
 * message. The first connector declared under the id is returned; duplicate ids
 * are a contradiction `validateBuiltEnvironment` refuses, not one this lookup
 * re-decides.
 */
export function requireBuiltConnector(
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
): IAutoMovieBuiltConnector {
  const connector: IAutoMovieBuiltConnector | undefined =
    environment.connectors.find(
      (candidate: IAutoMovieBuiltConnector): boolean =>
        candidate.id === connectorId,
    );
  if (connector === undefined)
    throw new Error(
      `built environment "${environment.id}" has no connector "${connectorId}"`,
    );
  return connector;
}
