import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import { approach } from "../everyday/approach";
import { bend } from "../everyday/bend";
import { gesture } from "../everyday/gesture";
import { look } from "../everyday/look";
import { rest } from "../everyday/rest";
import { rise } from "../everyday/rise";
import { shift } from "../everyday/shift";
import { sit } from "../everyday/sit";
import { kick } from "../striking/kick";
import { handshake } from "../handling/handshake";
import { flinch } from "../reaction/flinch";
import { knockdown } from "../reaction/knockdown";
import { stagger } from "../reaction/stagger";
import { defend } from "../striking/defend";
import { guard } from "../striking/guard";
import { punch } from "../striking/punch";
import { step } from "../striking/step";
import { stand } from "./stand";
import { walk } from "./walk";

/**
 * Every action law by name: the closed table a performance dispatches
 * through. A law's parameter type is its own; the table erases it to
 * `never` so one table holds every law, and the chain method that names an
 * action is what supplies its parameters.
 */
export const HUMAN_ACTIONS: Readonly<Record<HumanActionName, IHumanActionLaw<never>>> = {
  stand,
  walk,
  approach,
  look,
  gesture,
  rest,
  punch,
  kick,
  guard,
  step,
  defend,
  flinch,
  stagger,
  knockdown,
  sit,
  rise,
  shift,
  handshake,
  bend,
};
