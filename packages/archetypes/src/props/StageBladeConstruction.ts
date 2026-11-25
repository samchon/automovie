import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createStageBladeProp } from "./createStageBladeProp";

/** Overall display length is measured along the prop's long axis. */
const UNITS: Readonly<Record<createStageBladeProp.Dimension, "m">> = {
  length: "m",
};

/** Admitted digital display lengths. */
const LENGTH: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  0.55,
  1.45,
  "Authored digital display scale for padded blade props.",
  true,
);

/**
 * Each display profile gives its default length in metres, and the relative
 * locations and sizes of its visual features. They are authored silhouettes.
 */
const PROFILES = {
  foil: {
    length: 0.95,
    grip: 0.17,
    shaft: 0.011,
    guard: 0.046,
    color: "#c1b1e8",
  },
  epee: {
    length: 1.02,
    grip: 0.17,
    shaft: 0.017,
    guard: 0.073,
    color: "#acd3ea",
  },
  sabre: {
    length: 0.96,
    grip: 0.17,
    shaft: 0.018,
    guard: 0.058,
    color: "#edbf9b",
  },
  shinai: {
    length: 1.16,
    grip: 0.26,
    shaft: 0.021,
    guard: 0.047,
    color: "#d6ae73",
  },
  longsword: {
    length: 1.16,
    grip: 0.24,
    shaft: 0.029,
    guard: 0.082,
    color: "#b9b3ce",
  },
} as const satisfies Record<
  createStageBladeProp.Kind,
  {
    length: number;
    grip: number;
    shaft: number;
    guard: number;
    color: string;
  }
>;

/**
 * Build a padded hand-held silhouette.
 *
 * The common digital profile has a grip, capped shaft and optional
 * form-specific guard detail.
 *
 * @param kind The selected stored profile label.
 * @param twoHand Whether the contact admits an authored two-hand pose.
 * @param decorate Places any guard and profile-dependent details.
 * @param edge The striking part as shares of the length from the handle's end,
 *   for a silhouette that cuts; none for a point weapon.
 * @param params The scene identifier and display length in metres.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames: the grip, the
 *   point and any edge.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function StageBladeConstruction(
  kind: createStageBladeProp.Kind,
  params: Omit<createStageBladeProp.IParams, "kind">,
  seed: number | undefined,
  twoHand: boolean,
  decorate: StageBladeConstruction.Decorate,
  edge?: StageBladeConstruction.Span,
): AutoMovieArchetype<
  createStageBladeProp.Affordance,
  createStageBladeProp.Dimension
> {
  const profile: (typeof PROFILES)[createStageBladeProp.Kind] = PROFILES[kind];
  const draw: AutoMovieArchetypeDrawSession<createStageBladeProp.Dimension> =
    new AutoMovieArchetypeDrawSession("stageBladeProp", UNITS, seed, {
      length: params.length,
    });
  const length: number =
    params.length === undefined
      ? draw.derive("length", profile.length)
      : draw.dimensions({ length: LENGTH }).length;
  const builder: AutoMovieArchetypeBuilder<
    createStageBladeProp.Affordance,
    createStageBladeProp.Dimension
  > = new AutoMovieArchetypeBuilder({
    draw,
    id: params.id,
    name: `padded ${kind} stage prop`,
    material: "foam",
  });
  const v: typeof Vector3.create = Vector3.create;
  const gripLength: number = profile.grip * length;
  const gripRadius: number = Math.min(0.016, 0.021 * length);
  const shaftRadius: number = profile.shaft * length;
  const guardRadius: number = profile.guard * length;
  const capRadius: number = Math.max(shaftRadius, 0.019 * length);
  const capY: number = length - capRadius;
  const guardDepth: number = 0.024 * length;

  builder.rod("grip", gripRadius, v(0, 0, 0), v(0, gripLength, 0), {
    color: "#45465e",
  });
  builder.rod("shaft", shaftRadius, v(0, gripLength, 0), v(0, capY, 0), {
    color: profile.color,
  });
  builder.ball("endCap", capRadius, v(0, capY, 0), { color: "#fff0b2" });

  decorate(builder, {
    length,
    gripLength,
    guardRadius,
    guardDepth,
    shaftRadius,
  });

  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, gripLength / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: twoHand ? "two-hand" : "power",
    aperture: 2 * gripRadius,
    length: gripLength,
  });

  // The contact regions a touch or a strike is read from: the point at the
  // end cap's tip, and for a cutting silhouette the edge on the grip's front
  // (+Z) side, centred on the striking part, its +X along the shaft.
  builder.affordance({
    id: "point",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, length, 0),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  if (edge !== undefined) {
    const from: number = edge[0] * length;
    const to: number = edge[1] * length;
    builder.affordance({
      id: "edge",
      kind: "ledge",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, (from + to) / 2, shaftRadius),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
      extent: null,
      length: to - from,
    });
  }
  return builder.build(0.2);
}

/** Shared display measurements and guard geometry. */
export namespace StageBladeConstruction {
  /** Model-space locations and sizes for a form’s additional geometry. */
  export interface IProfile {
    /** The total display length, in metres. */
    length: number;
    /** The guard’s position along the handle from the origin in metres. */
    gripLength: number;
    /** The guard’s outer radius in metres. */
    guardRadius: number;
    /** The guard’s depth in metres along +Y. */
    guardDepth: number;
    /** The radius of the visible shaft in metres. */
    shaftRadius: number;
  }

  /** The builder and measurements of the chosen display prop. */
  export type Decorate = (
    builder: AutoMovieArchetypeBuilder<
      createStageBladeProp.Affordance,
      createStageBladeProp.Dimension
    >,
    profile: IProfile,
  ) => void;

  /** A striking part as shares of the length from the handle's end: from, to. */
  export type Span = readonly [from: number, to: number];

  /** Add the cylindrical guard used by fencing and practice silhouettes. */
  export function roundGuard(
    builder: Parameters<Decorate>[0],
    profile: IProfile,
  ): void {
    const { gripLength, guardRadius, guardDepth }: IProfile = profile;
    const v: typeof Vector3.create = Vector3.create;
    builder.rod(
      "guard",
      guardRadius,
      v(0, gripLength, 0),
      v(0, gripLength + guardDepth, 0),
      { color: "#6f6687" },
    );
  }
}
