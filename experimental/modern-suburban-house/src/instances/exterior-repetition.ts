/** Course assembly over the reviewed exterior wall and roof owners. */
import type { IAutoMovieMeshTransform } from "@automovie/engine";

import { AsphaltShingle } from "../models/exterior/shingle";
import { Siding } from "../models/exterior/siding";
import { EXTERIOR_PLINTH_TOP } from "../spaces/envelope/finish-boundary";
import type { IHouse } from "../spaces/house";
import {
  clip,
  collect,
  facadeFrame,
  facadeTriangles,
  identity,
  intervalsAt,
  local,
  polygonArea,
  roofFrame,
  roofTriangles,
  trianglePlanes,
  world,
  type Instance,
  type Model,
  type Point,
} from "./exterior-repetition-geometry";

export class ExteriorRepetition {
  /** Cover actual outward wall triangles above the elevation-owned plinth. */
  public buildSiding(house: IHouse): {
    models: Model[];
    instances: Instance[];
  } {
    const baseY = EXTERIOR_PLINTH_TOP;
    const models: Model[] = [],
      instances: Instance[] = [];
    const builder = new Siding();
    const walls = house.parts.filter(
      (part) =>
        part.role === "wall" &&
        part.owner.startsWith("envelope/") &&
        !part.id.includes("-head") &&
        /^(front-|rear-|left-|right-)/.test(part.id),
    );
    for (const part of walls) {
      const frame = facadeFrame(part.id, part.mesh);
      const triangles = facadeTriangles(part.mesh, frame);
      if (triangles.length === 0)
        throw new Error(`facade has no weather triangles: ${part.id}`);
      const coords = [
        ...new Set(triangles.flatMap((triangle) => triangle.map((p) => p[0]))),
      ].sort((a, b) => a - b);
      const maxY = Math.max(
        ...triangles.flatMap((triangle) => triangle.map((p) => p[1])),
      );
      const count = Math.ceil((maxY - baseY) / 0.15);
      for (let k = 0; k < count; k++) {
        const y = baseY + 0.15 * k;
        const members: { built: Model; transform: IAutoMovieMeshTransform }[] =
          [];
        for (let i = 0; i < coords.length - 1; i++) {
          const xa = coords[i]!,
            xb = coords[i + 1]!;
          if (xb - xa < 1e-7) continue;
          const q1 = xa + (xb - xa) / 4,
            q3 = xa + (3 * (xb - xa)) / 4;
          const left = intervalsAt(triangles, q1),
            right = intervalsAt(triangles, q3);
          if (left.length !== right.length)
            throw new Error(
              `facade interval changed inside ${part.id} at ${xa}..${xb}`,
            );
          for (let band = 0; band < left.length; band++) {
            const bottomSlope = (right[band]![0] - left[band]![0]) / (q3 - q1);
            const topSlope = (right[band]![1] - left[band]![1]) / (q3 - q1);
            const bottom = (x: number) =>
              left[band]![0] + bottomSlope * (x - q1);
            const top = (x: number) => left[band]![1] + topSlope * (x - q1);
            const cuts = [xa, xb];
            for (const [value, slope, at] of [
              [bottom(q1), bottomSlope, y + 0.18],
              [top(q1), topSlope, y],
            ] as const) {
              if (Math.abs(slope) > 1e-12) {
                const crossX = q1 + (at - value) / slope;
                if (crossX > xa + 1e-8 && crossX < xb - 1e-8) cuts.push(crossX);
              }
            }
            cuts.sort((a, b) => a - b);
            for (let sub = 0; sub < cuts.length - 1; sub++) {
              const x0 = cuts[sub]!,
                x1 = cuts[sub + 1]!,
                mid = (x0 + x1) / 2;
              if (top(mid) <= y || bottom(mid) >= y + 0.18) continue;
              const low0 = Math.max(0, bottom(x0) - y),
                low1 = Math.max(0, bottom(x1) - y);
              const high0 = Math.min(0.18, top(x0) - y),
                high1 = Math.min(0.18, top(x1) - y);
              // A zero-height endpoint is shifted only by geometric tolerance;
              // the visible roof intersection remains at the authored line.
              const edge = 1e-7;
              const a = high0 <= low0 ? x0 + edge : x0,
                b = high1 <= low1 ? x1 - edge : x1;
              if (b - a < 1e-7) continue;
              const x = (a + b) / 2;
              const built = builder.build({
                id: `${part.id}-${k}-${i}-${band}-${sub}`,
                length: b - a,
                bottomLeft: Math.max(0, bottom(a) - y),
                bottomRight: Math.max(0, bottom(b) - y),
                topLeft: Math.min(0.18, top(a) - y),
                topRight: Math.min(0.18, top(b) - y),
              });
              const placed = world(frame, x, y);
              members.push({
                built,
                transform: {
                  translation: { x: placed[0], y: placed[1], z: placed[2] },
                  rotation: frame.rotation,
                },
              });
            }
          }
        }
        if (members.length === 0) continue;
        const id = `${part.owner}-siding-${k}-${part.id}`;
        const built = collect(id, members);
        models.push(built);
        instances.push({ id, modelId: built.model.id, transform: identity });
      }
    }
    return { models, instances };
  }
  /** Cover every authored roof face, including the porch, in clipped courses. */
  public buildShingles(house: IHouse): {
    models: Model[];
    instances: Instance[];
  } {
    const models: Model[] = [];
    const instances: Instance[] = [];
    const builder = new AsphaltShingle();
    for (const part of house.parts.filter((entry) => entry.role === "roof")) {
      const triangles = roofTriangles(part.mesh);
      if (triangles.length === 0)
        throw new Error(`roof has no weather face: ${part.id}`);
      const frame = roofFrame(triangles[0]!);
      const tiles = triangles.map(
        (triangle) =>
          triangle.vertices.map((p) => local(frame, p)) as [
            Point,
            Point,
            Point,
          ],
      );
      const all = tiles.flat();
      const minX = Math.min(...all.map((p) => p[0])),
        maxX = Math.max(...all.map((p) => p[0]));
      const minY = Math.min(...all.map((p) => p[1])),
        maxY = Math.max(...all.map((p) => p[1]));
      const count = Math.ceil((maxY - minY) / 0.14);
      for (let k = -1; k < count; k++) {
        const starter = k === -1;
        const y = minY + (starter ? 0 : k * 0.14);
        const offset = !starter && k % 2 === 1 ? 0.165 : 0;
        const members: { built: Model; transform: IAutoMovieMeshTransform }[] =
          [];
        const start = Math.floor(minX - offset - 0.5),
          end = Math.ceil(maxX - offset + 0.5);
        for (let col = start; col <= end; col++) {
          const x = col + offset;
          const rectangle: Point[] = [
            [x - 0.5, y],
            [x + 0.5, y],
            [x + 0.5, y + 0.3],
            [x - 0.5, y + 0.3],
          ];
          for (let tile = 0; tile < tiles.length; tile++) {
            const planes = trianglePlanes(tiles[tile]!);
            const clipped = planes.reduce<Point[]>(
              (poly, plane) => clip(poly, plane),
              rectangle,
            );
            if (clipped.length < 3 || polygonArea(clipped) < 1e-7) continue;
            const clipPlanes = planes.map((plane) => ({
              x: plane.x,
              y: plane.y,
              limit: plane.limit - plane.x * x - plane.y * y,
            }));
            const built = builder.buildStrip({
              id: `${part.id}-${k}-${col}-${tile}`,
              starter,
              clipPlanes,
            });
            const placed = world(frame, x, y);
            members.push({
              built,
              transform: {
                translation: { x: placed[0], y: placed[1], z: placed[2] },
                rotation: frame.rotation,
              },
            });
          }
        }
        if (members.length === 0) continue;
        const id = `${part.owner}-shingle-${starter ? "starter" : k}`;
        const built = collect(id, members);
        models.push(built);
        instances.push({ id, modelId: built.model.id, transform: identity });
      }
    }
    return { models, instances };
  }
}
