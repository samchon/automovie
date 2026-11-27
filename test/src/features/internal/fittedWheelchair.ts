import { AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeWheelchair } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Build an authored propulsion chair with the seat at 16 inches and the
 * rear axle 4 inches ahead of the back posts, within TiLite Aero Z's seat
 * height and centre-of-gravity adjustments (TiLite Z Order Form, June 2025,
 * p. 2, https://www.spinlife.com/files/tilite-z-us-of_0725.pdf). The wheels, pushrim tubes,
 * articulation pivots and contact frames use the same axle coordinates.
 */
export function fittedWheelchair(
  depth: number,
): ReturnType<typeof AutoMovieArchetypeWheelchair.create> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeWheelchair.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "fittedWheelchair",
      AutoMovieArchetypeWheelchair.UNITS,
      undefined,
    );
  const chair: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeWheelchair.Affordance,
    AutoMovieArchetypeWheelchair.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    name: "fitted wheelchair",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const seat: number = draw.derive("seatHeight", 16 * 0.0254);
  const breadth: number = draw.derive("seatWidth", 0.4);
  const wheel: number = draw.derive("wheelDiameter", 24 * 0.0254) / 2;
  const axle: number = 4 * 0.0254;
  const rimRadius: number = AutoMovieArchetypeWheelchair.RIM / 2;
  const segments: number = 24;
  draw.derive("seatDepth", depth);
  chair.box("seat", v(breadth, 0.03, depth), v(0, seat - 0.015, depth / 2));
  chair.box("back", v(breadth, 0.38, 0.03), v(0, seat + 0.19, 0));
  chair.box("footboard", v(0.28, 0.025, 0.15), v(0, 0.12, depth + 0.13));
  chair.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(v(0, seat, depth)),
    extent: null,
    width: breadth,
    depth,
  });
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const hub: IAutoMovieVector3 = v(sign * 0.27, wheel, axle);
    const rim: IAutoMovieVector3 = v(sign * 0.29, wheel, axle);
    const wheelPart: string = `${side}Wheel`;
    const ringParts: string[] = [];
    chair.rod(
      wheelPart,
      wheel,
      v(hub.x - 0.012, wheel, axle),
      v(hub.x + 0.012, wheel, axle),
      { surface: "rubber" },
    );
    chair.rod(
      `${side}Caster`,
      0.06,
      v(sign * 0.18 - 0.012, 0.06, depth),
      v(sign * 0.18 + 0.012, 0.06, depth),
      { surface: "rubber" },
    );
    chair.rod(
      `${side}Frame`,
      0.015,
      v(sign * 0.18, 0.06, depth),
      v(sign * 0.18, seat, 0),
    );
    /** A vertex of the pushrim's rendered tube centreline, in chair metres. */
    const point = (index: number): IAutoMovieVector3 => {
      const angle: number = (2 * Math.PI * index) / segments;
      return v(
        rim.x,
        rim.y + rimRadius * Math.cos(angle),
        rim.z + rimRadius * Math.sin(angle),
      );
    };
    for (let i: number = 0; i < segments; ++i) {
      const piece: string = `${side}Rim${i}`;
      chair.rod(piece, 0.008, point(i), point(i + 1));
      ringParts.push(piece);
    }
    chair.affordance({
      id: `${side}Spin`,
      kind: "knob",
      frame: AutoMovieArchetypeFrame.facing(hub, v(1, 0, 0), v(0, 1, 0)),
      extent: null,
      travel: 360,
      parts: [wheelPart, ...ringParts],
    });
    chair.affordance({
      id: `${side}Rim`,
      kind: "wheel",
      frame: AutoMovieArchetypeFrame.facing(rim, v(-sign, 0, 0), v(0, 0, 1)),
      extent: null,
      grip: "power",
      radius: rimRadius,
      rides: `${side}Spin`,
    });
  }
  return chair.build(13, { rests: "rubber" });
}
