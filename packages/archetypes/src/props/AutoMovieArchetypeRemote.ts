import type { AutoMovieArchetype } from "../core";
import { HandheldDevice } from "./internal/HandheldDevice";

/**
 * Constructs an upright remote with two grasp frames and a front thumb contact.
 */
export namespace AutoMovieArchetypeRemote {
  /**
   * Build the remote upright on its bottom edge, facing model `+Z`.
   *
   * @param params Optional scene ID and finite dimensions in the remote bands.
   *   The ID defaults to `device`.
   * @param seed Numeric seed for omitted dimensions. Omit it for band
   *   midpoints, including case height 0.139 metres.
   * @returns Rear `grip`, lower `pinch` and a front `button` at three
   *   quarters of the case height. The button has no authored travel.
   * @throws {AutoMovieArchetypeRefusal} If a fixed dimension or model selection is inadmissible.
   */
  export function create(
    params: AutoMovieArchetypeRemote.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeRemote.Affordance,
    AutoMovieArchetypeRemote.Dimension
  > {
    const {
      builder,
      size,
    }: ReturnType<
      typeof HandheldDevice.draw<AutoMovieArchetypeRemote.Affordance>
    > = HandheldDevice.draw<AutoMovieArchetypeRemote.Affordance>(
      "remote",
      "remote control",
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
      id: "button",
      kind: "button",
      frame: HandheldDevice.front(height * 0.75, depth),
      extent: null,
    });
    return builder.build(size.mass);
  }

  /* The parameters and affordance identifiers of {@link AutoMovieArchetypeRemote}. */
  /**
   * Height, width and case thickness in metres and whole remote mass in kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /** Rear `grip`, lower lateral `pinch` and the front `button` frame. */
  export type Affordance = "button" | "grip" | "pinch";

  /**
   * Optional scene ID and fixed finite dimensions or mass from the remote-control bands.
   */
  export interface IParams extends Omit<
    HandheldDevice.IParams,
    "kind" | "model"
  > {
    /**
     * Keep this field absent. The remote takes its dimensions from the bands.
     */
    model?: never;
  }
}
