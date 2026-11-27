import type { AutoMovieArchetypeLacrosseCrosse } from "../AutoMovieArchetypeLacrosseCrosse";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StickBuild } from "./StickBuild";


/** Points in the local model frame, in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * A lacrosse crosse with a mesh pocket, scoop and shaft grip.
 *
 * The head lies at the bottom, its face toward +Z. The pocket rests behind the
 * head and the scoop marks its front edge.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createLacrosseCrosse(
  params: AutoMovieArchetypeLacrosseCrosse.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeLacrosseCrosse.Affordance,
  AutoMovieArchetypeLacrosseCrosse.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof StickBuild.draw<AutoMovieArchetypeLacrosseCrosse.Affordance>> =
    StickBuild.draw("lacrosse", params, seed);
  const length: number = d.length!;
  const head: number = d.head!;
  const width: number = d.width!;
  const depth: number = d.depth!;

  const section: number = 0.007;
  const pocketDepth: number = 0.045;
  const net: IAutoMovieVector3 = v(0, head / 2, -pocketDepth);
  const rim = (step: number): IAutoMovieVector3 => {
    const angle: number = (2 * Math.PI * step) / 12;
    return v(
      (width / 2 + section) * Math.sin(angle),
      section + ((head - section) * (1 + Math.cos(angle))) / 2,
      0,
    );
  };
  builder.rod("shaft", depth / 2, v(0, head, 0), v(0, length, 0), {
    color: "#28323d",
  });
  for (let step: number = 0; step < 12; ++step) {
    builder.rod(`rim-${step}`, section, rim(step), rim(step + 1), {
      color: "#d2d2cb",
    });
    if (step % 2 === 0)
      builder.rod(`mesh-${step}`, 0.0015, rim(step), net, {
        color: "#aeb2b0",
      });
  }
  // A nominal Sixes ball has about a 32 mm radius and an origin at
  // its bottom. Its centre sits inside the pocket behind the face.
  builder.affordance({
    id: "pocket",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, head / 2 - 0.032, -0.018)),
    extent: null,
  });
  builder.affordance({
    id: "scoop",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, section, section),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width,
    depth: section * 2,
  });
  const face: IAutoMovieVector3 = v(0, head / 2, 0);
  const faceWidth: number = width;
  StickBuild.contacts(builder, length, head, face, faceWidth, "round", depth);
  return builder.build(d.mass!);
}
