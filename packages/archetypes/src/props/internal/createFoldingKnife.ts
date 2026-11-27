import type { AutoMovieArchetypeFoldingKnife } from "../AutoMovieArchetypeFoldingKnife";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/*
 * A folding knife whose blade swings from inside its handle to open and locks
 * there.
 *
 * The handle runs along `+Z` from its butt at the origin to the pivot at its
 * far end, its spine up (`+Y`). The blade turns about the pivot's `+X` on the
 * `blade` hinge, from folded into the handle's slot at 0, its edge inside, to
 * open and locked at 180 degrees, pointing along `+Z`: a lock holds the blade
 * at the hinge's end, which the drive's last travel keeps. `grip` is the
 * handle, taken from below; `stud` is the thumb stud on the blade's spine that
 * opens it; `point` the blade's tip.
 * Parameter params: The optional scene id.
 * Returns: The knife and its contacts, metres.
 */
export function createFoldingKnife(
  params: AutoMovieArchetypeFoldingKnife.IParams = {},
): AutoMovieArchetype<
  AutoMovieArchetypeFoldingKnife.Affordance,
  AutoMovieArchetypeFoldingKnife.Dimension
> {
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeFoldingKnife.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "foldingKnife",
      { blade: "m", handle: "m", mass: "kg" },
      undefined,
    );
  draw.derive("blade", SIZE.blade);
  draw.derive("handle", SIZE.handle);
  draw.derive("mass", SIZE.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeFoldingKnife.Affordance,
    AutoMovieArchetypeFoldingKnife.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "foldingKnife",
    name: "folding knife",
    material: "steel",
    draw,
  });
  const pivot: number = SIZE.handle - 0.008;
  builder.box(
    "handle",
    v(SIZE.thickness, SIZE.width, SIZE.handle),
    v(0, 0, SIZE.handle / 2),
    { color: "#3b3430" },
  );
  // Folded, the blade lies in the handle's slot, back from the pivot.
  builder.box(
    "blade",
    v(0.002, SIZE.width * 0.7, SIZE.blade),
    v(0, 0, pivot - SIZE.blade / 2),
    { color: "#c9ccd0" },
  );
  builder.affordance({
    id: "blade",
    kind: "hinge",
    extent: null,
    travel: 180,
    parts: ["blade"],
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, pivot),
      v(1, 0, 0),
      v(0, 0, 1),
    ),
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, -SIZE.width / 2, SIZE.handle / 2),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: SIZE.width,
    length: SIZE.handle,
  });
  builder.affordance({
    id: "stud",
    kind: "button",
    rides: "blade",
    frame: AutoMovieArchetypeFrame.upright(
      v(0, SIZE.width * 0.35, pivot - 0.012),
    ),
    extent: null,
  });
  builder.affordance({
    id: "point",
    kind: "socket",
    rides: "blade",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, pivot - SIZE.blade)),
    extent: null,
  });
  return builder.build(SIZE.mass);
}

/*
 * A pocket folding knife with a three-inch blade (3 × 0.0254 m). No source is
 * read: the blade, the handle (the closed blade's length plus a bolster), its
 * thickness and width and the mass are provisional construction estimates.
 */
const SIZE: Readonly<AutoMovieArchetypeFoldingKnife.ISize> = {
  blade: 3 * 0.0254,
  handle: 3 * 0.0254 + 0.025,
  width: 0.022,
  thickness: 0.012,
  mass: 0.09,
};
