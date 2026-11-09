import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import { stand } from "./stand";

/**
 * Every action law by name: the closed table a performance dispatches
 * through. A law's parameter type is its own; the table erases it to
 * `never` so one table holds every law, and the chain method that names an
 * action is what supplies its parameters.
 */
export const HUMAN_ACTIONS: Readonly<Record<HumanActionName, IHumanActionLaw<never>>> = {
  stand,
};
