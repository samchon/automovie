import type { State } from "../house/State";

/** All declared static combinations; private/night equality is an observation,
 * not permission to omit either state's actual producer result. */
export const materialStates: readonly State[] = [
  {privacy:"day",flex:"work"},{privacy:"day",flex:"guest"},
  {privacy:"private",flex:"work"},{privacy:"private",flex:"guest"},
  {privacy:"night",flex:"work"},{privacy:"night",flex:"guest"},
];

