import { AutoMovieArchetypeStageBladeCarrier } from "../AutoMovieArchetypeStageBladeCarrier";
import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import { StageCarrierConstruction } from "../StageCarrierConstruction";
import { AutoMovieArchetypeHolster } from "../AutoMovieArchetypeHolster";

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
  params: AutoMovieArchetypeStageBladeCarrier.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageBladeCarrier.Affordance,
  AutoMovieArchetypeStageBladeCarrier.Dimension
> {
  const kind: AutoMovieArchetypeStageBladeCarrier.Kind = ArchetypeDraw.choice(
    "holster",
    "kind",
    params.kind,
    AutoMovieArchetypeStageBladeCarrier.KINDS,
  );
  return StageCarrierConstruction(kind, params, seed, (builder, d) => {
    const v: typeof Vector3.create = Vector3.create;
    const length: number = d.length!;
    const throat: number = AutoMovieArchetypeHolster.THROAT;
    const thick: number = d.thickness! + AutoMovieArchetypeHolster.THROAT_LIP;
    builder.box(
      "body",
      v(d.thickness!, length - throat, d.width!),
      v(0, (length - throat) / 2, 0),
      { color: "#4a3426" },
    );
    builder.box(
      "throat",
      v(thick, throat, d.width! + AutoMovieArchetypeHolster.THROAT_LIP),
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
