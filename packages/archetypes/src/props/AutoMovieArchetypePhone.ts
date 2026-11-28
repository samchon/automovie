import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { HandheldDevice } from "./internal/HandheldDevice";

/**
 * Constructs an upright smartphone case with front screen and rear lens contacts.
 */
export namespace AutoMovieArchetypePhone {
  /**
   * Build the phone upright on its bottom edge, facing model `+Z`.
   *
   * The front `screen` frame covers 94 percent of each case-face dimension.
   * The rear `lens` frame lies at 90 percent of the model height.
   *
   * @param params Optional scene ID and finite dimensions in the phone bands.
   *   The ID defaults to `device`.
   * @param seed Numeric seed for omitted dimensions. Omit it for band
   *   midpoints, including case height 0.14745 metres.
   * @returns A case with rear `grip` and bottom `pinch` plus `screen` and `lens`.
   * @throws {AutoMovieArchetypeRefusal} If a fixed dimension or model selection is inadmissible.
   */
  export function create(
    params: AutoMovieArchetypePhone.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypePhone.Affordance,
    AutoMovieArchetypePhone.Dimension
  > {
    const {
      builder,
      size,
    }: ReturnType<
      typeof HandheldDevice.draw<AutoMovieArchetypePhone.Affordance>
    > = HandheldDevice.draw<AutoMovieArchetypePhone.Affordance>(
      "phone",
      "smartphone",
      params,
      seed,
    );
    const {
      width,
      height,
      thickness: depth,
    }: Record<HandheldDevice.Dimension, number> = size;
    HandheldDevice.caseBody(builder, width, height, depth);
    for (const affordance of HandheldDevice.smallGrips(width, height, depth))
      builder.affordance(affordance);

    builder.affordance({
      id: "screen",
      kind: "surface",
      direction: "normal",
      frame: HandheldDevice.front(height / 2, depth),
      extent: null,
      width: width * 0.94,
      depth: height * 0.94,
    });
    builder.affordance({
      id: "lens",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, height * 0.9, -depth / 2),
        AutoMovieEngineVector3.create(0, 0, -1),
        AutoMovieEngineVector3.create(-1, 0, 0),
      ),
      extent: null,
    });
    return builder.build(size.mass);
  }

  /* The parameters and affordance identifiers of {@link AutoMovieArchetypePhone}. */
  /**
   * Upright case height, width and thickness in metres and mass in kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /**
   * Rear `grip`, lower lateral `pinch`, centred front `screen` and rear `lens`.
   */
  export type Affordance = "grip" | "lens" | "pinch" | "screen";

  /**
   * Optional scene ID and fixed finite case dimensions or mass from the phone bands.
   */
  export interface IParams extends Omit<
    HandheldDevice.IParams,
    "kind" | "model"
  > {
    /**
     * Keep this field absent. The phone takes its dimensions from the bands.
     */
    model?: never;
  }
}
