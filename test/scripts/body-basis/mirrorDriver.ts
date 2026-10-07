import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import { swapBodySide } from "./swapBodySide";

type Corrective = NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number];
type Channel = IAutoMovieHumanBodyBasis["channels"][number];

/** One driver with its side swapped; a channel goes to the channel it mirrors. */
export function mirrorDriver(
  driver: Corrective["inputs"][number],
  channels: Map<string, Channel>,
): Corrective["inputs"][number] {
  if ("channel" in driver)
    return {
      ...driver,
      channel: channels.get(driver.channel)?.mirror ?? driver.channel,
    };
  if ("bone" in driver)
    return { ...driver, bone: swapBodySide(driver.bone) as typeof driver.bone };
  return {
    ...driver,
    shoulder: swapBodySide(driver.shoulder) as typeof driver.shoulder,
  };
}
