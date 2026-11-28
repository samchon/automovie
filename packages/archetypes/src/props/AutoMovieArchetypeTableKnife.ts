import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { HandToolDraw } from "./internal/HandToolDraw";

/**
 * Constructs a table knife proxy with a precision grip and a food-side edge contact.
 */
export namespace AutoMovieArchetypeTableKnife {
  /**
   * Build a table knife with its butt at the origin and blade toward `+Y`.
   *
   * @param params Optional scene ID, finite 0.006 to 0.013 metre grip
   *   diameter and an Eichenlaub or Robert Welch model. ID defaults to `tool`.
   * @param seed Numeric seed for the omitted model and grip diameter. The
   *   default is Eichenlaub at 0.225 metres long with a 0.0095 metre grip.
   * @returns The knife with `grip` facing `-Z` and edge `face` facing `+Z`.
   * @throws {AutoMovieArchetypeRefusal} If the model or grip diameter is inadmissible.
   */
  export function create(
    params: AutoMovieArchetypeTableKnife.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeTableKnife.Affordance, AutoMovieArchetypeTableKnife.Dimension> {
    const {
      builder,
      d,
    }: ReturnType<typeof HandToolDraw.prepare<AutoMovieArchetypeTableKnife.Affordance>> =
      HandToolDraw.prepare<AutoMovieArchetypeTableKnife.Affordance>("knife", params, seed);
    const length: number = d.length!;
    const radius: number = d.gripDiameter! / 2;

    const handle: number = length - d.blade!;
    HandToolDraw.handle(builder, handle, radius, { precision: true });

    // The blade beyond the handle, its spine toward -Z and its edge toward +Z.
    const width: number = d.bladeWidth!;
    builder.box(
      "blade",
      AutoMovieEngineVector3.create(width * HandToolDraw.KNIFE_THICKNESS, d.blade!, width),
      AutoMovieEngineVector3.create(0, handle + d.blade! / 2, 0),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: "face",
      kind: "ledge",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, handle + d.blade! / 2, width / 2),
        AutoMovieEngineVector3.create(0, 0, 1),
        AutoMovieEngineVector3.create(0, 1, 0),
      ),
      extent: null,
      length: d.blade!,
    });
    return builder.build(d.mass!);
  }

  /* The authorable settings, contacts and dimensions of {@link AutoMovieArchetypeTableKnife}. */
  /** The precision handle `grip` and positive-Z blade-edge `face`. */
  export type Affordance = "face" | "grip";

  /**
   * Length and blade length follow Y. Blade width spans Z from spine to
   * edge. The handle diameter and blade measurements use metres and the
   * model's mass uses kilograms.
   */
  export type Dimension =
    | "blade"
    | "bladeWidth"
    | "gripDiameter"
    | "length"
    | "mass";


  /**
   * Optional identity, grip diameter and a complete manufacturer's knife model.
   */
  export interface IParams {
    /** Scene object ID, defaulting to `tool`. */
    id?: string;
    /** Finite handle diameter in metres within the 0.006 to 0.013 band. */
    gripDiameter?: number;
    /**
     * Selects `eichenlaub` or `robertWelch`. Omit it and the seed for `eichenlaub`.
     */
    model?: HandToolDraw.Model;
  }
}
