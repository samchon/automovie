import { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanCardBuilder } from "./AutoMovieHumanCardBuilder";
import { AutoMovieHumanHairRibbon } from "./AutoMovieHumanHairRibbon";
import { ownAutoMovieHumanEyeHair } from "./ownAutoMovieHumanEyeHair";
import { paintAutoMovieHumanHairStrands } from "./paintAutoMovieHumanHairStrands";

/**
 * Grow lash clusters from the actual head owner's anterior lid margins.
 *
 * The current head's independent fissure dimensions and shared orbital course
 * own every root and across direction. A bounded projection onto the emitted
 * skin rejects remote or rear sheets rather than substituting an eye-centre
 * scaled opening. Upper lashes curl upward and lower lashes downward (Gray,
 * Anatomy, 1918); the two upper rows and one lower row are economical individual
 * cards, not a measured follicle census. Width is a conventional fraction
 * of the actual course spacing. No moving-lid/contact support is claimed.
 */
export function growAutoMovieHumanLashes(props: {
  owners: Record<"left" | "right", ownAutoMovieHumanEyeHair.IOwner>;
  length: number;
  builder?: AutoMovieHumanCardBuilder;
}): IAutoMovieMesh | null {
  if (props.length <= 0) return null;
  const builder: AutoMovieHumanCardBuilder =
    props.builder ?? new AutoMovieHumanCardBuilder();
  const rows: Array<{
    upper: boolean;
    row: number;
    count: number;
    from: number;
    to: number;
    scale: number;
  }> = [
    { upper: true, row: 0, count: 32, from: 0.075, to: 0.975, scale: 1 },
    { upper: true, row: 1, count: 24, from: 0.125, to: 0.96, scale: 0.85 },
    { upper: false, row: 0, count: 22, from: 0.225, to: 0.975, scale: 0.5 },
  ];
  for (const side of ["left", "right"] as const) {
    const owner: ownAutoMovieHumanEyeHair.IOwner = props.owners[side];
    for (const upper of [true, false])
      builder.curve(
        "feature",
        `lid.anterior.${side}.${upper ? "upper" : "lower"}`,
        Array.from(
          { length: 33 },
          (_: unknown, k: number): V => owner.margin(upper, k / 32),
        ).flat(),
      );
    for (const row of rows)
      for (let i: number = 0; i < row.count; ++i) {
        const seed: number =
          (side === "left" ? 17 : 29) + 31 * row.row + (row.upper ? 0 : 53);
        const variation: number = hash(seed, i, 0) - 0.5;
        const s: number =
          row.from +
          ((i + 0.5 + 0.3 * row.row + 0.8 * variation) / row.count) *
            (row.to - row.from);
        const root: ReturnType<typeof owner.lidRoot> = owner.lidRoot(
          row.upper,
          s,
        );
        if (root === null) continue;
        const along: V = unit(
          sub(
            owner.margin(row.upper, s + 0.0001),
            owner.margin(row.upper, s - 0.0001),
          ),
        );
        const up: number = row.upper ? 1 : -1;
        const length: number =
          props.length *
          row.scale *
          (0.8 + 0.4 * hash(seed, i, 1)) *
          (0.6 + 0.4 * (1 - Math.min(1, Math.abs(2 * s - 1 - 0.15))) ** 1.5);
        const points: V[] = [
          add(root.position, scale(root.normal, 0.05 + 0.08 * row.row)),
        ];
        let direction: V = unit(
          add(
            owner.forward,
            add(
              scale(owner.up, up * 0.35),
              scale(owner.outward, 0.55 * (2 * s - 1) + 0.12 * variation),
            ),
          ),
        );
        for (let j: number = 0; j < 4; ++j) {
          points.push(add(points.at(-1)!, scale(direction, length / 4)));
          direction = unit(
            add(
              direction,
              add(scale(owner.up, up * 0.32), scale(owner.forward, -0.08)),
            ),
          );
        }
        const increment: number = (row.to - row.from) / row.count;
        const spacing: number =
          Math.hypot(
            ...sub(
              owner.margin(row.upper, Math.min(row.to, s + increment)),
              owner.margin(row.upper, Math.max(row.from, s - increment)),
            ),
          ) / 2;
        const tangents: V[] = points.map(
          (_: V, k: number): V =>
            unit(sub(points[Math.min(k + 1, 4)]!, points[Math.max(k - 1, 0)]!)),
        );
        const sides: V[] = tangents.map(
          (t: V): V => unit(sub(along, scale(t, dot(along, t)))),
        );
        const normals: V[] = tangents.map((t: V, k: number): V => {
          const n: V = unit(cross(t, sides[k]!));
          return dot(n, root.normal) < 0 ? scale(n, -1) : n;
        });
        builder.root(root.position, root.normal);
        builder.card(
          AutoMovieHumanHairRibbon.regularize({
            points,
            sides,
            normals,
            widths: points.map(
              (_: V, k: number): number => 0.65 * spacing * (1 - (0.7 * k) / 4),
            ),
            column: paintAutoMovieHumanHairStrands.COLUMNS.lashes,
            v: [0, 1],
          }),
        );
      }
  }
  return builder.build();
}

type V = [number, number, number];
/** Stable styling variation; no measured follicle distribution is claimed. */
function hash(seed: number, i: number, channel: number): number {
  let value: number =
    Math.imul(seed + 1, 0x27d4eb2d) ^
    Math.imul(i + 1, 0x165667b1) ^
    Math.imul(channel + 1, 0x9e3779b9);
  value = Math.imul(value ^ (value >>> 15), 0x85ebca6b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}
function add(a: readonly number[], b: readonly number[]): V {
  return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
}
function sub(a: readonly number[], b: readonly number[]): V {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}
function scale(a: readonly number[], n: number): V {
  return [a[0]! * n, a[1]! * n, a[2]! * n];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
function cross(a: readonly number[], b: readonly number[]): V {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}
function unit(a: readonly number[]): V {
  const length: number = Math.hypot(...a);
  if (length < 1e-10) throw new Error("Lash has no owned tangent");
  return scale(a, 1 / length);
}
