import type {
  IAutoMovieDesignLineage,
  IAutoMovieDesignPhaseSnapshot,
  IAutoMovieDesignPhaseState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { designLineagePhaseOrder, designLineagePhaseSnapshot, designLineageProject, validateDesignLineage } from "@automovie/engine";



import { emptyLineage, renovationLineage } from "../internal/lineageFixtures";
import { throwsError } from "../internal/predicates";

/**
 * Query phase prerequisites, lifecycle roles/presence and identity projection at demolition, shoring and completion.
 *
 * Scenarios:
 * 1. The out-of-order fixture returns the expected prerequisite order with ascending-id ties; this unit does not perform a second array permutation.
 * 2. At `strip` the demolished wall is gone, the retained fabric stands, and everything the work has yet to install reads `pending`.
 * 3. At `shore` the same demolished wall is still standing, which separates the work-level role from the per-phase presence.
 * 4. At `shore` the temporary shoring is `present`; at `structure` it is `removed` while keeping the role `temporary`, and the sibling `strip` leaves it `pending` because neither branch precedes the other.
 * 5. A null phase answers for the completed work: everything ever removed is gone and everything else stands.
 * 6. Four differently shaped consumer collections project to exactly the same ids at one phase and to a different same set at another, and an id the lineage never declared survives both.
 * 7. A lineage with no phases still orders and still answers for the completed work.
 * 8. A phase the plan does not contain is refused rather than answered.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls phase order/snapshot and generic designLineageProject, comparing the whole strip snapshot, selected shore/structure states, completed state strings and projected ids of four local row shapes. Confusing whole-lifecycle role with current presence, linearizing incomparable branches or dropping untracked stage-camera changes these observations; these rows do not invoke compiled scene, drawing, quantity or render hosts.
 * @evidence contracts/testing.md#independent-expectations The authored diamond with shore and strip as incomparable siblings determines every subject's role and presence; four existing row shapes carry the same explicit ids, so expected projection is hand-listed rather than produced by another snapshot query.
 * @evidence contracts/testing.md#distinguishing-cases Prerequisite order, demolition versus shoring, temporary installation/removal, null completion, four projection collections, untracked ids, an empty plan and an unknown phase retain distinct decisions; these generic row projections do not execute four renderer/drawing host applications.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_design_lineage_phase_states imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_design_lineage_phase_states(): void {
  const lineage: IAutoMovieDesignLineage = renovationLineage();
  TestValidator.equals(
    "the authored renovation lineage is self-consistent",
    validateDesignLineage({ lineage }).success,
    true,
  );

  TestValidator.equals(
    "the construction plan orders by prerequisite then by ascending id",
    designLineagePhaseOrder(lineage),
    ["survey", "shore", "strip", "structure", "services", "finishes"],
  );

  TestValidator.equals(
    "the demolition phase reports every subject's role and presence",
    designLineagePhaseSnapshot(lineage, "strip"),
    {
      phase: "strip",
      states: [
        {
          subject: "door-leaf",
          graph: "element",
          role: "new",
          presence: "pending",
        },
        {
          subject: "floor-oak",
          graph: "material-layer",
          role: "new",
          presence: "pending",
        },
        {
          subject: "oak-texture",
          graph: "asset",
          role: "retained",
          presence: "present",
        },
        {
          subject: "opening-door",
          graph: "opening",
          role: "new",
          presence: "pending",
        },
        {
          subject: "pendant-lamp",
          graph: "fixture",
          role: "new",
          presence: "pending",
        },
        {
          subject: "room-main",
          graph: "space",
          role: "retained",
          presence: "present",
        },
        {
          subject: "shoring-frame",
          graph: "element",
          role: "temporary",
          presence: "pending",
        },
        {
          subject: "wall-north",
          graph: "element",
          role: "retained",
          presence: "present",
        },
        {
          subject: "wall-south",
          graph: "element",
          role: "demolished",
          presence: "removed",
        },
        {
          subject: "wall-west",
          graph: "element",
          role: "retained",
          presence: "present",
        },
        {
          subject: "window-north",
          graph: "opening",
          role: "new",
          presence: "pending",
        },
      ],
    },
  );

  const shoring: IAutoMovieDesignPhaseState[] = designLineagePhaseSnapshot(
    lineage,
    "shore",
  ).states;
  TestValidator.equals(
    "a wall marked for demolition is still standing before its phase",
    shoring.find(
      (state: IAutoMovieDesignPhaseState): boolean =>
        state.subject === "wall-south",
    ),
    {
      subject: "wall-south",
      graph: "element",
      role: "demolished",
      presence: "present",
    },
  );
  TestValidator.equals(
    "the temporary shoring is up in its own phase",
    shoring.find(
      (state: IAutoMovieDesignPhaseState): boolean =>
        state.subject === "shoring-frame",
    ),
    {
      subject: "shoring-frame",
      graph: "element",
      role: "temporary",
      presence: "present",
    },
  );
  TestValidator.equals(
    "the shoring is taken out again once the structure phase completes",
    designLineagePhaseSnapshot(lineage, "structure").states.find(
      (state: IAutoMovieDesignPhaseState): boolean =>
        state.subject === "shoring-frame",
    ),
    {
      subject: "shoring-frame",
      graph: "element",
      role: "temporary",
      presence: "removed",
    },
  );

  TestValidator.equals(
    "the completed work keeps everything the plan never removes",
    designLineagePhaseSnapshot(lineage, null).states.map(
      (state: IAutoMovieDesignPhaseState): string =>
        `${state.subject}:${state.role}:${state.presence}`,
    ),
    [
      "door-leaf:new:present",
      "floor-oak:new:present",
      "oak-texture:retained:present",
      "opening-door:new:present",
      "pendant-lamp:new:present",
      "room-main:retained:present",
      "shoring-frame:temporary:removed",
      "wall-north:retained:present",
      "wall-south:demolished:removed",
      "wall-west:retained:present",
      "window-north:new:present",
    ],
  );

  // Four consumers of four different shapes, carrying the same identities plus
  // one the lineage never declared.
  const ids: string[] = [
    "wall-north",
    "wall-south",
    "shoring-frame",
    "stage-camera",
  ];
  const sceneNodes: { id: string; model: string }[] = ids.map(
    (id: string): { id: string; model: string } => ({
      id,
      model: `${id}-model`,
    }),
  );
  const drawingRows: { id: string; sheet: string }[] = ids.map(
    (id: string): { id: string; sheet: string } => ({ id, sheet: "A-101" }),
  );
  const quantityLines: { id: string; unit: string; amount: number }[] = ids.map(
    (id: string): { id: string; unit: string; amount: number } => ({
      id,
      unit: "m2",
      amount: 1,
    }),
  );
  const renderDraws: { id: string; pass: string }[] = ids.map(
    (id: string): { id: string; pass: string } => ({ id, pass: "beauty" }),
  );
  const projected: (phase: string | null) => string[][] = (
    phase: string | null,
  ): string[][] => [
    designLineageProject(lineage, phase, sceneNodes).map(
      (row: { id: string; model: string }): string => row.id,
    ),
    designLineageProject(lineage, phase, drawingRows).map(
      (row: { id: string; sheet: string }): string => row.id,
    ),
    designLineageProject(lineage, phase, quantityLines).map(
      (row: { id: string; unit: string; amount: number }): string => row.id,
    ),
    designLineageProject(lineage, phase, renderDraws).map(
      (row: { id: string; pass: string }): string => row.id,
    ),
  ];
  TestValidator.equals(
    "scene, drawing, quantity, and render agree on what stands at demolition",
    projected("strip"),
    [
      ["wall-north", "stage-camera"],
      ["wall-north", "stage-camera"],
      ["wall-north", "stage-camera"],
      ["wall-north", "stage-camera"],
    ],
  );
  TestValidator.equals(
    "the same four consumers agree on the different set standing at shoring",
    projected("shore"),
    [
      ["wall-north", "wall-south", "shoring-frame", "stage-camera"],
      ["wall-north", "wall-south", "shoring-frame", "stage-camera"],
      ["wall-north", "wall-south", "shoring-frame", "stage-camera"],
      ["wall-north", "wall-south", "shoring-frame", "stage-camera"],
    ],
  );

  const bare: IAutoMovieDesignLineage = emptyLineage();
  TestValidator.equals(
    "a lineage with no construction sequence still orders and still answers",
    [
      designLineagePhaseOrder(bare),
      designLineagePhaseSnapshot(bare, null).states,
      designLineageProject(bare, null, sceneNodes).map(
        (row: { id: string; model: string }): string => row.id,
      ),
    ],
    [[], [], ids],
  );

  TestValidator.predicate(
    "a phase the plan does not contain is refused, not answered",
    throwsError(
      (): IAutoMovieDesignPhaseSnapshot =>
        designLineagePhaseSnapshot(lineage, "topping-out"),
      'has no construction phase "topping-out"',
    ),
  );
}
