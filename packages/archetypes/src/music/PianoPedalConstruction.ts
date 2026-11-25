import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../core";
import type { createInstrument } from "./createInstrument";

/** The upright piano builder that owns the cabinet and its pedal. */
type Builder = AutoMovieArchetypeBuilder<
  createInstrument.Affordance,
  createInstrument.Dimension
>;

/**
 * Upright damper pedal dimensions in metres. The Yamaha U Series gallery and
 * TransAcoustic owner's manual show the right pedal protruding from the lower
 * front of the case. These dimensions approximate that profile and the visible
 * stroke for a coarse animation asset.
 */
const D = {
  right: 0.09,
  restHeight: 0.067,
  projection: 0.095,
  width: 0.047,
  depth: 0.115,
  thickness: 0.012,
  drop: 0.012,
} as const;

/**
 * Fit a moving right-hand damper pedal to the base of the upright case. See
 * https://data.yamaha.com/files/download/other_assets/4/331094/shta_om_en_YG744A0.pdf
 * and
 * https://usa.yamaha.com/products/musical_instruments/pianos/upright_pianos/u_series/u-series.html.
 *
 * @param builder The instrument builder.
 * @param front The case's front plane along local +Z, metres.
 */
export function PianoPedalConstruction(builder: Builder, front: number): void {
  const v: typeof Vector3.create = Vector3.create;
  const centre: number = front + D.projection;
  const y: number = D.restHeight - D.thickness / 2;
  const color: string = "#ad8a46";
  builder.box(
    "damper-pedal-neck",
    v(D.width / 2, D.thickness, D.projection + D.thickness),
    v(D.right, y, (front + centre - D.thickness) / 2),
    { color },
  );
  builder.box(
    "damper-pedal-plate",
    v(D.width, D.thickness, D.depth),
    v(D.right, y, centre),
    { color },
  );
  builder.affordance({
    id: "damperPedalHinge",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      v(D.right, D.restHeight, front),
      v(1, 0, 0),
      v(0, 1, 0),
    ),
    extent: null,
    travel: (Math.asin(D.drop / D.projection) * 180) / Math.PI,
    parts: ["damper-pedal-neck", "damper-pedal-plate"],
  });
  builder.affordance({
    id: "damperPedal",
    kind: "pedal",
    frame: AutoMovieArchetypeFrame.upright(v(D.right, D.restHeight, centre)),
    extent: null,
    width: D.width,
    depth: D.depth,
    rides: "damperPedalHinge",
  });
}
