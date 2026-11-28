import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeSaloonDoorData } from "./internal/AutoMovieArchetypeSaloonDoorData";

/** Constructs paired swinging saloon door leaves in a fixed passage. */
export namespace AutoMovieArchetypeSaloonDoor {
/**
 * Build two independently hinged leaves across a selected opening.
 *
 * Each leaf allows 125 degrees forward and reverse. Its front push
 * surface travels with that leaf. The fixed `passage` spans from Y
 * zero to the top of the closed leaves.
 *
 * @param params Optional catalogue opening, scene ID and finite leaf
 *   height, thickness, floor gap or mass. The ID defaults to `saloonDoor`.
 * @param seed Numeric seed for omitted settings. Omission selects `30in`
 *   and the midpoint of each applicable leaf band.
 * @returns The two hinges and push surfaces with the fixed aperture.
 * @throws {AutoMovieArchetypeRefusal} If the opening choice or fixed value is inadmissible.
 */
export function create(
  params: AutoMovieArchetypeSaloonDoor.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSaloonDoor.Affordance, AutoMovieArchetypeSaloonDoor.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSaloonDoor.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSaloonDoor.Dimension>(
      "saloonDoor",
      AutoMovieArchetypeSaloonDoor.UNITS,
      seed,
      params,
    );
  const opening: {
    name: AutoMovieArchetypeSaloonDoor.Opening | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeSaloonDoor.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeSaloonDoor.Opening>(
    "size",
    params.size,
    AutoMovieArchetypeSaloonDoor.OPENINGS,
  );
  const d: Record<AutoMovieArchetypeSaloonDoor.Dimension, number> = {
    ...draw.dimensions(AutoMovieArchetypeSaloonDoor.BANDS),
    opening: opening.figures.opening!,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSaloonDoor.Affordance,
    AutoMovieArchetypeSaloonDoor.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `saloon doors for a ${opening.name} opening`,
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const half: number = d.opening / 2;
  const middle: number = d.gap + d.height / 2;
  for (const [hinge, push, part, sign] of [
    ["leftLeaf", "leftPush", "leaf-left", 1],
    ["rightLeaf", "rightPush", "leaf-right", -1],
  ] as const) {
    builder.box(
      part,
      v(half, d.height, d.thickness),
      v((sign * half) / 2, middle, 0),
      {
        color: "#8a5a2b",
      },
    );
    builder.affordance({
      id: hinge,
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(sign * half, middle, d.thickness / 2),
        v(0, sign, 0),
        v(-sign, 0, 0),
      ),
      extent: null,
      travel: SWING,
      reverse: SWING,
      parts: [part],
    });
    builder.affordance({
      id: push,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        v((sign * half) / 2, middle, d.thickness / 2),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      width: half,
      depth: d.height,
      rides: hinge,
    });
  }
  builder.affordance({
    id: "passage",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: d.opening,
    height: d.gap + d.height,
  });
  return builder.build(d.mass);
}

  /**
   * Independent `leftLeaf` and `rightLeaf` hinges and their front push
   * surfaces, with a fixed `passage` aperture at floor level.
   */
  export type Affordance =
    | "leftLeaf"
    | "rightLeaf"
    | "leftPush"
    | "rightPush"
    | "passage";

  /**
   * Catalogue opening width, leaf height, thickness and floor gap in metres, and paired mass in kilograms.
   */
  export type Dimension = "opening" | "height" | "thickness" | "gap" | "mass";

  /**
   * Metres for the selected opening and leaf dimensions, and kilograms for mass.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    opening: "m",
    height: "m",
    thickness: "m",
    gap: "m",
    mass: "kg",
  };

  /** Catalogue clear-width labels `30in`, `32in` and `36in`. */
  export type Opening = "30in" | "32in" | "36in";

  /**
   * Clear width in metres for each opening label. The first row supplies the seedless selection.
   */
  export const OPENINGS: Readonly<
    Record<Opening, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "30in": { opening: 30 * AutoMovieArchetypeUnits.INCH },
    "32in": { opening: 32 * AutoMovieArchetypeUnits.INCH },
    "36in": { opening: 36 * AutoMovieArchetypeUnits.INCH },
  };

  /**
   * Optional opening size, scene ID and applicable finite leaf measurements.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "opening">, number>
  > {
    /** Selects the catalogue clear width. Omit it and the seed for `30in`. */
    size?: Opening;

    /** Scene object ID, defaulting to `saloonDoor`. */
    id?: string;
  }

  /**
   * Admitted height, thickness, lower gap and mass ranges for the paired leaves.
   */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "opening">, IAutoMovieArchetypeBand>
  > = {
    height: AutoMovieArchetypeBand.metres(
      40 * AutoMovieArchetypeUnits.INCH,
      40 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeSaloonDoorData.DOORS,
    ),
    thickness: AutoMovieArchetypeBand.metres(
      0.75 * AutoMovieArchetypeUnits.INCH,
      0.75 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeSaloonDoorData.DOORS,
    ),
    gap: AutoMovieArchetypeBand.metres(
      18 * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeSaloonDoorData.GAP,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      8,
      16,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}

/*
 * A leaf's opening on its gravity hinge, degrees: Swinging Cafe Doors' standard
 * gravity hinge, which "can be locked open in either direction" at 125 degrees
 * (https://swingingcafedoors.com/hardware-info).
 */
const SWING: number = 125;
