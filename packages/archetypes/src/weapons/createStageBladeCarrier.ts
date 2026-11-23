import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
} from "../core";
import { StageCarrierConstruction } from "./StageCarrierConstruction";
import { createHolster } from "./createHolster";

/**
 * Worn blade carrier silhouette.
 *
 * The classic digitized sheath forms stand upright from the base, with a
 * visible throat and wearer-facing hook. Both share legacy opening placement.
 *
 * @param params The scene id, optional display dimensions and this carrier's
 *   own fit options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageBladeCarrier(
  params: createStageBladeCarrier.IParams,
  seed?: number | string,
): AutoMovieArchetype<
  createStageBladeCarrier.Affordance,
  createStageBladeCarrier.Dimension
> {
  const kind: createStageBladeCarrier.Kind = ArchetypeDraw.choice(
    "holster",
    "kind",
    params.kind,
    createStageBladeCarrier.KINDS,
  );
  return StageCarrierConstruction(kind, params, seed, (builder, d) => {
    const v: typeof Vector3.create = Vector3.create;
    const length: number = d.length!;
    const throat: number = createHolster.THROAT;
    const thick: number = d.thickness! + createHolster.THROAT_LIP;
    builder.box(
      "body",
      v(d.thickness!, length - throat, d.width!),
      v(0, (length - throat) / 2, 0),
      { color: "#4a3426" },
    );
    builder.box(
      "throat",
      v(thick, throat, d.width! + createHolster.THROAT_LIP),
      v(0, length - throat / 2, 0),
      { color: "#8a8d91" },
    );
    builder.affordance({
      id: "mouth",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v(0, length, 0)),
      extent: null,
    });
    builder.affordance({
      id: "belt",
      kind: "hook",
      frame: StageCarrierConstruction.facingWearer(
        v(-thick / 2, length - throat / 2, 0),
      ),
      extent: null,
    });
  });
}

/** Authoring options for {@link createStageBladeCarrier}. */
export namespace createStageBladeCarrier {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";

  /**
   * The createHolster contact set its shared construction types. This producer
   * builds belt, mouth.
   */
  export type Affordance = createHolster.Affordance;

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["scabbard", "sheath"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createHolster.IParams,
    "id" | "length" | "width" | "thickness" | "mass"
  > {
    /** The profile with the required outline. */
    kind: Kind;
    /** A compatible historical display profile identifier. */
    blade?: createHolster.Blade;
  }
}
