import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";
import { createJumpRope } from "./createJumpRope";

/**
 * The recorded length and diameter in metres and the provisional mass in
 * kilograms.
 */
type Dimension = "handleLength" | "gripDiameter" | "mass";

/**
 * Build one skipping-rope handle in its mounting frame.
 *
 * The grip is centred at the origin and the barrel runs along local Z. The
 * `cordSocket` lies at the positive Z tip with its frame's +Y pointing out of
 * the end. Pass `dimensions.handleLength` in metres to the rope-skip sampler
 * when posing two matching handles.
 *
 * @param params The measured handle family, optional grip diameter in metres,
 *   and the model's scene id.
 * @param seed Draws the handle family when omitted from params. Without a seed
 *   the default is SR-1.
 * @returns The independent handle with `grip` and `cordSocket` affordances.
 * @throws {AutoMovieArchetypeRefusal} For an unknown handle family or a grip
 *   diameter outside the rope's measured band.
 */
export function createJumpRopeHandle(
  params: Pick<createJumpRope.IParams, "handle" | "id" | "gripDiameter"> = {},
  seed?: number | string,
): AutoMovieArchetype<"grip" | "cordSocket", Dimension> {
  const draw: AutoMovieArchetypeDrawSession<Dimension> =
    new AutoMovieArchetypeDrawSession<Dimension>(
      "jumpRopeHandle",
      createJumpRope.UNITS,
      seed,
      params,
    );
  const handle: AutoMovieArchetypeDrawSession.IModel<
    createJumpRope.Handle,
    Dimension
  > = draw.model("handle", params.handle, createJumpRope.HANDLES);
  const length: number = handle.figures.handleLength!;
  const { gripDiameter } = draw.dimensions({
    gripDiameter: createJumpRope.BANDS.gripDiameter,
  });

  // Allocate the provisional whole-rope midpoint equally to its two handles.
  const { minimum, maximum } = createJumpRope.BANDS.mass;
  const mass: number = draw.derive("mass", (minimum + maximum) / 4);
  const builder: AutoMovieArchetypeBuilder<"grip" | "cordSocket", Dimension> =
    new AutoMovieArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: `skipping rope handle ${handle.name}`,
      draw,
    });
  const v: typeof Vector3.create = Vector3.create;
  const tip: ReturnType<typeof Vector3.create> = v(0, 0, length / 2);
  builder.rod("barrel", gripDiameter / 2, v(0, 0, -length / 2), tip, {
    color: "#2c2f33",
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, 1, 0), v(0, 0, 1)),
    extent: null,
    grip: "power",
    aperture: gripDiameter,
    length,
  });
  builder.affordance({
    id: "cordSocket",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(tip, v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(mass);
}
