import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

/**
 * The connector one id names, or a thrown `Error` naming both the environment
 * and the missing id.
 *
 * Every connector-addressed query refuses an undeclared id with this one
 * message. The first connector declared under the id is returned; duplicate ids
 * are a contradiction `validateBuiltEnvironment` refuses, not one this lookup
 * re-decides.
 *
 * @evidence contracts/common.md#principled-implementation A first-match linear lookup over `environment.connectors`, so a validated record, whose connector ids are unique, resolves to its one connector, and an unvalidated duplicate resolves to its first declaration as `Array.prototype.find` defines.
 * @evidence contracts/common.md#clear-and-simple-design One lookup and refusal shared by the geometry, section and carriage queries, so the message and the first-match rule are written once rather than once per connector query file.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no connector kind or caller; an undeclared id always throws instead of producing a default route or section.
 * @evidence contracts/common.md#meaningful-documentation States that the result is the record's own connector, the refusal and what its message names, and how a duplicate id is read.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the connector count with constant space; each query resolves one id once, so an id index would cost more than the scan it replaces.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One synchronous lookup per call that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps no state; the returned connector is the caller's own record object.
 */
export const requireBuiltConnector = (
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
): IAutoMovieBuiltConnector => {
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
};
