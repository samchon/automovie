import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMovieCarriageValue,
  IAutoMovieConnectorCarriage,
  IAutoMovieConnectorState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { ViolationCollector } from "../validation/ViolationCollector";
import { builtEnvironmentContainsPoint } from "./builtEnvironmentContainsPoint";
import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { builtSpaceSubtree } from "./builtSpaceSubtree";

/**
 * Refuse a carriage that does not stand in the space its state says it serves.
 *
 * A named stop is a claim about geometry, so it is settled against geometry:
 * the state is applied, the element the carriage drives is placed, and its own
 * origin has to land inside the space or a space below it, by
 * `builtEnvironmentContainsPoint`. A space whose subtree states no volume is
 * skipped rather than failed, because a purely semantic container has no
 * stated interior for the car to be in. A stated but unbounded cell is not skipped merely because it has no finite bounds.
 *
 * Every other member stands where its own current state puts it, the same rule
 * the swept envelope follows, so a state is measured as the one change it
 * makes rather than against a configuration nothing declared. Findings are
 * pushed at the claiming value's `serves` path.
 *
 * @param environment Building already free of validation errors.
 * @param root Violation path of the building record, `$input`.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Stages the work with `builtEnvironmentWorldMatrices`, choosing the claiming state for this run and the current state for every other member, reads the carriage element's world origin from the translation column, and decides membership with the engine's own space containment query.
 * @evidence contracts/common.md#clear-and-simple-design One staged check separated from `validateBuiltEnvironment`; staging and containment come from their shared owners instead of the private staging copy the validator kept.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No connector or space is special-cased. The skip means no descendant states a volume; it does not mean a finite-bounds test failed.
 * @evidence contracts/common.md#meaningful-documentation States service containment, current/selected-state staging, the skip only when no descendant volume is stated, and the finding path; an unbounded stated cell is not silently skipped.
 * @evidence contracts/performance.md#efficient-algorithms Each non-null service claim builds/scans a space subtree to decide whether volume is stated. Each state with retained claims pays full `builtEnvironmentWorldMatrices` staging, followed by a full subtree containment query per claim, including its delegated volume checks. Connector carriage indexes are built once; cost is not only linear element staging.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one carriage index across a connector's states and one matrix map across a state's claims. Distinct claiming states stage separately because their displacement differs; nothing is cached across validation calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each staging is released before the next state; one violation per refused claim is appended to the caller's collector.
 */
export const validateBuiltCarriageService: (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
) => void = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const bounded: (spaceId: string) => boolean = (spaceId: string): boolean => {
    const included: Set<string> = builtSpaceSubtree(
      environment.spaces,
      spaceId,
    );
    return environment.spaces.some(
      (space: IAutoMovieBuiltSpace): boolean =>
        included.has(space.id) && builtSpaceStatesVolume(space),
    );
  };
  environment.connectors.forEach(
    (connector: IAutoMovieBuiltConnector, index: number): void => {
      const operation: IAutoMovieBuiltConnector["operation"] =
        connector.operation;
      if (operation === undefined) return;
      const carriages: Map<string, IAutoMovieConnectorCarriage> = new Map(
        operation.carriages.map(
          (
            carriage: IAutoMovieConnectorCarriage,
          ): [string, IAutoMovieConnectorCarriage] => [carriage.id, carriage],
        ),
      );
      operation.states.forEach(
        (state: IAutoMovieConnectorState, stateIndex: number): void => {
          const claims: { space: string; carriage: string; at: number }[] = [];
          state.carriages.forEach(
            (entry: IAutoMovieCarriageValue, valueIndex: number): void => {
              if (entry.serves !== null && bounded(entry.serves))
                claims.push({
                  space: entry.serves,
                  carriage: entry.carriage,
                  at: valueIndex,
                });
            },
          );
          if (claims.length === 0) return;
          const matrices: Map<string, number[]> = builtEnvironmentWorldMatrices(
            environment,
            (
              member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector,
            ): string =>
              member === connector ? state.id : member.operation!.state,
          );
          for (const claim of claims) {
            const carriage: IAutoMovieConnectorCarriage = carriages.get(
              claim.carriage,
            )!;
            const point: IAutoMovieVector3 = Matrix4.position(
              matrices.get(carriage.element)!,
            );
            if (
              builtEnvironmentContainsPoint(environment, claim.space, point) ===
              false
            )
              collector.push(
                "range",
                `${root}.connectors[${index}].operation.states[${stateIndex}].carriages[${claim.at}].serves`,
                `operating state "${state.id}" stands carriage "${carriage.id}" at (${point.x}, ${point.y}, ${point.z}), which is outside the space "${claim.space}" it serves`,
                claim.space,
              );
          }
        },
      );
    },
  );
};
