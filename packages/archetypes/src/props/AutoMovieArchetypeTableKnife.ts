import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { HandToolDraw } from "./internal/HandToolDraw";

/** Constructs the table knife archetype from its recipe. */
export namespace AutoMovieArchetypeTableKnife {
  /**
   * Table knife with a pinch grip and a food-side edge toward +Z.
   *
   * @param params The optional scene ID, grip diameter in metres and manufacturer
   *   model.
   * @param seed The seed for the recorded recipe. Without a seed, the draw uses
   *   the original defaults.
   * @returns The model with its named contact frames in model space.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
   *   outside its admitted recipe.
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
      Vector3.create(width * HandToolDraw.KNIFE_THICKNESS, d.blade!, width),
      Vector3.create(0, handle + d.blade! / 2, 0),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: "face",
      kind: "ledge",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, handle + d.blade! / 2, width / 2),
        Vector3.create(0, 0, 1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      length: d.blade!,
    });
    return builder.build(d.mass!);
  }

  /* The authorable settings, contacts and dimensions of {@link AutoMovieArchetypeTableKnife}. */
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "blade"
    | "bladeWidth"
    | "gripDiameter"
    | "length"
    | "mass";


  /** Parameters accepted by the table knife producer. */
  export interface IParams {
    /** The model's id, unique in a scene; `tool` when absent. */
    id?: string;
    /** Handle grip diameter in metres. */
    gripDiameter?: number;
    /** Table knife model; drawn from the seed when omitted. */
    model?: HandToolDraw.Model;
  }
}
