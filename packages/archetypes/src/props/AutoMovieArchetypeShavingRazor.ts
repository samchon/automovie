import { type AutoMovieArchetype } from "../core";
import { GroomingPropDraw } from "./internal/GroomingPropDraw";

/**
 * Constructs either Mach3-format razor with a handle grip and upward cartridge.
 */
export namespace AutoMovieArchetypeShavingRazor {

/**
 * Build a razor with the handle at Z zero and cartridge toward `+Z`.
 *
 * The handle grip is centred on the shaft. The cartridge's working
 * surface points `+Y` and spans 0.04 by 0.015 metres.
 *
 * @param params Optional scene ID, a recorded model and a finite
 *   handle diameter in metres.
 * @param seed Numeric seed for omitted values. Omit it for the
 *   Edwin Jagger model, 0.129 metres long and 0.087 kilograms.
 * @returns A handle with `grip` and a flat cartridge with `face`.
 * @throws {AutoMovieArchetypeRefusal} If the model or diameter is inadmissible.
 */
export function create(
  params: AutoMovieArchetypeShavingRazor.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeShavingRazor.Affordance,
  AutoMovieArchetypeShavingRazor.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof GroomingPropDraw.prepare<AutoMovieArchetypeShavingRazor.Affordance>
  > = GroomingPropDraw.prepare<AutoMovieArchetypeShavingRazor.Affordance>(
    "razor",
    params,
    seed,
  );
  const length: number = d.length!;
  const width: number = d.width!;

  GroomingPropDraw.addHead(
    builder,
    {
      length,
      width,
      head: GroomingPropDraw.CARTRIDGE.depth,
      across: GroomingPropDraw.CARTRIDGE.width,
    },
    { handle: "#2c2f33", head: "#b9bcc0" },
  );
  return builder.build(d.mass!);
}


  /* The contacts and dimensions of {@link AutoMovieArchetypeShavingRazor}. */
  /**
   * Optional ID, finite handle diameter and a recorded Edwin Jagger or Gillette model.
   */
  export interface IParams {
    /** Scene object ID, defaulting to `careItem`. */
    id?: string;
    /** Finite handle diameter in metres within the razor's width band. */
    width?: number;
    /**
     * Selects `edwinJagger` or `gilletteMach3`. The first is the seedless default.
     */
    model?: Extract<GroomingPropDraw.Model, "edwinJagger" | "gilletteMach3">;
  }

  /** Power `grip` at the handle midpoint and upward cartridge `face`. */
  export type Affordance = "face" | "grip";

  /**
   * Overall Z length and handle diameter as `width`, in metres. Mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "width";
}
