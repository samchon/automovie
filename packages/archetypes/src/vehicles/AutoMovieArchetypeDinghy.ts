import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";
import * as AutoMovieArchetypeDinghyData from "./internal/AutoMovieArchetypeDinghyData";
import { v } from "./internal/AutoMovieArchetypeDinghyData";

/** The canonical producer and authoring contract for a sailing dinghy. */
export namespace AutoMovieArchetypeDinghy {
  /**
   * A two-person open sailing dinghy. The hull's reference waterline is Y = 0 and
   * +Z points at the bow. Two standing areas share the footwell, the helm's aft
   * of the crew's. The boom pivots about the mast and carries the mainsail and
   * clew; the visible sheet runs from the clew to a floor block and its tail up
   * to the helm's hand end, which stays fixed in the hull. The tiller and the
   * rudder pivot together about the stern, and the tiller extension swings and
   * lifts on a universal joint at the tiller's end. Hull envelope and club sail
   * area follow the Feva Mk2. Intermediate sections, the spars and prepared part
   * dimensions are staged estimates.
   *
   * @param params Optional scene identity and reference dimensions.
   * @param seed Provenance seed. The reference dimensions are fixed.
   * @returns A hull with an open footwell and the two independent controls.
   */
  export function create(
    params: AutoMovieArchetypeDinghy.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeDinghy.Affordance,
    AutoMovieArchetypeDinghy.Dimension
  > {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeDinghy.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "dinghy",
        AutoMovieArchetypeDinghy.UNITS,
        seed,
        params,
      );
    const dimensions: Record<AutoMovieArchetypeDinghy.Dimension, number> =
      draw.dimensions(AutoMovieArchetypeDinghy.BANDS);
    const builder: Build = new AutoMovieArchetypeBuilder({
      material: "composite",
      name: "two-person sailing dinghy",
      id: params.id,
      draw,
    });
    hull(builder, dimensions.length, dimensions.beam);
    mainRig(builder, dimensions.length);
    helm(builder, dimensions.length);
    return builder.build(dimensions.mass);
  }

  /* Reference dimensions and the model's named crew and rig contacts. */
  /** Two deck stations, rotation drivers and real hand and line attachments. */
  export type Affordance =
    | "helmDeck"
    | "crewDeck"
    | "boom"
    | "rudder"
    | "tillerEnd"
    | "extensionSwing"
    | "extensionLift"
    | "tiller"
    | "mainSheet"
    | "clew"
    | "sheetBlock"
    | "sheetSwing"
    | "sheetLift";
  /**
   * The tiller extension's length from its joint to its tip, metres: a staged
   * estimate.
   */
  export const EXTENSION: number = 0.75;

  /** Overall length, beam and estimated rigged mass. */
  export type Dimension = "length" | "beam" | "mass";
  /** Scene identity and published dimension overrides. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }
  /** Units of fixed reference dimensions. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    beam: "m",
    mass: "kg",
  };
  /** Published hull and mainsail, plus an estimated complete mass. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(3.64, 3.64, AutoMovieArchetypeDinghyData.HULL),
    beam: AutoMovieArchetypeBand.metres(1.42, 1.42, AutoMovieArchetypeDinghyData.HULL),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      82,
      82,
      `${AutoMovieArchetypeDinghyData.HULL}. Published hull 73 kg with provisional 9 kg rig (${AutoMovieArchetypeDinghyData.RIG}).`,
      true,
    ),
  };
}

const PAINT: string = "#1c668e";
const DECK: string = "#dfebee";
const SPARS: string = "#989c9e";
const FLOOR: number = 0.02;
const MAIN_AREA: number = 5.5;

/*
 * Thin hull cells on one longitudinal section family beneath the common cockpit
 * floor.
 */
function hull(builder: Build, length: number, beam: number): void {
  const rim: number = 0.31;
  const panels: readonly ISection[] = [
    { z: -length / 2, half: beam * 0.39, keel: -0.1 },
    { z: -length * 0.3, half: beam / 2, keel: -0.2 },
    { z: length * 0.17, half: beam / 2, keel: -0.2 },
    { z: length * 0.38, half: beam * 0.32, keel: -0.125 },
    { z: length / 2, half: 0.02, keel: 0.12 },
  ];
  const ring = (s: ISection, inner: boolean): IAutoMovieVector3[] => {
    const width: number = s.half * (inner ? 0.94 : 1);
    const keel: number = s.keel + (inner ? 0.017 : 0);
    return [
      v(-width, rim, s.z),
      v(-width * 0.76, keel + 0.06, s.z),
      v(-width * 0.44, keel, s.z),
      v(width * 0.44, keel, s.z),
      v(width * 0.76, keel + 0.06, s.z),
      v(width, rim, s.z),
    ];
  };
  const frames: readonly IRing[] = panels.map(
    (p: ISection): IRing => ({
      inner: ring(p, true),
      outer: ring(p, false),
    }),
  );
  for (let i: number = 0; i + 1 < frames.length; ++i)
    for (let j: number = 0; j < 5; ++j)
      builder.convex(
        `shell-${i}-${j}`,
        [frames[i]!, frames[i + 1]!].flatMap(({ inner, outer }) => [
          inner[j]!,
          inner[j + 1]!,
          outer[j]!,
          outer[j + 1]!,
        ]),
        undefined,
        { color: PAINT },
      );
  for (const [name, frame, inward] of [
    ["transom", frames[0]!, 0.017],
    ["stem", frames.at(-1)!, -0.017],
  ] as const)
    builder.convex(
      name,
      frame.outer.flatMap((point) => [
        point,
        { ...point, z: point.z + inward },
      ]),
      undefined,
      { color: PAINT },
    );
  const width: number = beam * 0.78;
  const depth: number = length * 0.62;
  builder.box(
    "cockpit",
    v(width, 0.055, depth),
    v(0, FLOOR - 0.0275, -length * 0.11),
    {
      color: DECK,
    },
  );
  for (const [id, z] of [
    ["helmDeck", -0.3],
    ["crewDeck", 0.8],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, FLOOR, z)),
      extent: null,
      width,
      depth: 0.76,
    });
  builder.box("daggerboard", v(0.046, 0.56, 0.29), v(0, -0.37, 0.51), {
    color: SPARS,
  });
}

/*
 * Main sail, boom and sheet, sharing the mast pivot and a posed hand end.
 */
function mainRig(builder: Build, length: number): void {
  const tack: IAutoMovieVector3 = v(0, 1.18, length * 0.25);
  const boomLength: number = length * 0.64;
  const clew: IAutoMovieVector3 = { ...tack, z: tack.z - boomLength };
  const head: IAutoMovieVector3 = {
    ...tack,
    y: tack.y + (2 * MAIN_AREA) / boomLength,
  };
  const band: IAutoMovieVector3 = Vector3.lerp(clew, head, 0.29);
  const luff: IAutoMovieVector3 = Vector3.lerp(tack, head, 0.29);
  builder.rod(
    "mast",
    0.045,
    v(0, FLOOR, tack.z),
    { ...head, y: head.y + 0.08 },
    { color: SPARS },
  );
  builder.rod("boom-beam", 0.036, tack, clew, { color: SPARS });
  for (const [id, face, color] of [
    ["sail-lower", [tack, clew, band, luff], "#f8f5ec"],
    ["sail-upper", [luff, band, head], "#cc3d44"],
  ] as const)
    builder.convex(
      id,
      face.flatMap((point) => [
        v(-0.006, point.y, point.z),
        v(0.006, point.y, point.z),
      ]),
      undefined,
      { color },
    );
  builder.affordance({
    id: "boom",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(tack, v(0, 1, 0), v(0, 0, -1)),
    extent: null,
    reverse: 65,
    travel: 65,
    parts: ["boom-beam", "sail-lower", "sail-upper"],
  });
  builder.affordance({
    id: "clew",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(clew),
    extent: null,
    rides: "boom",
  });
  // Centre mainsheet: the sheet runs from the clew down to a floor block,
  // and its tail leads up from the block to the helm's forward hand.
  const block: IAutoMovieVector3 = v(0, FLOOR + 0.11, -0.05);
  const take: IAutoMovieVector3 = v(0, 0.7, 0.45);
  builder.ball("sheet-block", 0.049, block, { color: SPARS });
  builder.affordance({
    id: "sheetBlock",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(block),
    extent: null,
  });
  // The tail leaves the block wherever the hand leads it: it swings and
  // lifts about the block.
  builder.affordance({
    id: "sheetSwing",
    kind: "wheel",
    frame: AutoMovieArchetypeFrame.facing(block, v(0, 1, 0), v(0, 0, 1)),
    extent: null,
    travel: 180,
  });
  builder.affordance({
    id: "sheetLift",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(block, v(-1, 0, 0), v(0, 0, 1)),
    extent: null,
    reverse: 60,
    travel: 40,
    rides: "sheetSwing",
  });
  builder.affordance({
    id: "mainSheet",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      take,
      v(0, 0, -1),
      Vector3.subtract(take, block),
    ),
    extent: null,
    grip: "power",
    aperture: 0.018,
    // A hand takes the rope tail anywhere along its free run.
    length: 0.6,
    rides: "sheetLift",
  });
  builder.span(
    "main-sheet-return",
    { type: "affordance", affordance: "clew" },
    { type: "affordance", affordance: "sheetBlock" },
    0.008,
    {
      color: "#d7be77",
    },
  );
  builder.span(
    "main-sheet-tail",
    { type: "affordance", affordance: "sheetBlock" },
    { type: "affordance", affordance: "mainSheet", overhang: 0.08 },
    0.008,
    {
      color: "#d7be77",
    },
  );
}

/*
 * The stern pivot carries the below-water blade and the tiller. At the tiller's
 * end a universal joint carries the extension: it swings about the end's
 * vertical (`extensionSwing`) and lifts about its horizontal (`extensionLift`),
 * so the helm's hand carries the extension's grip where it holds it, as a real
 * hinged tiller extension does.
 */
function helm(builder: Build, length: number): void {
  const pivot: IAutoMovieVector3 = v(0, 0.32, -length / 2);
  const end: IAutoMovieVector3 = v(0, 0.42, -0.95);
  const tip: IAutoMovieVector3 = v(
    0,
    end.y,
    end.z + AutoMovieArchetypeDinghy.EXTENSION,
  );
  const grip: IAutoMovieVector3 = Vector3.lerp(end, tip, 0.6);
  builder.box(
    "rudder-blade",
    v(0.049, 0.72, 0.29),
    v(0, -0.21, pivot.z - 0.08),
    {
      color: SPARS,
    },
  );
  builder.rod("tiller", 0.021, pivot, end, { color: SPARS });
  builder.rod("tiller-extension", 0.017, end, tip, { color: "#30353b" });
  builder.affordance({
    id: "rudder",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(pivot, v(0, 1, 0), v(0, 0, 1)),
    extent: null,
    reverse: 40,
    travel: 40,
    parts: ["rudder-blade", "tiller"],
  });
  builder.affordance({
    id: "tillerEnd",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(end),
    extent: null,
    rides: "rudder",
  });
  builder.affordance({
    id: "extensionSwing",
    kind: "wheel",
    frame: AutoMovieArchetypeFrame.facing(end, v(0, 1, 0), v(0, 0, 1)),
    extent: null,
    travel: 120,
    rides: "rudder",
  });
  builder.affordance({
    id: "extensionLift",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(end, v(-1, 0, 0), v(0, 0, 1)),
    extent: null,
    reverse: 20,
    travel: 90,
    parts: ["tiller-extension"],
    rides: "extensionSwing",
  });
  builder.affordance({
    id: "tiller",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(grip, v(0, 1, 0), v(0, 0, 1)),
    extent: null,
    grip: "power",
    aperture: 0.025,
    length: 0.5,
    rides: "extensionLift",
  });
}

type Build = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeDinghy.Affordance,
  AutoMovieArchetypeDinghy.Dimension
>;

/*
 * One transverse hull section: its station along +Z, half-beam at the rim and
 * keel height, metres.
 */
interface ISection {
  /*
   * Station along the hull, metres from midships.
   */
  z: number;

  /*
   * Half-beam at the sheer, metres.
   */
  half: number;

  /*
   * Keel height relative to the waterline, metres.
   */
  keel: number;
}

/*
 * A section's inner and outer skin outlines, port to starboard.
 */
interface IRing {
  /*
   * Inner skin points.
   */
  inner: IAutoMovieVector3[];

  /*
   * Outer skin points.
   */
  outer: IAutoMovieVector3[];
}
