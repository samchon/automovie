import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";
import { BOAT_MODELS } from "./BOAT_MODELS";
import { BoatHull } from "./BoatHull";
import { BoatOars } from "./BoatOars";
import { createBoat } from "./createBoat";

/**
 * Assemble a boat with its fixed, positive-Z bow.
 *
 * The hull model and material determine the bottom and the gunwale around the
 * waterline. The outfitting callback owns the contacts beyond the hull.
 *
 * @param kind The fixed hull form.
 * @param outfit Adds the form's seats and other interior equipment.
 * @param params The hull's authored options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function BoatConstruction(
  kind: createBoat.Kind,
  params: Omit<createBoat.IParams, "kind">,
  seed: number | string | undefined,
  outfit: BoatConstruction.Outfit,
): AutoMovieArchetype<createBoat.Affordance, createBoat.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createBoat.Dimension> =
    new AutoMovieArchetypeDrawSession<createBoat.Dimension>(
      "boat",
      createBoat.UNITS,
      seed,
      params,
    );
  // One read hull whole and, for a canoe, one of its layups; a rowboat's blades are the oar its span calls for.
  const hull: {
    name: createBoat.Model | undefined;
    figures: Readonly<Partial<Record<createBoat.Dimension, number>>>;
  } = draw.model<createBoat.Model>(
    "model",
    params.model,
    BOAT_MODELS.hulls[kind],
  );
  const layup: {
    figures: Readonly<Partial<Record<createBoat.Dimension, number>>>;
  } = draw.model<createBoat.Layup>(
    "layup",
    params.layup,
    hull.name === undefined ? undefined : BOAT_MODELS.layups[hull.name],
  );
  const drawn: Partial<Record<createBoat.Dimension, number>> = {
    ...draw.dimensions(createBoat.BANDS[kind], createBoat.BANDS),
    ...hull.figures,
    ...layup.figures,
  };
  // A rowboat's blades follow its beam, by the oar its span calls for: derived, not drawn.
  const derived = (blade: {
    bladeLength: number;
    bladeWidth: number;
  }): Partial<Record<createBoat.Dimension, number>> => ({
    bladeLength: draw.derive("bladeLength", blade.bladeLength),
    bladeWidth: draw.derive("bladeWidth", blade.bladeWidth),
  });
  const d: Partial<Record<createBoat.Dimension, number>> =
    kind === "rowboat"
      ? { ...drawn, ...derived(BoatOars.blade(drawn.beam!)) }
      : drawn;
  const builder: AutoMovieArchetypeBuilder<
    createBoat.Affordance,
    createBoat.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind === "launch" ? "pulling boat" : kind,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const beam: number = d.beam!;
  const draft: number = d.draft ?? createBoat.DRAFT[kind];
  const bottom: number = -draft;
  const gunwale: number = d.depth! - draft;
  const stern: number = kind === "canoe" ? 0 : (createBoat.TRANSOM * beam) / 2;
  const ends: number = kind === "canoe" ? bottom + d.endHeight! : gunwale;

  const e: typeof createBoat.ESTIMATES = createBoat.ESTIMATES;

  // The hull: a bottom, and each side in two flat panels, aft from the transom's corner (a canoe's stern post) to the widest beam amidships, and forward to the stem.
  builder.box(
    "bottom",
    v(beam * e.bottom.beam, e.bottom.thickness, length * e.bottom.length),
    v(0, bottom + e.bottom.thickness / 2, 0),
    { color: BoatHull.PAINT, surface: "wood" },
  );
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    BoatHull.panel(
      builder,
      `side-${side}-aft`,
      v(sign * stern, 0, -length / 2),
      v((sign * beam) / 2, 0, 0),
      bottom,
      gunwale,
    );
    BoatHull.panel(
      builder,
      `side-${side}-fore`,
      v((sign * beam) / 2, 0, 0),
      v(0, 0, length / 2),
      bottom,
      gunwale,
    );
  }
  builder.box(
    "stem",
    v(e.post, ends - bottom, e.post),
    v(0, (ends + bottom) / 2, length / 2),
    { color: BoatHull.PAINT },
  );
  if (stern === 0)
    builder.box(
      "sternpost",
      v(e.post, ends - bottom, e.post),
      v(0, (ends + bottom) / 2, -length / 2),
      { color: BoatHull.PAINT },
    );
  if (stern > 0)
    builder.box(
      "transom",
      v(2 * stern, gunwale - bottom, e.transom),
      v(0, (gunwale + bottom) / 2, -length / 2),
      { color: BoatHull.PAINT },
    );

  // The floorboards lie on the bottom board, and people stand on their top.
  const floor: number = bottom + e.bottom.thickness + e.floor.thickness;
  builder.box(
    "floor",
    v(beam * e.floor.beam, e.floor.thickness, length * e.floor.length),
    v(0, floor - e.floor.thickness / 2, 0),
    { color: BoatHull.WOOD, surface: "wood" },
  );
  builder.affordance({
    id: "floor",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, floor, 0)),
    extent: null,
    width: beam * e.floor.beam,
    depth: length * e.floor.length,
  });
  builder.rod(
    "gunwale",
    createBoat.RAIL / 2,
    v(beam / 2, gunwale, -length / 8),
    v(beam / 2, gunwale, length / 8),
    { color: BoatHull.WOOD, surface: "wood" },
  );
  builder.affordance({
    id: "gunwale",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(beam / 2, gunwale, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: createBoat.RAIL,
    length: length / 4,
  });
  builder.affordance({
    id: "bow",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.upright(
      v(0, ends, length / 2 - e.ledge / 2),
    ),
    extent: null,
    length: e.ledge,
  });
  builder.affordance({
    id: "stern",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.upright(
      v(0, ends, -length / 2 + e.ledge / 2),
    ),
    extent: null,
    length: Math.max(2 * stern, e.ledge),
  });

  outfit(builder, { d, length, beam, bottom, gunwale, stern });
  return builder.build(d.mass!);
}

/** The hull measurements each fixed-seat boat reads while fitting its supports. */
export namespace BoatConstruction {
  /** Measured support frame inputs in the unposed hull's coordinate system. */
  export interface IHull {
    /** The resolved base dimensions, including rowboat blade sizes. */
    d: Readonly<Partial<Record<createBoat.Dimension, number>>>;
    /** The bow-to-stern extent. */
    length: number;
    /** The widest span across the hull. */
    beam: number;
    /** The height of the bottom relative to the waterline. */
    bottom: number;
    /** The height of the rail relative to the waterline. */
    gunwale: number;
    /** The transom's half-width, zero for a pointed stem. */
    stern: number;
  }

  /** Builds the interior and its contacts over the finished hull. */
  export type Outfit = (
    builder: AutoMovieArchetypeBuilder<
      createBoat.Affordance,
      createBoat.Dimension
    >,
    hull: IHull,
  ) => void;
}
