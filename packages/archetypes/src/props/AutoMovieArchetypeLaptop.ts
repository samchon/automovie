import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";
import { KeyboardHardware } from "./internal/KeyboardHardware";

/** A laptop from the measured Air models and their input contacts. */
export namespace AutoMovieArchetypeLaptop {
  /**
 * An open laptop with a key field, screen and lid grasp.
 *
 * The base rests centered at the origin with its typing edge toward `+Z`.
 *
 * @param params The manufacturer's model and optional model identifier.
 * @param seed The seed used to select a model when omitted.
 * @returns The input device and its named contacts.
 * @throws {AutoMovieArchetypeRefusal} When the requested input is inadmissible.
 */
  export function create(
  params: AutoMovieArchetypeLaptop.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLaptop.Affordance, AutoMovieArchetypeLaptop.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof KeyboardHardware.draw<AutoMovieArchetypeLaptop.Display>> =
    KeyboardHardware.draw<AutoMovieArchetypeLaptop.Display>("laptop", params, seed);
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const tilt: number = KeyboardHardware.LID;
  const thick: number = KeyboardHardware.LID_THICKNESS;
  const rad: number = tilt * AutoMovieArchetypeUnits.DEGREE;
  // The lid's bottom edge on the base's back edge, turned up from the base's forward line by the tilt, so its top leans back.
  const up: IAutoMovieVector3 = v(0, Math.sin(rad), Math.cos(rad));
  const out: IAutoMovieVector3 = v(0, -Math.cos(rad), Math.sin(rad));
  const hinge: IAutoMovieVector3 = v(0, d.height, -d.depth / 2);
  const centre: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    AutoMovieEngineVector3.add(hinge, AutoMovieEngineVector3.scale(up, d.depth / 2)),
    AutoMovieEngineVector3.scale(out, -thick / 2),
  );
  builder.box("lid", v(d.width, d.depth, thick), centre, {
    color: "#8a8d91",
    rotation: AutoMovieEngineQuaternion.fromAxisAngle(v(1, 0, 0), 90 - tilt),
  });
  builder.affordance({
    id: "screen",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.add(hinge, AutoMovieEngineVector3.scale(up, d.depth / 2)),
      out,
      v(1, 0, 0),
    ),
    extent: null,
    width: d.width,
    depth: d.depth,
  });
  const top: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    AutoMovieEngineVector3.add(hinge, AutoMovieEngineVector3.scale(up, d.depth)),
    AutoMovieEngineVector3.scale(out, -thick / 2),
  );
  builder.affordance({
    id: "lid",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(top, out, v(1, 0, 0)),
    extent: null,
    grip: "precision",
    aperture: thick,
    length: d.width / 3,
  });
  return builder.build(d.mass);
  }

  /* The parameters and contact identifiers of {@link AutoMovieArchetypeLaptop}. */
  /** The `model` choices this producer admits. */
  export type Model = "air13" | "air15";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The identifiers of contacts this producer builds. */
  export type Affordance = "homeRow" | "keys" | Display;

  /**
   * The display contacts the laptop adds to the shared keyboard deck: its
   * screen and its lid hinge.
   */
  export type Display = "screen" | "lid";

  /** The constructor input. */
  export interface IParams {
    /** The identifier the scene uses. */
    id?: string;

    /** The manufacturer model, selected with the seed when omitted. */
    model?: Model;
  }
}
