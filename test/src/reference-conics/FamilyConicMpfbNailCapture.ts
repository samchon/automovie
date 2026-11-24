import {
  AutoMovieSolidVector as Vec,
  inspectAutoMovieMeshTopology,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import { AutoMovieHumanDigitNails as Nails } from "@automovie/human";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieHumanDigitNails,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import type { FamilyConicMpfbDigitTips as Tips } from "./FamilyConicMpfbDigitTips";
import type { FamilyConicMpfbNailJoin as Join } from "./FamilyConicMpfbNailJoin";
import { FamilyConicMpfbNailMesh as Mesh } from "./FamilyConicMpfbNailMesh";
import type { FamilyConicMpfbNailStock as Stock } from "./FamilyConicMpfbNailStock";
import { FamilyConicMpfbNailVeto as Veto } from "./FamilyConicMpfbNailVeto";
import type { FamilyConicMpfbNails as View } from "./FamilyConicMpfbNails";
import type { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Compare the isolated distal skin and fitted plate with exact public source
 * clay.
 */
export namespace FamilyConicMpfbNailCapture {
  /** Bounded diagnostic receipt for one digit and its requested viewpoints. */
  export interface IReceipt {
    /** Directed triangle-edge accounting on the skin before the nail attachment. */
    skin: ReturnType<typeof inspectAutoMovieMeshTopology>;
    /** Edges that are open anywhere other than the unjoined proximal wall. */
    distalBoundary: number;
    /** Diagnostics from realizing the supplied wall and the standalone plate. */
    diagnostics: IAutoMovieConstructionRealization.IRealization["diagnostics"];
    /** Each independently framed source-candidate pair. */
    frames: {
      camera: N.Camera;
      files: { file: string; sha256: string }[];
      veto?: ReturnType<typeof Veto.observe>;
    }[];
  }

  /** Borrow one exact source triangle mesh for every camera pair. */
  export function prepare(
    source: Mpfb.IGeometry,
    walls: boolean = false,
  ): (
    out: string,
    cap: Tips.ICap,
    made: IAutoMovieHumanDigitNails.IMade,
    views: readonly View.IView[],
    patch: Stock.IPatch,
    joined?: Join.IExterior,
  ) => Promise<IReceipt> {
    const reference: N.Mesh = {
      id: "mpfb.hm08.skin",
      positions: Array.from(source.body.positions, (mm): number => mm / 1000),
      indices: Array.from(source.body.indices),
      colour: [0.64, 0.65, 0.67],
    };
    return async (out, cap, made, views, patch, joined): Promise<IReceipt> => {
      const { nail } = made;
      const skin = realize(
        Nails.addReliefs(cap.view, cap.family, [nail.bed, nail.strip]),
      );
      const plate = realize(Nails.attachmentPlate(nail.plate, nail.bed));
      const bare = walls ? realize(cap.view).mesh : null;
      const owned: N.Mesh = {
        ...reference,
        indices: cap.profileSourceIndices ?? cap.sourceIndices,
      };
      const scope: string = cap.family.name;
      const meshes: N.Mesh[] = [
        { ...skin.mesh, id: scope, colour: reference.colour },
        { ...plate.mesh, id: nail.plate.name, colour: [0.77, 0.77, 0.77] },
      ];
      const frames: IReceipt["frames"] = [];
      const passes: readonly [string, N.Mesh[]][] = [
        ["reference", referenceMaterial(reference, patch)],
        joined === undefined
          ? ["isolated", meshes]
          : ["attached", shades(joined, nail.plate.name, reference.colour)],
      ];
      const clear: readonly [string, N.Mesh[]][] =
        bare === null
          ? []
          : [
              ["source-owned", [owned]],
              [
                "raw-parent",
                [{ ...bare, id: scope, colour: reference.colour }],
              ],
              ["candidate-clear", passes[1]![1]],
              ["reference-clear", passes[0]![1]],
            ];
      const roi: N.Point[] = [
        ...Camera.indexedPoints([meshes[1]!]),
        ...[...patch.points, cap.pole, cap.frame.origin].map(
          (p): N.Point => Vec.scale(p, 1 / 1000),
        ),
      ];
      const depthOwners: N.Point[] = Camera.indexedPoints([
        ...passes[1]![1],
        owned,
      ]);
      for (const { name, back, up } of views) {
        // Include both actual nail outlines, the distal joint and the pole.
        const camera: N.Camera = Camera.fitAnnotated(
          name,
          back,
          up,
          roi,
          600,
          600,
        );
        let low: number = Infinity;
        let high: number = -Infinity;
        for (const point of depthOwners) {
          const z: number = Camera.project(point, camera)[2];
          low = Math.min(low, z);
          high = Math.max(high, z);
        }
        // Pad the actual depth hull by one raster pixel in world metres. A
        // nail-only sphere can put the fore-facing parent on the wrong side
        // of the near plane and expose the inside-facing triangle behind it.
        const pixel: number = 1 / camera.scale;
        const fitted: N.Camera = {
          ...camera,
          clipping: {
            distance: high + 2 * pixel,
            near: pixel,
            far: high - low + 3 * pixel,
          },
        };
        const files: { file: string; sha256: string }[] = [];
        for (const [pass, parts] of [...passes, ...clear])
          files.push(
            await Frame.write(
              null,
              out,
              `${scope}.${name}.${pass}.png`,
              clear.some(([key]): boolean => key === pass) ? camera : fitted,
              [...parts],
              [],
              "depth",
              "HM08 distal nail study",
              pass,
              scope,
              undefined,
              pass.startsWith("reference") || pass === "source-owned"
                ? "HM08 source"
                : "Human nail candidate",
            ),
          );
        frames.push({
          camera: fitted,
          files,
          ...(bare === null
            ? {}
            : {
                veto: Veto.observe(
                  cap,
                  fitted,
                  bare,
                  joined?.mesh ?? skin.mesh,
                  owned,
                ),
              }),
        });
      }
      return {
        skin: inspectAutoMovieMeshTopology(Mesh.topologyInput(skin.mesh)),
        distalBoundary: Mesh.boundary(
          skin.mesh,
          skin.mesh.owners.indexOf(scope),
          cap.view.stations[0]!,
        ),
        diagnostics: [...skin.diagnostics, ...plate.diagnostics],
        frames,
      };
    };
  }

  /** Shade precisely the source asset's material faces on the unchanged clay. */
  function referenceMaterial(reference: N.Mesh, patch: Stock.IPatch): N.Mesh[] {
    const key = (indices: readonly number[], i: number): string =>
      `${indices[i]}:${indices[i + 1]}:${indices[i + 2]}`;
    const marked: Set<string> = new Set();
    for (let i: number = 0; i < patch.indices.length; i += 3)
      marked.add(key(patch.indices, i));
    const skin: number[] = [];
    for (let i: number = 0; i < reference.indices.length; i += 3) {
      if (marked.has(key(reference.indices, i))) continue;
      skin.push(
        reference.indices[i]!,
        reference.indices[i + 1]!,
        reference.indices[i + 2]!,
      );
    }
    return [
      { ...reference, indices: skin },
      {
        ...reference,
        id: "mpfb.hm08.nail",
        indices: patch.indices,
        colour: [0.77, 0.77, 0.77],
      },
    ];
  }

  /** Display the retained exterior plate and skin using their mesh ownership. */
  export function shades(
    { mesh, plateFrom }: Join.IExterior,
    plate: string,
    colour: N.Mesh["colour"],
  ): N.Mesh[] {
    const owner: number = mesh.owners.indexOf(plate);
    const part: number[] = [],
      skin: number[] = [];
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const face: number[] = mesh.indices.slice(i, i + 3);
      const visiblePlate: boolean =
        plateFrom === undefined
          ? face.filter((k): boolean => mesh.coordinates[3 * k] === owner)
              .length >= 2
          : i >= plateFrom;
      (visiblePlate ? part : skin).push(...face);
    }
    return [
      { id: "skin", positions: mesh.positions, indices: skin, colour },
      {
        id: plate,
        positions: mesh.positions,
        indices: part,
        colour: [0.77, 0.77, 0.77],
      },
    ];
  }

  /** Realize only the named skin or plate's actual source. */
  export function realize(
    part: IAutoMovieViewPart,
  ): IAutoMovieConstructionRealization.IRealization {
    // ESTIMATE: resolve the established nail chord to a quarter for clay review.
    return realizeAutoMovieConstruction(
      {
        name: part.name,
        root: { type: "source", name: part.name, source: part.name },
      },
      { sources: new Map([[part.name, part]]), chord: Nails.CHORD_MM / 4000 },
    );
  }
}
