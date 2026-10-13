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

/** Linear-basis round-trip tolerance, scaled by max(1, largest basis entry). */
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
 * Operations whose moved subtrees overlap are also checked in every joint
 * assignment of their named states. Independent branches do not interact.
 * A matrix is sheared when recomposing its decomposition differs in the linear
 * basis by more than 1e-8 times max(1, that basis's largest absolute entry).
 * The unit floor gives tiny bases an absolute tolerance; translation cannot
 * enlarge it. Non-finite compositions are refused by the same gate.
 *
 * @param environment Building already free of validation errors.
 * @param root Violation path of the building record, `$input`.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation TRS requires orthogonal scaled basis columns, tested by decomposition and recomposition with linear-basis error bounded by 1e-8 times max(1, largest absolute basis entry). Every named state combination affecting one element is checked; translation is excluded from the error scale, tiny bases retain the absolute tolerance floor, and non-finite matrices are refused.
 * @evidence contracts/common.md#clear-and-simple-design One staged check separated from `validateBuiltEnvironment`; staging and subtree walks come from their shared owners instead of the private staging and fixed-point descendant copies the validator kept.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element, door or run is special-cased; shear is refused rather than decomposed away, and a state is reported once because its author fixes one hierarchy.
 * @evidence contracts/common.md#meaningful-documentation States current-state paths, alternative subtree checks, interacting named-state combinations, independent-branch separation, translation-independent tolerance and non-finite refusal.
 * @evidence contracts/performance.md#efficient-algorithms Current and single-alternative checks each stage E elements. Interacting elements are grouped by their influencing operation set and checked over that set's Cartesian state product; worst-case cost is exponential in interacting operations, required to inspect every authored assignment, while disjoint branches never multiply each other's states.
 * @evidence contracts/performance.md#reuse-equivalent-work Elements with the same influencing operation indexes share one combination walk and staging per assignment. Assignments differing from current in at most one member reuse the earlier checks by skipping; no staging survives the call because the environment is mutable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Operation subtrees and element groups are bounded by operation-count times element-count; one matrix map and one state assignment live per combination, with recursion depth bounded by interacting operations. Findings grow with rejected combinations and have no separate cap.
 */
export const validateBuiltStagedConfigurations: (environment: IAutoMovieBuiltEnvironment, root: string, collector: ViolationCollector) => void = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const base: Map<string, number[]> =
    builtEnvironmentWorldMatrices(environment);
  environment.elements.forEach(
    (element: IAutoMovieBuiltElement, index: number): void => {
      if (cannotRepresentWorldTrs(base.get(element.id)!))
        collector.push(
          "type",
          `${root}.elements[${index}].transform`,
          `the composed hierarchy contains shear or non-finite coordinates, ${SHEAR_ADVICE}`,
          element.transform,
        );
    },
  );
  /** Report the first element one alternative state shears, if any. */
  const alternative: (member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector, state: string, moved: readonly string [ ], path: string) => void = (
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
      if (cannotRepresentWorldTrs(matrices.get(id)!)) {
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
  appendCombinedStateDefects(environment, root, collector);
};

/** Operations affecting an element share exactly one combination search. */
const appendCombinedStateDefects: (environment: IAutoMovieBuiltEnvironment, root: string, collector: ViolationCollector) => void = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const operations: {
    member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector;
    states: readonly { id: string }[];
    current: string;
    path: string;
    affected: Set<string>;
  }[] = [];
  environment.openings.forEach((member: IAutoMovieBuiltOpening, index: number): void => {
    if (member.operation === undefined) return;
    operations.push({
      member,
      states: member.operation.states,
      current: member.operation.state,
      path: `${root}.openings[${index}].operation.states`,
      affected: builtElementSubtree(environment.elements, member.operation.panels.map(
        (panel: IAutoMovieMovablePanel): string => panel.element,
      )),
    });
  });
  environment.connectors.forEach((member: IAutoMovieBuiltConnector, index: number): void => {
    if (member.operation === undefined) return;
    operations.push({
      member,
      states: member.operation.states,
      current: member.operation.state,
      path: `${root}.connectors[${index}].operation.states`,
      affected: builtElementSubtree(environment.elements, member.operation.carriages.map(
        (carriage: IAutoMovieConnectorCarriage): string => carriage.element,
      )),
    });
  });
  const groups: Map<string, { indexes: number[]; elements: string[] }> = new Map();
  for (const element of environment.elements) {
    const indexes: number[] = [];
    operations.forEach((operation: (typeof operations)[number], index: number): void => {
      if (operation.affected.has(element.id)) indexes.push(index);
    });
    if (indexes.length < 2) continue;
    const key: string = JSON.stringify(indexes);
    const group: { indexes: number[]; elements: string[] } | undefined = groups.get(key);
    if (group === undefined) groups.set(key, { indexes, elements: [element.id] });
    else group.elements.push(element.id);
  }
  for (const group of groups.values()) {
    const selected: Map<IAutoMovieBuiltOpening | IAutoMovieBuiltConnector, string> = new Map();
    const visit: (depth: number, changed: number) => void = (depth: number, changed: number): void => {
      if (depth < group.indexes.length) {
        const operation: (typeof operations)[number] = operations[group.indexes[depth]!]!;
        for (const state of operation.states) {
          selected.set(operation.member, state.id);
          visit(depth + 1, changed + Number(state.id !== operation.current));
        }
        selected.delete(operation.member);
        return;
      }
      if (changed < 2) return;
      const matrices: Map<string, number[]> = builtEnvironmentWorldMatrices(
        environment,
        (member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector): string =>
          selected.get(member) ?? member.operation!.state,
      );
      for (const element of group.elements)
        if (cannotRepresentWorldTrs(matrices.get(element)!)) {
          const assignment: { member: string; state: string }[] = group.indexes.map(
            (index: number): { member: string; state: string } => ({
              member: operations[index]!.member.id,
              state: selected.get(operations[index]!.member)!,
            }),
          );
          collector.push(
            "type",
            operations[group.indexes[group.indexes.length - 1]!]!.path,
            `combined operating states ${JSON.stringify(assignment)} compose shear into element "${element}", ${SHEAR_ADVICE}`,
            assignment,
          );
          break;
        }
    };
    visit(0, 0);
  }
};

/** Whether a world matrix carries more than a position, rotation, and scale. */
const cannotRepresentWorldTrs: (world: number [ ]) => boolean = (world: number[]): boolean => {
  if (world.some((entry: number): boolean => !Number.isFinite(entry))) return true;
  const decomposed: ReturnType<typeof Matrix4.decompose> =
    Matrix4.decompose(world);
  const recomposed: number[] = Matrix4.compose(
    decomposed.position,
    Quaternion.normalize(decomposed.rotation),
    decomposed.scale,
  );
  let magnitude: number = 1;
  let difference: number = 0;
  for (let column: number = 0; column < 3; ++column)
    for (let row: number = 0; row < 3; ++row) {
      const index: number = column * 4 + row;
      if (!Number.isFinite(recomposed[index]!)) return true;
      magnitude = Math.max(magnitude, Math.abs(world[index]!));
      difference = Math.max(difference, Math.abs(world[index]! - recomposed[index]!));
    }
  return difference > magnitude * MATRIX_ROUND_TRIP_EPSILON;
};
