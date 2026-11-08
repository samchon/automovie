/** Preparation, consequential action and recovery on the one film clock. */
interface Action { prepare: readonly [number, number]; act: readonly [number, number]; recover: readonly [number, number]; }

/**
 * Read the screenplay's executable action schedule, shared by pose and path.
 * This adopts the action-table/resolution structure observed in the separate
 * kickboxing production, not its DLS solver, choreography or joint constants.
 *
 * @evidence contracts/common.md#implementation-and-ownership One frozen table owns preparation, delivery and recovery for the fixed chase, miss, choice and support transfer. Pose/path consumers read its event boundaries; the actual FK and video audit still decide whether the actions are delivered.
 * @evidence contracts/common.md#authoring-interface All values are global seconds. Returned records are immutable; newLeft43, oldRelease44.3 and newRight45.2 preserve the existing support order. No new story or uncommissioned acrobatics is introduced.
 */
export function flightActions(): {
  taunt: Action; slip: Action; retry: Action; choice: Action; approach: Action; transfer: Action; recovery: Action;
  newLeft: number; oldRelease: number; newRight: number;
} {
  return SCHEDULE;
}

/** The seven performance rows and the three consequential grip events. */
const SCHEDULE: ReturnType<typeof flightActions> = Object.freeze({
  taunt: row([3.5, 4], [4, 5.8], [5.8, 8]),
  slip: row([20, 23], [23, 25.5], [25.5, 26.5]),
  retry: row([26, 26.5], [26.5, 28], [28, 29.5]),
  choice: row([30.5, 32], [32, 33.7], [33.7, 35]),
  approach: row([33.4, 35], [35, 38.5], [38.5, 43]),
  transfer: row([40, 43], [43, 45.2], [45.2, 50.5]),
  recovery: row([48, 49.5], [49.5, 53], [53, 60]),
  newLeft: 43, oldRelease: 44.3, newRight: 45.2,
});

/** Freeze the nested tuples as well as the row. */
function row(prepare: [number, number], act: [number, number], recover: [number, number]): Action {
  return Object.freeze({ prepare: Object.freeze(prepare), act: Object.freeze(act), recover: Object.freeze(recover) });
}
