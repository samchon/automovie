import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";
import type { AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import type { QuadrupedAttachments } from "../quadruped/QuadrupedAttachments";

/** The existing rectangular tread's depth and thickness, in metres. */
const TREAD = { depth: 0.05, thickness: 0.01 };

/** One coarse round stock section with the thickness of the existing tread. */
const STEEL_RADIUS: number = TREAD.thickness / 2;

/** The existing coarse leather's round radius, metres. */
const LEATHER_RADIUS: number = 0.008;

/** Traditional Fillis overall height and clear eye width, from AJ Tack. */
const FILLIS = {
  height: 4.5 * AutoMovieArchetypeUnits.INCH,
  eye: 1.25 * AutoMovieArchetypeUnits.INCH,
};

/**
 * Lay the physical tread, arch, eye and leather of one conventional stirrup.
 * WO2007052127A1, figures 1 and 2, shows the tread at the bases of the arch and
 * opening 301 for the leather above the foot. AJ Tack's Fillis iron gives the
 * overall height and eye width
 * (ajtack.com/products/aj-tack-stainless-steel-fillis-stirrup-irons). An
 * elliptical arch and round stock approximate the outline and thickness. The
 * arch's side stock fits inside the base's rim outside the full clear tread.
 * The leather's two runs pass outside the barrel and close around the eye's
 * lower rail. The authored drop places the tread, including the iron.
 *
 * @param builder The equid being built, with the saddle tree already laid.
 * @param props The placed tread, the saddle edge and the torso section.
 */
export function EquineStirrup(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  props: EquineStirrup.IProps,
): void {
  const {
    side,
    tread,
    width,
    drop,
    saddle,
    barrel,
    color,
  }: EquineStirrup.IProps = props;
  const prefix: string = `stirrup-${side}`;
  const sign: number = side === "left" ? 1 : -1;
  const radius: number = STEEL_RADIUS;
  const eye: number = FILLIS.eye / 2 + radius;
  const above: number = FILLIS.height - TREAD.thickness - radius;
  const lower: number = above - 2 * (radius + LEATHER_RADIUS);
  const half: number = width / 2 + radius;
  const branchRadius: number = radius / 2;
  const point = (x: number, y: number, z: number = 0): IAutoMovieVector3 =>
    Vector3.create(tread.x + x, tread.y + y, tread.z + z);
  const metal: AutoMovieArchetypeBuilder.IOptions = {
    color: "#b9bcc0",
    share: 0,
  };
  const round: AutoMovieArchetypeBuilder.IOptions & { round: true } = {
    ...metal,
    round: true,
  };

  builder.box(
    prefix,
    Vector3.create(width, TREAD.thickness, TREAD.depth),
    point(0, -TREAD.thickness / 2),
    metal,
  );
  builder.box(
    `${prefix}-base`,
    Vector3.create(2 * half, TREAD.thickness / 2, TREAD.depth),
    point(0, (-3 * TREAD.thickness) / 4),
    metal,
  );

  // Fit each branch's half-stock in the single-radius rim. Moving its axis
  // inward by the radius reduction preserves the opening at the tread.
  const from: number = radius;
  const run: number = half - eye;
  const rise: number = lower - from;
  const segments: number = Math.ceil(
    Math.PI / 2 / (2 * Math.acos(1 - radius / Math.max(run, rise))),
  );
  for (const end of [-1, 1]) {
    const branch = (x: number, y: number): IAutoMovieVector3 =>
      point(end * (x - branchRadius), y);
    let previous: IAutoMovieVector3 = branch(half, from);
    builder.rod(
      `${prefix}-foot-${end}`,
      branchRadius,
      branch(half, -radius),
      previous,
      round,
    );
    for (let index: number = 1; index <= segments; ++index) {
      const angle: number = (index * Math.PI) / (2 * segments);
      const next: IAutoMovieVector3 = branch(
        eye + run * Math.cos(angle),
        from + rise * Math.sin(angle),
      );
      builder.rod(
        `${prefix}-arch-${end}-${index}`,
        branchRadius,
        previous,
        next,
        round,
      );
      previous = next;
    }
    builder.rod(
      `${prefix}-eye-${end}`,
      radius,
      point(end * eye, lower),
      point(end * eye, above),
      round,
    );
  }
  builder.rod(
    `${prefix}-bearing`,
    radius,
    point(-eye, lower),
    point(eye, lower),
    round,
  );
  builder.rod(
    `${prefix}-crown`,
    radius,
    point(-eye, above),
    point(eye, above),
    round,
  );

  const wrap: number = radius + LEATHER_RADIUS;
  const axis: number = barrel.from.y;
  const leather: AutoMovieArchetypeBuilder.IOptions & { round: true } = {
    color,
    share: 0,
    round: true,
  };
  const route: readonly ISection[] = outside({
    start: { x: saddle.x, y: saddle.y - axis },
    end: { x: Math.abs(tread.x), y: tread.y + lower - axis },
    radius: barrel.radius + LEATHER_RADIUS,
  });
  const placed = (section: ISection, offset: number): IAutoMovieVector3 =>
    Vector3.create(sign * section.x, axis + section.y, tread.z + offset);
  builder.rod(
    `${prefix}-bar`,
    radius,
    placed(route[0]!, -wrap),
    placed(route[0]!, wrap),
    round,
  );
  for (const end of [-1, 1])
    for (let index: number = 1; index < route.length; ++index)
      builder.rod(
        end === -1 && index === 1
          ? `leather-${side}`
          : `leather-${side}-${end}-${index}`,
        LEATHER_RADIUS,
        placed(route[index - 1]!, end * wrap),
        placed(route[index]!, end * wrap),
        leather,
      );

  // The two hanging runs meet on the underside of the round lower eye rail.
  const under: readonly ISection[] = tangents(wrap, Math.PI, 2 * Math.PI);
  const turn = (section: ISection): IAutoMovieVector3 =>
    point(0, lower + section.y, section.x);
  for (let index: number = 1; index < under.length; ++index)
    builder.rod(
      `leather-${side}-turn-${index}`,
      LEATHER_RADIUS,
      turn(under[index - 1]!),
      turn(under[index]!),
      leather,
    );

  builder.affordance({
    id: `${side}Stirrup`,
    kind: "stirrup",
    materialPart: prefix,
    frame: AutoMovieArchetypeFrame.upright(tread),
    extent: null,
    width,
    depth: TREAD.depth,
    length: drop,
  });
}

/** The stirrup's material inputs, measured in its neutral equid frame. */
export namespace EquineStirrup {
  /** Tread and suspension geometry for one side. */
  export interface IProps {
    /** Named side; the rig's left is model +X. */
    side: "left" | "right";
    /** Centre of the tread's bearing top, model metres. */
    tread: IAutoMovieVector3;
    /** Width across the unobstructed flat tread, metres. */
    width: number;
    /** Authored drop from the saddle top to this tread, metres. */
    drop: number;
    /** Saddle box side's absolute x and its thickness midpoint y. */
    saddle: ISection;
    /** Barrel cross section, in metres, used by the physical trunk capsule. */
    barrel: QuadrupedAttachments.ICapsule;
    /** Saddle leather colour. */
    color: string;
  }
}

/** An exterior strap route from the saddle bar to the lower eye rail. */
function outside(props: {
  start: ISection;
  end: ISection;
  radius: number;
}): readonly ISection[] {
  const { start, end, radius } = props;
  const dx: number = end.x - start.x;
  const dy: number = end.y - start.y;
  const t: number = Math.max(
    0,
    Math.min(1, -(start.x * dx + start.y * dy) / (dx * dx + dy * dy)),
  );
  if (Math.hypot(start.x + t * dx, start.y + t * dy) >= radius)
    return [start, end];
  const first: number =
    Math.atan2(start.y, start.x) -
    Math.acos(radius / Math.hypot(start.x, start.y));
  const last: number =
    Math.atan2(end.y, end.x) + Math.acos(radius / Math.hypot(end.x, end.y));
  // A zero angular interval leaves the one common tangent between the ends.
  if (first <= last) return [start, end];
  return [start, ...tangents(radius, first, last), end];
}

/**
 * Outer tangent polygon for a circular span. Every straight segment stays
 * outside the circle; each corner overhang is at most the leather radius.
 */
function tangents(radius: number, from: number, to: number): ISection[] {
  const segments: number = Math.ceil(
    Math.abs(to - from) / (2 * Math.acos(radius / (radius + LEATHER_RADIUS))),
  );
  const points: ISection[] = [];
  const polar = (distance: number, angle: number): ISection => ({
    x: distance * Math.cos(angle),
    y: distance * Math.sin(angle),
  });
  const step: number = (to - from) / segments;
  const corner: number = radius / Math.cos(step / 2);
  points.push(polar(radius, from));
  for (let index: number = 0; index < segments; ++index)
    points.push(polar(corner, from + (index + 0.5) * step));
  points.push(polar(radius, to));
  return points;
}

/** A point in a section through the equid's barrel, world-aligned metres. */
interface ISection {
  x: number;
  y: number;
}
