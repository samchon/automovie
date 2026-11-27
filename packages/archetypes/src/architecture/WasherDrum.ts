import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../core";
import type { AutoMovieArchetypeAppliance } from "./AutoMovieArchetypeAppliance";

/** One cross section of the elastomer opening or the drum, in metres. */
interface ISection {
  /** Vertical center of the section. */
  centre: number;
  /** Outside width and height of the appliance. */
  width: number;
  height: number;
  /** Circumradius and side count of the unobstructed polygon. */
  radius: number;
  sides: number;
  /** Back and front planes of this section. */
  back: number;
  front: number;
  /** Color of the solid material around the opening. */
  color: string;
}

/** Where one angular ray meets the cavity and the outside of the body, metres. */
interface IDrumStation {
  /** The ray's point on the polygonal cavity. */
  interior: IAutoMovieVector3;

  /** The ray's point on the rectangular outside. */
  exterior: IAutoMovieVector3;
}

/** Keep angular stations in one turn. */
const TURN: number = 2 * Math.PI;

/** The maker's drum volume, in cubic metres. */
const DRUM_VOLUME: number = 0.065;

/** The drum polygon's circumradius, metres; a coarse construction estimate. */
const DRUM_RADIUS: number = 0.22;

/** The drum polygon's side count; a coarse construction estimate. */
const DRUM_SIDES: number = 8;

/** The rubber lip's depth, metres; a coarse construction estimate. */
const LIP_DEPTH: number = 0.03;

/** The rubber lip polygon's circumradius, metres, near the 300 mm porthole. */
const LIP_RADIUS: number = 0.15;

/** The rubber lip polygon's side count; a coarse construction estimate. */
const LIP_SIDES: number = 12;

/**
 * A washer's visible and physical loading aperture and drum.
 *
 * The 65 litre drum and 160 degree door are the Bosch WAN28255GB's. Its drawing
 * does not give the porthole diameter. Use the related WAN282X0GB's 300 mm
 * porthole as an estimate. The polygonal drum width and lip depth are proxy
 * construction estimates. A flat bottom chord gives a folded bundle an support.
 * The back remains solid.
 *
 * Sources:
 * https://media3.bosch-home.com/Documents/specsheet/en-GB/WAN28255GB.pdf and
 * https://media3.bosch-home.com/Documents/specsheet/en-GB/WAN282X0GB.pdf.
 *
 * @param builder The empty appliance enclosure.
 * @param width Outside width, metres.
 * @param height Outside height, metres.
 * @param front The body plane behind the closed door, metres from the back.
 * @param centre The door center height, metres.
 */
export function WasherDrum(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeAppliance.Affordance,
    AutoMovieArchetypeAppliance.Dimension
  >,
  width: number,
  height: number,
  front: number,
  centre: number,
): void {
  const v: typeof Vector3.create = Vector3.create;
  const drumFront: number = front - LIP_DEPTH;
  const area: number =
    (DRUM_SIDES * DRUM_RADIUS ** 2 * Math.sin(TURN / DRUM_SIDES)) / 2;
  const drumBack: number = drumFront - DRUM_VOLUME / area;
  const drumBottom: number =
    centre - DRUM_RADIUS * Math.cos(Math.PI / DRUM_SIDES);

  builder.box(
    "body-back",
    v(width, height, drumBack),
    v(0, height / 2, drumBack / 2),
    {
      color: "#e9eae6",
    },
  );
  shell(builder, "drum", {
    centre,
    width,
    height,
    radius: DRUM_RADIUS,
    sides: DRUM_SIDES,
    back: drumBack,
    front: drumFront,
    color: "#b9bcc0",
  });
  shell(builder, "lip", {
    centre,
    width,
    height,
    radius: LIP_RADIUS,
    sides: LIP_SIDES,
    back: drumFront,
    front,
    color: "#e9eae6",
  });

  const span: number = 2 * LIP_RADIUS * Math.cos(Math.PI / LIP_SIDES);
  builder.affordance({
    id: "drumAperture",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, centre, front),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: span,
    height: span,
  });

  // The outside stops pull laundry clear of the side before it aligns with
  // the loading port. The next two stops take it through the port and past
  // the lip before it descends to the drum floor.
  for (const [id, x, y, z] of [
    ["loadApproach", 0.41, centre, front + 0.165],
    ["loadAlign", 0, centre, front + 0.165],
    ["loadOpening", 0, centre, front],
    ["drumEntry", 0, centre, drumFront - 0.16],
    ["drumSeat", 0, drumBottom, drumFront - 0.16],
  ] as const)
    builder.affordance({
      id,
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v(x, y, z)),
      extent: null,
    });
}

/** Extrude one rectangular surround from exactly shared cross-section vertices. */
function shell(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeAppliance.Affordance,
    AutoMovieArchetypeAppliance.Dimension
  >,
  id: string,
  section: ISection,
): void {
  const { centre, width, height, radius, sides, back, front, color }: ISection =
    section;
  const step: number = TURN / sides;
  const apothem: number = radius * Math.cos(step / 2);
  const half: number = width / 2;
  const top: number = height - centre;

  // Include both polygons' corner rays so each pair lies on one edge of
  // each boundary. The resulting quadrilateral cells share their faces.
  const angles: number[] = [
    ...Array.from(
      { length: sides },
      (_: unknown, index: number): number => (index + 0.5) * step,
    ),
    Math.atan2(top, half),
    Math.atan2(top, -half),
    TURN + Math.atan2(-centre, -half),
    TURN + Math.atan2(-centre, half),
  ].sort((a: number, b: number): number => a - b);
  const stations: IDrumStation[] = angles.map((angle: number): IDrumStation => {
    const x: number = Math.cos(angle);
    const y: number = Math.sin(angle);
    const inner: number =
      apothem / Math.cos(angle - Math.round(angle / step) * step);
    const outer: number = Math.min(
      half / Math.abs(x),
      y >= 0 ? top / y : -centre / y,
    );
    return {
      interior: Vector3.create(inner * x, centre + inner * y, 0),
      exterior: Vector3.create(outer * x, centre + outer * y, 0),
    };
  });
  for (const [index, current] of stations.entries()) {
    const next: IDrumStation = stations[(index + 1) % stations.length]!;
    const perimeter: readonly IAutoMovieVector3[] = [
      current.interior,
      current.exterior,
      next.exterior,
      next.interior,
    ];
    const corners: IAutoMovieVector3[] = [back, front].flatMap(
      (z: number): IAutoMovieVector3[] =>
        perimeter.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point, z }),
        ),
    );
    builder.convex(`${id}-${index + 1}`, corners, undefined, { color });
  }
}
