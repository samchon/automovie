import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";

/**
 * Build the connectivity of the head cage, the same for every person.
 *
 * The head is a box of quads wrapped around the skull, the "planes of the head" of figure drawing: a front plane from the cheekbones to the hairline, two side planes, a back plane, a top and a bottom band that runs along the jaw and under the occiput. Its eight corners are the only valence 3 vertices of the closed box and sit where the head has corners of its own: the zygomatic prominences, the frontal eminences at the temples, the parietal eminences and the occiput behind the mastoids. Everywhere else the grid is regular, so the limit surface is C2 across cheeks, forehead and vault, where specular light shows any irregularity (OpenSubdiv documentation, "Modeling Tips": mostly regular faces and few extraordinary vertices).
 *
 * Openings are rectangular holes in that grid, which a regular grid accepts without new irregular vertices:
 *
 * - The neck ring: a 4 by 2 hole in the bottom band, its twelve vertices on the mandible's lower border in front and under the occiput behind (`neckTop`).
 * - Each ear ring: a 2 by 2 hole across the side plane's lower edge around tragion (`ear`).
 * - Each palpebral fissure: a 4 by 2 hole in the front plane, filled by three concentric loops of twelve, the orbital rim, the lid sulcus, the lid margin and its inner edge, following orbicularis oculi. The inner edge stays open for the eyeball.
 * - The oral fissure: a 6 by 2 hole in the bottom band's front, filled by three concentric loops of sixteen, the outer lip border, the vermilion border, the lip crest and its inner edge, following orbicularis oris. The inner edge stays open for the mouth's interior.
 *
 * Each hole's four corners gain one edge from its loops, so the eyes and the mouth carry four valence 5 vertices each, diagonally off their corners, where the brow, the tear trough, the crow's feet and the modiolus already curve sharply. The face's features keep their own regions without changing this topology: the eyes their loops, the mouth its loops, the nose the block between the eyes and the oral loops with a two-by-two pocket for each nostril, and the nasolabial line runs down the column beside each ala to the modiolus.
 *
 * @returns Vertices with their canonical address, quads counterclockwise seen from outside, and the index lists of every ring, loop and anchor
 */
export function buildAutoMovieHumanHeadTopology(): buildAutoMovieHumanHeadTopology.ITopology {
  const vertices: buildAutoMovieHumanHeadTopology.IVertex[] = [];
  const index: Map<string, number> = new Map();
  const lattice = (x: number, y: number, z: number): number => {
    const key: string = `${x},${y},${z}`;
    let found: number | undefined = index.get(key);
    if (found === undefined) {
      found = vertices.length;
      index.set(key, found);
      vertices.push({ lattice: [x, y, z], loop: null, canonical: canonical(x, y, z) });
    }
    return found;
  };
  const holes: Set<string> = new Set();
  const hole = (face: string, a: number[], b: number[]): void => {
    for (const i of a) for (const j of b) holes.add(`${face}:${i}:${j}`);
  };
  const half: number = WIDTH / 2;
  hole("bottom", range(half - 2, half + 2), range(NECK_BACK, NECK_BACK + 2));
  hole("bottom", range(half - 3, half + 3), range(MOUTH_BOTTOM, MOUTH_BOTTOM + 2));
  hole("front", range(half + 1, half + 5), range(EYE_BOTTOM, EYE_BOTTOM + 2));
  hole("front", range(half - 5, half - 1), range(EYE_BOTTOM, EYE_BOTTOM + 2));
  hole("left", [0], range(EAR_BACK, EAR_BACK + 2));
  hole("bottom", [WIDTH - 1], range(EAR_BACK, EAR_BACK + 2));
  hole("right", [0], range(EAR_BACK, EAR_BACK + 2));
  hole("bottom", [0], range(EAR_BACK, EAR_BACK + 2));

  const faces: Array<[number, number, number, number]> = [];
  const quad = (corners: Array<[number, number, number]>): void => {
    faces.push(
      corners.map(([x, y, z]: [number, number, number]): number => lattice(x, y, z)) as [
        number,
        number,
        number,
        number,
      ],
    );
  };
  for (let x: number = 0; x < WIDTH; ++x)
    for (let z: number = 0; z < DEPTH; ++z) {
      if (!holes.has(`bottom:${x}:${z}`))
        quad([[x, 0, z], [x + 1, 0, z], [x + 1, 0, z + 1], [x, 0, z + 1]]);
      quad([[x, HEIGHT, z], [x, HEIGHT, z + 1], [x + 1, HEIGHT, z + 1], [x + 1, HEIGHT, z]]);
    }
  for (let x: number = 0; x < WIDTH; ++x)
    for (let y: number = 0; y < HEIGHT; ++y) {
      if (!holes.has(`front:${x}:${y}`))
        quad([[x, y, DEPTH], [x + 1, y, DEPTH], [x + 1, y + 1, DEPTH], [x, y + 1, DEPTH]]);
      quad([[x, y, 0], [x, y + 1, 0], [x + 1, y + 1, 0], [x + 1, y, 0]]);
    }
  for (let y: number = 0; y < HEIGHT; ++y)
    for (let z: number = 0; z < DEPTH; ++z) {
      if (!holes.has(`left:${y}:${z}`))
        quad([[WIDTH, y, z], [WIDTH, y + 1, z], [WIDTH, y + 1, z + 1], [WIDTH, y, z + 1]]);
      if (!holes.has(`right:${y}:${z}`))
        quad([[0, y, z], [0, y, z + 1], [0, y + 1, z + 1], [0, y + 1, z]]);
    }

  // boundary edges, each directed as its face runs it
  const edges: Map<string, [number, number]> = new Map();
  for (const f of faces)
    for (let k: number = 0; k < 4; ++k) {
      const a: number = f[k]!;
      const b: number = f[(k + 1) % 4]!;
      const reverse: string = `${b}>${a}`;
      if (edges.has(reverse)) edges.delete(reverse);
      else edges.set(`${a}>${b}`, [a, b]);
    }
  const next: Map<number, number> = new Map();
  for (const [a, b] of edges.values()) next.set(a, b);
  const loopFrom = (start: number): number[] => {
    const loop: number[] = [start];
    for (let v: number = next.get(start)!; v !== start; v = next.get(v)!) loop.push(v);
    return loop;
  };

  // concentric loops filling a hole, outer loop first, each running as the faces outside it do
  const fill = (
    feature: "leftEye" | "rightEye" | "mouth",
    start: [number, number, number],
    centre: IAutoMovieVector3,
  ): number[][] => {
    const outer: number[] = loopFrom(lattice(...start));
    const loops: number[][] = [outer];
    for (let l: number = 1; l < LOOPS; ++l) {
      const previous: number[] = loops[l - 1]!;
      const loop: number[] = previous.map((_: number, i: number): number => {
        const from: IAutoMovieVector3 = vertices[outer[i]!]!.canonical;
        vertices.push({
          lattice: null,
          loop: { feature, loop: l, outer: outer[i]! },
          canonical: AutoMovieHumanVector.normalize(
            AutoMovieHumanVector.offset(
              AutoMovieHumanVector.of(0, 0, 0),
              [from, 1 - l / (LOOPS + 1)],
              [centre, l / (LOOPS + 1)],
            ),
          ),
        });
        return vertices.length - 1;
      });
      previous.forEach((a: number, i: number): void => {
        const j: number = (i + 1) % previous.length;
        faces.push([previous[j]!, a, loop[i]!, loop[j]!]);
      });
      loops.push(loop);
    }
    return loops;
  };
  const eyeY: number = EYE_BOTTOM + 1;
  const loops: Record<"leftEye" | "rightEye" | "mouth", number[][]> = {
    leftEye: fill("leftEye", [half + 1, eyeY, DEPTH], canonical(half + 3, eyeY, DEPTH)),
    rightEye: fill("rightEye", [half - 1, eyeY, DEPTH], canonical(half - 3, eyeY, DEPTH)),
    mouth: fill("mouth", [half, 0, MOUTH_BOTTOM + 2], canonical(half, 0, MOUTH_BOTTOM + 1)),
  };

  const at = (x: number, y: number, z: number): number => index.get(`${x},${y},${z}`)!;
  // each rim vertex's place around its hole, the hole a unit square
  const offset = (vertex: number, feature: "leftEye" | "rightEye" | "mouth"): [number, number] => {
    const [x, y, z] = vertices[vertex]!.lattice!;
    if (feature === "mouth") return [(x - half) / 3, z - (MOUTH_BOTTOM + 1)];
    const sign: number = feature === "leftEye" ? 1 : -1;
    return [(sign * (x - (half + 3 * sign))) / 2, y - eyeY];
  };
  // build order counterclockwise about the head's long axis from the anterior midline
  const neck: number[] = [
    ...range(half, half + 2).map((x: number): number => at(x, 0, NECK_BACK + 2)),
    at(half + 2, 0, NECK_BACK + 2),
    at(half + 2, 0, NECK_BACK + 1),
    ...range(half + 2, half - 3, -1).map((x: number): number => at(x, 0, NECK_BACK)),
    at(half - 2, 0, NECK_BACK + 1),
    ...range(half - 2, half).map((x: number): number => at(x, 0, NECK_BACK + 2)),
  ];
  const ear = (inner: number, wall: number): Array<[number, number, number]> => {
    const ring: Array<[number, number, number]> = [];
    for (let dz: number = -1; dz <= 1; ++dz) {
      const z: number = EAR_BACK + 1 + dz;
      ring.push([at(wall, 1, z), 1, dz]);
      if (dz !== 0) ring.push([at(wall, 0, z), 0, dz]);
      ring.push([at(inner, 0, z), -1, dz]);
    }
    return ring;
  };
  return {
    vertices,
    faces,
    neck,
    ears: {
      left: ear(WIDTH - 1, WIDTH).map(([v, up, forward]) => ({ vertex: v, up, forward })),
      right: ear(1, 0).map(([v, up, forward]) => ({ vertex: v, up, forward })),
    },
    loops,
    rims: {
      leftEye: loops.leftEye[0]!.map((v: number) => offset(v, "leftEye")),
      rightEye: loops.rightEye[0]!.map((v: number) => offset(v, "rightEye")),
      mouth: loops.mouth[0]!.map((v: number) => offset(v, "mouth")),
    },
    corners: {
      cheek: [at(WIDTH, 0, DEPTH), at(0, 0, DEPTH)],
      occiput: [at(WIDTH, 0, 0), at(0, 0, 0)],
      temple: [at(WIDTH, HEIGHT, DEPTH), at(0, HEIGHT, DEPTH)],
      parietal: [at(WIDTH, HEIGHT, 0), at(0, HEIGHT, 0)],
    },
    nostrils: [at(half + 2, 0, MOUTH_BOTTOM + 3), at(half - 2, 0, MOUTH_BOTTOM + 3)],
  };
}
export namespace buildAutoMovieHumanHeadTopology {
  /**
   * One cage vertex's address: where it sits in the box lattice or in a feature's loops, and its direction on the canonical sphere the chart is read from.
   *
   * @author Samchon
   */
  export interface IVertex {
    /** Lattice coordinates on the box, or null for a loop vertex. */
    lattice: [number, number, number] | null;

    /** The loop vertex's feature, loop number from the hole outward and its vertex on the hole's rim, or null for a lattice vertex. */
    loop: { feature: "leftEye" | "rightEye" | "mouth"; loop: number; outer: number } | null;

    /** Unit direction of the vertex on the canonical sphere, identical for every person. */
    canonical: IAutoMovieVector3;
  }

  /**
   * The head cage's connectivity.
   *
   * @author Samchon
   */
  export interface ITopology {
    vertices: IVertex[];
    faces: Array<[number, number, number, number]>;

    /** The neck ring's twelve vertices in build order: counterclockwise about the head's axis seen from above, from the anterior midline. */
    neck: number[];

    /** Each ear ring's eight vertices with their place around tragion, one step up or forward per unit. */
    ears: Record<"left" | "right", Array<{ vertex: number; up: number; forward: number }>>;

    /** Each feature's loops, the rim of the hole first; loop vertex `i` descends from rim vertex `i`. */
    loops: Record<"leftEye" | "rightEye" | "mouth", number[][]>;

    /**
     * Where each rim vertex lies around its hole, aligned with the rim loop: for an eye, laterally away from the midline and upward; for the mouth, toward the person's left and upward; each from -1 to 1 across the hole.
     */
    rims: Record<"leftEye" | "rightEye" | "mouth", Array<[number, number]>>;

    /** The box corners, left first in each pair. */
    corners: Record<"cheek" | "occiput" | "temple" | "parietal", [number, number]>;

    /** Centre of each nostril's pocket, left first. */
    nostrils: [number, number];
  }
}

/** Box lattice size across, in cells. */
const WIDTH: number = 14;
/** Box lattice height of the front, side and back planes, in cells. */
const HEIGHT: number = 6;
/** Box lattice depth from back to front, in cells. */
const DEPTH: number = 10;
/** Bottom-band row where the neck hole starts, counted from the back. */
const NECK_BACK: number = 2;
/** Bottom-band row where the oral hole starts. */
const MOUTH_BOTTOM: number = 6;
/** Front-plane row where each eye hole starts. */
const EYE_BOTTOM: number = 1;
/** Side-plane column where each ear hole starts, counted from the back. */
const EAR_BACK: number = 3;
/** Loops in each feature hole, the rim included. */
const LOOPS: number = 4;

const range = (from: number, to: number, step: number = 1): number[] => {
  const out: number[] = [];
  for (let i: number = from; step > 0 ? i < to : i > to; i += step) out.push(i);
  return out;
};

/** Unit direction of a lattice point from the box centre, the box scaled to a cube. */
const canonical = (x: number, y: number, z: number): IAutoMovieVector3 =>
  AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.of((2 * x) / WIDTH - 1, (2 * y) / HEIGHT - 1, (2 * z) / DEPTH - 1),
  );
