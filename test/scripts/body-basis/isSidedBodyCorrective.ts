import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
type Corrective = NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number];
type Channel = IAutoMovieHumanBodyBasis["channels"][number];
import { mirrorDriver } from "./mirrorDriver";

/**
 * Whether a corrective names a side: its drivers, taken as a set, mirror to a
 * different set. A midline corrective (a macro channel, the spine) names no
 * side, and so does a bilateral one whose left and right drivers swap into
 * each other (both thighs flexed together); both are symmetrized, not mirrored
 * into a partner.
 */
export function isSidedBodyCorrective(
  corrective: Corrective,
  channels: Map<string, Channel>,
): boolean {
  const canonical = (drivers: Corrective["inputs"]): string =>
    JSON.stringify(drivers.map((driver) => JSON.stringify(driver)).sort((a, b) => a.localeCompare(b)));
  return (
    canonical(corrective.inputs) !==
    canonical(corrective.inputs.map((driver) => mirrorDriver(driver, channels)))
  );
}
