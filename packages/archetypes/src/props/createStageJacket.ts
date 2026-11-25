import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The bounds of authored coarse garment dimensions in metres. */
const BANDS: Readonly<
  Record<createStageJacket.Dimension, IAutoMovieArchetypeBand>
> = {
  width: AutoMovieArchetypeBand.metres(
    0.36,
    0.6,
    "Coarse wardrobe prop across its torso",
    true,
  ),
  depth: AutoMovieArchetypeBand.metres(
    0.24,
    0.42,
    "Coarse wardrobe prop around its torso",
    true,
  ),
  length: AutoMovieArchetypeBand.metres(
    0.45,
    0.69,
    "Coarse wardrobe prop along its back",
    true,
  ),
  sleeveWidth: AutoMovieArchetypeBand.metres(
    0.12,
    0.2,
    "Clear opening of a loose short sleeve",
    true,
  ),
  sleeveLength: AutoMovieArchetypeBand.metres(
    0.04,
    0.08,
    "Coarse length of a short sleeve",
    true,
  ),
  zipTravel: AutoMovieArchetypeBand.metres(
    0.13,
    0.27,
    "Visible pull distance across the front of the stage garment",
    true,
  ),
};

/** Coarse staging proxy wall thickness, in metres. */
const WALL: number = 0.012;

/**
 * An open-front short-sleeve stage jacket with two hollow sleeve passages.
 *
 * The model's origin is at the middle of the upper back. Positive Y points up
 * and positive Z faces forward. Each sleeve's opening faces up in model space
 * and fits around the wearer's upper arm. One visible zipper pull travels along
 * the placket from its lower stop toward the neck.
 *
 * @param params An optional identity and authored dimensions in metres.
 * @param seed Selects dimensions left unbound by the author.
 * @returns A model with separate front and back collar holds, wear, sleeve,
 *   exit and closure contacts.
 * @throws {AutoMovieArchetypeRefusal} When an authored dimension is outside its
 *   band.
 */
export function createStageJacket(
  params: createStageJacket.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createStageJacket.Affordance,
  createStageJacket.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createStageJacket.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "stageJacket",
      {
        width: "m",
        depth: "m",
        length: "m",
        sleeveWidth: "m",
        sleeveLength: "m",
        zipTravel: "m",
      },
      seed,
      params,
    );
  const d: Record<createStageJacket.Dimension, number> = draw.dimensions(BANDS);
  const v: typeof Vector3.create = Vector3.create;
  const builder: AutoMovieArchetypeBuilder<
    createStageJacket.Affordance,
    createStageJacket.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "short-sleeve stage jacket",
    material: "composite",
    draw,
  });
  const cloth: AutoMovieArchetypeBuilder.IOptions = { color: "#437b89" };
  const seam: AutoMovieArchetypeBuilder.IOptions = { color: "#30616e" };

  // Separate back and front panels leave space for the body and a front opening.
  const half: number = d.width / 2;
  const front: number = d.depth / 2 + WALL;
  const back: number = front + 0.11;
  const panelWidth: number = d.width * 0.42;
  const bottom: number = -d.length;
  const panelTop: number = -d.sleeveLength;
  const panelLength: number = panelTop - bottom;
  const panelCenter: number = (bottom + panelTop) / 2;
  builder.box(
    "back",
    v(d.width, panelLength, WALL),
    v(0, panelCenter, -back),
    cloth,
  );
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    builder.box(
      side + "-front",
      v(panelWidth, panelLength, WALL),
      v(sign * (half - panelWidth / 2), panelCenter, front),
      cloth,
    );
    builder.box(
      side + "-side",
      v(WALL, panelLength, front + back),
      v(sign * (half + WALL / 2), panelCenter, (front - back) / 2),
      seam,
    );
    const at: number = sign * half;
    const ring: number = (d.sleeveWidth + WALL) / 2;
    const outside: number = d.sleeveWidth + WALL * 2;
    const sleeveY: number = -d.sleeveLength / 2;
    const sleeveFront: number = WALL * 3;
    for (const [edge, cross] of [
      ["inner", -1],
      ["outer", 1],
    ] as const)
      builder.box(
        side + "-sleeve-" + edge,
        v(WALL, d.sleeveLength, outside),
        v(at + cross * ring, sleeveY, sleeveFront),
        seam,
      );
    for (const [edge, cross] of [
      ["back", -1],
      ["front", 1],
    ] as const)
      builder.box(
        side + "-sleeve-" + edge,
        v(d.sleeveWidth, d.sleeveLength, WALL),
        v(at, sleeveY, sleeveFront + cross * ring),
        cloth,
      );
    builder.affordance({
      id: side === "left" ? "leftSleeveOpening" : "rightSleeveOpening",
      kind: "aperture",
      frame: AutoMovieArchetypeFrame.facing(
        v(at, 0, sleeveFront + d.sleeveWidth / 2),
        v(0, 0, -1),
        v(1, 0, 0),
      ),
      width: d.sleeveWidth,
      height: d.sleeveWidth,
      extent: null,
    });
    builder.affordance({
      id: side === "left" ? "leftSleeveExit" : "rightSleeveExit",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(
        v(at, -d.sleeveLength, sleeveFront),
      ),
      extent: null,
    });
  }

  // A visible centered pull rides the zipper's upward travel in model space.
  const zipY: number = -d.length * 0.58;
  const zipZ: number = front + WALL;
  builder.box(
    "closurePath",
    v(0.024, d.zipTravel + 0.02, WALL),
    v(0, zipY + d.zipTravel / 2, zipZ),
    { color: "#b6c2b7" },
  );
  builder.box("zipPull", v(0.027, 0.021, WALL * 1.8), v(0, zipY, zipZ + WALL), {
    color: "#f2b644",
  });
  builder.affordance({
    id: "zip",
    kind: "slider",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, zipY, zipZ + WALL),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    travel: d.zipTravel,
    parts: ["zipPull"],
  });
  builder.rod(
    "hold-stripe",
    0.018,
    v(-0.035, panelTop, front + 0.035),
    v(0.035, panelTop, front + 0.035),
    { color: "#e4a344" },
  );
  builder.affordance({
    id: "hold",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, panelTop, front + 0.035),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    aperture: 0.036,
    length: 0.07,
    grip: "power",
    symmetry: "round",
    extent: null,
  });

  // The same handle on the back panel's collar edge, for a dresser standing behind the wearer.
  builder.rod(
    "back-collar-stripe",
    0.018,
    v(-0.035, panelTop, -(back + 0.035)),
    v(0.035, panelTop, -(back + 0.035)),
    { color: "#e4a344" },
  );
  builder.affordance({
    id: "backCollar",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, panelTop, -(back + 0.035)),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    aperture: 0.036,
    length: 0.07,
    grip: "power",
    symmetry: "round",
    extent: null,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
  });
  return builder.build(0.46);
}

/** Authorable dimensions and declared contact identities. */
export namespace createStageJacket {
  /**
   * Distinct sleeve opening/exit sites, the front collar hold, the back collar
   * hold a dresser behind the wearer takes, the wear site and the zip.
   */
  export type Affordance =
    | "leftSleeveOpening"
    | "leftSleeveExit"
    | "rightSleeveOpening"
    | "rightSleeveExit"
    | "hold"
    | "backCollar"
    | "wear"
    | "zip";

  /** The overall torso, clear short sleeves and zipper travel as metre values. */
  export type Dimension =
    | "width"
    | "depth"
    | "length"
    | "sleeveWidth"
    | "sleeveLength"
    | "zipTravel";

  /** Input constraints and optional scene identity. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The garment's stable scene identity. */
    id?: string;
  }
}
