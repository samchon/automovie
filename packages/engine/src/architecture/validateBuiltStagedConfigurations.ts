import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieConnectorCarriage,
  IAutoMovieConnectorState,
  IAutoMovieMovablePanel,
  IAutoMovieOperationState,
} from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { ViolationCollector } from "../validation/ViolationCollector";
import { builtElementSubtree } from "./builtElementSubtree";
import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";

/** Relative round-trip error above which a world matrix carries shear. */
const MATRIX_ROUND_TRIP_EPSILON: number = 1e-8;

const SHEAR_ADVICE: string =
  "which cannot be lowered to the scene's world TRS; keep rotated descendants below uniformly scaled ancestors";

/**
 * Refuse a configuration the scene could not stage, in any state the record
 * names.
 *
 * A staged node is world TRS, so a composed hierarchy carrying shear cannot be
 * lowered without silently dropping it. Checking only the state the record
 * currently stands in would let a door pass shut and lie open: the same
 * revolute leaf below a non-uniformly scaled ancestor is a clean rigid frame at
 * rest and a sheared one a quarter turn later, and both the staged set and the
 * placement queries would answer with a decomposition that never existed.
 *
 * Every element is checked in the current staging and reported at its own
 * `transform`. Then each non-current state of each opening and connector is
 * staged with every other member in its current state, and only the subtree
 * the state moves is re-checked, because a displacement rides down from the
 * element it drives and nothing above or beside it can change. A state that
 * shears any element is reported once, at the state's path, naming the first.
 * A matrix is sheared when recomposing its decomposition differs from it by
 * more than 1e-8 of its largest entry.
 *
 * @param environment Building already free of validation errors.
 * @param root Violation path of the building record, `$input`.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation A matrix is exactly a TRS composition when decomposing and recomposing it returns it, so the relative round-trip error detects shear with a tolerance scaled by the matrix's own magnitude; each alternative state is staged through `builtEnvironmentWorldMatrices` choosing that state for its member and the current state for every other.
 * @evidence contracts/common.md#clear-and-simple-design One staged check separated from `validateBuiltEnvironment`; staging and subtree walks come from their shared owners instead of the private staging and fixed-point descendant copies the validator kept.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element, door or run is special-cased; shear is refused rather than decomposed away, and a state is reported once because its author fixes one hierarchy.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why shear is refused in every state, what is checked in which staging, why only the moved subtree is re-checked, how often and where a state is reported, and the shear test and tolerance.
 * @evidence contracts/performance.md#efficient-algorithms One staging for the current configuration plus one per non-current state, each linear in elements, with the shear test limited to the moved subtree after the first; restaging is needed because a member's travel changes every matrix below it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each alternative state needs its own staging because its displacement differs, and the current staging is computed once and shared by the base check.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each staging and subtree is released before the next state; one violation per sheared element in the current staging and one per shearing state is appended to the caller's collector.
 */
export const validateBuiltStagedConfigurations = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const base: Map<string, number[]> =
    builtEnvironmentWorldMatrices(environment);
  environment.elements.forEach(
    (element: IAutoMovieBuiltElement, index: number): void => {
      if (isSheared(base.get(element.id)!))
        collector.push(
          "type",
          `${root}.elements[${index}].transform`,
          `the composed hierarchy contains shear, ${SHEAR_ADVICE}`,
          element.transform,
        );
    },
  );
  /** Report the first element one alternative state shears, if any. */
  const alternative = (
    member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector,
    state: string,
    moved: readonly string[],
    path: string,
  ): void => {
    const matrices: Map<string, number[]> = builtEnvironmentWorldMatrices(
      environment,
      (other: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector): string =>
        other === member ? state : other.operation!.state,
    );
    for (const id of builtElementSubtree(environment.elements, moved))
      if (isSheared(matrices.get(id)!)) {
        collector.push(
          "type",
          path,
          `operating state "${state}" composes shear into element "${id}", ${SHEAR_ADVICE}`,
          state,
        );
        return;
      }
  };
  environment.openings.forEach(
    (opening: IAutoMovieBuiltOpening, index: number): void => {
      const operation: IAutoMovieBuiltOpening["operation"] = opening.operation;
      if (operation === undefined) return;
      operation.states.forEach(
        (state: IAutoMovieOperationState, stateIndex: number): void => {
          if (state.id !== operation.state)
            alternative(
              opening,
              state.id,
              operation.panels.map(
                (panel: IAutoMovieMovablePanel): string => panel.element,
              ),
              `${root}.openings[${index}].operation.states[${stateIndex}]`,
            );
        },
      );
    },
  );
  environment.connectors.forEach(
    (connector: IAutoMovieBuiltConnector, index: number): void => {
      const operation: IAutoMovieBuiltConnector["operation"] =
        connector.operation;
      if (operation === undefined) return;
      operation.states.forEach(
        (state: IAutoMovieConnectorState, stateIndex: number): void => {
          if (state.id !== operation.state)
            alternative(
              connector,
              state.id,
              operation.carriages.map(
                (carriage: IAutoMovieConnectorCarriage): string =>
                  carriage.element,
              ),
              `${root}.connectors[${index}].operation.states[${stateIndex}]`,
            );
        },
      );
    },
  );
};

/** Whether a world matrix carries more than a position, rotation, and scale. */
const isSheared = (world: number[]): boolean => {
  const decomposed: ReturnType<typeof Matrix4.decompose> =
    Matrix4.decompose(world);
  const recomposed: number[] = Matrix4.compose(
    decomposed.position,
    Quaternion.normalize(decomposed.rotation),
    decomposed.scale,
  );
  let magnitude: number = 1;
  let difference: number = 0;
  for (let index: number = 0; index < world.length; ++index) {
    magnitude = Math.max(magnitude, Math.abs(world[index]!));
    difference = Math.max(
      difference,
      Math.abs(world[index]! - recomposed[index]!),
    );
  }
  return difference > magnitude * MATRIX_ROUND_TRIP_EPSILON;
};
