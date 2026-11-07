import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { auditPhysicalOutcomes as audit } from "../../../../packages/engine/src/physics/auditPhysicalOutcomes";

/** A long episode cannot borrow a later impulse to fulfill an earlier screenplay contact or contradict an earlier deliberate miss. */
export function test_physical_outcome_causality(): void {
  const receipt: Receipt = {
    id: "tool-panel",
    source: "solver",
    seconds: 1,
    endSeconds: 3,
    a: { body: "tool", bone: "tip", shape: "tip", material: "solid" },
    b: { body: "panel", bone: "face", shape: "face", material: "solid" },
    point: { x: 0, y: 1, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    separation: -0.001,
    compression: 0,
    impulse: 2,
    samples: [1, 3].map(
      (seconds: number): NonNullable<Receipt["samples"]>[number] => ({
        seconds,
        duration: 1 / 120,
        impulse: seconds === 3 ? 2 : 0,
        point: { x: 0, y: 1, z: 0 },
        normal: { x: 1, y: 0, z: 0 },
        separation: -0.001,
        compression: 0,
      }),
    ),
  };
  const action: audit.IAction = {
    id: "promised-contact",
    seconds: 1,
    tolerance: 0.1,
    actor: "tool",
    target: "panel",
    actorShapes: ["tip"],
    targetShapes: ["face"],
    expected: "contact",
    source: "solver",
  };
  const inspect: (promise: audit.IAction) => audit.IFinding[] = (
    promise: audit.IAction,
  ): audit.IFinding[] =>
    audit({
      actions: [promise],
      contacts: [receipt],
      falls: [],
      observedFalls: {},
      missDistance: (): number => 0.001,
      allowUnplanned: (): boolean => true,
    });
  TestValidator.equals(
    "future positive impulse does not fulfill an earlier contact",
    inspect(action).map((finding: audit.IFinding): string => finding.kind),
    ["missed-contact"],
  );
  TestValidator.equals(
    "later impulse does not contradict the earlier miss",
    inspect({ ...action, expected: "miss" }),
    [],
  );
  TestValidator.equals(
    "actual in-window impulse fulfills its own contact",
    inspect({ ...action, seconds: 3 }),
    [],
  );
}
