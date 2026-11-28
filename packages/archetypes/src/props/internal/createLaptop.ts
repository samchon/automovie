import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";
import type { AutoMovieArchetypeLaptop } from "../AutoMovieArchetypeLaptop";
import { KeyboardHardware } from "./KeyboardHardware";

/*
 * Construct the laptop's open geometry once for both entry points. A named
 * producer may bind an actuator at the rear edge. The saved keyboard recipe
 * leaves its original screen and lid contacts fixed.
 */
export function createLaptop<Extra extends string = never>(
  params: AutoMovieArchetypeLaptop.IParams,
  seed?: number,
  articulate?: (
    builder: AutoMovieArchetypeBuilder<
      KeyboardHardware.Affordance | Extra,
      KeyboardHardware.Dimension
    >,
    pivot: IAutoMovieVector3,
    tilt: number,
  ) => string,
): AutoMovieArchetype<
  KeyboardHardware.Affordance | Extra,
  KeyboardHardware.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof KeyboardHardware.draw<AutoMovieArchetypeLaptop.Display | Extra>
  > = KeyboardHardware.draw<AutoMovieArchetypeLaptop.Display | Extra>(
    "laptop",
    params,
    seed,
  );
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const tilt: number = KeyboardHardware.LID;
  const thick: number = KeyboardHardware.LID_THICKNESS;
  const rad: number = tilt * AutoMovieArchetypeUnits.DEGREE;
  // The bottom edge rests on the rear of the deck. The lid leans back from it.
  const up: IAutoMovieVector3 = v(0, Math.sin(rad), Math.cos(rad));
  const out: IAutoMovieVector3 = v(0, -Math.cos(rad), Math.sin(rad));
  const pivot: IAutoMovieVector3 = v(0, d.height, -d.depth / 2);
  const face: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    pivot,
    AutoMovieEngineVector3.scale(up, d.depth / 2),
  );
  const inward: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    out,
    -thick / 2,
  );
  builder.box(
    "lid",
    v(d.width, d.depth, thick),
    AutoMovieEngineVector3.add(face, inward),
    {
      color: "#8a8d91",
      rotation: AutoMovieEngineQuaternion.fromAxisAngle(v(1, 0, 0), 90 - tilt),
    },
  );
  const carrier: string | undefined = articulate?.(builder, pivot, tilt);
  const ride: { rides?: string } =
    carrier === undefined ? {} : { rides: carrier };
  builder.affordance({
    id: "screen",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(face, out, v(1, 0, 0)),
    extent: null,
    width: d.width,
    depth: d.depth,
    ...ride,
  });
  const top: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    AutoMovieEngineVector3.add(
      pivot,
      AutoMovieEngineVector3.scale(up, d.depth),
    ),
    inward,
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
    ...ride,
  });
  return builder.build(d.mass);
}
