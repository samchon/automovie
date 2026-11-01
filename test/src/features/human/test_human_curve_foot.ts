import { assertHumanCurves } from "../internal/assertHumanCurves";

/**
 * The feet and their joins are sound curves, on every person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits the foot, forefoot and toe chains, catching a toe's ring running over itself, a crease across the sole or an open toe root. A foot of any length or breadth passes, and a toe's short ring is exempt from the rules a cap cannot meet.
 * @evidence contracts/testing.md#independent-expectations Ring orientation, self-crossing and gap are properties of any closed surface, so the expectation owes nothing to the foot's prior. A section pinched at the toes is exempt from the crossing rule, so a crossing there would pass here and rests on the viewer's foot round.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts the references with stature and girth ends, which move a foot through its expected dimensions. Toe chains take the digit branch of the audit, and the leg's test owns the ankle ring the foot hands over.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_foot`, sharing the cached people with the other curve units and starting no external host.
 */
export const test_human_curve_foot = (): void =>
  assertHumanCurves(/^(foot|forefoot|toe)\./);
