import { Assembly, v } from "../assembly";
import { datum } from "../plan";
import { slabTop } from "../storeys/floors";
import { cutWall } from "../walls";

/** One switchback, two flights and their shared landing. Step dimensions belong
 * to these solids; connector.steps is omitted because its run is the entire
 * polyline (including the landing), not the nominal tread going. */
export function stair(a: Assembly): void {
  for (const { frame } of a.wallRecords.filter(
    (r) =>
      r.frame.spaces.includes("upper-storey") && r.frame.spaces.length === 2,
  )) {
    const coordinate = frame.along === "x" ? -3.5 : 0.14;
    // The hole face is lined from the slab top, below the storey floor finish,
    // and over the 6 mm room-lining zone to the front facade body: the stair
    // void has no room lining of its own.
    const front =
      frame.along === "z" && frame.a <= -datum.innerZ + 1e-6
        ? { a: -(datum.innerZ + 0.006) }
        : {};
    cutWall(
      a,
      { ...frame, ...front, floor: slabTop(1) },
      [],
      "plaster",
      frame.id + "-stair-lining",
      Math.sign(coordinate - frame.plane) * (frame.depth / 2 - 0.003),
      0.006,
      false,
    );
  }
  const stepsPerFlight = 9,
    rise = (datum.floors[1] - datum.floors[0]) / (2 * stepsPerFlight);
  const halfRise = stepsPerFlight * rise,
    going = 0.28,
    treadWidth = 1.2;
  const landingDepth = 0.12,
    guardHeight = 0.95,
    stringerRadius = 0.065,
    stringerEndExtension = 0.107;
  const ids: string[] = [];
  const upperFlightX = -0.48;
  const route = [v(0.86, datum.floors[0], -1.65)];
  for (let flight = 0; flight < 2; flight++) {
    const x = flight === 0 ? 0.86 : upperFlightX,
      direction = flight === 0 ? -1 : 1;
    const zStart = flight === 0 ? -1.8 : -4.32,
      yStart = datum.floors[0] + flight * halfRise;
    if (flight === 1)
      route.push(v(0.86, yStart, -4.92), v(upperFlightX, yStart, -4.92));
    for (let i = 0; i < stepsPerFlight; i++) {
      const z = zStart + direction * (i + 0.5) * going,
        top = yStart + (i + 1) * rise;
      const id = "stair-" + flight + "-" + i;
      ids.push(
        a.box(
          id + "-tread",
          "entry",
          "oak",
          x,
          top - 0.022,
          z,
          treadWidth,
          0.044,
          going,
        ),
      );
      a.environment.elements.at(-1)!.kind = "stair-tread";
      ids.push(
        a.box(
          id + "-riser",
          "entry",
          "oak",
          x,
          top - rise / 2,
          z - direction * (going / 2 - 0.01),
          treadWidth,
          rise,
          0.02,
        ),
      );
      route.push(v(x, top, z));
      a.environment.surfaces.push({
        space: "entry",
        surface: {
          id: id + "-walk",
          kind: "floor",
          polygon: [
            v(x - treadWidth / 2, 0, z - going / 2),
            v(x + treadWidth / 2, 0, z - going / 2),
            v(x + treadWidth / 2, 0, z + going / 2),
            v(x - treadWidth / 2, 0, z + going / 2),
          ],
          height: { kind: "constant", value: top },
        },
      });
      for (const side of [-1, 1]) {
        const railX = x + side * (treadWidth / 2 - 0.03);
        ids.push(
          a.rod(
            id + "-baluster-" + side,
            "entry",
            "metal",
            v(railX, top, z),
            v(railX, top + guardHeight, z),
            0.012,
          ),
        );
      }
    }
    for (const side of [-1, 1]) {
      const railX = x + side * (treadWidth / 2 - 0.03);
      // The upper flight is inset so both 0.065m stringers remain outside
      // their treads and inside the authored slab and ceiling opening.
      const stringerX = x + side * (treadWidth / 2 + stringerRadius + 0.015);
      ids.push(
        a.rod(
          "stair-" + flight + "-handrail-" + side,
          "entry",
          "metal",
          v(
            railX,
            yStart + rise + guardHeight,
            zStart + (direction * going) / 2,
          ),
          v(
            railX,
            yStart + halfRise + guardHeight,
            zStart + direction * (stepsPerFlight - 0.5) * going,
          ),
          0.022,
        ),
      );
      // Extend only the two horizontal endpoints toward their supports. The
      // endpoint heights stay 0.12 m below the first and last tread tops;
      // this makes the depth beneath intermediate treads vary along the axis.
      ids.push(
        a.rod(
          "stair-" + flight + "-stringer-" + side,
          "entry",
          "steel",
          v(
            stringerX,
            yStart + rise - 0.12,
            zStart + direction * (going / 2 - stringerEndExtension),
          ),
          v(
            stringerX,
            yStart + halfRise - 0.12,
            zStart + direction * ((stepsPerFlight - 0.5) * going + stringerEndExtension),
          ),
          stringerRadius,
        ),
      );
    }
  }
  ids.push(
    a.box(
      "stair-half-landing",
      "entry",
      "oak",
      0.14,
      datum.floors[0] + halfRise - landingDepth / 2,
      -4.92,
      2.64,
      landingDepth,
      treadWidth,
    ),
  );
  for (const x of [-1.14, 1.42]) {
    a.rod(
      "landing-side-" + x,
      "entry",
      "metal",
      v(x, datum.floors[0] + halfRise + guardHeight, -5.48),
      v(x, datum.floors[0] + halfRise + guardHeight, -4.46),
      0.022,
    );
    // The front rail owns both corner posts at z=-5.48.
    for (let i = 1; i <= 10; i++)
      a.rod(
        "landing-side-post-" + x + "-" + i,
        "entry",
        "metal",
        v(x, datum.floors[0] + halfRise, -5.48 + i * 0.1),
        v(x, datum.floors[0] + halfRise + guardHeight, -5.48 + i * 0.1),
        0.012,
      );
  }
  a.rod(
    "landing-front-rail",
    "entry",
    "metal",
    v(-1.14, datum.floors[0] + halfRise + guardHeight, -5.48),
    v(1.42, datum.floors[0] + halfRise + guardHeight, -5.48),
    0.022,
  );
  for (let i = 0; i <= 24; i++)
    a.rod(
      "landing-front-post-" + i,
      "entry",
      "metal",
      v(-1.14 + (i * 2.56) / 24, datum.floors[0] + halfRise, -5.48),
      v(
        -1.14 + (i * 2.56) / 24,
        datum.floors[0] + halfRise + guardHeight,
        -5.48,
      ),
      0.012,
    );
  route.push(v(upperFlightX, datum.floors[1], -1.65));
  a.environment.connectors.push({
    id: "single-stair",
    kind: "stair",
    from: "entry",
    to: "upper-corridor",
    bidirectional: true,
    route,
    width: treadWidth,
    clearHeight: 2.2,
    elements: ids,
  });
}
