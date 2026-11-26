import type { AutoMovieArchetypeGamingChip } from "../AutoMovieArchetypeGamingChip";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../../core/index";
import { TabletopStack } from "../TabletopStack";

/**
 * A casino gaming chip: "The chips used in United States casinos typically
 * weigh about 10 grams" (English Wikipedia, Casino token, read 2026-11-21). No
 * read source gave the diameter or thickness, so the common 39 mm by 3.3 mm are
 * provisional estimates.
 */
const CHIP: Readonly<AutoMovieArchetypeGamingChip.IChip> = {
  diameter: 0.039,
  thickness: 0.0033,
  mass: 0.01,
};

/**
 * One gaming chip lying flat.
 *
 * The chip is a disc in the `XZ` plane, its origin the centre of its underside.
 * Chips stack by the shared tabletop contacts (`TabletopStack`): one chip's
 * `base` mounted on the next one's `top`, so a stack moves with the chip at its
 * bottom.
 *
 * @param params The optional scene id.
 * @returns The inert chip and its contact frames, metres.
 */
export function createGamingChip(
  params: AutoMovieArchetypeGamingChip.IParams = {},
): AutoMovieArchetype<AutoMovieArchetypeGamingChip.Affordance, AutoMovieArchetypeGamingChip.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeGamingChip.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "gamingChip",
      { diameter: "m", thickness: "m", mass: "kg" },
      undefined,
    );
  draw.derive("diameter", CHIP.diameter);
  draw.derive("thickness", CHIP.thickness);
  draw.derive("mass", CHIP.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeGamingChip.Affordance,
    AutoMovieArchetypeGamingChip.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "gamingChip",
    name: "gaming chip",
    material: "plastic",
    draw,
  });
  builder.rod(
    "chip",
    CHIP.diameter / 2,
    Vector3.create(0, 0, 0),
    Vector3.create(0, CHIP.thickness, 0),
    { color: "#2a6db2" },
  );
  TabletopStack.contacts(builder, CHIP.thickness, CHIP.diameter);
  return builder.build(CHIP.mass);
}
