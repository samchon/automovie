import { buildAutoMovieWall } from "@automovie/engine";
import { Assembly } from "../Assembly";
import { datum } from "../datum";
import { stairHole } from "../stairHole";
import { v } from "../v";

/** A horizontal holed panel uses the same public wall kernel in a rotated frame. */
export function ceiling(a: Assembly, level: 0 | 1): void {
  const y = datum.ceilings[level];
  const mesh = buildAutoMovieWall({
    width: 2 * datum.innerX,
    height: 2 * datum.innerZ,
    depth: 0.008,
    openings: level === 0
      ? [
        {
          id: "stair-hole",
          x: stairHole[0] + datum.innerX,
          y: stairHole[2] + datum.innerZ,
          width: stairHole[1] - stairHole[0],
          height: stairHole[3] - stairHole[2],
        },
      ]
      : [],
  });
  a.place(
    "ceiling-" + level,
    "ceiling",
    level === 0 ? "ground-storey" : "upper-storey",
    a.model("ceiling-mesh-" + level, "plaster", { type: "mesh", mesh }),
    v(0, y + 0.004, 0),
    v(1, 1, 1),
    { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }
  );
}
