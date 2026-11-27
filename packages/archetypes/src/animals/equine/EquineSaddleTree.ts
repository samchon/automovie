import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type AutoMovieArchetypeBuilder, AutoMovieArchetypeFrame } from "../../core";
import type { AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import type { QuadrupedAttachments } from "../quadruped/QuadrupedAttachments";

/*
 * Lay one coarse connected riding saddle on the actual trunk capsule. The
 * bearing deck spans a flat sit-bone region and meets a narrowing forward
 * twist and raised end sections (EP2275382A2, description of the saddle tree).
 * L'Arçonnerie Française's jumping and dressage trees both publish 260 mm
 * broad and 125 mm twist widths; Stübben publishes a 50 mm jumping panel gap.
 * The end ramps use the existing crest envelope as their longitudinal run.
 * Half of the original shell thickness forms the deck and the other half
 * clears the spine between the separately attached underside panels.
 * Parameter builder: The physical horse builder, before its tack is closed.
 * Parameter props: Seat envelope, tree station and installed barrel.
 * Returns: The actual tree edge at the stirrup bar's station.
 */
export function EquineSaddleTree(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  props: EquineSaddleTree.IProps,
): EquineSaddleTree.IBar {
  const { centre, top, length, bar, barrel, share }: EquineSaddleTree.IProps = props;
  const rear: number = centre - length / 2;
  const front: number = centre + length / 2;
  const rise: number = STOCK.gripRise + STOCK.gripRadius;
  const bottom: number = top - STOCK.deck / 2;
  const panBack: number = rear + rise;
  const panFront: number = bar - rise;
  const width: number = TREE.broad;
  const half: number = width / 2;
  const waist: number = TREE.twist / 2;
  const color: string = "#4a3324";
  const skin: AutoMovieArchetypeBuilder.IOptions = { color, share: 0 };
  const section = (z: number, edge: number, peak: number): ISection => ({
    z,
    half: edge,
    bottom,
    top: peak,
  });
  const sittingBack: ISection = section(panBack, half, top);
  const sittingFront: ISection = section(panFront, half, top);
  const twist: ISection = section(bar, waist, top);
  const pommelBase: ISection = section(front - rise, waist, top);
  const points = (station: ISection): IAutoMovieVector3[] =>
    [-station.half, station.half].flatMap(
      (x: number): IAutoMovieVector3[] => [
        AutoMovieEngineVector3.create(x, station.bottom, station.z),
        AutoMovieEngineVector3.create(x, station.top, station.z),
      ],
    );
  const join = (id: string, a: ISection, b: ISection): void => {
    builder.convex(id, [...points(a), ...points(b)], undefined, skin);
  };

  builder.box(
    "saddle",
    AutoMovieEngineVector3.create(width, top - bottom, panFront - panBack),
    AutoMovieEngineVector3.create(0, (top + bottom) / 2, (panFront + panBack) / 2),
    { color, share },
  );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, top, panFront)),
    extent: null,
    depth: panFront - panBack,
    width,
    astride: true,
    mount: "left",
  });
  join("saddle-twist", sittingFront, twist);
  join("saddle-waist", twist, pommelBase);
  join(
    "saddle-pommel",
    pommelBase,
    section(front, props.trickGripHalf ?? waist, top + STOCK.gripRise),
  );
  join("saddle-cantle", section(rear, STOCK.gripHalf, top + STOCK.gripRise), sittingBack);

  for (const [id, z] of [
    ["pommel", front],
    ["cantle", rear],
  ] as const) {
    const grip: IAutoMovieVector3 = AutoMovieEngineVector3.create(0, top + STOCK.gripRise, z);
    builder.rod(
      id,
      STOCK.gripRadius,
      { ...grip, x: -STOCK.gripHalf },
      { ...grip, x: STOCK.gripHalf },
      skin,
    );
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.upright(grip),
      extent: null,
      grip: "power",
      aperture: 2 * STOCK.gripRadius,
      length: 2 * STOCK.gripHalf,
    });
  }

  // Keep the rigid fitted panels outside the complete curved trunk. In each
  // cross-section the bottom is tangent, so its edges cannot cut the barrel.
  const inner: number = CHANNEL / 2;
  const radius: number = barrel.radius;
  const axis: number = barrel.from.y;
  const ceiling: number = bottom - axis;
  const reach: number = radius * Math.sqrt(1 - (radius / ceiling) ** 2);
  const bearing: number = Math.min((inner + waist) / 2, reach);
  const vertical: number = Math.sqrt(radius * radius - bearing * bearing);
  const panel = (a: ISection, b: ISection, name: string): void => {
    const from: number = Math.max(a.z, barrel.from.z);
    const to: number = Math.min(b.z, barrel.to.z);
    if (!(to > from)) return;
    for (const side of [-1, 1]) {
      const at = (z: number): IAutoMovieVector3[] => {
        const edge: number = a.half + ((b.half - a.half) * (z - a.z)) / (b.z - a.z);
        return [inner, edge].flatMap((x: number): IAutoMovieVector3[] => {
          const under: number = axis + (radius * radius - bearing * x) / vertical;
          return [AutoMovieEngineVector3.create(side * x, under, z), AutoMovieEngineVector3.create(side * x, bottom, z)];
        });
      };
      builder.convex(`saddle-panel-${name}-${side}`, [...at(from), ...at(to)], undefined, skin);
    }
  };
  panel(sittingBack, sittingFront, "pan");
  panel(sittingFront, twist, "waist");

  return { x: twist.half, y: (twist.bottom + twist.top) / 2 };
}

/*
 * The neutral tree's authored dimensions, in model-local metres.
 */
export namespace EquineSaddleTree {
  /*
   * Installing the tree from the horse's measured back and saddle envelope.
   */
  export interface IProps {
    /*
     * Seat size midpoint along the back.
     */
    centre: number;
    /*
     * The existing seat datum, above the model floor.
     */
    top: number;
    /*
     * Nominal nail-to-cantle seat size.
     */
    length: number;
    /*
     * Longitudinal position of the stirrup bar, below the narrow twist.
     */
    bar: number;
    /*
     * Existing outer grip position of a trick saddle, when fitted.
     */
    trickGripHalf: number | undefined;
    /*
     * Actual rendered barrel.
     */
    barrel: QuadrupedAttachments.ICapsule;
    /*
     * Saddle mass as a percent of the horse's nominal mass.
     */
    share: number;
  }

  /*
   * The width edge and mid-thickness elevation at the bar's own station.
   */
  export interface IBar {
    /*
     * Absolute lateral coordinate of the tree edge.
     */
    x: number;
    /*
     * Vertical coordinate of the mounting bar.
     */
    y: number;
  }
}

/*
 * Broad and waist widths shared by the French maker's jumping/dressage trees.
 */
const TREE: Readonly<{ broad: number; twist: number }> = {
  broad: 0.26,
  twist: 0.125,
};

/*
 * Factory jumping saddle's panel gap (Stübben), in metres.
 */
const CHANNEL: number = 0.05;

/*
 * The original saddle shell and its two grip bounds, in metres.
 */
const STOCK: Readonly<{ deck: number; gripRadius: number; gripHalf: number; gripRise: number }> = {
  deck: 0.04,
  gripRadius: 0.015,
  gripHalf: 0.06,
  gripRise: 0.03,
};

/*
 * A transverse tree section, at its own longitudinal plane.
 */
interface ISection {
  /*
   * Longitudinal station in model metres.
   */
  z: number;
  /*
   * Half the section's transverse width, metres.
   */
  half: number;
  /*
   * Section bounds from the model floor, metres.
   */
  bottom: number;
  top: number;
}
