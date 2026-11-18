import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The parade contract establishes the shared carry. Dimensions are authored for staging. */
const SCENIC: string =
  "Authored set dimensions for one banner shared by two carriers, as described in the Arlington Patriots Day Parade contract (https://www.arlingtonma.gov/home/showpublisheddocument/33593/636227460660770000).";

/** The panel measures and pole diameter use metres. The prop mass uses kilograms. */
type Dimension =
  | "width"
  | "panelHeight"
  | "depth"
  | "poleHeight"
  | "poleDiameter"
  | "mass";

/** Grip names follow model X, from the perspective facing the panel from +Z. */
type Affordance = "leftGrip" | "rightGrip" | "face";

/** Units paired with the banner's authorable dimensions for draw provenance. */
const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
  width: "m",
  panelHeight: "m",
  depth: "m",
  poleHeight: "m",
  poleDiameter: "m",
  mass: "kg",
};

/** Independent set dimensions keep the panel above an exposed grip on each pole. */
const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
  width: ArchetypeBand.metres(1.2, 2.2, SCENIC, true),
  panelHeight: ArchetypeBand.metres(0.35, 0.7, SCENIC, true),
  depth: ArchetypeBand.metres(0.008, 0.02, SCENIC, true),
  poleHeight: ArchetypeBand.metres(1.1, 1.6, SCENIC, true),
  poleDiameter: ArchetypeBand.metres(0.026, 0.048, SCENIC, true),
  mass: ArchetypeBand.of("kg", 0.6, 1.8, SCENIC, true),
};

/**
 * A wide parade banner carried as one rigid prop by two performers.
 * The pole bases sit at local Y zero and the panel faces +Z. Use leftGrip
 * on the negative-X pole and rightGrip on the positive-X pole as separate
 * carrier sites on the same motion prop. The face site marks the panel center.
 *
 * @param params Fixed set dimensions in metres and kilograms, and an optional scene-unique id.
 * @param seed Draws any omitted dimensions. Without a seed, use each band's midpoint.
 * @returns One framed panel with two pole grips and a front surface site.
 * @throws {ArchetypeRefusal} When a fixed dimension lies outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared prop, local axes, units, seed and motion sites.
 * @evidence contracts/development/implementation.md#principled-implementation Each pole shares an axis with the corresponding panel edge and grip.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draws dimensions, builds the panel and mirrored supports, then adds the front marker.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Independent bands keep the poles above the panel's lower edge without clamping any author dimension.
 * @evidence contracts/development/implementation.md#efficient-algorithms Emits three primitives and three contacts from six dimension draws.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model per call.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no evaluation state.
 */
export function createScenicParadeBanner(
  params: createScenicParadeBanner.IParams = {},
  seed?: string | number,
): Archetype<Affordance, Dimension> {
  const draw: ArchetypeDrawSession<Dimension> = new ArchetypeDrawSession(
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
  const builder: ArchetypeBuilder<Affordance, Dimension> = new ArchetypeBuilder(
    {
      material: "wood",
      id: params.id,
      name: "scenic parade banner",
      draw,
    },
  );

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
      frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
      Vector3.create(0, panelCenter, depth / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(mass);
}

/**
 * Author controls for the shared banner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Groups the optional metre and kilogram controls with the model producer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the shared banner inputs without creating a second geometry or grip description.
 */
export namespace createScenicParadeBanner {
  /**
   * Optional fixed dimensions for a rectangular panel and two matching poles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the set dimensions, units and scene identity.
   * @evidence contracts/development/design.md#principled-representation One panel and two mirrored poles share a width and pole diameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Authors set the dimensions that control the visible silhouette and its mass.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All admitted dimensions are positive and preserve the exposed pole segment.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene-unique id. The producer supplies a default when omitted. */
    id?: string;
  }
}
