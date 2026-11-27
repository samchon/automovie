import { Vector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";
import type { AutoMovieArchetypeStageBladeProp } from "../AutoMovieArchetypeStageBladeProp";
import * as StageBladeConstructionData from "./StageBladeConstructionData";

/*
 * Build a padded hand-held silhouette.
 *
 * The common digital profile has a grip, capped shaft and optional
 * form-specific guard detail.
 * Parameter kind: The selected stored profile label.
 * Parameter twoHand: Whether the contact admits an authored two-hand pose.
 * Parameter decorate: Places any guard and profile-dependent details.
 * Parameter edge: The striking part as shares of the length from the handle's end,
 * for a silhouette that cuts; none for a point weapon.
 * Parameter params: The scene identifier and display length in metres.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames: the grip, the
 * point and any edge.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function StageBladeConstruction(
  kind: AutoMovieArchetypeStageBladeProp.Kind,
  params: Omit<AutoMovieArchetypeStageBladeProp.IParams, "kind">,
  seed: number | undefined,
  twoHand: boolean,
  decorate: StageBladeConstruction.Decorate,
  edge?: StageBladeConstruction.Span,
): AutoMovieArchetype<
  AutoMovieArchetypeStageBladeProp.Affordance,
  AutoMovieArchetypeStageBladeProp.Dimension
> {
  const profile: (typeof StageBladeConstructionData.PROFILES)[AutoMovieArchetypeStageBladeProp.Kind] = StageBladeConstructionData.PROFILES[kind];
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStageBladeProp.Dimension> =
    new AutoMovieArchetypeDrawSession("stageBladeProp", StageBladeConstructionData.UNITS, seed, {
      length: params.length,
    });
  const length: number =
    params.length === undefined
      ? draw.derive("length", profile.length)
      : draw.dimensions({ length: StageBladeConstructionData.LENGTH }).length;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStageBladeProp.Affordance,
    AutoMovieArchetypeStageBladeProp.Dimension
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

/*
 * Shared display measurements and guard geometry.
 */
export namespace StageBladeConstruction {
  /*
   * Model-space locations and sizes for a form’s additional geometry.
   */
  export interface IProfile {
    /*
     * The total display length, in metres.
     */
    length: number;
    /*
     * The guard’s position along the handle from the origin in metres.
     */
    gripLength: number;
    /*
     * The guard’s outer radius in metres.
     */
    guardRadius: number;
    /*
     * The guard’s depth in metres along +Y.
     */
    guardDepth: number;
    /*
     * The radius of the visible shaft in metres.
     */
    shaftRadius: number;
  }

  /*
   * The builder and measurements of the chosen display prop.
   */
  export type Decorate = (
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeStageBladeProp.Affordance,
      AutoMovieArchetypeStageBladeProp.Dimension
    >,
    profile: IProfile,
  ) => void;

  /** A striking part as shares of the length from the handle's end: from, to. */
  export type Span = readonly [from: number, to: number];

  /*
   * Add the cylindrical guard used by fencing and practice silhouettes.
   */
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
