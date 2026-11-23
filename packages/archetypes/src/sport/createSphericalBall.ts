import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { BallBuild } from "./BallBuild";
import type { createBall } from "./createBall";

/**
 * A golf ball's rolling resistance on a green: the USGA Stimpmeter releases
 * the ball at 1.83 m/s, and a medium green of 10 ft (3.05 m) gives
 * mu = v^2 / (2 g S), about 0.056.
 */
const GREEN: number = 1.83 ** 2 / (2 * 9.80665 * 3.05);

/**
 * A spherical ball with a centre grip and upper surface.
 *
 * The model rests on the floor at the origin with its centre one radius above it. Select a sport for size, mass and finish.
 * @param params The sport profile, identifier and dimensions fixed within their bands. Omission selects football.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Build one sphere with the sport's recorded diameter and centre it one radius above the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The models retain a smooth surface. The basketball's, football's and tennis ball's rebounds use their rules' drop references, and the tennis ball's felt slides at the ITF medium court pace; other kinds declare no rebound until a source is read.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createSphericalBall(
  params: createSphericalBall.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createSphericalBall.Affordance,
  createSphericalBall.Dimension
> {
  const kind: createSphericalBall.Kind = ArchetypeDraw.choice(
    "ball",
    "kind",
    params.kind === undefined ? "football" : params.kind,
    createSphericalBall.KINDS,
  );

  const {
    builder,
    d,
  }: ReturnType<typeof BallBuild.draw<createSphericalBall.Affordance>> =
    BallBuild.draw(kind, params, seed, "composite");
  const diameter: number = d.diameter!;

  builder.ball("ball", diameter / 2, Vector3.create(0, diameter / 2, 0), {
    color: BallBuild.COLORS[kind],
  });
  BallBuild.contacts(builder, diameter, diameter);
  // Restitution is the square root of a rule's rebound over its drop height,
  // at the midpoint of its band: FIBA 2.4 drops the basketball 1.8 m and
  // takes 1.035 to 1.085 m back; ITF Rules of Tennis, Appendix I, drops the
  // tennis ball 254 cm onto a rigid base and takes 135 to 147 cm back; the
  // FIFA Quality Programme drops the football 2 m and takes 1.35 to 1.65 m
  // back. ITTF Technical Leaflet T3 (2018) drops the table tennis ball
  // 305 mm onto a steel block and takes 240 to 265 mm back; the FIP drops
  // the padel ball 2.54 m onto a hard surface and takes 1.35 to 1.45 m
  // back; the WSF drops the double-yellow squash ball 254 cm and takes 25 to
  // 30 % back at its 45 degree playing temperature. The cricket ball's and
  // the field hockey ball's are measured: 0.609 and 0.653 dropped 1.5 m onto
  // steel (Haron and Ismail 2012, IOP Conf. Ser.: Mater. Sci. Eng. 36
  // 012038, table 3). The basketball's rubber slides as rubber on dry
  // concrete, an outdoor court; the tennis ball's felt slides on a hard
  // court's medium pace rating.
  return builder.build(
    d.mass!,
    kind === "basketball"
      ? { rests: "rubber", restitution: Math.sqrt(1.06 / 1.8) }
      : kind === "tennis"
        ? { rests: "felt", restitution: Math.sqrt(1.41 / 2.54) }
        : kind === "golf"
          ? { outcome: { rolling: GREEN } }
          : kind === "football"
            ? { restitution: Math.sqrt(1.5 / 2) }
            : kind === "tableTennis"
              ? { restitution: Math.sqrt(0.2525 / 0.305) }
              : kind === "padel"
                ? { restitution: Math.sqrt(1.4 / 2.54) }
                : kind === "squash"
                  ? { restitution: Math.sqrt(0.275) }
                  : kind === "cricket"
                    ? { restitution: 0.609 }
                    : kind === "fieldHockey"
                      ? { restitution: 0.653 }
                      : undefined,
  );
}

/**
 * The authored parameters and contact names for {@link createSphericalBall}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation Each contact names a distinct surface or the grasp of this shape. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createSphericalBall {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "diameter" | "mass";

  /** The contacts used by floor, grip and strike motions. */
  export type Affordance = "grip" | "top";

  /** The sport profiles sharing this shape and its contacts. */
  export const KINDS: readonly Kind[] = BallBuild.KINDS.filter(
    (kind): kind is Kind =>
      kind !== "rugby" && kind !== "americanFootball" && kind !== "puck",
  );

  /** The applicable sport profile. */
  export type Kind = Exclude<
    createBall.Kind,
    "rugby" | "americanFootball" | "puck"
  >;

  /** The identifier, dimensions and choices of this shape. */
  export interface IParams extends Pick<
    createBall.IParams,
    "id" | "diameter" | "mass"
  > {
    /** The sport profile. Omission selects football. */
    kind?: Kind;
  }
}
