import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/*
 * The parade contract establishes the shared carry. Dimensions are authored for
 * staging.
 */
const SCENIC: string =
  "Authored set dimensions for one banner shared by two carriers, as described in the Arlington Patriots Day Parade contract (https://www.arlingtonma.gov/home/showpublisheddocument/33593/636227460660770000).";

/*
 * Units paired with the banner's authorable dimensions for draw provenance.
 */
const UNITS: Readonly<Record<Dimension, AutoMovieArchetypeDrawSession.Unit>> = {
  width: "m",
  panelHeight: "m",
  depth: "m",
  poleHeight: "m",
  poleDiameter: "m",
  mass: "kg",
};

/*
 * Independent set dimensions keep the panel above an exposed grip on each pole.
 */
const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
  width: AutoMovieArchetypeBand.metres(1.2, 2.2, SCENIC, true),
  panelHeight: AutoMovieArchetypeBand.metres(0.35, 0.7, SCENIC, true),
  depth: AutoMovieArchetypeBand.metres(0.008, 0.02, SCENIC, true),
  poleHeight: AutoMovieArchetypeBand.metres(1.1, 1.6, SCENIC, true),
  poleDiameter: AutoMovieArchetypeBand.metres(0.026, 0.048, SCENIC, true),
  mass: AutoMovieArchetypeBand.of("kg", 0.6, 1.8, SCENIC, true),
};

/** Constructs the scenic parade banner archetype from its recipe. */
export namespace AutoMovieArchetypeScenicParadeBanner {
/**
 * A wide parade banner carried as one rigid prop by two performers. The pole
 * bases sit at local Y zero and the panel faces +Z. Use leftGrip on the
 * negative-X pole and rightGrip on the positive-X pole as separate carrier
 * sites on the same motion prop. The face site marks the panel center and spans
 * the panel's front, read with model `+Y` up.
 *
 * @param params Fixed set dimensions in metres and kilograms, and an optional
 *   scene-unique id.
 * @param seed Draws any omitted dimensions. Without a seed, use each band's
 *   midpoint.
 * @returns One framed panel with two pole grips and a front surface site.
 * @throws {AutoMovieArchetypeRefusal} When a fixed dimension lies outside its
 *   band.
 */
export function create(
  params: AutoMovieArchetypeScenicParadeBanner.IParams = {},
  seed?: number,
): AutoMovieArchetype<Affordance, Dimension> {
  const draw: AutoMovieArchetypeDrawSession<Dimension> =
    new AutoMovieArchetypeDrawSession(
      "scenicParadeBanner",
      UNITS,
      seed,
      params,
    );
  const {
    width,
    panelHeight,
    depth,
    poleHeight,
    poleDiameter,
    mass,
  }: Record<Dimension, number> = draw.dimensions(BANDS);
  const builder: AutoMovieArchetypeBuilder<Affordance, Dimension> =
    new AutoMovieArchetypeBuilder({
      material: "wood",
      id: params.id,
      name: "scenic parade banner",
      draw,
    });

  const panelBottom: number = poleHeight - panelHeight;
  const panelCenter: number = poleHeight - panelHeight / 2;
  builder.box(
    "panel",
    Vector3.create(width, panelHeight, depth),
    Vector3.create(0, panelCenter, 0),
    { color: "#885149" },
  );
  for (const [pole, grip, x] of [
    ["leftPole", "leftGrip", -width / 2],
    ["rightPole", "rightGrip", width / 2],
  ] as const) {
    builder.rod(
      pole,
      poleDiameter / 2,
      Vector3.create(x, 0, 0),
      Vector3.create(x, poleHeight, 0),
    );
    builder.affordance({
      id: grip,
      kind: "handle",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(x, panelBottom / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      symmetry: "round",
      aperture: poleDiameter,
      length: panelBottom,
    });
  }

  builder.affordance({
    id: "face",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, panelCenter, depth / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    width,
    depth: panelHeight,
  });
  return builder.build(mass);
}

  /*
   * Fixed banner dimensions in metres and prop mass in kilograms, plus an
   * optional scene id. The producer validates overrides against bands that leave
   * an exposed grip below the panel on each pole.
   */
  /** Optional fixed dimensions for a rectangular panel and two matching poles. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene-unique id. The producer supplies a default when omitted. */
    id?: string;
  }
}

/**
 * The panel measures and pole diameter use metres. The prop mass uses
 * kilograms.
 */
type Dimension =
  | "width"
  | "panelHeight"
  | "depth"
  | "poleHeight"
  | "poleDiameter"
  | "mass";

/** Grip names follow model X, from the perspective facing the panel from +Z. */
type Affordance = "leftGrip" | "rightGrip" | "face";
