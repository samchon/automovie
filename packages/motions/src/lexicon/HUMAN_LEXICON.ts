import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import { HumanBlade } from "./HumanBlade";
import { HumanCarried } from "./HumanCarried";
import { HumanDrill } from "./HumanDrill";
import { HumanEmblem } from "./HumanEmblem";
import { HumanFirearm } from "./HumanFirearm";
import { HumanGait } from "./HumanGait";
import { HumanHabit } from "./HumanHabit";
import { HumanLabour } from "./HumanLabour";
import { HumanPose } from "./HumanPose";
import { HumanPursuit } from "./HumanPursuit";
import { HumanRide } from "./HumanRide";
import { HumanSocial } from "./HumanSocial";
import { HumanStageFight } from "./HumanStageFight";
import { HumanStance } from "./HumanStance";

/** The registered laws a namespace holds: its members that plan. */
const rows = (space: object): readonly IHumanActionLaw<never>[] =>
  Object.values(space).filter(
    (value: unknown): value is IHumanActionLaw<never> =>
      typeof value === "object" && value !== null && "plan" in value,
  );

/**
 * Every row and law of the lexicon by family, as data: what a page, a test
 * and an agent's search read to know which named actions exist beyond the
 * vocabulary. Pass a family's list, or all of them, to a performance's
 * `laws` to register them at once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds, who reads it and how it registers.
 * @evidence contracts/development/design.md#principled-representation One list of law records per family, derived from the family namespaces themselves so it cannot drift from them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table; the families own their rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No name is restated: the lists are read from the namespaces.
 */
export const HUMAN_LEXICON: Readonly<
  Record<string, readonly IHumanActionLaw<never>[]>
> = {
  emblem: rows(HumanEmblem),
  habit: rows(HumanHabit),
  stance: rows(HumanStance),
  pose: rows(HumanPose),
  gait: rows(HumanGait),
  pursuit: rows(HumanPursuit),
  social: rows(HumanSocial),
  stageFight: rows(HumanStageFight),
  drill: rows(HumanDrill),
  blade: rows(HumanBlade),
  firearm: rows(HumanFirearm),
  labour: rows(HumanLabour),
  ride: rows(HumanRide),
  carried: rows(HumanCarried),
};
