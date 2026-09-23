import { cutWall } from "../walls";
import { datum } from "../plan";
import { slabTop } from "../storeys/floors";
import { Assembly, v } from "../assembly";
/** One switchback, two flights and their shared landing. Step dimensions belong
 * to these solids; connector.steps is omitted because its run is the entire
 * polyline (including the landing), not the nominal tread going. */
export function stair(a: Assembly): void {
  for (const { frame } of a.wallRecords.filter((r) => r.frame.spaces.includes("upper-storey") && r.frame.spaces.length === 2)) {
    const coordinate = frame.along === "x" ? -3.5 : 0.14;
    // The hole face is lined from the slab top, below the storey floor finish,
    // and over the 6 mm room-lining zone to the front facade body: the stair
    // void has no room lining of its own.
    const front = frame.along === "z" && frame.a <= -datum.innerZ + 1e-6 ? { a: -(datum.innerZ + 0.006) } : {};
    cutWall(a, { ...frame, ...front, floor: slabTop(1) }, [], "plaster", frame.id + "-stair-lining", Math.sign(coordinate - frame.plane) * (frame.depth / 2 - 0.003), 0.006, false);
  }
  const rise = 3.2 / 18, going = 0.28, ids: string[] = [];
  const route = [v(0.86, 0, -1.65)];
  for (let flight = 0; flight < 2; flight++) {
    const x = flight === 0 ? 0.86 : -0.58, direction = flight === 0 ? -1 : 1;
    const zStart = flight === 0 ? -1.8 : -4.32, yStart = flight * 1.6;
    if (flight === 1) route.push(v(0.86, 1.6, -4.92), v(-0.58, 1.6, -4.92));
    for (let i = 0; i < 9; i++) {
      const z = zStart + direction * (i + 0.5) * going, top = yStart + (i + 1) * rise;
      const id = "stair-" + flight + "-" + i;
      ids.push(a.box(id + "-tread", "entry", "oak", x, top - 0.022, z, 1.2, 0.044, going));
      a.environment.elements.at(-1)!.kind = "stair-tread";
      ids.push(a.box(id + "-riser", "entry", "oak", x, top - rise / 2, z - direction * (going / 2 - 0.01), 1.2, rise, 0.02));
      route.push(v(x, top, z));
      a.environment.surfaces.push({ space: "entry", surface: { id: id + "-walk", kind: "floor", polygon: [v(x - 0.6, 0, z - going / 2), v(x + 0.6, 0, z - going / 2), v(x + 0.6, 0, z + going / 2), v(x - 0.6, 0, z + going / 2)], height: { kind: "constant", value: top } } });
      for (const side of [-1, 1]) {
        const railX = x + side * 0.57;
        ids.push(a.rod(id + "-baluster-" + side, "entry", "metal", v(railX, top, z), v(railX, top + 0.95, z), 0.012));
      }
    }
    for (const side of [-1, 1]) {
      const railX = x + side * 0.57;
      ids.push(a.rod("stair-" + flight + "-handrail-" + side, "entry", "metal", v(railX, yStart + rise + 0.95, zStart + direction * going / 2), v(railX, yStart + 1.6 + 0.95, zStart + direction * 8.5 * going), 0.022));
      ids.push(a.rod("stair-" + flight + "-stringer-" + side, "entry", "steel", v(railX, yStart + rise - 0.12, zStart + direction * going / 2), v(railX, yStart + 1.6 - 0.12, zStart + direction * 8.5 * going), 0.065));
    }
  }
  ids.push(a.box("stair-half-landing", "entry", "oak", 0.14, 1.54, -4.92, 2.64, 0.12, 1.2));
  for (const x of [-1.14, 1.42]) {
    a.rod("landing-side-" + x, "entry", "metal", v(x, 2.55, -5.48), v(x, 2.55, -4.46), 0.022);
    for (let i = 0; i <= 10; i++) a.rod("landing-side-post-" + x + "-" + i, "entry", "metal", v(x, 1.6, -5.48 + i * 0.1), v(x, 2.55, -5.48 + i * 0.1), 0.012);
  }
  a.rod("landing-front-rail", "entry", "metal", v(-1.14, 2.55, -5.48), v(1.42, 2.55, -5.48), 0.022);
  for (let i = 0; i <= 24; i++) a.rod("landing-front-post-" + i, "entry", "metal", v(-1.14 + i * 2.56 / 24, 1.6, -5.48), v(-1.14 + i * 2.56 / 24, 2.55, -5.48), 0.012);
  route.push(v(-0.58, 3.2, -1.65));
  a.environment.connectors.push({ id: "single-stair", kind: "stair", from: "entry", to: "upper-corridor", bidirectional: true, route, width: 1.2, clearHeight: 2.2, elements: ids });
}
