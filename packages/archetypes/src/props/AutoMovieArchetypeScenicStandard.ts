import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The size bands describe plausible set props rather than measured artifacts. */
const SCENIC: string =
  "Authored set size. Staff and panel silhouettes draw on the Met standard bearer (https://www.metmuseum.org/art/collection/search/546175) and the British Museum textile banner (https://islamicworld.britishmuseum.org/collection/RRM186437).";

/** Constructs the scenic standard archetype from its recipe. */
export namespace AutoMovieArchetypeScenicStandard {
/**
 * A carried processional standard with a banner panel or a round sign. The
 * staff starts at local ground and points up. The scene can mount a hand on
 * `grip` along the exposed shaft and use `face` as a framing point. The panel
 * keeps a fixed silhouette through the authored carry. The head is mounted
 * ahead of the staff, its back on the staff's front. `face` spans the head's
 * `headSpan` square on its front, read with model `+Y` up; on a roundel the
 * square's corners lie outside the disc, so content placed there overhangs it.
 *
 * @param params The silhouette and any fixed set dimensions.
 * @param seed The seed for the remaining dimensions.
 * @returns A scenic prop with a shaft grip and a front-facing marker.
 * @throws {AutoMovieArchetypeRefusal} For an unsupported silhouette or
 *   dimension.
 */
export function create(
  params: AutoMovieArchetypeScenicStandard.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeScenicStandard.Affordance,
  AutoMovieArchetypeScenicStandard.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeScenicStandard.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "scenicStandard",
      AutoMovieArchetypeScenicStandard.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeScenicStandard.Kind = ArchetypeDraw.choice(
    "scenicStandard",
    "kind",
    params.kind,
    AutoMovieArchetypeScenicStandard.KINDS,
  );
  const dimensions: Record<AutoMovieArchetypeScenicStandard.Dimension, number> =
    draw.dimensions(AutoMovieArchetypeScenicStandard.BANDS);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeScenicStandard.Affordance,
    AutoMovieArchetypeScenicStandard.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: kind === "banner" ? "scenic banner" : "scenic roundel",
    draw,
  });
  const vector: typeof Vector3.create = Vector3.create;
  const shaftRadius: number = dimensions.shaftDiameter / 2;
  const faceRadius: number = dimensions.headSpan / 2;
  const faceTop: number = dimensions.length - shaftRadius;
  const faceCenter: number = faceTop - faceRadius;
  const clearShaft: number = faceTop - dimensions.headSpan;

  // The head is mounted ahead of the staff, its back on the staff's front,
  // so the staff never shows across the face.
  const middle: number = shaftRadius + dimensions.faceDepth / 2;
  const front: number = shaftRadius + dimensions.faceDepth;
  builder.rod(
    "shaft",
    shaftRadius,
    vector(0, 0, 0),
    vector(0, dimensions.length, 0),
  );
  if (kind === "banner") {
    builder.rod(
      "crossbar",
      shaftRadius,
      vector(-faceRadius, faceTop, 0),
      vector(faceRadius, faceTop, 0),
    );
    builder.box(
      "panel",
      vector(dimensions.headSpan, dimensions.headSpan, dimensions.faceDepth),
      vector(0, faceCenter, middle),
      { color: "#885149" },
    );
  } else
    builder.rod(
      "panel",
      faceRadius,
      vector(0, faceCenter, shaftRadius),
      vector(0, faceCenter, front),
      { color: "#a77649" },
    );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      vector(0, clearShaft / 2, 0),
      vector(0, 0, -1),
      vector(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    symmetry: "round",
    aperture: dimensions.shaftDiameter,
    length: clearShaft,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      vector(0, faceCenter, front),
      vector(0, 0, 1),
      vector(1, 0, 0),
    ),
    extent: null,
    width: dimensions.headSpan,
    depth: dimensions.headSpan,
  });
  return builder.build(dimensions.mass);
}

  /* Author controls for a carried scenic standard. */
  /** A carried textile-shaped panel or a circular emblem. */
  export type Kind = "banner" | "roundel";

  /** The recognized silhouette choices. */
  export const KINDS: readonly Kind[] = ["banner", "roundel"];

  /** The clear shaft handle and the front of the displayed head. */
  export type Affordance = "grip" | "face";

  /** The overall shaft height, diameter, head width, head depth and model mass. */
  export type Dimension =
    | "length"
    | "shaftDiameter"
    | "headSpan"
    | "faceDepth"
    | "mass";

  /** Each dimension uses metres or kilograms. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    shaftDiameter: "m",
    headSpan: "m",
    faceDepth: "m",
    mass: "kg",
  };

  /** Set dimensions sized for a hand-carried silhouette with an exposed shaft. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(1.2, 2.1, SCENIC, true),
    shaftDiameter: AutoMovieArchetypeBand.metres(0.026, 0.048, SCENIC, true),
    headSpan: AutoMovieArchetypeBand.metres(0.3, 0.7, SCENIC, true),
    faceDepth: AutoMovieArchetypeBand.metres(0.008, 0.028, SCENIC, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.3, 1.5, SCENIC, true),
  };

  /** The named silhouette and optional fixed dimensions of the standard. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The principal outline. */
    kind: Kind;

    /** Scene-unique id. */
    id?: string;
  }
}
