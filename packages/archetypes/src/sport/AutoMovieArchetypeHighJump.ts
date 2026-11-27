import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeHighJumpData } from "./internal/AutoMovieArchetypeHighJumpData";

/** Constructs the high jump archetype from its recipe. */
export namespace AutoMovieArchetypeHighJump {
/** The kinds: the high jump and the pole vault. */
  export type Kind = "highJump" | "poleVault";

  /**
   * The affordance ids:
   *
   * - `bar`: the crossbar's axis, a bar along `+X` facing up.
   * - `box`: a pole vault's planting box, the socket at the stop board's foot.
   */
  export type Affordance = "bar" | "box";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the crossbar's top above the floor, the height jumped.
   * - `length`: the crossbar's.
   * - `diameter`: the crossbar's.
   * - `span`: between the uprights' axes, or a pole vault's pegs.
   * - `setback`: a pole vault's standards beyond the zero line.
   * - `boxLength`, `boxFloor`, `boxDepth`: a pole vault box's length at runway
   *   level, its floor's length along its slope and the stop board's foot below
   *   the runway.
   * - `boxWidth`, `boxEnd`: the box's width at its front and at the stop board's
   *   foot.
   * - `mass`: the apparatus, kilograms.
   */
  export type Dimension =
    | "height"
    | "length"
    | "diameter"
    | "span"
    | "setback"
    | "boxLength"
    | "boxFloor"
    | "boxDepth"
    | "boxWidth"
    | "boxEnd"
    | "mass";

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which apparatus; `highJump` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `highJump` when absent. */
    id?: string;
  }

  /**
 * A vertical jump's apparatus: the high jump's two uprights and crossbar, or
 * the pole vault's standards, crossbar and planting box.
 *
 * The jumper approaches along `+Z`. A high jump's uprights stand either side of
 * the origin along `X` with the crossbar across them. A pole vault's box is
 * sunk in the runway ahead of the origin: its stop board's top edge, the zero
 * line, lies on `X` at the origin, the box reaching back 1.08 m along `-Z` at
 * runway level and its floor sloping down to the stop board's foot 0.20 m
 * below; its standards stand the drawn setback beyond the zero line, each
 * holding the crossbar's end on a horizontal arm.
 *
 * `bar` is the crossbar's axis, a bar along `+X` facing up: its height is the
 * one a jump reads and its length the bar's. A pole vault also declares `box`,
 * the socket at the stop board's foot where the pole's tip plants, `+Y` up out
 * of the box. The landing area is its own archetype (`createLandingMat`),
 * placed beyond the bar on `+Z`.
 *
 * @param params The kind, `highJump` when absent, and any dimension the author
 *   fixes; `height` is the bar's.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The apparatus.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
 *   or one only the other kind has.
 */
export function create(
  params: AutoMovieArchetypeHighJump.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHighJump.Affordance, AutoMovieArchetypeHighJump.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeHighJump.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeHighJump.Dimension>(
      "highJump",
      AutoMovieArchetypeHighJump.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeHighJump.Kind = ArchetypeDraw.choice(
    "highJump",
    "kind",
    params.kind ?? "highJump",
    AutoMovieArchetypeHighJump.KINDS,
  );
  const d: Partial<Record<AutoMovieArchetypeHighJump.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypeHighJump.BANDS[kind],
    AutoMovieArchetypeHighJump.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeHighJump.Affordance,
    AutoMovieArchetypeHighJump.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind === "highJump" ? "high jump" : "pole vault",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const radius: number = d.diameter! / 2;
  const centre: number = d.height! - radius;
  const length: number = d.length!;
  const at: number = kind === "highJump" ? 0 : d.setback!;

  // The high jump's uprights carry the bar's ends; a pole vault's standards stand clear of its ends and reach in with arms to the pegs.
  const standing: number =
    kind === "highJump" ? d.span! / 2 : length / 2 + AutoMovieArchetypeHighJump.UPRIGHT;
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    builder.rod(
      `upright-${side}`,
      AutoMovieArchetypeHighJump.UPRIGHT / 2,
      v(sign * standing, 0, at),
      v(sign * standing, d.height! + AutoMovieArchetypeHighJump.ABOVE, at),
      { color: "#d8d2c4", density: 2 },
    );
    if (kind === "poleVault")
      builder.rod(
        `arm-${side}`,
        AutoMovieArchetypeHighJump.UPRIGHT / 4,
        v(
          sign * standing,
          d.height! - d.diameter! - AutoMovieArchetypeHighJump.UPRIGHT / 4,
          at,
        ),
        v(
          (sign * d.span!) / 2,
          d.height! - d.diameter! - AutoMovieArchetypeHighJump.UPRIGHT / 4,
          at,
        ),
        { color: "#d8d2c4" },
      );
  }
  builder.rod(
    "crossbar",
    radius,
    v(-length / 2, centre, at),
    v(length / 2, centre, at),
    { color: "#e8c547", density: 0.3 },
  );
  builder.affordance({
    id: "bar",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, centre, at),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    aperture: d.diameter!,
    length,
  });
  if (kind === "poleVault") box(builder, d);
  return builder.build(d.mass!);
}

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["highJump", "poleVault"];

  /** An upright's diameter, metres. An estimate, not read at a source. */
  export const UPRIGHT: number = 0.05;

  /**
   * How far the uprights stand above the bar, metres: World Athletics asks at
   * least 0.10 m above the greatest height, as secondary summaries give it.
   */
  export const ABOVE: number = 0.1;

  /** The thickness of the box's floor and stop board, metres: an estimate. */
  export const PLATE: number = 0.02;

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    length: "m",
    diameter: "m",
    span: "m",
    setback: "m",
    boxLength: "m",
    boxFloor: "m",
    boxDepth: "m",
    boxWidth: "m",
    boxEnd: "m",
    mass: "kg",
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    highJump: {
      height: AutoMovieArchetypeBand.metres(
        1,
        2.45,
        "the height the competition sets, from a beginner's 1 m to the 2.45 m men's world record (World Athletics records); a setting, not a measurement",
        true,
      ),
      length: AutoMovieArchetypeBand.metres(3.98, 4.02, AutoMovieArchetypeHighJumpData.RULES),
      diameter: AutoMovieArchetypeBand.metres(0.029, 0.031, AutoMovieArchetypeHighJumpData.BAR),
      span: AutoMovieArchetypeBand.metres(4, 4.04, AutoMovieArchetypeHighJumpData.RULES),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        20,
        40,
        "an estimate of two weighted uprights with their bar; no maker's figure was read",
        true,
      ),
    },
    poleVault: {
      height: AutoMovieArchetypeBand.metres(
        2,
        6.3,
        "the height the competition sets, from a beginner's 2 m to the men's world record near 6.3 m; a setting, not a measurement",
        true,
      ),
      length: AutoMovieArchetypeBand.metres(
        4.48,
        4.52,
        `${AutoMovieArchetypeHighJumpData.WA}, Technical Rule 26.7: the crossbar 4.50 m +/- 0.02 m long in the pole vault`,
      ),
      diameter: AutoMovieArchetypeBand.metres(0.029, 0.031, AutoMovieArchetypeHighJumpData.BAR),
      span: AutoMovieArchetypeBand.metres(
        4.28,
        4.37,
        `${AutoMovieArchetypeHighJumpData.WA}, Technical Rule 28.10: the pegs 4.28 to 4.37 m apart`,
      ),
      setback: AutoMovieArchetypeBand.metres(
        0,
        0.8,
        `${AutoMovieArchetypeHighJumpData.WA}, Figure (c) TR28: the standards from the zero line to 0.80 m beyond it`,
      ),
      boxLength: AutoMovieArchetypeBand.metres(1.08, 1.08, AutoMovieArchetypeHighJumpData.BOX),
      boxFloor: AutoMovieArchetypeBand.metres(1, 1, AutoMovieArchetypeHighJumpData.BOX),
      boxDepth: AutoMovieArchetypeBand.metres(0.2, 0.2, AutoMovieArchetypeHighJumpData.BOX),
      boxWidth: AutoMovieArchetypeBand.metres(0.6, 0.6, AutoMovieArchetypeHighJumpData.BOX),
      boxEnd: AutoMovieArchetypeBand.metres(0.15, 0.15, AutoMovieArchetypeHighJumpData.BOX),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        60,
        120,
        "an estimate of two pole vault standards with their bar and box; no maker's figure was read",
        true,
      ),
    },
  };
}

/*
 * A pole vault box sunk in the runway: its floor plate down the slope from the
 * runway at the box's front to the stop board's foot, the stop board from there
 * up to the zero line, each at the box's mean width, and the planting socket at
 * the foot.
 *
 * The foot lies behind the zero line by the runway length less the floor's run,
 * the run being the floor's slope length projected over the depth.
 * Parameter builder: The builder.
 * Parameter d: The drawn dimensions.
 */
function box(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeHighJump.Affordance,
    AutoMovieArchetypeHighJump.Dimension
  >,
  d: Partial<Record<AutoMovieArchetypeHighJump.Dimension, number>>,
): void {
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const depth: number = d.boxDepth!;
  const run: number = Math.sqrt(d.boxFloor! ** 2 - depth ** 2);
  const front: IAutoMovieVector3 = v(0, 0, -d.boxLength!);
  const foot: IAutoMovieVector3 = v(0, -depth, -d.boxLength! + run);
  const lip: IAutoMovieVector3 = v(0, 0, 0);
  const width: number = (d.boxWidth! + d.boxEnd!) / 2;
  const t: number = AutoMovieArchetypeHighJump.PLATE;

  // Each plate is a box turned about X so its long side runs between its two ends, set back by half its thickness behind the inside face.
  const plate = (
    id: string,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    behind: IAutoMovieVector3,
  ): void => {
    const span: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(to, from);
    const tilt: number =
      Math.atan2(-span.y, span.z) / AutoMovieArchetypeUnits.DEGREE;
    builder.box(
      id,
      v(width, t, AutoMovieEngineVector3.length(span)),
      AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(from, to), 0.5),
        AutoMovieEngineVector3.scale(behind, t / 2),
      ),
      {
        color: "#4a4d52",
        rotation: AutoMovieEngineQuaternion.fromAxisAngle(v(1, 0, 0), tilt),
      },
    );
  };
  plate("box-floor", front, foot, AutoMovieEngineVector3.normalize(v(0, -run, -depth)));
  plate("box-stop", foot, lip, AutoMovieEngineVector3.normalize(v(0, foot.z - lip.z, depth)));
  builder.affordance({
    id: "box",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(foot),
    extent: null,
  });
}
