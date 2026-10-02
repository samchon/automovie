/**
 * Independent analytic surfaces for the person seam: an open-ended vertical
 * tube of rings, wound so every normal points away from the axis, with an
 * optional fan closing one end.
 *
 * A ring at height `y` has `segments` vertices at radius `radius`, vertex `k`
 * at angle `2 pi k / segments` measured from +Z towards +X, which is the
 * azimuth convention of `createHumanLoopAzimuth`. Ring `i` starts at vertex
 * `i * segments`. Between two rings each quad `(a, b, c, d)` (`a`, `b` on the
 * lower ring, `c`, `d` above) is the triangles `(a, b, c)` and `(b, d, c)`,
 * whose normal is the tangent crossed with up, which points outward.
 * `close: "bottom"` adds a centre vertex under ring 0 and a fan; `close: "top"`
 * adds one over the last ring. A closed end has no open loop, so a tube closed
 * at one end has exactly one loop, at the other.
 */
export function humanPersonTube(props: {
  rings: number[];
  segments: number;
  radius: number;
  close: "bottom" | "top" | "none";
  /** Reverse every triangle, turning the normals inward. */
  inward?: boolean;
}): { positions: number[]; indices: number[]; rings: number[][] } {
  const { rings, segments, radius } = props;
  const positions: number[] = [];
  const ring: number[][] = [];
  rings.forEach((y) => {
    const ids: number[] = [];
    for (let k = 0; k < segments; k++) {
      const angle = (2 * Math.PI * k) / segments;
      ids.push(positions.length / 3);
      positions.push(radius * Math.sin(angle), y, radius * Math.cos(angle));
    }
    ring.push(ids);
  });
  const indices: number[] = [];
  const triangle = (a: number, b: number, c: number): void => {
    if (props.inward === true) indices.push(a, c, b);
    else indices.push(a, b, c);
  };
  for (let i = 0; i + 1 < rings.length; i++)
    for (let k = 0; k < segments; k++) {
      const next = (k + 1) % segments;
      const [a, b, c, d] = [
        ring[i][k],
        ring[i][next],
        ring[i + 1][k],
        ring[i + 1][next],
      ];
      triangle(a, b, c);
      triangle(b, d, c);
    }
  if (props.close !== "none") {
    const end = props.close === "bottom" ? 0 : rings.length - 1;
    const centre = positions.length / 3;
    positions.push(0, rings[end], 0);
    for (let k = 0; k < segments; k++) {
      const [a, b] = [ring[end][k], ring[end][(k + 1) % segments]];
      // facing down for the bottom cap and up for the top cap
      if (props.close === "bottom") triangle(a, centre, b);
      else triangle(a, b, centre);
    }
  }
  return { positions, indices, rings: ring };
}
