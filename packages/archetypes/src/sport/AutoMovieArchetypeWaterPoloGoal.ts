import "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import * as AutoMovieArchetypeWaterPoloGoalData from "./internal/AutoMovieArchetypeWaterPoloGoalData";
import { v } from "./internal/AutoMovieArchetypeWaterPoloGoalData";

/** Constructs the water polo goal archetype from its recipe. */
export namespace AutoMovieArchetypeWaterPoloGoal {
/**
 * One floating water polo goal for deep water. The front of the aperture is Z =
 * 0, the waterline is Y = 0 and the playing area lies along +Z. The recorded
 * goal mouth is the inside opening from water to crossbar, without counting the
 * posts or the net. Frame and aperture dimensions follow the federation. Net
 * thickness, floats and the assembly mass are staged.
 *
 * @param params Optional scene identity and fixed aperture overrides.
 * @param seed Provenance seed. The reference dimensions are fixed.
 * @returns A floating frame, open scoring aperture and visible net pocket.
 */
export function create(
  params: AutoMovieArchetypeWaterPoloGoal.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeWaterPoloGoal.Affordance,
  AutoMovieArchetypeWaterPoloGoal.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeWaterPoloGoal.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "waterPoloGoal",
      AutoMovieArchetypeWaterPoloGoal.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeWaterPoloGoal.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeWaterPoloGoal.BANDS,
  );
  const builder: Build = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "floating water polo goal",
    material: "composite",
    draw,
  });
  const half: number = d.width / 2;
  const post: number = half + d.bar / 2;
  const top: number = d.height + d.bar / 2;
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    builder.box(
      `post-${side}`,
      v(d.bar, d.height, d.bar),
      v(sign * post, d.height / 2, -d.bar / 2),
      { color: FRAME },
    );
    builder.box(
      `float-${side}`,
      v(0.14, 0.13, d.depth + d.bar),
      v(sign * (post + 0.08), -0.03, -d.depth / 2),
      { color: FRAME },
    );
    builder.rod(
      `top-stay-${side}`,
      0.017,
      v(sign * post, top, -d.bar),
      v(sign * post, 0.66, -d.depth),
      { color: FRAME },
    );
    builder.rod(
      `rear-stay-${side}`,
      0.017,
      v(sign * post, 0.03, -d.depth),
      v(sign * post, 0.66, -d.depth),
      { color: FRAME },
    );
  }
  builder.box(
    "crossbar",
    v(d.width + 2 * d.bar, d.bar, d.bar),
    v(0, top, -d.bar / 2),
    { color: FRAME },
  );
  net(builder, d, half);
  builder.affordance({
    id: "mouth",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: d.width,
    height: d.height,
  });
  return builder.build(d.mass);
}

  /* The aperture and net dimensions for one deep-water reference field. */
  /** Goal opening at the front face. */
  export type Affordance = "mouth";
  /** Inside mouth width and height, post section, cleared pocket depth and mass. */
  export type Dimension = "width" | "height" | "bar" | "depth" | "mass";
  /** Optional scene identity and reference dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }
  /** Units of each assembled reference figure. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    bar: "m",
    depth: "m",
    mass: "kg",
  };
  /**
   * The fixed opening and bar section, with a model pocket beyond the required
   * clearance.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(3, 3, AutoMovieArchetypeWaterPoloGoalData.RULES),
    height: AutoMovieArchetypeBand.metres(0.9, 0.9, AutoMovieArchetypeWaterPoloGoalData.RULES),
    bar: AutoMovieArchetypeBand.metres(0.075, 0.075, AutoMovieArchetypeWaterPoloGoalData.RULES),
    depth: AutoMovieArchetypeBand.metres(
      0.55,
      0.55,
      `${AutoMovieArchetypeWaterPoloGoalData.RULES}. Film pocket deeper than the 0.30 m minimum.`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      35,
      35,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}

const FRAME: string = "#fbf9ef";
const NET: string = "#d9dde0";

/*
 * The three side surfaces and the top of the pocket use one shared set of
 * corners.
 */
function net(
  builder: Build,
  d: Readonly<Record<AutoMovieArchetypeWaterPoloGoal.Dimension, number>>,
  half: number,
): void {
  const rows: number = 8;
  const columns: number = 23;
  const rear: number = 0.66;
  const twine: number = 0.003;
  for (let i: number = 0; i <= columns; ++i) {
    const x: number = (i / columns - 0.5) * d.width;
    builder.rod(
      `net-top-${i}`,
      twine,
      v(x, d.height, -d.bar),
      v(x, rear, -d.depth),
      { color: NET },
    );
    builder.rod(
      `net-back-${i}`,
      twine,
      v(x, 0, -d.depth),
      v(x, rear, -d.depth),
      { color: NET },
    );
  }
  for (let i: number = 1; i <= rows; ++i) {
    const u: number = i / rows;
    builder.rod(
      `net-cross-${i}`,
      twine,
      v(-half, rear * u, -d.depth),
      v(half, rear * u, -d.depth),
      { color: NET },
    );
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const)
      builder.rod(
        `net-${side}-${i}`,
        twine,
        v(sign * half, d.height * u, -d.bar),
        v(sign * half, rear * u, -d.depth),
        { color: NET },
      );
  }
}

type Build = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeWaterPoloGoal.Affordance,
  AutoMovieArchetypeWaterPoloGoal.Dimension
>;
