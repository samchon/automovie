import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";

/**
 * Close the crown: a grid of 14 by 16 quads over the lattice's top row, the loop just under the vertex where the sweep begins.
 *
 * The grid's sides take the top row's 60 points in four runs, 14 over the face's dense columns and the back's, 16 over each side, so the grid is regular and its four corners, the only valence-3 vertices, sit on the crown off the midline where hair covers them. Its inner points are the transfinite interpolation of its sides across the top (Gordon and Hall 1973, Int J Numer Methods Eng 7(4):461-477), raised onto the vault's dome: from the top section to the vertex the dome rises as the vault's frontal outline does near its top, by the share of its radius to the power {@link DOME}.
 *
 * @param props The domain, the network, the lattice's top row in column order and the column lines' `v`
 */
export function capAutoMovieHumanHead(props: {
  domain: AutoMovieHumanHeadDomain;
  network: AutoMovieHumanHeadNetwork;
  top: AutoMovieHumanHeadNetwork.IPoint[];
  lines: number[];
}): void {
  const { domain, network, top } = props;
  const C: number = top.length;
  // the loop runs against v, counterclockwise seen from above, from the face's column FRONT_START
  const ring: AutoMovieHumanHeadNetwork.IPoint[] = Array.from(
    { length: C },
    (_: unknown, m: number) => top[(((START - m) % C) + C) % C]!,
  );
  const A: number = SIDES[0];
  const B: number = SIDES[1];
  const boundary = (
    a: number,
    b: number,
  ): AutoMovieHumanHeadNetwork.IPoint | null =>
    b === 0
      ? ring[a]!
      : a === A
        ? ring[A + b]!
        : b === B
          ? ring[A + B + (A - a)]!
          : a === 0
            ? ring[(2 * A + B + (B - b)) % C]!
            : null;
  const at = (p: AutoMovieHumanHeadNetwork.IPoint): IAutoMovieVector3 =>
    domain.point(p.domain.u, p.domain.v);
  const spine: IAutoMovieVector3 = domain.toHead(
    domain.surface.frame(0).origin,
  );
  const height: number = spine.y;
  const drop: number = domain.profile.top - height;
  const grid: AutoMovieHumanHeadNetwork.IPoint[][] = [];
  for (let a: number = 0; a <= A; ++a) {
    const column: AutoMovieHumanHeadNetwork.IPoint[] = [];
    for (let b: number = 0; b <= B; ++b) {
      const edge: AutoMovieHumanHeadNetwork.IPoint | null = boundary(a, b);
      if (edge !== null) {
        column.push(edge);
        continue;
      }
      const s: number = a / A;
      const t: number = b / B;
      const P = (x: number, y: number): IAutoMovieVector3 =>
        at(boundary(x, y)!);
      const blend: IAutoMovieVector3 = AutoMovieHumanVector.offset(
        AutoMovieHumanVector.of(0, 0, 0),
        [P(a, 0), 1 - t],
        [P(a, B), t],
        [P(0, b), 1 - s],
        [P(A, b), s],
        [P(0, 0), -(1 - s) * (1 - t)],
        [P(A, 0), -s * (1 - t)],
        [P(0, B), -(1 - s) * t],
        [P(A, B), -s * t],
      );
      // its share of the way out to the loop along its own direction from the spine
      const x: number = blend.x - spine.x;
      const z: number = blend.z - spine.z;
      const angle: number = Math.atan2(x, -z);
      const rim: IAutoMovieVector3 = domain.point(0, angle / (2 * Math.PI));
      const share: number =
        Math.hypot(x, z) /
        Math.max(1e-6, Math.hypot(rim.x - spine.x, rim.z - spine.z));
      const position: IAutoMovieVector3 = AutoMovieHumanVector.of(
        blend.x,
        height + drop * (1 - Math.pow(Math.min(1, share), DOME)),
        blend.z,
      );
      column.push(
        network.free(`cap.${a}.${b}`, domain.toModel(position), { u: 0, v: 0 }),
      );
    }
    grid.push(column);
  }
  for (let a: number = 0; a < A; ++a)
    for (let b: number = 0; b < B; ++b)
      network.quad(
        [
          grid[a]![b]!,
          grid[a + 1]![b]!,
          grid[a + 1]![b + 1]!,
          grid[a]![b + 1]!,
        ],
        "cap",
        false,
      );
}

/** Column index the loop starts from: the face's line 25 columns from its left edge. */
const START: number = 12 + 25;

/** The grid's quads across and along. */
const SIDES: [number, number] = [14, 16];

/** Exponent of the dome's rise over the top section, the vault's frontal superellipse exponent near the vertex. Calibrated with the vault's outline. */
const DOME: number = 2.25;
