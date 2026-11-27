import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { HandheldDevice } from "./internal/HandheldDevice";

/** The canonical producer and authoring contract for a compact camera. */
export namespace AutoMovieArchetypeCamera {
  /**
   * A compact camera with separate grasp, support, viewing and shutter contacts.
   *
   * The model stands on its bottom edge at the origin with its front toward `+Z`.
   *
   * @param params The identifier and a choice among this device's measured
   *   models.
   * @param seed The seed for the device's remaining choices.
   * @returns The device and its named contacts.
   * @throws {AutoMovieArchetypeRefusal} For a refused dimension or producer
   *   input.
   */
  export function create(
    params: AutoMovieArchetypeCamera.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeCamera.Affordance,
    AutoMovieArchetypeCamera.Dimension
  > {
    const {
      builder,
      size,
    }: ReturnType<
      typeof HandheldDevice.draw<AutoMovieArchetypeCamera.Affordance>
    > = HandheldDevice.draw<AutoMovieArchetypeCamera.Affordance>(
      "camera",
      "compact camera",
      params,
      seed,
    );
    const {
      width,
      height,
      thickness: depth,
    }: Record<HandheldDevice.Dimension, number> = size;
    // The body, a grip bar on the photographer's right (-X) and the lens barrel in front.
    const grip: number = depth / 2;
    builder.box(
      "body",
      AutoMovieEngineVector3.create(width - 2 * grip, height, depth),
      AutoMovieEngineVector3.create(grip, height / 2, 0),
      { color: "#2c2f33" },
    );
    builder.rod(
      "grip",
      grip,
      AutoMovieEngineVector3.create(-width / 2 + grip, 0, 0),
      AutoMovieEngineVector3.create(-width / 2 + grip, height, 0),
      { color: "#2c2f33" },
    );
    builder.rod(
      "lens",
      height * 0.35,
      AutoMovieEngineVector3.create(grip, height / 2, depth / 2),
      AutoMovieEngineVector3.create(grip, height / 2, depth / 2 + 0.02),
      { color: "#55595f" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(-width / 2 + grip, height / 2, 0),
        AutoMovieEngineVector3.create(-1, 0, 0),
        AutoMovieEngineVector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: depth,
      length: height,
    });
    // The thumb on the left side and index finger underneath brace the
    // lower outer edge (https://in.canon/en/support/8000009200). The approach
    // is vertical, so the case's height is its aperture. Centre the frame
    // vertically so the near face lands on the underside. The front half
    // of the edge leaves room for the hand ahead of the photographer's face.
    builder.affordance({
      id: "support",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(width / 2, height / 2, grip / 2),
        AutoMovieEngineVector3.create(0, -1, 0),
        AutoMovieEngineVector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "precision",
      aperture: height,
      length: grip,
    });
    builder.affordance({
      id: "lens",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(grip, height / 2, depth / 2 + 0.02),
        AutoMovieEngineVector3.create(0, 0, 1),
        AutoMovieEngineVector3.create(1, 0, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: "screen",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(grip, height / 2, -depth / 2),
        AutoMovieEngineVector3.create(0, 0, -1),
        AutoMovieEngineVector3.create(-1, 0, 0),
      ),
      extent: null,
      width: width * 0.6,
      depth: height * 0.8,
    });
    builder.affordance({
      id: "button",
      kind: "button",
      frame: AutoMovieArchetypeFrame.upright(
        AutoMovieEngineVector3.create(-width / 2 + grip, height, 0),
      ),
      extent: null,
    });
    return builder.build(size.mass);
  }

  /* The parameters and affordance identifiers of {@link AutoMovieArchetypeCamera}. */
  /** The `model` choices this producer admits. */
  export type Model = "grIII" | "x100vi";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /** The identifiers of contacts built by this producer. */
  export type Affordance = "button" | "grip" | "lens" | "screen" | "support";

  /** Parameters for this compact camera. */
  export interface IParams extends Pick<HandheldDevice.IParams, "id"> {
    /** The manufacturer model, drawn from the seed when absent. */
    model?: Model;
  }
}
