import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { StageBladeConstruction } from "./StageBladeConstruction";
import type { createStageBladeProp } from "./createStageBladeProp";

/**
 * Padded fencing stage prop.
 *
 * A round visual guard and capped shaft surround the one-hand grip. The
 * selected profile determines the visible guard and colour. Every profile
 * declares its point; the sabre, which also touches with its blade, declares
 * the edge of its whole blade above the guard.
 *
 * @param params The scene identity and optional display length in metres, with
 *   the chosen fencing silhouette.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageFencingProp(
  params: createStageFencingProp.IParams,
  seed?: number | string,
): AutoMovieArchetype<
  createStageFencingProp.Affordance,
  createStageFencingProp.Dimension
> {
  const kind: createStageFencingProp.Kind = ArchetypeDraw.choice(
    "stageBladeProp",
    "kind",
    params.kind,
    createStageFencingProp.KINDS,
  );
  return StageBladeConstruction(
    kind,
    params,
    seed,
    false,
    (builder, profile) => {
      StageBladeConstruction.roundGuard(builder, profile);
      if (kind === "sabre") {
        const {
          gripLength,
          guardRadius,
          guardDepth,
        }: StageBladeConstruction.IProfile = profile;
        const v: typeof Vector3.create = Vector3.create;
        builder.rod(
          "guardBow",
          guardDepth,
          v(guardRadius * 0.82, gripLength, 0),
          v(guardRadius * 0.45, guardDepth, 0),
          { color: "#6f6687", round: true },
        );
      }
    },
    kind === "sabre" ? createStageFencingProp.SABRE_EDGE : undefined,
  );
}

/** Authoring options for {@link createStageFencingProp}. */
export namespace createStageFencingProp {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length";

  /**
   * The contacts this producer builds: the grip, the point and, on the sabre,
   * the edge.
   */
  export type Affordance = "grip" | "point" | "edge";

  /**
   * The sabre's striking part, as shares of its length from the handle's end:
   * its whole blade above the guard, which a sabre touch may land with (FIE
   * Technical Rules, the sabre's valid hit), taken from the guard's end at
   * 0.2.
   */
  export const SABRE_EDGE: StageBladeConstruction.Span = [0.2, 1];

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["foil", "epee", "sabre"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createStageBladeProp.IParams,
    "id" | "length"
  > {
    /** The profile with the required outline. */
    kind: Kind;
  }
}
