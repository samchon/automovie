/**
 * Closed vocabulary of the human actions an author chains: every law the
 * package ships has exactly one name here, and a chain, an interrupt table or
 * a legality rule refers to actions only by these names. The list grows
 * additively as laws land; a name is never repurposed.
 *
 * - `stand`: quiet standing on both feet.
 */
export type HumanActionName = "stand";
