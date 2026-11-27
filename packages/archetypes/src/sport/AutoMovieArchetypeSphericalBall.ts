import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { BallBuild } from "./internal/BallBuild";
import type { AutoMovieArchetypeBall } from "./AutoMovieArchetypeBall";

/**
 * A golf ball's rolling resistance on a green: the USGA Stimpmeter releases the
 * ball at 1.83 m/s, and a medium green of 10 ft (3.05 m) gives mu = v^2 / (2 g
 * S), about 0.056.
 */
const GREEN: number = 1.83 ** 2 / (2 * 9.80665 * 3.05);

/**
 * A thin hollow shell's gyration, its moment of inertia about a diameter over
 * its mass times its radius squared: 2/3. An inflated football, futsal ball,
 * basketball, volleyball or handball, and a celluloid table tennis ball, have a
 * wall a few hundredths of their radius thick, which lowers it by only a few
 * per cent.
 */
const THIN_SHELL: number = 2 / 3;

/** Canonical producer and authoring contract for Spherical Ball. */
export namespace AutoMovieArchetypeSphericalBall {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
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
    AutoMovieArchetypeBall.Kind,
    "rugby" | "americanFootball" | "puck"
  >;

  /** The identifier, dimensions and choices of this shape. */
  export interface IParams extends Pick<
    AutoMovieArchetypeBall.IParams,
    "id" | "diameter" | "mass"
  > {
    /** The sport profile. Omission selects football. */
    kind?: Kind;
  }

  /**
   * A spherical ball with a centre grip and upper surface.
   *
   * The model rests on the floor at the origin with its centre one radius above
   * it. Select a sport for size, mass and finish.
   *
   * @param params The sport profile, identifier and dimensions fixed within their
   *   bands. Omission selects football.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(
    params: AutoMovieArchetypeSphericalBall.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeSphericalBall.Affordance,
    AutoMovieArchetypeSphericalBall.Dimension
  > {
    const kind: AutoMovieArchetypeSphericalBall.Kind = ArchetypeDraw.choice(
      "ball",
      "kind",
      params.kind === undefined ? "football" : params.kind,
      AutoMovieArchetypeSphericalBall.KINDS,
    );

    const {
      builder,
      d,
    }: ReturnType<typeof BallBuild.draw<AutoMovieArchetypeSphericalBall.Affordance>> =
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
    // An inflated ball and a celluloid one are thin shells (`THIN_SHELL`).
    return builder.build(
      d.mass!,
      kind === "basketball"
        ? {
            rests: "rubber",
            restitution: Math.sqrt(1.06 / 1.8),
            outcome: { gyration: THIN_SHELL },
          }
        : kind === "tennis"
          ? { rests: "felt", restitution: Math.sqrt(1.41 / 2.54) }
          : kind === "golf"
            ? { outcome: { rolling: GREEN } }
            : kind === "football"
              ? {
                  restitution: Math.sqrt(1.5 / 2),
                  outcome: { gyration: THIN_SHELL },
                }
              : kind === "tableTennis"
                ? {
                    restitution: Math.sqrt(0.2525 / 0.305),
                    outcome: { gyration: THIN_SHELL },
                  }
                : kind === "futsal" ||
                    kind === "volleyball" ||
                    kind === "handball"
                  ? { outcome: { gyration: THIN_SHELL } }
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
}
