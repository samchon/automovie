import { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanCardBuilder } from "./AutoMovieHumanCardBuilder";
import { AutoMovieHumanHairRibbon } from "./AutoMovieHumanHairRibbon";
import { ownAutoMovieHumanEyeHair } from "./ownAutoMovieHumanEyeHair";
import { paintAutoMovieHumanHairStrands } from "./paintAutoMovieHumanHairStrands";

/**
 * Grow fine brow cards inside a conventional envelope anchored to the head's owned canthi.
 *
 * The existing atlas's single-strand column is reused at a conventional display
 * width, not a measured follicle diameter. Inner directions blend smoothly into
 * the crossing body, following the arrangement described by Gray (1918) and
 * Rajput (2021). Roots, lifted middle points and tips are checked against the
 * same visible envelope. This does not certify every finite-width card edge or
 * an anatomical eyebrow boundary. The optional builder records the very cards
 * used by the surface for construction inspection.
 */
export function growAutoMovieHumanBrows(props: {
  owners: Record<"left" | "right", ownAutoMovieHumanEyeHair.IOwner>;
  builder?: AutoMovieHumanCardBuilder;
}): IAutoMovieMesh {
  const builder: AutoMovieHumanCardBuilder =
    props.builder ?? new AutoMovieHumanCardBuilder();
  for (const side of ["left", "right"] as const) {
    const owner: ownAutoMovieHumanEyeHair.IOwner = props.owners[side];
    // A bounded 8 by 64 population uses finer atlas strands, not wider strokes.
    const rows: number = 8;
    const cols: number = 64;
    const size: number = owner.length / 30;
    for (let i: number = 0; i < rows; ++i)
      for (let j: number = 0; j < cols; ++j) {
        const u: number = (j + hash(side, i, j, 0)) / cols;
        const w: number = (i + hash(side, i, j, 1)) / rows;
        if (hash(side, i, j, 2) > (1 - 0.55 * u) * (1 - 0.6 * (2 * w - 1) ** 2))
          continue;
        const root: ReturnType<typeof owner.browRoot> = owner.browRoot(u, w);
        if (root === null) continue;
        const blend: number = smooth(0.04, 0.2, u);
        const angle: number =
          ((60 * (1 - blend) -
            18 * (2 * w - 1) * blend +
            18 * (hash(side, i, j, 3) - 0.5)) *
            Math.PI) /
          180;
        const planar: V = unit(
          add(
            scale(owner.outward, Math.cos(angle)),
            scale(owner.up, Math.sin(angle)),
          ),
        );
        const tangent: V = unit(
          sub(planar, scale(root.normal, dot(planar, root.normal))),
        );
        let length: number = size * (2 + 1.8 * hash(side, i, j, 4));
        const points: (extent: number) => V[] = (extent: number): V[] => [
          add(root.position, scale(root.normal, 0.1)),
          add(
            add(root.position, scale(tangent, extent / 2)),
            scale(root.normal, 0.18),
          ),
          add(
            add(root.position, scale(tangent, extent)),
            scale(root.normal, 0.1),
          ),
        ];
        const inside: (extent: number) => boolean = (extent: number): boolean =>
          points(extent).every(owner.inBrow);
        if (!inside(0)) continue;
        if (!inside(length)) {
          let lo: number = 0;
          let hi: number = length;
          for (let q: number = 0; q < 16; ++q) {
            const mid: number = (lo + hi) / 2;
            if (inside(mid)) lo = mid;
            else hi = mid;
          }
          length = lo;
        }
        if (length < 0.35 * size) continue;
        const guide: V[] = points(length);
        const frame: ReturnType<typeof AutoMovieHumanHairRibbon.frame> =
          AutoMovieHumanHairRibbon.frame(guide, root.normal);
        builder.root(root.position, root.normal);
        builder.card(
          AutoMovieHumanHairRibbon.regularize({
            points: guide,
            ...frame,
            widths: [0.18, 0.14, 0.04].map(
              (width: number): number => width * size,
            ),
            column: paintAutoMovieHumanHairStrands.COLUMNS.single,
            v: [0, 1],
          }),
        );
      }
  }
  return builder.build();
}

type V = [number, number, number];
function hash(side: "left" | "right", i: number, j: number, k: number): number {
  let h: number =
    Math.imul(side === "left" ? 11 : 13, 0x27d4eb2d) ^
    Math.imul(i + 1, 0x165667b1) ^
    Math.imul(j + 1, 0x9e3779b9) ^
    Math.imul(k + 5, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(a: number, b: number, x: number): number {
  const t: number = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function add(a: readonly number[], b: readonly number[]): V {
  return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
}
function sub(a: readonly number[], b: readonly number[]): V {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}
function scale(a: readonly number[], s: number): V {
  return [a[0]! * s, a[1]! * s, a[2]! * s];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
function unit(a: readonly number[]): V {
  const length: number = Math.hypot(...a);
  if (length < 1e-10) throw new Error("Brow hair has no tangent");
  return scale(a, 1 / length);
}
