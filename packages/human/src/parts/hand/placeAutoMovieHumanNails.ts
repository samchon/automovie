import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/** Nail plate thickness above the skin and sunk below it, millimetres; conventional, about the 0.5 mm of an adult plate. */
const PLATE: { above: number; below: number } = { above: 0.5, below: 0.5 };

/** How far the proximal nail fold's corners lie distal to its middle, as a share of the visible nail length; conventional, the lunula-shaped cuticle arc. */
const FOLD: number = 0.18;

/** Vertices along and across a nail plate's top and bottom grids. */
const GRID: { along: number; across: number } = { along: 5, across: 5 };

/**
 * Place a nail plate on each digit's back, on the skin the hand's cage produces.
 *
 * Each plate covers the measured nail length back from the fingertip, plus a tenth more tucked under the proximal nail fold, and spans the measured nail width. Its grid points are found by casting rays from the digit's axis across its dorsal side onto the refined skin, so the plate follows the skin's own transverse and longitudinal curvature; the top grid stands just above the skin and the bottom grid just below it, and their borders close the plate as one quad cage.
 *
 * @param props The hand, its skin and its measurements
 * @returns One closed quad cage per digit, thumb first, in the hand frame: vertices and quads
 */
export function placeAutoMovieHumanNails(props: {
  /** The hand. */
  hand: readAutoMovieHumanHand.IHand;

  /** Hand breadth, millimetres. */
  breadth: number;

  /** The refined skin's triangles, as packed positions and vertex index triples, hand frame. */
  skin: { positions: number[]; triangles: number[] };
}): Array<{
  positions: IAutoMovieVector3[];
  quads: Array<[number, number, number, number]>;
}> {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const F: typeof AUTOMOVIE_HUMAN_HAND_FORM = AUTOMOVIE_HUMAN_HAND_FORM;
  const hand: readAutoMovieHumanHand.IHand = props.hand;
  const digits: Array<{
    points: IAutoMovieVector3[];
    dorsal: IAutoMovieVector3;
    across: IAutoMovieVector3;
    width: number;
    length: number;
  }> = [
    {
      points: hand.thumb.points,
      dorsal: V.of(-hand.thumb.pad.x, -hand.thumb.pad.y, -hand.thumb.pad.z),
      across: hand.thumb.web,
      width: F.thumb.nail * F.thumb.ip * props.breadth,
      length: F.nailLength.Thumb,
    },
    ...(["Index", "Middle", "Ring", "Little"] as const).map(
      (f: readAutoMovieHumanHand.IFinger) => ({
        points: hand.fingers[f].points,
        dorsal: V.of(0, -1, 0),
        across: V.of(0, 0, -1),
        width: F.fingers[f].nail * F.fingers[f].dip * props.breadth,
        length: F.nailLength[f],
      }),
    ),
  ];
  return digits.map((digit) => {
    const dip: IAutoMovieVector3 = digit.points[2]!;
    const tip: IAutoMovieVector3 = digit.points[3]!;
    const segment: number = V.distance(dip, tip);
    const axis: IAutoMovieVector3 = V.normalize(V.offset(tip, [dip, -1]));
    const dorsal: IAutoMovieVector3 = V.normalize(
      V.offset(digit.dorsal, [axis, -V.dot(digit.dorsal, axis)]),
    );
    const across: IAutoMovieVector3 = V.normalize(
      V.offset(
        digit.across,
        [axis, -V.dot(digit.across, axis)],
        [dorsal, -V.dot(digit.across, dorsal)],
      ),
    );
    // the dorsal skin's radius at the nail's middle sets the angle the width spans
    const middle: IAutoMovieVector3 = V.offset(tip, [
      axis,
      -0.5 * digit.length * segment,
    ]);
    const radius: number = cast(props.skin, middle, dorsal) ?? digit.width;
    const half: number = Math.min(1.2, digit.width / 2 / radius);
    const top: IAutoMovieVector3[] = [];
    const bottom: IAutoMovieVector3[] = [];
    for (let i: number = 0; i < GRID.along; ++i) {
      const s: number =
        segment * (1 - 1.1 * digit.length) +
        (segment * 1.1 * digit.length - 0.04 * segment) *
          (i / (GRID.along - 1));
      for (let j: number = 0; j < GRID.across; ++j) {
        const across01: number = 2 * (j / (GRID.across - 1)) - 1;
        // the proximal nail fold is an arc convex toward the wrist: the plate's root row bows back at its middle and narrows, the next row follows halfway
        const bow: number = i === 0 ? 1 : i === 1 ? 0.5 : 0;
        const origin: IAutoMovieVector3 = V.offset(dip, [
          axis,
          s + bow * FOLD * digit.length * segment * across01 * across01,
        ]);
        const angle: number = half * (1 - 0.2 * bow) * across01;
        const ray: IAutoMovieVector3 = V.offset(
          V.of(0, 0, 0),
          [dorsal, Math.cos(angle)],
          [across, Math.sin(angle)],
        );
        const hit: number = cast(props.skin, origin, ray) ?? radius;
        top.push(V.offset(origin, [ray, hit + PLATE.above]));
        bottom.push(V.offset(origin, [ray, hit - PLATE.below]));
      }
    }
    const positions: IAutoMovieVector3[] = [...top, ...bottom];
    const at = (layer: number, i: number, j: number): number =>
      layer * GRID.along * GRID.across + i * GRID.across + j;
    const quads: Array<[number, number, number, number]> = [];
    for (let i: number = 0; i + 1 < GRID.along; ++i)
      for (let j: number = 0; j + 1 < GRID.across; ++j) {
        quads.push([
          at(0, i, j),
          at(0, i, j + 1),
          at(0, i + 1, j + 1),
          at(0, i + 1, j),
        ]);
        quads.push([
          at(1, i, j),
          at(1, i + 1, j),
          at(1, i + 1, j + 1),
          at(1, i, j + 1),
        ]);
      }
    // the rim: walk the top grid's border and bridge it to the bottom's
    const rim: Array<[number, number]> = [];
    for (let j: number = 0; j + 1 < GRID.across; ++j) rim.push([0, j]);
    for (let i: number = 0; i + 1 < GRID.along; ++i)
      rim.push([i, GRID.across - 1]);
    for (let j: number = GRID.across - 1; j > 0; --j)
      rim.push([GRID.along - 1, j]);
    for (let i: number = GRID.along - 1; i > 0; --i) rim.push([i, 0]);
    rim.forEach(([i, j]: [number, number], k: number): void => {
      const [p, q] = rim[(k + 1) % rim.length]!;
      quads.push([at(0, p, q), at(0, i, j), at(1, i, j), at(1, p, q)]);
    });
    // wind every quad so its normal leaves the plate: the top's faces away from the digit's axis
    const n: IAutoMovieVector3 = V.cross(
      V.offset(positions[quads[0]![1]]!, [positions[quads[0]![0]]!, -1]),
      V.offset(positions[quads[0]![3]]!, [positions[quads[0]![0]]!, -1]),
    );
    const outward: boolean =
      V.dot(n, V.offset(positions[quads[0]![0]]!, [dip, -1])) > 0;
    return {
      positions,
      quads: outward
        ? quads
        : quads.map(
            ([a, b, c, d]: [number, number, number, number]): [
              number,
              number,
              number,
              number,
            ] => [a, d, c, b],
          ),
    };
  });
}

/**
 * Distance along a ray from an origin to the farthest skin triangle it crosses, or null when it crosses none.
 *
 * The farthest crossing is the outer skin even where the ray first passes through a neighbouring digit's flank.
 */
function cast(
  skin: { positions: number[]; triangles: number[] },
  origin: IAutoMovieVector3,
  ray: IAutoMovieVector3,
): number | null {
  const p: number[] = skin.positions;
  let best: number | null = null;
  for (let t: number = 0; t < skin.triangles.length; t += 3) {
    const a: number = 3 * skin.triangles[t]!;
    const b: number = 3 * skin.triangles[t + 1]!;
    const c: number = 3 * skin.triangles[t + 2]!;
    const e1: [number, number, number] = [
      p[b]! - p[a]!,
      p[b + 1]! - p[a + 1]!,
      p[b + 2]! - p[a + 2]!,
    ];
    const e2: [number, number, number] = [
      p[c]! - p[a]!,
      p[c + 1]! - p[a + 1]!,
      p[c + 2]! - p[a + 2]!,
    ];
    const h: [number, number, number] = [
      ray.y * e2[2] - ray.z * e2[1],
      ray.z * e2[0] - ray.x * e2[2],
      ray.x * e2[1] - ray.y * e2[0],
    ];
    const det: number = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
    if (Math.abs(det) < 1e-12) continue;
    const s: [number, number, number] = [
      origin.x - p[a]!,
      origin.y - p[a + 1]!,
      origin.z - p[a + 2]!,
    ];
    const u: number = (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]) / det;
    if (u < 0 || u > 1) continue;
    const q: [number, number, number] = [
      s[1] * e1[2] - s[2] * e1[1],
      s[2] * e1[0] - s[0] * e1[2],
      s[0] * e1[1] - s[1] * e1[0],
    ];
    const v: number = (ray.x * q[0] + ray.y * q[1] + ray.z * q[2]) / det;
    if (v < 0 || u + v > 1) continue;
    const d: number = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
    if (d > 0 && d < 40 && (best === null || d > best)) best = d;
  }
  return best;
}
