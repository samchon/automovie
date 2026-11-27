import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { AutoMovieArchetypeMobilityAid } from "../AutoMovieArchetypeMobilityAid";

/** The readable name of each kind. */
const NAMES: Readonly<Record<AutoMovieArchetypeMobilityAid.Kind, string>> = {
  cane: "walking cane",
  walker: "walking frame",
  infusionStand: "infusion stand",
};

/** Model coordinates in metres. */
const v: typeof Vector3.create = Vector3.create;

/** The shared painted metal part color. */
const metal: string = "#9aa1a6";

/**
 * Draw the selected stand or aid's admitted dimensions in the historical
 * stream.
 */
function draw<Id extends AutoMovieArchetypeMobilityAid.Affordance>(
  kind: AutoMovieArchetypeMobilityAid.Kind,
  params: Omit<AutoMovieArchetypeMobilityAid.IParams, "kind">,
  seed?: number,
): IDrawn<Id> {
  const session: AutoMovieArchetypeDrawSession<AutoMovieArchetypeMobilityAid.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeMobilityAid.Dimension>(
      "mobilityAid",
      AutoMovieArchetypeMobilityAid.UNITS,
      seed,
      params,
    );
  // A walker is Drive's adult or junior model whole, its handle height drawn in that model's own range.
  const model: {
    name: AutoMovieArchetypeMobilityAid.Model | undefined;
    figures: AutoMovieArchetypeMobilityAid.Figures;
  } = session.model<AutoMovieArchetypeMobilityAid.Model>(
    "model",
    params.model,
    AutoMovieArchetypeMobilityAid.MODELS[kind],
  );
  // The model's own range bands its height, so the author's height is checked in it.
  const range: IAutoMovieArchetypeBand | undefined =
    model.name === undefined
      ? undefined
      : AutoMovieArchetypeMobilityAid.HANDLE_HEIGHTS[model.name];
  const d: Partial<Record<AutoMovieArchetypeMobilityAid.Dimension, number>> = {
    ...session.dimensions(
      range === undefined
        ? AutoMovieArchetypeMobilityAid.BANDS[kind]
        : { ...AutoMovieArchetypeMobilityAid.BANDS[kind], height: range },
      AutoMovieArchetypeMobilityAid.BANDS,
    ),
    ...model.figures,
  };
  const builder: Builder<Id> = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw: session,
  });
  return { builder, d };
}

/** Put the downward floor reference under the model origin. */
function tip(builder: {
  affordance(contact: Parameters<Builder<"tip">["affordance"]>[0]): void;
}): void {
  builder.affordance({
    id: "tip",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
}

/**
 * Shared sizing and individual constructions for floor-supported props held
 * beside a person.
 */
export namespace MobilityAidConstruction {
  /** The contact ids {@link cane} builds or reads. */
  export type CaneContact = "grip" | "tip";

  /** Build an offset cane with a floor tip and a handle across its shaft. */
  export function cane(
    params: Omit<AutoMovieArchetypeMobilityAid.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<CaneContact, AutoMovieArchetypeMobilityAid.Dimension> {
    const { builder, d }: ReturnType<typeof draw<CaneContact>> =
      draw<CaneContact>("cane", params, seed);
    const height: number = d.height!;
    const r: number = d.diameter! / 2;
    const handle: number = AutoMovieArchetypeMobilityAid.HANDLE;
    builder.rod("shaft", r, v(0, 0, 0), v(0, height - r, 0), { color: metal });
    builder.rod("handle", r, v(0, height - r, -r), v(0, height - r, handle), {
      color: "#2c2f33",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, height - r, (handle - r) / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * r,
      length: handle + r,
    });

    tip(builder);
    return builder.build(d.mass!);
  }

  /** The contact ids {@link walker} builds or reads. */
  export type WalkerContact = "leftGrip" | "rightGrip" | "tip";

  /** Build a walking frame with paired side rail grips and a central floor tip. */
  export function walker(
    params: Omit<AutoMovieArchetypeMobilityAid.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<WalkerContact, AutoMovieArchetypeMobilityAid.Dimension> {
    const { builder, d }: ReturnType<typeof draw<WalkerContact>> =
      draw<WalkerContact>("walker", params, seed);
    const height: number = d.height!;
    const r: number = d.diameter! / 2;
    // Four legs, a rail along each side and a bar across the front, all at the handle height.
    const x: number = d.width! / 2 - r;
    const z: number = d.depth! / 2 - r;
    const top: number = height - r;
    for (const [id, sx, sz] of [
      ["legFrontLeft", 1, 1],
      ["legFrontRight", -1, 1],
      ["legBackLeft", 1, -1],
      ["legBackRight", -1, -1],
    ] as const)
      builder.rod(id, r, v(sx * x, 0, sz * z), v(sx * x, top, sz * z), {
        color: metal,
      });
    builder.rod("front", r, v(-x, top, z), v(x, top, z), { color: metal });
    for (const [id, sx] of [
      ["leftGrip", 1],
      ["rightGrip", -1],
    ] as const) {
      builder.rod(id, r, v(sx * x, top, -z), v(sx * x, top, z), {
        color: "#2c2f33",
      });
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.facing(
          v(sx * x, top, 0),
          v(0, 1, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "power",
        aperture: 2 * r,
        length: 2 * z,
      });
    }

    tip(builder);
    return builder.build(d.mass!);
  }

  /** The contact ids {@link infusionStand} builds or reads. */
  export type InfusionStandContact = "grip" | "tip" | "hook";

  /** Build a wheeled stand with a shaft grip, floor tip and bag hook. */
  export function infusionStand(
    params: Omit<AutoMovieArchetypeMobilityAid.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<InfusionStandContact, AutoMovieArchetypeMobilityAid.Dimension> {
    const { builder, d }: ReturnType<typeof draw<InfusionStandContact>> =
      draw<InfusionStandContact>("infusionStand", params, seed);
    const height: number = d.height!;
    const r: number = d.diameter! / 2;
    // Five legs on castors, the outer tube up from the hub, the inner tube on to the height.
    const stand: typeof AutoMovieArchetypeMobilityAid.STAND = AutoMovieArchetypeMobilityAid.STAND;
    const reach: number = d.width! / 2 - stand.castor / 2;
    const leg: number = stand.leg / 2;
    const hub: number = stand.castor + leg;
    const outer: number = hub + stand.outer;
    const legVolume: number = Math.PI * leg ** 2 * reach;
    const castorVolume: number = (4 / 3) * Math.PI * (stand.castor / 2) ** 3;
    const outerVolume: number = Math.PI * r ** 2 * stand.outer;
    const innerVolume: number =
      Math.PI * (stand.inner / 2) ** 2 * (height - outer);
    const base: number = stand.base / d.mass!;
    const perBase: number = base / (stand.legs * (legVolume + castorVolume));
    const perTube: number = (1 - base) / (outerVolume + innerVolume);
    for (let k: number = 0; k < stand.legs; ++k) {
      const angle: number = (2 * Math.PI * k) / stand.legs;
      const out: ReturnType<typeof v> = v(Math.sin(angle), 0, Math.cos(angle));
      builder.rod(
        `leg${k}`,
        leg,
        v(0, hub, 0),
        v(out.x * reach, hub, out.z * reach),
        { color: metal, share: perBase * legVolume },
      );
      builder.ball(
        `castor${k}`,
        stand.castor / 2,
        v(out.x * reach, stand.castor / 2, out.z * reach),
        { color: "#2c2f33", share: perBase * castorVolume },
      );
    }
    builder.rod("outerTube", r, v(0, hub, 0), v(0, outer, 0), {
      color: metal,
      share: perTube * outerVolume,
    });
    builder.rod("innerTube", stand.inner / 2, v(0, outer, 0), v(0, height, 0), {
      color: metal,
      share: perTube * innerVolume,
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, (hub + outer) / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * r,
      length: stand.outer,
    });
    builder.affordance({
      id: "hook",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(v(0, height, 0)),
      extent: null,
    });

    tip(builder);
    return builder.build(d.mass!);
  }
}

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends AutoMovieArchetypeMobilityAid.Affordance> =
  AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeMobilityAid.Dimension>;

/** Model dimensions in the legacy family's recorded units. */
type Dimensions = Partial<Record<AutoMovieArchetypeMobilityAid.Dimension, number>>;

/** A started construction: its builder and its drawn dimensions. */
interface IDrawn<Id extends AutoMovieArchetypeMobilityAid.Affordance> {
  /** The model-space builder for the selected contact ids. */
  builder: Builder<Id>;

  /** The drawn and fixed dimensions in the family's recorded units. */
  d: Dimensions;
}
