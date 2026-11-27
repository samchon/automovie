import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { HandheldDevice } from "./internal/HandheldDevice";

/** The canonical producer and authoring contract for a smartphone. */
export namespace AutoMovieArchetypePhone {
  /**
   * A smartphone with an upright touchscreen and a rear lens.
   *
   * The model stands on its bottom edge at the origin with its front toward `+Z`.
   *
   * @param params The identifier, fixed outside dimensions and mass.
   * @param seed The seed for the device's remaining choices.
   * @returns The device and its named contacts.
   * @throws {AutoMovieArchetypeRefusal} For a refused dimension or producer
   *   input.
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
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /** The identifiers of contacts built by this producer. */
  export type Affordance = "grip" | "lens" | "pinch" | "screen";

  /** Parameters for this smartphone. */
  export interface IParams extends Omit<
    HandheldDevice.IParams,
    "kind" | "model"
  > {
    /** This smartphone has no manufacturer model selector. */
    model?: never;
  }
}
