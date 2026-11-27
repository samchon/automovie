import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core";
import { AutoMovieArchetypeVessel } from "../AutoMovieArchetypeVessel";

/** Create a model-space point in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * Resolve recorded sizing, then lay out the shared open floor, walls and
 * surfaces.
 */
function draw<Id extends AutoMovieArchetypeVessel.Affordance>(
  kind: AutoMovieArchetypeVessel.Kind,
  params: Omit<AutoMovieArchetypeVessel.IParams, "kind">,
  seed?: number,
): IDrawResult<Id> {
  const session: AutoMovieArchetypeDrawSession<AutoMovieArchetypeVessel.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeVessel.Dimension>(
      "vessel",
      AutoMovieArchetypeVessel.UNITS,
      seed,
      params,
    );
  const drawn: Partial<Record<AutoMovieArchetypeVessel.Dimension, number>> =
    session.dimensions(AutoMovieArchetypeVessel.BANDS[kind]);
  // A bowl or an ashtray is one of the read models whole.
  const model: {
    name: AutoMovieArchetypeVessel.Model | undefined;
    figures: AutoMovieArchetypeVessel.Figures;
  } = session.model<AutoMovieArchetypeVessel.Model>(
    "model",
    params.model,
    AutoMovieArchetypeVessel.MODELS[kind],
  );
  const read: Partial<Record<AutoMovieArchetypeVessel.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const d: Record<AutoMovieArchetypeVessel.Dimension, number> = {
    diameter: read.diameter!,
    height: read.height!,
    mass: read.mass!,
  };
  const builder: Builder<Id | DrawContact> = new AutoMovieArchetypeBuilder({
    material:
      kind === "bowl"
        ? "ceramic"
        : kind === "ashtray" || kind === "vase"
          ? "glass"
          : "steel",
    id: params.id,
    name: kind,
    draw: session,
  });
  const wall: number = AutoMovieArchetypeVessel.WALL;
  const r: number = d.diameter / 2;
  const color: string = AutoMovieArchetypeVessel.COLORS[kind];
  builder.rod("floor", r, v(0, 0, 0), v(0, wall, 0), { color });
  for (const [id, size, at] of [
    [
      "wallFront",
      v(d.diameter, d.height - wall, wall),
      v(0, (d.height + wall) / 2, r - wall / 2),
    ],
    [
      "wallBack",
      v(d.diameter, d.height - wall, wall),
      v(0, (d.height + wall) / 2, -r + wall / 2),
    ],
    [
      "wallLeft",
      v(wall, d.height - wall, d.diameter - 2 * wall),
      v(r - wall / 2, (d.height + wall) / 2, 0),
    ],
    [
      "wallRight",
      v(wall, d.height - wall, d.diameter - 2 * wall),
      v(-r + wall / 2, (d.height + wall) / 2, 0),
    ],
  ] as const)
    builder.box(id, size, at, { color });
  builder.affordance({
    id: "rim",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
    width: d.diameter,
    depth: d.diameter,
  });
  builder.affordance({
    id: "inside",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, wall, 0)),
    extent: null,
    width: d.diameter - 2 * wall,
    depth: d.diameter - 2 * wall,
  });
  return { builder, d };
}

/** Define a grip from below the bottom floor of a shallow vessel. */
function dishGrip(
  builder: {
    affordance(contact: Parameters<Builder<"body">["affordance"]>[0]): void;
  },
  grip: DishGripGrip,
): void {
  const wall: number = AutoMovieArchetypeVessel.WALL;
  builder.affordance({
    id: "body",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, wall / 2, 0),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip,
    aperture: wall,
  });
}

/** Shared floor and wall geometry with distinct food, ash and display grips. */
export namespace VesselConstruction {
  /** The contact ids {@link bowl} builds or reads. */
  export type BowlContact = "rim" | "inside" | "body";

  /** Build a bowl held from beneath with two hands. */
  export function bowl(
    params: Omit<AutoMovieArchetypeVessel.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<BowlContact, AutoMovieArchetypeVessel.Dimension> {
    const { builder, d }: ReturnType<typeof draw<BowlContact>> =
      draw<BowlContact>("bowl", params, seed);
    dishGrip(builder, "two-hand");
    return builder.build(d.mass);
  }

  /** The contact ids {@link ashtray} builds or reads. */
  export type AshtrayContact = "rim" | "inside" | "body";

  /** Build an ashtray grasped from below. */
  export function ashtray(
    params: Omit<AutoMovieArchetypeVessel.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<AshtrayContact, AutoMovieArchetypeVessel.Dimension> {
    const { builder, d }: ReturnType<typeof draw<AshtrayContact>> =
      draw<AshtrayContact>("ashtray", params, seed);
    dishGrip(builder, "precision");
    return builder.build(d.mass);
  }

  /** The contact ids {@link vase} builds or reads. */
  export type VaseContact = "rim" | "inside" | "body";

  /** Build a vase at the model origin with a grip around the middle. */
  export function vase(
    params: Omit<AutoMovieArchetypeVessel.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<VaseContact, AutoMovieArchetypeVessel.Dimension> {
    const { builder, d }: ReturnType<typeof draw<VaseContact>> =
      draw<VaseContact>("vase", params, seed);
    builder.affordance({
      id: "body",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, d.height / 2, 0),
        v(-1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.diameter,
    });
    return builder.build(d.mass);
  }

  /** The values {@link cookingPot} accepts at this place in its signature. */
  export type CookingPotKind = "saucepan" | "stockpot";

  /** The contact ids {@link cookingPot} builds or reads. */
  export type CookingPotContact =
    | "rim"
    | "inside"
    | "handle"
    | "leftHandle"
    | "rightHandle";

  /** Build a cooking pot with its own grasp arrangement. */
  export function cookingPot(
    kind: CookingPotKind,
    params: Omit<AutoMovieArchetypeVessel.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<CookingPotContact, AutoMovieArchetypeVessel.Dimension> {
    const { builder, d }: ReturnType<typeof draw<CookingPotContact>> =
      draw<CookingPotContact>(kind, params, seed);
    const r: number = d.diameter / 2;
    const grip: number = AutoMovieArchetypeVessel.GRIP;
    if (kind === "saucepan") {
      const length: number = AutoMovieArchetypeVessel.HANDLE;
      builder.rod(
        "handle",
        grip / 2,
        v(r, d.height - grip, 0),
        v(r + length, d.height - grip, 0),
        {
          color: "#2c2f33",
        },
      );
      builder.affordance({
        id: "handle",
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.facing(
          v(r + length / 2, d.height - grip, 0),
          v(0, 1, 0),
          v(1, 0, 0),
        ),
        extent: null,
        grip: "power",
        aperture: grip,
        length,
      });
    } else {
      for (const [id, sign] of [
        ["leftHandle", 1],
        ["rightHandle", -1],
      ] as const) {
        const x: number = sign * (r + 0.03);
        builder.rod(
          id,
          grip / 2,
          v(x, d.height - grip, -0.05),
          v(x, d.height - grip, 0.05),
          {
            color: "#2c2f33",
          },
        );
        builder.affordance({
          id,
          kind: "handle",
          symmetry: "none",
          frame: AutoMovieArchetypeFrame.facing(
            v(x, d.height - grip, 0),
            v(0, 1, 0),
            v(0, 0, 1),
          ),
          extent: null,
          grip: "hook",
          aperture: grip,
          length: 0.1,
        });
      }
    }
    return builder.build(d.mass);
  }
}

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends AutoMovieArchetypeVessel.Affordance> = AutoMovieArchetypeBuilder<
  Id,
  AutoMovieArchetypeVessel.Dimension
>;

/** The contact ids every vessel draw builds. */
type DrawContact = "inside" | "rim";

/** What {@link draw} prepares for its caller. */
interface IDrawResult<Id extends AutoMovieArchetypeVessel.Affordance> {
  /** The prepared `builder` this call returns. */
  builder: Builder<Id | DrawContact>;

  /** The prepared `d` this call returns. */
  d: Record<AutoMovieArchetypeVessel.Dimension, number>;
}

/** The values {@link dishGrip} accepts at this place in its signature. */
type DishGripGrip = "two-hand" | "precision";
