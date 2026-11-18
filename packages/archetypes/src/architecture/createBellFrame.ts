import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Visual reference for the flared bell and its raised bands. */
const BELL: string =
  "The Met, Refectory Bell (https://www.metmuseum.org/art/collection/search/640179)";

/**
 * A fixed civic bell in an open timber frame on a low plinth.
 *
 * The floor origin is centred under the bell, with the open front along `+Z`.
 * The `step` contact marks the part of the plinth ahead of the front posts.
 *
 * @param params Dimensions the author fixes, and an optional scene id.
 * @param seed Seed for dimensions left free, or the band midpoints when absent.
 * @returns The scenery, including its front step contact.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the floor origin, front direction, step position and fixed pose.
 * @evidence contracts/development/implementation.md#principled-implementation Four posts leave an open bay below a convex gabled canopy. Convex flared sections and narrow cylindrical bands give the bell's visible outline. The step frame and extent derive from the plinth's unobstructed front strip.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the frame dimensions, place the plinth and posts, then add the canopy and hanging silhouette.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This is fixed scenery; the bell's convex solids represent its visible envelope. The museum reference supplies appearance, while the dimensions are fictional estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms The part count and the size of each convex input are fixed.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds an independent scene model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Uses no host or external resources.
 */
export function createBellFrame(
  params: createBellFrame.IParams = {},
  seed?: number | string,
): Archetype<"step", createBellFrame.Dimension> {
  const draw: ArchetypeDrawSession<createBellFrame.Dimension> =
    new ArchetypeDrawSession("bell frame", createBellFrame.UNITS, seed, params);
  const d: Record<createBellFrame.Dimension, number> = draw.dimensions(
    createBellFrame.BANDS,
  );
  const builder: ArchetypeBuilder<"step", createBellFrame.Dimension> =
    new ArchetypeBuilder({
      id: params.id,
      name: "bell frame",
      material: "composite",
      draw,
    });
  const wood: string = "#674d3a";
  const bronze: string = "#7c6546";
  const lip: string = "#4f4636";
  const post: number = d.width * 0.09;
  const halfWidth: number = d.width / 2;
  const halfDepth: number = d.depth / 2;
  const plinthHeight: number = 0.22;
  const stepDepth: number = 0.38;
  const eave: number = d.height - d.width * 0.26;

  builder.box(
    "plinth",
    Vector3.create(d.width, plinthHeight, d.depth + stepDepth),
    Vector3.create(0, plinthHeight / 2, stepDepth / 2),
    { color: "#8a8170" },
  );
  builder.affordance({
    id: "step",
    kind: "surface",
    frame: ArchetypeFrame.upright(
      Vector3.create(0, plinthHeight, halfDepth + stepDepth / 2),
    ),
    extent: null,
    width: d.width,
    depth: stepDepth,
  });

  const postHeight: number = eave - plinthHeight;
  for (const side of [-1, 1]) {
    for (const end of [-1, 1])
      builder.box(
        `post-${side}-${end}`,
        Vector3.create(post, postHeight, post),
        Vector3.create(
          side * (halfWidth - post / 2),
          plinthHeight + postHeight / 2,
          end * (halfDepth - post / 2),
        ),
        { color: wood },
      );
    builder.box(
      `side-beam-${side}`,
      Vector3.create(post, post, d.depth - 2 * post),
      Vector3.create(side * (halfWidth - post / 2), eave - post / 2, 0),
      { color: wood },
    );
  }
  builder.box(
    "crossbeam",
    Vector3.create(d.width - 2 * post, post, post),
    Vector3.create(0, eave - post / 2, 0),
    { color: wood },
  );

  // A gable rises from the eaves to one ridge running along Z.
  const canopy: IAutoMovieVector3[] = [];
  for (const z of [-halfDepth - post, halfDepth + post])
    canopy.push(
      Vector3.create(-halfWidth - post, eave, z),
      Vector3.create(halfWidth + post, eave, z),
      Vector3.create(0, d.height, z),
    );
  builder.convex("canopy", canopy, undefined, { color: "#4a4338" });

  const radius: number = Math.min(d.width - 2 * post, d.depth) * 0.32;
  const crown: number = eave - post;
  const mouth: number = crown - radius * 1.6;
  const waist: number = mouth + radius * 0.65;

  // Two tapered sections share the waist ring, leaving the flare visible.
  const ring = (y: number, r: number): IAutoMovieVector3[] =>
    Array.from({ length: 12 }, (_: unknown, i: number): IAutoMovieVector3 => {
      const angle: number = (2 * Math.PI * i) / 12;
      return Vector3.create(r * Math.cos(angle), y, r * Math.sin(angle));
    });
  const waistRing: IAutoMovieVector3[] = ring(waist, radius * 0.62);
  builder.convex(
    "bell-shoulder",
    [...waistRing, ...ring(crown, radius * 0.37)],
    undefined,
    {
      color: bronze,
    },
  );
  builder.convex(
    "bell-flare",
    [...ring(mouth, radius), ...waistRing],
    undefined,
    {
      color: bronze,
    },
  );
  builder.rod(
    "bell-lip",
    radius * 1.03,
    Vector3.create(0, mouth - radius * 0.09, 0),
    Vector3.create(0, mouth, 0),
    { color: lip },
  );
  builder.ball(
    "clapper",
    radius * 0.12,
    Vector3.create(0, mouth - radius * 0.13, 0),
    {
      color: lip,
    },
  );
  return builder.build(d.mass);
}

/**
 * Dimensions of {@link createBellFrame}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States dimensions, units, optional identity and the basis of the bands.
 * @evidence contracts/development/design.md#principled-representation SI bands drive the frame, canopy, bell and the clearance above the front step through the shared draw session.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Authors choose the overall framing dimensions; bell proportions and step placement follow the frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fictional size estimates are recorded separately from the museum's appearance reference.
 */
export namespace createBellFrame {
  /**
   * Width between outer post faces, depth between outer post faces, roof ridge height and scenic mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines where to measure the frame and height.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /**
   * Author-fixed dimensions within the scene bands and an optional model id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the overrides and model identity.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene-unique model id, defaulting to the producer's name. */
    id?: string;
  }

  /**
   * Model lengths are metres and mass is kilograms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lists the units for all four controllable axes.
   */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * Scene blockout bands for fictional freestanding scenery.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each sizing interval names its scene reference.
   */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    width: ArchetypeBand.of(
      "m",
      1.3,
      1.8,
      `Fictional frame width. Bell outline reference: ${BELL}`,
      true,
    ),
    depth: ArchetypeBand.of("m", 1.1, 1.5, "Fictional frame depth", true),
    height: ArchetypeBand.of("m", 2.45, 3.1, "Fictional ridge height", true),
    mass: ArchetypeBand.of("kg", 120, 190, ArchetypeBand.TYPICAL_MASS, true),
  };
}
