import type { HumanActionName } from "./HumanActionName";

/**
 * The name an action is performed under: one of the vocabulary's own names,
 * or the name a production registered a law of its own under.
 *
 * `HumanActionName` stays the closed list of what the package ships, so an
 * editor completes it and documentation lists it. A performance also runs
 * the laws a production gives it (`HumanPerformance.IInput.laws`), and those
 * carry names this package cannot know, so every place that only carries a
 * name through (a placed action, a cancel table's key, an entry state)
 * takes this wider type. A registered name never equals a shipped one: the
 * performance refuses the shadow.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two kinds of name, why both types exist and the shadow rule.
 * @evidence contracts/development/design.md#principled-representation The closed union widened by any other text, written so the union's members still complete in an editor.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One alias, read wherever a name is carried and not dispatched on.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Not plain `string`: the shipped names stay visible in the type.
 */
export type HumanActionKey = HumanActionName | (string & {});
