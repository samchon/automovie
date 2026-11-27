import { AutoMovieArchetypeDrinkware } from "../AutoMovieArchetypeDrinkware";
import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal } from "../../core";
import "../constants/DRINKWARE_BANDS";

/*
 * A drinking vessel: a mug, a cup, a drinking glass, a wine glass, or a beer,
 * water or wine bottle.
 *
 * The model is the vessel's body as one upright cylinder, with a mug's handle
 * as three bars, a wine glass's stem and foot, and a bottle's neck; with each
 * kind's flat colour, brown for a beer bottle, pale blue for a water bottle and
 * dark green for a wine bottle, that is what tells the six apart. What a hand
 * and a mouth read is exact: each grip's frame lies on the axis of the part it
 * wraps with the part's diameter as its `aperture`, and the `lip` stands on the
 * rim on the vessel's `+Z` side, where the drinker's mouth meets it.
 *
 * The vessel stands on its base at the origin, `+Y` up. A mug's or a cup's
 * handle is on `+X`, the right of a drinker who faces the `+Z` side: a loop
 * centred on the body's half height, or resting its lower stub at the base
 * where the body is too short for that, its inside as tall as an index and a
 * middle finger are broad and as deep as the thicker of them, so the two
 * fingers pass through it, its bar an industrial handle's read thickness as an
 * analogue; the fingers' hook grip reads the loop's clearance, not the bar.
 * Parameter params: The kind, how full it is and any dimension the author fixes.
 * Parameter seed: The seed that picks the model when none is given and draws every
 * dimension left free inside its band; absent, the first model and the middle
 * of each band.
 * Returns: The vessel.
 * For a fixed dimension outside its band or
 * a fill outside 0 to 1.
 */
export function createDrinkware(
  params: AutoMovieArchetypeDrinkware.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeDrinkware.Affordance, AutoMovieArchetypeDrinkware.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeDrinkware.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeDrinkware.Dimension>(
      "drinkware",
      AutoMovieArchetypeDrinkware.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeDrinkware.Kind = ArchetypeDraw.choice(
    "drinkware",
    "kind",
    params.kind,
    AutoMovieArchetypeDrinkware.KINDS,
  );
  const fill: number = params.fill ?? 0;
  if (!(fill >= 0 && fill <= 1))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "drinkware",
      axis: "fill",
      value: fill,
      feasible: { kind: "range", minimum: 0, maximum: 1, unit: "" },
      reason: `a vessel is from empty to full, not ${fill}`,
      fix: "give a fill from 0 to 1",
    });
  const drawn: Partial<Record<AutoMovieArchetypeDrinkware.Dimension, number>> =
    draw.dimensions(AutoMovieArchetypeDrinkware.BANDS[kind], AutoMovieArchetypeDrinkware.BANDS);
  // A beer bottle is one of the longnecks read, whole.
  const model: {
    name: AutoMovieArchetypeDrinkware.Model | undefined;
    figures: AutoMovieArchetypeDrinkware.Figures;
  } = draw.model<AutoMovieArchetypeDrinkware.Model>(
    "model",
    params.model,
    AutoMovieArchetypeDrinkware.MODELS[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeDrinkware.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const height: number = d.height!;
  const radius: number = d.diameter! / 2;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeDrinkware.Affordance,
    AutoMovieArchetypeDrinkware.Dimension
  > = new AutoMovieArchetypeBuilder({
    material:
      fill > 0
        ? "composite"
        : kind === "mug" || kind === "cup"
          ? "ceramic"
          : kind === "waterBottle"
            ? "plastic"
            : "glass",
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  const bottle: boolean =
    kind === "beerBottle" || kind === "waterBottle" || kind === "wineBottle";
  const color: string = COLORS[kind];

  // Where the body starts and ends: above a wine glass's stem, below a bottle's neck.
  const stem: number = d.stemLength ?? 0;
  const neck: number = bottle ? height * 0.3 : 0;
  const top: number = height - neck;
  builder.rod(
    "body",
    radius,
    Vector3.create(0, stem, 0),
    Vector3.create(0, top, 0),
    { color },
  );
  builder.affordance({
    id: "body",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, (stem + top) / 2, 0),
      Vector3.create(-1, 0, 0),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
    length: top - stem,
  });

  if (kind === "mug" || kind === "cup") {
    // The handle: an upright bar the fingers hook, held off the body by two stubs whose inner faces bound the loop.
    const bar: number = d.handleDiameter! / 2;
    const reach: number = radius + d.handleOpening! + bar;
    // Centred on the body's half height, unless the loop and its stubs are taller than half the body allows: then the lower stub rests at the base.
    const low: number = Math.max(height / 2 - d.handleLoop! / 2 - bar, bar);
    const high: number = low + d.handleLoop! + 2 * bar;
    builder.rod(
      "handle",
      bar,
      Vector3.create(reach, low, 0),
      Vector3.create(reach, high, 0),
      { color, round: true },
    );
    builder.rod(
      "handle-low",
      bar,
      Vector3.create(radius, low, 0),
      Vector3.create(reach, low, 0),
      { color },
    );
    builder.rod(
      "handle-high",
      bar,
      Vector3.create(radius, high, 0),
      Vector3.create(reach, high, 0),
      { color },
    );
    builder.affordance({
      id: "handle",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(reach, height / 2, 0),
        Vector3.create(1, 0, 0),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "hook",
      aperture: 2 * bar,
      length: d.handleLoop!,
    });
  }

  if (kind === "wineGlass") {
    const thin: number = d.stemDiameter! / 2;
    builder.rod(
      "foot",
      d.baseDiameter! / 2,
      Vector3.create(0, 0, 0),
      Vector3.create(0, 0.004, 0),
      { color },
    );
    builder.rod(
      "stem",
      thin,
      Vector3.create(0, 0.004, 0),
      Vector3.create(0, stem, 0),
      { color },
    );
    builder.affordance({
      id: "stem",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, (0.004 + stem) / 2, 0),
        Vector3.create(-1, 0, 0),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: 2 * thin,
      length: stem - 0.004,
    });
  }

  // The rim the mouth meets: of the body, or of a bottle's neck.
  const rim: number = bottle ? d.neckDiameter! / 2 : radius;
  if (bottle) {
    builder.rod(
      "neck",
      rim,
      Vector3.create(0, top, 0),
      Vector3.create(0, height, 0),
      { color },
    );
    builder.affordance({
      id: "neck",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, top + neck / 2, 0),
        Vector3.create(-1, 0, 0),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * rim,
      length: neck,
    });
    builder.affordance({
      id: "mouth",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
      extent: null,
    });
  }
  builder.affordance({
    id: "lip",
    kind: "ledge",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, rim)),
    extent: null,
  });
  // A beer bottle breaks at the energies a drop tower measured on half-litre beer bottles: its body leaves as shards and its neck stays in the hand.
  const breaking: number | undefined =
    kind === "beerBottle" ? AutoMovieArchetypeDrinkware.BREAKING[fill] : undefined;
  if (breaking !== undefined)
    builder.fracture([
      { id: "shards", parts: ["body"], affordances: ["body"] },
    ]);
  return builder.build(
    d.mass! + fill * CAPACITY[kind],
    breaking === undefined ? undefined : { outcome: { fracture: breaking } },
  );
}

/*
 * The readable name of each kind.
 */
const NAMES: Readonly<Record<AutoMovieArchetypeDrinkware.Kind, string>> = {
  mug: "mug",
  cup: "cup",
  glass: "drinking glass",
  wineGlass: "wine glass",
  beerBottle: "beer bottle",
  waterBottle: "water bottle",
  wineBottle: "wine bottle",
};

/*
 * The flat colour each kind is drawn in, picture only: a glazed mug, clear
 * glass, brown glass for beer, a clear pale blue for water and dark green glass
 * for wine, so the bottles are told apart on a still.
 */
const COLORS: Readonly<Record<AutoMovieArchetypeDrinkware.Kind, string>> = {
  mug: "#e8e4da",
  cup: "#f4f2ec",
  glass: "#a9c8d8",
  wineGlass: "#a9c8d8",
  beerBottle: "#6b3f1d",
  waterBottle: "#cdeaf8",
  wineBottle: "#1f4d2b",
};

/*
 * What each kind holds when full, litres: the capacity its sources state.
 */
const CAPACITY: Readonly<Record<AutoMovieArchetypeDrinkware.Kind, number>> = {
  mug: 0.24,
  cup: 0.18,
  glass: 0.473,
  wineGlass: 0.215,
  beerBottle: 0.33,
  waterBottle: 0.5,
  wineBottle: 0.75,
};
