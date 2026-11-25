import {
  AutoMovieLoftAdmissionError,
  AutoMovieSolidMesh as Mesh,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import {
  AutoMovieHumanDigitNails as Nails,
  AutoMovieHumanNailPatch as Native,
} from "@automovie/human";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieHumanDigitNails,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import type { FamilyConicMpfbNailStock as Stock } from "./FamilyConicMpfbNailStock";

/** Exercise the native material patch on a standalone observed digit. */
export namespace FamilyConicMpfbNailPatch {
  /** The same source preparation consumed by body skin. */
  export type IPrepared = Native.IPrepared;

  /** Prepare the same native skin and plate on the observation's grid. */
  export const prepare = Native.prepare;

  /** Add the retained trim without an assembled body's proximal chart cut. */
  export function realize(prepared: IPrepared, stock?: Stock.IPatch) {
    const started: number = performance.now();
    const {
      made,
      digit,
      contact: { host: skin, part: plate, footprint },
    } = prepared;
    const reference =
      stock === undefined
        ? undefined
        : measuredOutline(
            stock,
            made.nail.frame,
            skin.surface.jet(...footprint.centre),
            footprint.semi,
          );
    const patch = Native.shape(prepared, reference);
    const ready: number = performance.now();
    const kernel: IAutoMovieSolidMesh.IMesh = Mesh.create();
    const loop: IAutoMovieSolidMesh.ILoop = patch.seam(kernel);
    const host: IAutoMovieSolidSurface = patch.host;
    const hostId: number = Mesh.owner(kernel, host);
    const [first, last]: [number, number] = host.domain!;
    const bottom: boolean = digit.pole === "both";
    const tip: number = made.support.domain[1];
    const stations: number[] = patch
      .stations(first, last, Nails.CLIP_MM)
      .filter((s): boolean => s < tip && (!bottom || s > first));
    const open = Mesh.face(kernel, {
      surface: host,
      stations,
      phases: patch.phases,
      loops: [loop],
    });
    // Preserve both distinct end rings and their original pole records.
    const ends: ("top" | "bottom")[] = bottom ? ["top", "bottom"] : ["top"];
    for (const end of ends) {
      const cycle = open.find((ring): boolean => ring.end === end);
      if (cycle === undefined)
        throw new AutoMovieLoftAdmissionError(
          "The skin trim lost its original " + end + " closing ring",
        );
      const station: number = end === "top" ? tip : first;
      const pole: number = Mesh.vertex(
        kernel,
        host.point!(station, 0),
        hostId,
        station,
        0,
      );
      Mesh.close(
        kernel,
        cycle.vertices.map((v, i): [number, number, number] => [
          v,
          cycle.vertices[(i + 1) % cycle.vertices.length]!,
          pole,
        ]),
        host,
        false,
      );
    }
    const skinDone: number = performance.now();
    const plateFrom: number = kernel.indices.length;
    const { rows, inward, nominalInward } = patch.crown(kernel, loop.vertices);
    const mesh: IAutoMovieConstructionRealization.IMesh = {
      positions: kernel.positions.map((v): number => v / 1000),
      indices: kernel.indices,
      coordinates: kernel.coordinates,
      owners: kernel.owners.map((o): string => o.name),
    };
    return {
      mesh,
      plateChain: plate.chain,
      seam: loop.vertices,
      plateFrom,
      columns: patch.columns,
      rows,
      skinStations: stations.length,
      skinPhases: patch.phases.length,
      support: patch.support,
      inward,
      nominalInward,
      milliseconds: {
        prepare: ready - started + prepared.milliseconds,
        skin: skinDone - ready,
        crown: performance.now() - skinDone,
      },
    };
  }

  /** Measure the same outline rays in the original visible material plane. */
  function measuredOutline(
    patch: Stock.IPatch,
    frame: IAutoMovieHumanDigitNails.IMade["nail"]["frame"],
    parent: IAutoMovieSolidSurface.IJet,
    semi: P2,
  ): (clock: number) => number | null {
    const lateral: P3 = Vec.cross(frame.distal, frame.dorsal);
    const flat = (point: P3): P2 => [
      Vec.dot(point, frame.distal),
      Vec.dot(point, lateral),
    ];
    const points: P2[] = patch.points.map(
      (p): P2 => flat(Vec.sub(p, frame.origin)),
    );
    const centre: P2 = [0, 1].map((axis): number => {
      const v: number[] = points.map((p): number => p[axis]!);
      return (Math.max(...v) + Math.min(...v)) / 2;
    }) as P2;
    const edges = patch.margins.map(({ edge: [a, b] }): [P2, P2] => {
      const p: P2 = flat(Vec.sub(a, frame.origin));
      const e: P2 = flat(Vec.sub(b, a));
      return [[p[0] - centre[0], p[1] - centre[1]], e];
    });
    return (clock): number | null => {
      const ray: P2 = flat(
        Vec.add(
          Vec.scale(parent.u, semi[0] * Math.cos(clock)),
          Vec.scale(parent.v, semi[1] * Math.sin(clock)),
        ),
      );
      let closest: number = Infinity;
      for (const [p, e] of edges) {
        const root = Vec.solve2(ray[0], -e[0], ray[1], -e[1], p);
        if (root !== null && root[0] > 0 && root[1] >= 0 && root[1] <= 1)
          closest = Math.min(closest, root[0]);
      }
      return Number.isFinite(closest) ? closest : null;
    };
  }
}
