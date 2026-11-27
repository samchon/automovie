import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";

/*
 * A stationary 16-inch crash cymbal on a straight tripod stand. The diameter
 * and raised bell follow Zildjian's cymbal anatomy
 * (https://ae.zildjian.com/wp-content/uploads/Zildjian_Drum_Method_Lesson_11.pdf).
 * The 0.85 m plate height is a scenic setting within Yamaha's CS650A range
 * (https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/hardware/cymbal_stands/specs.html).
 * The plate thickness, bell and stand proportions and assembly mass are scenic
 * estimates for the rigid prop.
 * Parameter params: The model id, supplied as an option or as a positional string.
 * Returns: The mounted cymbal with the upward-facing `edge` on the rim at local
 * −Z and `bell` at the raised center.
 */
export function createCymbal(
  params: { id?: string } | string = {},
): AutoMovieArchetype<"edge" | "bell", never> {
  const radius: number = 8 * AutoMovieArchetypeUnits.INCH;
  const edgeHeight: number = 0.85;
  const plateThickness: number = 0.002;
  const bellRadius: number = 0.055;
  const bellRise: number = 0.022;
  const mastRadius: number = 0.011;
  const legRadius: number = 0.009;
  const legSpread: number = 0.25;
  const legJointHeight: number = 0.18;
  const mass: number = 3;
  const bronze: string = "#c89439";
  const steel: string = "#8c969c";
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const builder: AutoMovieArchetypeBuilder<"edge" | "bell", never> =
    new AutoMovieArchetypeBuilder({
      id: typeof params === "string" ? params : params.id,
      name: "mounted cymbal",
      material: "composite",
      draw: new AutoMovieArchetypeDrawSession<never>("cymbal", {}, undefined),
    });

  builder.rod(
    "plate",
    radius,
    v(0, edgeHeight - plateThickness, 0),
    v(0, edgeHeight, 0),
    { color: bronze },
  );
  builder.rod(
    "bell",
    bellRadius,
    v(0, edgeHeight, 0),
    v(0, edgeHeight + bellRise, 0),
    { color: bronze },
  );
  builder.rod(
    "mast",
    mastRadius,
    v(0, legJointHeight, 0),
    v(0, edgeHeight - plateThickness, 0),
    { color: steel },
  );
  for (let leg: number = 0; leg < 3; leg++) {
    const angle: number = (leg * 2 * Math.PI) / 3;
    builder.rod(
      `leg-${leg + 1}`,
      legRadius,
      v(0, legJointHeight, 0),
      v(legSpread * Math.sin(angle), legRadius, legSpread * Math.cos(angle)),
      { color: steel, round: true },
    );
  }

  builder.affordance({
    id: "edge",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, edgeHeight, -radius)),
    extent: null,
  });
  builder.affordance({
    id: "bell",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, edgeHeight + bellRise, 0)),
    extent: null,
  });
  return builder.build(mass);
}
