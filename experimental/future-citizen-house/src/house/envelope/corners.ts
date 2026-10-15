import { extrudeAutoMovieProfile } from "@automovie/engine";
import { Assembly } from "../Assembly";
import { datum } from "../datum";
import { rectangle } from "../rectangle";
import { v } from "../v";

/** A diagonal closes the corner without two facade owners occupying the same solid. */
export function corners(
  a: Assembly,
  name: string,
  face: "front" | "rear" | "left" | "right"
): void {
  const signs = face === "front" || face === "rear"
    ? [-1, 1].map((x) => [x, face === "front" ? -1 : 1])
    : [-1, 1].map((z) => [face === "left" ? 1 : -1, z]);
  for (const [sx, sz] of signs) {
    const ix = sx * datum.innerX, iz = sz * datum.innerZ;
    const ox = sx < 0 ? datum.minX : datum.maxX, oz = sz < 0 ? datum.minZ : datum.maxZ;
    const inner = { x: ix, y: iz }, outer = { x: ox, y: oz };
    const edge = face === "front" || face === "rear" ? { x: ix, y: oz } : { x: ox, y: iz };
    const profile = [inner, edge, outer];
    const height = datum.ceilings[1] - datum.floors[0];
    const mesh = extrudeAutoMovieProfile({ profile, depth: height });
    const element = a.place(
      name + "-corner-" + sx + "-" + sz,
      "corner",
      "house",
      a.model(name + "-corner-mesh-" + sx + "-" + sz, "stone", {
        type: "mesh",
        mesh,
      }),
      v(0, (datum.floors[0] + datum.ceilings[1]) / 2, 0),
      v(1, 1, 1),
      { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }
    );
    const boundary = a.environment.boundaries.find(
      (b) => b.id === name + "-face"
    )!;
    boundary.elements.push(element);
    if (boundary.face) {
      const low = face === "front" || face === "rear" ? datum.minX : datum.minZ;
      const high = face === "front" || face === "rear" ? datum.maxX : datum.maxZ;
      boundary.face.outline = rectangle(low, high, -height / 2, height / 2);
    }
  }
}
