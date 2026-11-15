import { Vector3 } from "@automovie/engine";

import {
  ArchetypeUnits,
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The maker's offset cane, read. */
const CANE: string =
  "Drive Medical offset handle aluminium cane: handle height adjusts from 30 to 39 in, 3/4 in diameter (https://shop.drivemedical.com/us/en/products/mobility/canes/offset/offset-handle-aluminum-canes/p/477-1)";

/** A retailer's weight of that cane, seen only in search results. */
const CANE_MASS: string =
  "a retailer's 0.85 lb for the Drive offset cane, seen only in search results";

/** Drive Medical's two-button folding walker, read. */
const WALKER: string =
  "Drive Medical deluxe two-button folding walker sheet: handle heights 32 to 39 and 25 to 32.25 in, overall width 24 in, weights 7.5, 7.5 and 7 lb for items 10210-1, 10210-4ASM and 10211-4ASM (https://shop.drivemedical.com/us/en/products/mobility/walkers/push-button/deluxe-folding-walker-two-button-with-5-wheels/p/10210-1/downloadPdf); its 18 in base depth seen only in search results";

/** Provita's Premium Care infusion stand, read in the maker's catalogue. */
const PROVITA: string =
  "Provita Infusion stands catalogue, Premium Care I-PRE003 / I-PRE013 (p. 16): regulating range 1,430 to 2,260 mm, tube diameter 33.7 / 25 mm, outer tube 1,200 mm, base diameter 630 mm, base leg profile 33.7 mm, castors 75 mm, four hooks, base weight 8.9 kg, total weight 12 kg (https://medtehural.ru/images/madcat2_24/provita_Infusion%20Stands.pdf); the same tubes, range and hooks on Provita's I-PRE013 listing (https://www.medicalexpo.com/prod/provita-medical/product-69770-2808357.html)";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to a walker's frame, whose tube no maker read sizes";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createMobilityAid.Kind, string>> = {
  cane: "walking cane",
  walker: "walking frame",
  infusionStand: "infusion stand",
};

/**
 * An aid a person walks with: a cane, a walking frame (a walker) or an infusion stand wheeled alongside.
 *
 * Each stands on the floor at the origin, the user behind it facing `+Z`:
 *
 * - a cane is a shaft up `+Y` to its handle height, its offset handle running forward along `+Z` from the shaft's top. `grip` is the handle, taken from above; `tip` is the rubber foot, facing down onto the floor.
 * - a walker is four legs at its corners, `width` across `X` and `depth` along `Z`, joined by a rail along each side and a bar across the front at the handle height; the user stands in its open back. `leftGrip` and `rightGrip` are the side rails at `+X` and `-X`, taken from above; `tip` is the floor under its middle, facing down.
 * - an infusion stand is five legs out from its hub to its base diameter, each on a castor, an outer tube up from the hub and an inner tube on to the drawn height, where its `hook` holds the bags. `grip` is the outer tube, taken from the side anywhere along it; `tip` is the floor under its hub. Its weighted base carries the read base weight and its tubes the rest. Its height, base diameter, tube diameters and lengths and masses are the Provita sheet's; each castor drawn as a ball of the read castor diameter, and the legs laid on the castors' tops, are construction details no act reads.
 *
 * A gait that walks with an aid has no motion law yet; the aid is built for holding, standing and carrying. A crutch waits for a source of its hand grip's height.
 *
 * @param params The kind, the kind's model where it has read models, and any dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The aid.
 * @throws {ArchetypeRefusal} For a model the kind does not have, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each aid stands, where it is held, what is missing for a gait, and which kinds wait for a source.
 * @evidence contracts/development/implementation.md#principled-implementation Rods from the published heights, widths and diameters, an infusion stand's castors as balls of their read diameter under its legs, and its read base weight shared over its legs and castors by volume, the rest over its tubes; each grip's frame lies at the centre of the rod it closes on, with that rod's diameter as its aperture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind: its rods, its grips and its foot.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No walker's wheels or glides, folding joints, rubber tip or castor housings are drawn; the cane's offset handle is CCOHS's recommended handle length, as no maker read gives its own.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most twelve parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMobilityAid(
  params: createMobilityAid.IParams,
  seed?: number | string,
): Archetype<createMobilityAid.Affordance, createMobilityAid.Dimension> {
  const draw: ArchetypeDrawSession<createMobilityAid.Dimension> = new ArchetypeDrawSession<createMobilityAid.Dimension>("mobilityAid", createMobilityAid.UNITS, seed, params);
  const kind: createMobilityAid.Kind = ArchetypeDraw.choice(
    "mobilityAid",
    "kind",
    params.kind,
    createMobilityAid.KINDS,
  );
  // A walker is Drive's adult or junior model whole, its handle height drawn in that model's own range.
  const model: { name: createMobilityAid.Model | undefined; figures: createMobilityAid.Figures } = draw.model<createMobilityAid.Model>(
    "model",
    params.model,
    createMobilityAid.MODELS[kind],
  );
  // The model's own range bands its height, so the author's height is checked in it.
  const range: IArchetypeBand | undefined =
    model.name === undefined ? undefined : createMobilityAid.HANDLE_HEIGHTS[model.name];
  const d: Partial<Record<createMobilityAid.Dimension, number>> = {
    ...draw.dimensions(
      range === undefined
        ? createMobilityAid.BANDS[kind]
        : { ...createMobilityAid.BANDS[kind], height: range },
      createMobilityAid.BANDS,
    ),
    ...model.figures,
  };
  const builder: ArchetypeBuilder<
    createMobilityAid.Affordance,
    createMobilityAid.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const r: number = d.diameter! / 2;
  const metal: string = "#9aa1a6";

  if (kind === "infusionStand") {
    // Five legs on castors, the outer tube up from the hub, the inner tube on to the height.
    const stand: typeof createMobilityAid.STAND = createMobilityAid.STAND;
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
      frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.upright(v(0, height, 0)),
      extent: null,
    });
  } else if (kind === "cane") {
    const handle: number = createMobilityAid.HANDLE;
    builder.rod("shaft", r, v(0, 0, 0), v(0, height - r, 0), { color: metal });
    builder.rod("handle", r, v(0, height - r, -r), v(0, height - r, handle), {
      color: "#2c2f33",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, height - r, (handle - r) / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * r,
      length: handle + r,
    });
  } else {
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
        frame: ArchetypeFrame.facing(v(sx * x, top, 0), v(0, 1, 0), v(0, 0, 1)),
        extent: null,
        grip: "power",
        aperture: 2 * r,
        length: 2 * z,
      });
    }
  }
  builder.affordance({
    id: "tip",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createMobilityAid}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the three aids with sourced bands, one band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grips a hand takes, the foot on the floor and an infusion stand's hook (#3468's N5).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The heights, widths, diameter and walker's weight are the maker's as read; the infusion stand's are its maker's catalogue's as read; the walker's depth and the cane's weight are seen only in search results and a walker's tube is a grip band applied, all provisional; the cane's handle length is CCOHS's recommended handle length.
 */
export namespace createMobilityAid {
  /** The kinds: an offset cane, a walking frame and an infusion stand. */
  export type Kind = "cane" | "walker" | "infusionStand";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["cane", "walker", "infusionStand"];

  /** The infusion stand's read construction, metres and kilograms: its castors' and base legs' diameters, its outer tube's length, its inner tube's diameter and its weighted base's mass, Provita's I-PRE003 / I-PRE013; its five legs are counted in the catalogue's photographs of the stand (pp. 13 and 16), as its text states no count. */
  export const STAND: Readonly<{
    legs: number;
    castor: number;
    leg: number;
    outer: number;
    inner: number;
    base: number;
  }> = {
    legs: 5,
    castor: 0.075,
    leg: 0.0337,
    outer: 1.2,
    inner: 0.025,
    base: 8.9,
  };

  /** The cane's offset handle, forward of the shaft, metres: the 120 mm CCOHS recommends for a tool handle (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html), the length a hand closes round. */
  export const HANDLE: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `grip`: a cane's handle, taken from above.
   * - `leftGrip`, `rightGrip`: a walker's side rails at `+X` and `-X`, taken from above.
   * - `tip`: the foot on the floor, facing down.
   * - `hook`: an infusion stand's hooks at its top, where the bags hang.
   */
  export type Affordance = "grip" | "leftGrip" | "rightGrip" | "tip" | "hook";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the handle's top above the floor; an infusion stand's top, where its hooks are.
   * - `diameter`: a cane's shaft, a walker's tube, an infusion stand's outer tube.
   * - `width`, `depth`: a walker's across `X` and along `Z`; `width` an infusion stand's base diameter.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "width" | "depth" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    height: "m",
    diameter: "m",
    width: "m",
    depth: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which aid. */
    kind: Kind;

    /** A walker's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `mobilityAid` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The walkers read: Drive Medical's deluxe two-button folding walker, adult (10210-1, 10210-4ASM) and junior (10211-4ASM). */
  export type Model = "adult" | "junior";

  /** Each kind's models whole, the default first: the adult walker 7.5 lb and the junior 7 lb, the sheet's weights in the order of its item rows (https://shop.drivemedical.com/us/en/products/mobility/walkers/push-button/deluxe-folding-walker-two-button-with-5-wheels/p/10210-1/downloadPdf). */
  export const MODELS: Readonly<Partial<Record<Kind, Readonly<Record<Model, Figures>>>>> = {
    walker: {
      adult: { mass: 7.5 * ArchetypeUnits.POUND },
      junior: { mass: 7 * ArchetypeUnits.POUND },
    },
  };

  /** Each walker model's own handle height range, metres: the sheet's 32 to 39 in for the adult and 25 to 32.25 in for the junior. */
  export const HANDLE_HEIGHTS: Readonly<Partial<Record<Model, IArchetypeBand>>> = {
    adult: ArchetypeBand.metres(32 * ArchetypeUnits.INCH, 39 * ArchetypeUnits.INCH, `${WALKER}: the adult handle heights`),
    junior: ArchetypeBand.metres(25 * ArchetypeUnits.INCH, 32.25 * ArchetypeUnits.INCH, `${WALKER}: the junior handle heights`),
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    cane: {
      height: ArchetypeBand.metres(30 * ArchetypeUnits.INCH, 39 * ArchetypeUnits.INCH, CANE),
      diameter: ArchetypeBand.metres(0.75 * ArchetypeUnits.INCH, 0.75 * ArchetypeUnits.INCH, CANE),
      mass: ArchetypeBand.of(
        "kg",
        0.85 * ArchetypeUnits.POUND,
        0.85 * ArchetypeUnits.POUND,
        CANE_MASS,
        true,
      ),
    },
    walker: {
      width: ArchetypeBand.metres(24 * ArchetypeUnits.INCH, 24 * ArchetypeUnits.INCH, WALKER),
      depth: ArchetypeBand.metres(18 * ArchetypeUnits.INCH, 18 * ArchetypeUnits.INCH, WALKER, true),
      diameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
    },
    infusionStand: {
      height: ArchetypeBand.metres(1.43, 2.26, PROVITA),
      diameter: ArchetypeBand.metres(0.0337, 0.0337, PROVITA),
      width: ArchetypeBand.metres(0.63, 0.63, PROVITA),
      mass: ArchetypeBand.of("kg", 12, 12, PROVITA),
    },
  };
}
