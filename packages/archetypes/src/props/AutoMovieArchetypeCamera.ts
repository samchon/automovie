import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { HandheldDevice } from "./internal/HandheldDevice";

/**
 * Constructs a compact camera with fixed body geometry and separate viewing and handling contacts.
 */
export namespace AutoMovieArchetypeCamera {
  /**
   * Build an upright compact camera with the lens facing model `+Z`.
   *
   * The grip bar and shutter sit on `-X`, and the `support` grasp faces
   * down from the far `+X` edge. The rear `screen` faces `-Z`. The lens
   * frame is 0.02 metres ahead of the front body plane.
   *
   * @param params Optional catalogue model and scene ID. Defaults to ID `device`.
   * @param seed Numeric seed for an omitted model. Omit it for `grIII`.
   * @returns The complete model and its named handling and viewing frames.
   * @throws {AutoMovieArchetypeRefusal} If the catalogue model is unavailable.
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
  /** Recorded Ricoh GR III (`grIII`) and Fujifilm X100VI (`x100vi`) bodies. */
  export type Model = "grIII" | "x100vi";

  /**
   * Catalogue body width, height and lens-free thickness in metres and mass in kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /**
   * Grip bar, underside support, front lens, rear screen and top shutter button.
   */
  export type Affordance = "button" | "grip" | "lens" | "screen" | "support";

  /** Optional scene ID and a whole compact-camera catalogue entry. */
  export interface IParams extends Pick<HandheldDevice.IParams, "id"> {
    /**
     * Selects the paired body dimensions and mass. Defaults to `grIII` without a seed.
     */
    model?: Model;
  }
}
