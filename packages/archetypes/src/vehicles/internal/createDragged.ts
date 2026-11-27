import { AutoMovieArchetypeDragged } from "../AutoMovieArchetypeDragged";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../../core/index";

/*
 * A load drawn along the ground by a horse's traces rather than rolled on
 * wheels: a walking mouldboard plough, a harrow, a chained log or a sledge on
 * runners.
 *
 * The load stands with its front toward `+Z` and its ground contact on `Y=0`:
 * the plough's share and landside, the harrow's tines, the log's underside, the
 * sledge's runners. Its `coupling` is the clevis, chain ring or bar its
 * whippletree is hooked to, at the front on the centreline. A plough carries
 * two `leftHandle` and `rightHandle` grips behind it, `+X` the ploughman's
 * left, and its `share`, the share's point at the furrow bottom, the frame a
 * working depth is read at; a sledge carries a `bed` it is loaded on. The
 * dimensions are construction estimates, `SIZES`, one set per kind; no maker's
 * drawing was read, so each is provisional, and the author may fix any of
 * them.
 * Parameter params: The kind, any dimension the author fixes, and the load's mass.
 * Returns: The load at rest.
 * For a nonpositive dimension or mass.
 */
export function createDragged(
  params: AutoMovieArchetypeDragged.IParams,
): AutoMovieArchetype<AutoMovieArchetypeDragged.Affordance, AutoMovieArchetypeDragged.Dimension> {
  const d: Record<AutoMovieArchetypeDragged.Dimension, number> = {
    ...AutoMovieArchetypeDragged.SIZES[params.kind],
  };
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeDragged.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeDragged.Dimension>(
      "dragged",
      AutoMovieArchetypeDragged.UNITS,
      undefined,
    );
  for (const key of AutoMovieArchetypeDragged.DIMENSIONS) {
    const value: number = params[key] ?? d[key];
    d[key] = value;
    if (!(value > 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "dragged",
        axis: key,
        value,
        feasible: null,
        reason: "must be finite and positive",
        fix: "give the load positive sizes and mass",
      });
    draw.derive(key, value);
  }
  const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
    z: number,
  ): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeDragged.Affordance,
    AutoMovieArchetypeDragged.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: params.kind,
    draw,
  });
  const front: number = d.length / 2;
  let hitch: number = d.height;
  if (params.kind === "plough") {
    // The beam from the clevis down and back to the frog over the share; the handles rising back from it.
    hitch = d.height;
    builder.rod("beam", 0.04, v(0, hitch, front), v(0, 0.3, -front / 4));
    builder.box("share", v(d.width, 0.05, 0.35), v(0, 0.025, 0));
    builder.box("mouldboard", v(0.03, 0.25, 0.4), v(-d.width / 2, 0.15, -0.05));
    for (const [side, sign] of SIDES) {
      builder.rod(
        `handle-${side}`,
        0.02,
        v((sign * 0.05) / 2, 0.3, -front / 4),
        v((sign * d.handleSpread) / 2, d.handleHeight, -front),
      );
      builder.affordance({
        id: side === "left" ? "leftHandle" : "rightHandle",
        kind: "bar",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.upright(
          v((sign * d.handleSpread) / 2, d.handleHeight, -front),
        ),
        extent: null,
        grip: "power",
        aperture: 0.04,
        length: 0.12,
      });
    }
    builder.affordance({
      id: "share",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
      extent: null,
      width: d.width,
      depth: 0.35,
    });
  } else if (params.kind === "harrow") {
    hitch = d.height;
    builder.box("frame", v(d.width, 0.06, d.length), v(0, d.height, 0));
    for (let i: number = 0; i < 5; i++)
      for (let j: number = 0; j < 4; j++)
        builder.rod(
          `tine-${i}-${j}`,
          0.012,
          v(
            -d.width / 2 + (d.width * (i + 0.5)) / 5,
            d.height,
            -front + (d.length * (j + 0.5)) / 4,
          ),
          v(
            -d.width / 2 + (d.width * (i + 0.5)) / 5,
            0,
            -front + (d.length * (j + 0.5)) / 4,
          ),
        );
  } else if (params.kind === "log") {
    hitch = d.width / 2;
    builder.rod(
      "log",
      d.width / 2,
      v(0, d.width / 2, -front),
      v(0, d.width / 2, front),
    );
  } else {
    hitch = d.height;
    for (const [side, sign] of SIDES)
      builder.box(
        `runner-${side}`,
        v(0.06, 0.08, d.length),
        v((sign * (d.width - 0.06)) / 2, 0.04, 0),
      );
    builder.box(
      "bed",
      v(d.width, 0.05, d.length * 0.9),
      v(0, d.height - 0.025, 0),
    );
    builder.affordance({
      id: "bed",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, d.height, 0)),
      extent: null,
      width: d.width,
      depth: d.length * 0.9,
    });
  }
  builder.affordance({
    id: "coupling",
    kind: "hook",
    frame: AutoMovieArchetypeFrame.upright(v(0, hitch, front)),
    extent: null,
  });
  return builder.build(d.mass);
}



/*
 * A side of the load.
 */
type Side = "left" | "right";

/*
 * A side and the sign of `X` on it.
 */
type SideSign = readonly [Side, number];

/*
 * The two sides, `+X` first.
 */
const SIDES: readonly SideSign[] = [
  ["left", 1],
  ["right", -1],
];
