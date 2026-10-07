import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
type Corrective = NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number];
type Channel = IAutoMovieHumanBodyBasis["channels"][number];
import { swapBodySide } from "./swapBodySide";
import { mirrorDriver } from "./mirrorDriver";
import { isSidedBodyCorrective } from "./isSidedBodyCorrective";
import type { IBodyMirroredCorrective } from "./IBodyMirroredCorrective";

/**
 * The exact mirror of a sided corrective and of its rows.
 *
 * The id is the id with its sides swapped, the drivers are mirrored (a shoulder
 * kernel keeps its orientation, which reads the same on either arm), the target
 * is the new id, and every row moves to its vertex's mirror with `x` negated.
 * A row whose vertex has no mirror is refused. Rows are sorted by vertex. The
 * corrective must be sided and its id must name a side, or the mirror would
 * collide with it; both refusals throw.
 */
export function mirrorBodyCorrective(
  corrective: Corrective,
  rows: number[],
  partner: number[],
  channels: Map<string, Channel>,
): IBodyMirroredCorrective {
  const id = swapBodySide(corrective.id);
  if (!isSidedBodyCorrective(corrective, channels) || id === corrective.id)
    throw new Error("Only a sided corrective with a sided id has a mirror.");
  const moved: [number, number, number, number][] = [];
  for (let at = 0; at < rows.length; at += 4) {
    const v = partner[rows[at]];
    if (v < 0) throw new Error("A corrective row's vertex has no mirror.");
    moved.push([v, -rows[at + 1], rows[at + 2], rows[at + 3]]);
  }
  moved.sort((a, b) => a[0] - b[0]);
  return {
    corrective: {
      ...corrective,
      id,
      target: id,
      inputs: corrective.inputs.map((driver) => mirrorDriver(driver, channels)),
    },
    rows: moved.flat(),
  };
}
