import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";

/*
 * The rule text that names the struck regions, read.
 */
const FIK: string =
  "FIK, The Regulations of Kendo Shiai and Shinpan, revision of 26 July 2023: Article 12 scores a strike or thrust on the datotsu-bui of the kendo-gu, and Article 14 with its figure names them the men, the kote, the do and the tsuki (https://www.kendo.or.jp/wp/wp-content/uploads/2025/01/RevisionE-Regulations-of-Kendo-Shiai-and-Shinpan-20230726.pdf)";

/*
 * What no source read gives.
 */
const UNREAD: string =
  "an estimate of a coarse figure; no maker's size table was read";

/** Constructs the kendo armour archetype from its recipe. */
export namespace AutoMovieArchetypeKendoArmour {
/**
 * A piece of kendo armour (bogu), worn on one body region: the helmet (`men`),
 * the trunk protector (`do`), the padded gauntlet (`kote`) or the waist flaps
 * (`tare`).
 *
 * Each piece stands as worn by a body standing at the origin facing `+Z`, `+Y`
 * up and the wearer's left toward `+X`. `wear` is the socket the body region
 * goes into, `+Y` toward it: the men's padded inside top rests on the head's
 * crown, the do's inside centre on the solar plexus, the kote's inside back on
 * the back of the hand with the fingers along `+Y`, and the tare's belt on the
 * lower abdomen. The struck regions the rules name are surfaces facing out of
 * the piece: the men's top (`men`) and its throat flap (`tsuki`), the do's
 * right and left sides (`migiDo`, `hidariDo`) and the kote's wrist cuff
 * (`kote`). The tare is protection and names none.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The piece.
 * @throws {AutoMovieArchetypeRefusal} For an unknown kind or a fixed dimension
 *   outside its band.
 */
export function create(
  params: AutoMovieArchetypeKendoArmour.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeKendoArmour.Affordance,
  AutoMovieArchetypeKendoArmour.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeKendoArmour.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeKendoArmour.Dimension>(
      "kendoArmour",
      AutoMovieArchetypeKendoArmour.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeKendoArmour.Kind = ArchetypeDraw.choice(
    "kendoArmour",
    "kind",
    params.kind,
    AutoMovieArchetypeKendoArmour.KINDS,
  );
  const d: Record<AutoMovieArchetypeKendoArmour.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeKendoArmour.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeKendoArmour.Affordance,
    AutoMovieArchetypeKendoArmour.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `kendo ${kind}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const pad: number = AutoMovieArchetypeKendoArmour.PAD;
  const indigo: IPaint = { color: "#27304a" };
  const lacquer: IPaint = { color: "#2b1d1a" };
  const metal: IPaint = { color: "#a7abb0" };

  if (kind === "men") {
    // A shell around the head, the grille before the face, the side and
    // back flaps over the shoulders and the throat flap under the grille.
    const radius: number = d.width / 2;
    const centre: number = d.height - radius;
    builder.ball("shell", radius, v(0, centre, 0), indigo);
    builder.box(
      "grille",
      v(0.8 * d.width, 0.5 * d.height, pad),
      v(0, centre - 0.1 * d.height, d.depth / 2 - pad / 2),
      metal,
    );
    builder.box(
      "flaps",
      v(1.3 * d.width, 0.12 * d.height, 0.8 * d.depth),
      v(0, 0.12 * d.height, -0.1 * d.depth),
      indigo,
    );
    builder.box(
      "throatFlap",
      v(0.4 * d.width, 0.3 * d.height, pad),
      v(0, 0.15 * d.height, 0.4 * d.depth),
      indigo,
    );
    builder.affordance({
      id: "wear",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, d.height - pad, 0),
        v(0, -1, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: "men",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(v(0, d.height, 0), v(0, 1, 0)),
      extent: null,
    });
    builder.affordance({
      id: "tsuki",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0.15 * d.height, 0.4 * d.depth + pad / 2),
        v(0, 0, 1),
      ),
      extent: null,
    });
  } else if (kind === "do") {
    // The breastplate stands its depth before the solar plexus; its sides
    // are struck where they turn back toward the flanks.
    builder.box(
      "plate",
      v(d.width, d.height, pad),
      v(0, 0, d.depth - pad / 2),
      lacquer,
    );
    builder.affordance({
      id: "wear",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, 0, -1)),
      extent: null,
    });
    for (const [id, sign] of [
      ["hidariDo", 1],
      ["migiDo", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "surface",
        direction: "normal",
        frame: AutoMovieArchetypeFrame.facing(
          v(sign * 0.4 * d.width, -0.2 * d.height, d.depth),
          v(sign, 0, 1),
        ),
        extent: null,
      });
  } else if (kind === "kote") {
    // The mitten over the fingers and the cuff along the forearm, the
    // fingers toward +Y and the back of the hand toward -Z.
    builder.box(
      "mitten",
      v(d.width, 0.45 * d.height, d.depth),
      v(0, 0.775 * d.height, 0),
      indigo,
    );
    builder.rod("cuff", d.depth / 2, v(0, 0, 0), v(0, 0.55 * d.height, 0), {
      color: "#6d4b2f",
    });
    builder.affordance({
      id: "wear",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0.7 * d.height, -d.depth / 2 + pad),
        v(0, 0, 1),
      ),
      extent: null,
    });
    builder.affordance({
      id: "kote",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0.3 * d.height, -d.depth / 2),
        v(0, 0, -1),
      ),
      extent: null,
    });
  } else {
    // The belt across the lower abdomen and three front flaps below it.
    builder.box(
      "belt",
      v(d.width, 0.2 * d.height, d.depth),
      v(0, 0, d.depth / 2),
      indigo,
    );
    for (const [id, x] of [
      ["leftFlap", 1],
      ["middleFlap", 0],
      ["rightFlap", -1],
    ] as const)
      builder.box(
        id,
        v(0.3 * d.width, d.height, pad),
        v((x * d.width) / 3, -d.height / 2, d.depth + pad / 2),
        indigo,
      );
    builder.affordance({
      id: "wear",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, 0, -1)),
      extent: null,
    });
  }
  return builder.build(d.mass);
}

  /** The pieces of the armour. */
  export type Kind = "men" | "do" | "kote" | "tare";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "do", "kote", "tare"];

  /** The padding, grille and plate thickness, metres: an estimate. */
  export const PAD: number = 0.02;

  /**
   * The affordance ids:
   *
   * - `wear`: the socket the body region goes into, `+Y` toward it.
   * - `men`: the men's top, the struck head region, facing up.
   * - `tsuki`: the men's throat flap, the thrust region, facing forward.
   * - `migiDo`, `hidariDo`: the do's right and left sides, facing out and
   *   forward.
   * - `kote`: the kote's wrist cuff on the back of the hand's side.
   *
   * The struck regions are the rules' datotsu-bui (FIK, Article 14).
   */
  export type Affordance =
    | "wear"
    | "men"
    | "tsuki"
    | "migiDo"
    | "hidariDo"
    | "kote";

  /** The struck regions a valid strike or thrust lands on, in the rules' order. */
  export const STRUCK: readonly Affordance[] = [
    "men",
    "kote",
    "migiDo",
    "hidariDo",
    "tsuki",
  ];

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: the men's shell across, the do's and the tare's front across, the
   *   kote's mitten across.
   * - `height`: the men from the throat flap's foot to its top, the do's and a
   *   tare flap's height, the kote from cuff to fingertip.
   * - `depth`: the men front to back, the do's standing off the solar plexus, the
   *   tare's belt off the abdomen, the kote's mitten thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "height" | "depth" | "mass";

  /** Each dimension's unit, which its band shares. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    depth: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which piece. */
    kind: Kind;

    /** The model's id, unique in a scene; `kendo <kind>` names it when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind; all estimates. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    men: {
      width: AutoMovieArchetypeBand.metres(0.24, 0.27, UNREAD, true),
      height: AutoMovieArchetypeBand.metres(0.3, 0.34, UNREAD, true),
      depth: AutoMovieArchetypeBand.metres(0.26, 0.3, UNREAD, true),
      mass: AutoMovieArchetypeBand.of("kg", 1.2, 1.8, UNREAD, true),
    },
    do: {
      width: AutoMovieArchetypeBand.metres(0.36, 0.42, UNREAD, true),
      height: AutoMovieArchetypeBand.metres(0.4, 0.46, UNREAD, true),
      depth: AutoMovieArchetypeBand.metres(0.06, 0.1, UNREAD, true),
      mass: AutoMovieArchetypeBand.of("kg", 1.2, 2, UNREAD, true),
    },
    kote: {
      width: AutoMovieArchetypeBand.metres(0.1, 0.12, UNREAD, true),
      height: AutoMovieArchetypeBand.metres(0.3, 0.36, UNREAD, true),
      depth: AutoMovieArchetypeBand.metres(0.09, 0.11, UNREAD, true),
      mass: AutoMovieArchetypeBand.of("kg", 0.25, 0.4, UNREAD, true),
    },
    tare: {
      width: AutoMovieArchetypeBand.metres(0.4, 0.48, UNREAD, true),
      height: AutoMovieArchetypeBand.metres(0.22, 0.27, UNREAD, true),
      depth: AutoMovieArchetypeBand.metres(0.02, 0.04, UNREAD, true),
      mass: AutoMovieArchetypeBand.of("kg", 0.5, 0.9, UNREAD, true),
    },
  };

  /** The rule source of the struck regions. */
  export const SOURCE: string = FIK;
}

/*
 * A part's display colour.
 */
interface IPaint {
  /*
   * CSS hex colour.
   */
  color: string;
}
