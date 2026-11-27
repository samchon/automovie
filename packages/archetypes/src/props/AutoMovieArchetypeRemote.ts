import type { AutoMovieArchetype } from "../core";
import { HandheldDevice } from "./HandheldDevice";

/** The canonical producer and authoring contract for a remote control. */
export namespace AutoMovieArchetypeRemote {
  /**
   * An upright remote control with a shallow case and a front thumb contact.
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
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /** The identifiers of contacts built by this producer. */
  export type Affordance = "button" | "grip" | "pinch";

  /** Parameters for this remote control. */
  export interface IParams extends Omit<
    HandheldDevice.IParams,
    "kind" | "model"
  > {
    /** This remote control has no manufacturer model selector. */
    model?: never;
  }
}
