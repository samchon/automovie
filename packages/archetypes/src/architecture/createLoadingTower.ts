import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** Colour and banding references for the fictional scenery. */
const OAK_AND_IRON: string =
  "The Met, Chest with Iron Banding (https://www.metmuseum.org/art/collection/search/463632)";

/**
 * A fictional timber loading tower with fixed wheel faces and a stage gangway.
 *
 * The scene origin lies at floor level under the middle of the tower. The rear
 * boarding area projects along `-Z`. The upper platform opens through the front
 * doorway onto the level gangway along `+Z`.
 *
 * @param params Dimensions the author fixes, and an optional scene id.
 * @param seed Seed for dimensions left free, or the band midpoints when absent.
 * @returns The fixed scenery and its model-local staging contacts.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createLoadingTower(
  params: createLoadingTower.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createLoadingTower.Affordance,
  createLoadingTower.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createLoadingTower.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "loading tower",
      createLoadingTower.UNITS,
      seed,
      params,
    );
  const d: Record<createLoadingTower.Dimension, number> = draw.dimensions(
    createLoadingTower.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createLoadingTower.Affordance,
    createLoadingTower.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "loading tower",
    material: "composite",
    draw,
  });
  const timber: string = "#71503a";
  const floor: string = "#906b4a";
  const trim: string = "#4b3930";
  const iron: string = "#353130";
  const thickness: number = 0.12;
  const boardingY: number = 0.35;
  const front: number = d.depth / 2;
  const openingWidth: number = d.width * 0.56;
  const openingHeight: number = 2.05;

  // Contact rectangles are the top faces of the corresponding slabs.
  const slab = (
    id: Exclude<createLoadingTower.Affordance, "door">,
    width: number,
    depth: number,
    y: number,
    z: number,
  ): void => {
    builder.box(
      id,
      Vector3.create(width, thickness, depth),
      Vector3.create(0, y - thickness / 2, z),
      { color: floor },
    );
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, y, z)),
      extent: null,
      width,
      depth,
    });
  };
  slab("boarding", openingWidth, 0.85, boardingY, -front - 0.85 / 2);
  slab("platform", d.width - 2 * thickness, d.depth, d.platformHeight, 0);
  slab(
    "gangway",
    openingWidth,
    d.gangwayDepth,
    d.platformHeight,
    front + d.gangwayDepth / 2,
  );

  builder.box(
    "lower-floor",
    Vector3.create(d.width - 2 * thickness, thickness, d.depth),
    Vector3.create(0, boardingY - thickness / 2, 0),
    { color: floor },
  );

  const sideX: number = (d.width - thickness) / 2;
  const rearJambWidth: number = (d.width - openingWidth) / 2;
  const jambX: number = (d.width + openingWidth) / 4;
  const lowerHeight: number = d.platformHeight - boardingY;
  const upperHeight: number = openingHeight + thickness;
  for (const side of [-1, 1]) {
    const suffix: string = side < 0 ? "left" : "right";
    builder.box(
      `lower-side-${suffix}`,
      Vector3.create(thickness, lowerHeight, d.depth),
      Vector3.create(side * sideX, boardingY + lowerHeight / 2, 0),
      { color: timber },
    );
    builder.box(
      `rear-jamb-${suffix}`,
      Vector3.create(rearJambWidth, lowerHeight, thickness),
      Vector3.create(
        side * jambX,
        boardingY + lowerHeight / 2,
        -front + thickness / 2,
      ),
      { color: trim },
    );
    builder.box(
      `front-jamb-${suffix}`,
      Vector3.create(rearJambWidth, upperHeight, thickness),
      Vector3.create(
        side * jambX,
        d.platformHeight + upperHeight / 2,
        front - thickness / 2,
      ),
      { color: timber },
    );
    builder.box(
      `upper-side-${suffix}`,
      Vector3.create(thickness, openingHeight * 0.46, d.depth),
      Vector3.create(side * sideX, d.platformHeight + openingHeight * 0.23, 0),
      { color: timber },
    );

    // Shallow scenic wheel faces sit on the outside of the side walls.
    for (const end of [-1, 1]) {
      const wheel: string = `wheel-${suffix}-${end < 0 ? "rear" : "front"}`;
      const y: number = 0.44;
      const z: number = (end * d.depth) / 4;
      const inner: number = (side * d.width) / 2;
      const outer: number = inner + side * 0.16;
      builder.rod(
        wheel,
        y,
        Vector3.create(inner, y, z),
        Vector3.create(outer, y, z),
        { color: trim },
      );
      builder.rod(
        `${wheel}-hub`,
        y * 0.24,
        Vector3.create(outer, y, z),
        Vector3.create(outer + side * 0.05, y, z),
        { color: iron },
      );
    }
  }
  builder.box(
    "front-panel",
    Vector3.create(d.width, lowerHeight, thickness),
    Vector3.create(0, boardingY + lowerHeight / 2, front - thickness / 2),
    { color: timber },
  );
  builder.box(
    "door-lintel",
    Vector3.create(openingWidth, thickness, thickness),
    Vector3.create(
      0,
      d.platformHeight + openingHeight + thickness / 2,
      front - thickness / 2,
    ),
    { color: trim },
  );
  builder.affordance({
    id: "door",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, d.platformHeight, front),
    ),
    extent: null,
    width: openingWidth,
    height: openingHeight,
  });
  return builder.build(d.mass);
}

/** Dimensions and staging contacts of {@link createLoadingTower}. */
export namespace createLoadingTower {
  /**
   * Foot support on the rear boarding slab, upper platform and gangway, plus
   * the front doorway passage.
   */
  export type Affordance = "boarding" | "platform" | "gangway" | "door";

  /**
   * Shell width along X, shell depth along Z, upper floor above grade, gangway
   * projection from the front, and scenic mass.
   */
  export type Dimension =
    | "width"
    | "depth"
    | "platformHeight"
    | "gangwayDepth"
    | "mass";

  /** Author-fixed dimensions within the scene bands and an optional model id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene-unique model id, defaulting to the producer's name. */
    id?: string;
  }

  /** Model lengths are metres and mass is kilograms. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    platformHeight: "m",
    gangwayDepth: "m",
    mass: "kg",
  };

  /** Scene blockout bands, chosen for actor staging and silhouette. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.of(
      "m",
      1.8,
      2.6,
      `Fictional scene footprint. Finish reference: ${OAK_AND_IRON}`,
      true,
    ),
    depth: AutoMovieArchetypeBand.of(
      "m",
      1.9,
      2.7,
      "Fictional scene footprint",
      true,
    ),
    platformHeight: AutoMovieArchetypeBand.of(
      "m",
      2.3,
      3.1,
      "Fictional upper staging level",
      true,
    ),
    gangwayDepth: AutoMovieArchetypeBand.of(
      "m",
      0.7,
      1.2,
      "Fictional gangway staging area",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      160,
      240,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
