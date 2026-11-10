import type { HumanActionName } from "../HumanActionName";
import { approach } from "../everyday/approach";
import { bend } from "../everyday/bend";
import { brace } from "../everyday/brace";
import { gesture } from "../everyday/gesture";
import { look } from "../everyday/look";
import { rest } from "../everyday/rest";
import { rise } from "../everyday/rise";
import { shift } from "../everyday/shift";
import { sit } from "../everyday/sit";
import { stepOver } from "../everyday/stepOver";
import { typeText } from "../everyday/typeText";
import { handOver } from "../handling/handOver";
import { handshake } from "../handling/handshake";
import { pickUp } from "../handling/pickUp";
import { putDown } from "../handling/putDown";
import { receive } from "../handling/receive";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import { flinch } from "../reaction/flinch";
import { knockdown } from "../reaction/knockdown";
import { stagger } from "../reaction/stagger";
import { defend } from "../striking/defend";
import { guard } from "../striking/guard";
import { kick } from "../striking/kick";
import { knee } from "../striking/knee";
import { punch } from "../striking/punch";
import { step } from "../striking/step";
import { jump } from "./jump";
import { run } from "./run";
import { stand } from "./stand";
import { walk } from "./walk";

/**
 * Every action law by name: the closed table a performance dispatches
 * through. A law's parameter type is its own; the table erases it to
 * `never` so one table holds every law, and the chain method that names an
 * action is what supplies its parameters.
 */
export const HUMAN_ACTIONS: Readonly<
  Record<HumanActionName, IHumanActionLaw<never>>
> = {
  stand,
  walk,
  run,
  jump,
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
  knee,
  sit,
  rise,
  shift,
  handshake,
  pickUp,
  putDown,
  handOver,
  receive,
  bend,
  stepOver,
  brace,
  typeText,
};
