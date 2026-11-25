import {
  inspectAutoMovieMeshTopology,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import { AutoMovieHumanDigitNails as Nails } from "@automovie/human";
import { buildHumanNeutralCapture } from "@automovie/human/capture";
import type {
  IAutoMovieHumanDigitNails,
  IAutoMovieMesh,
} from "@automovie/interface";

import { FamilyConicMpfbNailMesh as Mesh } from "./FamilyConicMpfbNailMesh";
import { FamilyConicNeutralNailCapture as Capture } from "./FamilyConicNeutralNailCapture";

/** Observe material and skin from ordinary body generation and final indices. */
export namespace FamilyConicNeutralNailAssembly {
  /** One material and its surviving counterpart in the ordinary index buffer. */
  interface ISite {
    /** Original digit name and skin/plate face counts. */
    name: string;
    skin: number;
    plate: number;
    /** Number of shared index identities on the opposed material cycle. */
    shared: number;
    /** Actual body clearance, null when the cycle or witness is unavailable. */
    maximumMm: number | null;
    /** Local topology; the proximal body rail is outside this pair. */
    topology: ReturnType<typeof inspectAutoMovieMeshTopology>;
    /** Plate intersections with the skin and with itself. */
    crossings: { skin: number; crown: number };
    /** Complete indexed contact and admissible clipped depth. */
    retained: boolean;
    /** Matched original and assembled views, when requested. */
    capture?: Awaited<ReturnType<typeof Capture.write>>;
  }

  /** Evaluate the body once, then inspect requested native sites on that mesh. */
  export async function observe(
    side: "left" | "right" | undefined,
    names: readonly string[],
    out?: string,
    captureNames: readonly string[] = [],
  ) {
    return observeBody(buildHumanNeutralCapture.inspect(), side, names, out, captureNames);
  }

  /** Read the requested nails from the same already evaluated ordinary body. */
  export async function observeBody(
    body: ReturnType<typeof buildHumanNeutralCapture.inspect>,
    side: "left" | "right" | undefined,
    names: readonly string[],
    out?: string,
    captureNames: readonly string[] = [],
  ) {
    const sources: readonly IAutoMovieHumanDigitNails.IPlaced[] =
      body.calibration.nailSources ?? [];
    const requested = (name: string): boolean =>
      (side === undefined || name.split(".")[1] === side) &&
      (names.length === 0 || names.includes(name));
    const clipping: ReadonlyMap<string, number> = new Map(
      body.nailClipping?.map(({ digit, maximumMm }) => [digit, maximumMm]),
    );
    const selected = sources.filter((source): boolean =>
      requested(source.original.source.name),
    );
    const owners: Set<string> = new Set(
      selected.flatMap(({ original: { source } }): string[] => [
        source.name,
        Nails.names(source.name).plate,
      ]),
    );
    const groups = new Map<string, number[]>();
    for (const [i, group] of body.triangleGroups.entries()) {
      const { name, start } = group;
      const owner: string = name.slice(0, name.lastIndexOf("/"));
      if (!owners.has(owner)) continue;
      const end: number =
        body.triangleGroups[i + 1]?.start ?? body.mesh.indices!.length;
      const current: number[] = groups.get(owner) ?? [];
      for (let k: number = start; k < end; ++k)
        current.push(body.mesh.indices![k]!);
      groups.set(owner, current);
    }

    const sites: ISite[] = [];
    for (const {
      original: { source },
      frame,
    } of selected) {
      const name: string = source.name;
      const plate: string = Nails.names(name).plate;
      const skin: readonly number[] = groups.get(name) ?? [];
      const crown: readonly number[] = groups.get(plate) ?? [];
      const skinIds: Set<number> = new Set(skin);
      const shared: number = new Set(
        crown.filter((vertex): boolean => skinIds.has(vertex)),
      ).size;
      const joined = compact(body.mesh.positions, skin, crown);
      const skinMesh: IAutoMovieMesh = Mesh.topologyInput({
        positions: joined.positions,
        indices: joined.indices.slice(0, skin.length),
      });
      const plateMesh: IAutoMovieMesh = Mesh.topologyInput({
        positions: joined.positions,
        indices: joined.indices.slice(skin.length),
      });
      const topology = inspectAutoMovieMeshTopology(Mesh.topologyInput(joined));
      const maximumMm: number | null = clipping.get(name) ?? null;
      const crossings = {
        skin: measureAutoMovieMeshCrossings(plateMesh, skinMesh).length,
        crown: measureAutoMovieMeshCrossings(plateMesh, plateMesh).length,
      };
      const retained: boolean =
        maximumMm !== null &&
        maximumMm <= Nails.CLIP_MM &&
        shared >= 3 &&
        topology.nonManifoldEdges === 0 &&
        topology.degenerate === 0 &&
        crossings.skin === 0 &&
        crossings.crown === 0;
      sites.push({
        name,
        skin: skin.length / 3,
        plate: crown.length / 3,
        shared,
        maximumMm,
        topology,
        crossings,
        retained,
        capture:
          out !== undefined &&
          retained &&
          (captureNames.length === 0 || captureNames.includes(name))
            ? await Capture.write(
                out,
                source,
                { mesh: joined, plateFrom: skin.length },
                frame,
                true,
              )
            : undefined,
      });
    }
    return {
      scope: "ordinary assembled neutral skin",
      body: {
        topology: body.topology,
        pieces: body.pieces,
        diagnostics: body.diagnostics,
        milliseconds: body.milliseconds,
      },
      unavailable: names.filter(
        (name): boolean => !sites.some((site): boolean => site.name === name),
      ),
      sites,
    };
  }

  /** Borrow only this exterior's vertices, preserving each shared index. */
  function compact(
    global: readonly number[],
    skin: readonly number[],
    plate: readonly number[],
  ) {
    const positions: number[] = [];
    const indices: number[] = [];
    const ids: Map<number, number> = new Map();
    for (const triangles of [skin, plate])
      for (const index of triangles) {
        let local: number | undefined = ids.get(index);
        if (local === undefined) {
          local = positions.length / 3;
          ids.set(index, local);
          positions.push(
            global[3 * index]!,
            global[3 * index + 1]!,
            global[3 * index + 2]!,
          );
        }
        indices.push(local);
      }
    return { positions, indices, coordinates: [], owners: [] };
  }
}
