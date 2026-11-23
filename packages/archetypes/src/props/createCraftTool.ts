import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/**
 * Each kind's size, metres and kilograms. No source is read: every figure is a
 * provisional construction estimate of the common article (an artist's
 * long-handled brush, a conductor's baton, a hand-sewing needle, a straight
 * knitting needle).
 */
const KINDS: Readonly<Record<createCraftTool.Kind, createCraftTool.ISize>> = {
  paintbrush: { length: 0.3, radius: 0.004, grip: 0.12, mass: 0.015 },
  baton: { length: 0.4, radius: 0.004, grip: 0.04, mass: 0.02 },
  needle: { length: 0.04, radius: 0.0004, grip: 0.01, mass: 0.0005 },
  knittingNeedle: { length: 0.3, radius: 0.0025, grip: 0.1, mass: 0.01 },
};

/**
 * A slender hand tool worked by its tip: an artist's paintbrush, a conductor's
 * baton, a sewing needle or a knitting needle.
 *
 * The tool runs along `+Z` from its butt at the origin to its tip at its
 * length. `grip` is where the hand holds it, a power grip round a baton's bulb
 * at the butt, a precision grip elsewhere; `tip` is its working point, a
 * brush's bristles, a baton's point, a needle's point, touching over the rod's
 * end of the shaft's radius (`radius`); `stitch` is the flat just behind a
 * knitting needle's tip where a stitch sits, the surface the other needle's tip
 * enters, facing `+Y`.
 *
 * @param params The kind and the optional scene id.
 * @returns The tool and its contacts, metres.
 * @throws {AutoMovieArchetypeRefusal} For a kind outside the set.
 */
export function createCraftTool(
  params: createCraftTool.IParams,
): AutoMovieArchetype<createCraftTool.Affordance, createCraftTool.Dimension> {
  const kind: createCraftTool.Kind = ArchetypeDraw.choice(
    "craftTool",
    "kind",
    params.kind,
    createCraftTool.KINDS,
  );
  const size: createCraftTool.ISize = KINDS[kind];
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<createCraftTool.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "craftTool",
      { length: "m", radius: "m", mass: "kg" },
      undefined,
    );
  draw.derive("length", size.length);
  draw.derive("radius", size.radius);
  draw.derive("mass", size.mass);
  const builder: AutoMovieArchetypeBuilder<
    createCraftTool.Affordance,
    createCraftTool.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? kind,
    name: kind,
    material: kind === "needle" ? "steel" : "wood",
    draw,
  });
  builder.rod("shaft", size.radius, v(0, 0, 0), v(0, 0, size.length));
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, size.grip / 2),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: kind === "baton" ? "power" : "precision",
    aperture: 2 * size.radius,
    length: size.grip,
  });
  // The rod ends square at its tip, so the working point touches over the
  // rod's own end: a disc of the shaft's radius.
  builder.affordance({
    id: "tip",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, size.length)),
    extent: null,
    radius: size.radius,
  });
  if (kind === "knittingNeedle")
    builder.affordance({
      id: "stitch",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        v(0, size.radius, size.length - 0.02),
      ),
      extent: null,
      width: 0.01,
      depth: 0.03,
    });
  return builder.build(size.mass);
}

/** The inputs, contacts and sizes of {@link createCraftTool}. */
export namespace createCraftTool {
  /** The four tools. */
  export type Kind = "paintbrush" | "baton" | "needle" | "knittingNeedle";

  /** Every kind. */
  export const KINDS: readonly Kind[] = [
    "paintbrush",
    "baton",
    "needle",
    "knittingNeedle",
  ];

  /** The hold, the working point and a knitting needle's stitch. */
  export type Affordance = "grip" | "tip" | "stitch";

  /** The length, the radius and the mass. */
  export type Dimension = "length" | "radius" | "mass";

  /** The kind and the scene id. */
  export interface IParams {
    /** Which tool. */
    kind: Kind;

    /** The model's id, unique in a scene; the kind when absent. */
    id?: string;
  }

  /** A tool's size, metres and kilograms. */
  export interface ISize {
    /** Butt to tip. */
    length: number;

    /** The shaft's radius. */
    radius: number;

    /** The held span from the butt. */
    grip: number;

    /** The mass. */
    mass: number;
  }
}
