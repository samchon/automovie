import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type Archetype, ArchetypeFrame, ArchetypeUnits } from "../core";
import { KeyboardHardware } from "./KeyboardHardware";

/**
 * An open laptop with a key field, screen and lid grasp.
 *
 * The base rests centered at the origin with its typing edge toward `+Z`.
 * @param params The manufacturer's model and optional model identifier.
 * @param seed The seed used to select a model when omitted.
 * @returns The input device and its named contacts.
 * @throws {ArchetypeRefusal} When the requested input is inadmissible.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the input device, its frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Draw the original model figures and place the standard key field, then add the raised lid and its screen and grasp.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Share the base and add the laptop lid in this producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lid has the original stated estimated tilt and thickness.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and four contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The original draw and the key field construction serve both input devices.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer retains nothing.
 */
export function createLaptop(
  params: createLaptop.IParams = {},
  seed?: number | string,
): Archetype<createLaptop.Affordance, createLaptop.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof KeyboardHardware.draw<"screen" | "lid">> =
    KeyboardHardware.draw<"screen" | "lid">("laptop", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const tilt: number = KeyboardHardware.LID;
  const thick: number = KeyboardHardware.LID_THICKNESS;
  const rad: number = tilt * ArchetypeUnits.DEGREE;
  // The lid's bottom edge on the base's back edge, turned up from the base's forward line by the tilt, so its top leans back.
  const up: IAutoMovieVector3 = v(0, Math.sin(rad), Math.cos(rad));
  const out: IAutoMovieVector3 = v(0, -Math.cos(rad), Math.sin(rad));
  const hinge: IAutoMovieVector3 = v(0, d.height, -d.depth / 2);
  const centre: IAutoMovieVector3 = Vector3.add(
    Vector3.add(hinge, Vector3.scale(up, d.depth / 2)),
    Vector3.scale(out, -thick / 2),
  );
  builder.box("lid", v(d.width, d.depth, thick), centre, {
    color: "#8a8d91",
    rotation: Quaternion.fromAxisAngle(v(1, 0, 0), 90 - tilt),
  });
  builder.affordance({
    id: "screen",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      Vector3.add(hinge, Vector3.scale(up, d.depth / 2)),
      out,
      v(1, 0, 0),
    ),
    extent: null,
    width: d.width,
    depth: d.depth,
  });
  const top: IAutoMovieVector3 = Vector3.add(
    Vector3.add(hinge, Vector3.scale(up, d.depth)),
    Vector3.scale(out, -thick / 2),
  );
  builder.affordance({
    id: "lid",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(top, out, v(1, 0, 0)),
    extent: null,
    grip: "precision",
    aperture: thick,
    length: d.width / 3,
  });
  return builder.build(d.mass);
}

/**
 * The parameters and contact identifiers of {@link createLaptop}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names its admitted models and contacts.
 * @evidence contracts/development/design.md#principled-representation The closed model names select the corresponding recorded manufacturer figures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Inputs carry the optional identifier and this device's model choice.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This producer exposes only its built contacts and supported manufacturer models.
 */
export namespace createLaptop {
  /** The `model` choices this producer admits. */
  export type Model = "air13" | "air15";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The identifiers of contacts this producer builds. */
  export type Affordance = "homeRow" | "keys" | "lid" | "screen";

  /** The constructor input. */
  export interface IParams {
    /** The identifier the scene uses. */
    id?: string;

    /** The manufacturer model, selected with the seed when omitted. */
    model?: Model;
  }
}
