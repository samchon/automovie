
import { AutomovieHumanoidBoneSlotsData } from "./AutomovieHumanoidBoneSlotsData";

/*
 * The names of every humanoid bone slot, for membership checks.
 */
export const AUTOMOVIE_HUMANOID_BONE_SLOTS: ReadonlySet<string> = new Set(
  Object.keys(AutomovieHumanoidBoneSlotsData.SLOTS),
);
