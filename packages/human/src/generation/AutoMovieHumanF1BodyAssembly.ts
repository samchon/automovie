import type { AutoMovieMeshExtract } from "@automovie/engine";

import { AutoMovieHumanF1Arm } from "./AutoMovieHumanF1Arm";
import type { AutoMovieHumanF1Body } from "./AutoMovieHumanF1Body";
import { AutoMovieHumanHeadBuild } from "./head/AutoMovieHumanHeadBuild";
import { AutoMovieHumanLegBuild } from "./leg/AutoMovieHumanLegBuild";
import type { AutoMovieHumanF1Fork } from "./trunk/AutoMovieHumanF1Fork";
import { AutoMovieHumanTrunkPorts } from "./trunk/AutoMovieHumanTrunkPorts";
import { AutoMovieHumanTrunkS00 } from "./trunk/AutoMovieHumanTrunkS00";

/** Absolute capture-world coordinates or directions; positions use millimetres. */
type V3 = [number, number, number];
/** One indexed edge's first directed endpoint and total triangle incidence. */
type EdgeUse = { start: number; count: number };
/** Global vertex IDs ordered by exact coordinate keys, with the incident direction. */
type FreeEdge = { low: number; high: number; increasing: boolean };
/** Exact boundary keys; null keeps ambiguous coincident sheets separate. */
type Free = Map<string, FreeEdge | null>;

/** Assemble the six F1 ports by their exact, oriented indexed boundaries. */
export namespace AutoMovieHumanF1BodyAssembly {
  /** The host-owned connection controls in capture-world millimetres. */
  export interface IPorts {
    /** The shared end of the neck and trunk. */
    readonly neck: readonly V3[];

    /** The two independent armscye contours. */
    readonly arm: Readonly<Record<"left" | "right", readonly V3[]>>;

    /** The parent fork, both half loops and the single shared crotch line. */
    readonly fork: AutoMovieHumanF1Fork.IResult;
  }

  /** A complete-seam receipt and the resulting indexed skin. */
  export interface IOutput {
    /** Absolute world millimetres and the final, sewn triangle indices. */
    readonly mesh: { positions: number[]; indices: number[] };

    /** Every canonical seam, including those the two operands did not own. */
    readonly seams: {
      name: string;
      parts: [string, string];
      expectedEdges: number;
      matchingEdges: number;
      sameDirection: number;
      sewn: boolean;
    }[];

    /** Surface connectivity and edge incidence after exact sewing. */
    readonly skin: {
      triangles: number;
      components: number;
      freeEdges: number;
      multipleEdges: number;
      upperTrunkFreeEdges: number;
    };
  }

  /** Geometry and construction diagnostics from the six reference-free owners. */
  export interface IFixed extends IOutput {
    /** Generated triangle counts, attached digit IDs and local observations by owner. */
    readonly sources: {
      name: string;
      triangles: number;
      included?: readonly string[];
      diagnostics?: readonly string[];
    }[];

    /** Construction and assembly elapsed milliseconds. */
    readonly milliseconds: Readonly<Record<string, number>>;
  }

  /** Same-call owner results retained on Error.cause; this is not an assembled body. */
  export interface IFailureContext {
    /** Distinguishes unassembled diagnostic parts from a complete IFixed realization. */
    readonly kind: "incomplete-f1-owner-generation";
    /** Successful world-mm meshes, retaining each owner's original local indices. */
    readonly parts: ReadonlyMap<string, AutoMovieMeshExtract.IMesh>;
    /** Counts, emitted digit IDs and observations from those same successful calls. */
    readonly sources: IFixed["sources"];
    /** Actual elapsed milliseconds for every attempted owner, including failures. */
    readonly milliseconds: IFixed["milliseconds"];
    /** The canonical boundary objects supplied to these owner calls. */
    readonly ports: AutoMovieHumanTrunkPorts.IFixed;
    /** Original thrown values, including any owner-specific diagnostic Error.cause. */
    readonly failures: readonly { name: string; error: unknown }[];
  }

  /** Realize the existing fixed-coordinate F1 owners with one shared port set. */
  export function fixed(): IFixed {
    const ports: AutoMovieHumanTrunkPorts.IFixed =
      AutoMovieHumanTrunkPorts.f1();
    const sources: IFixed["sources"] = [];
    const parts: Map<string, AutoMovieMeshExtract.IMesh> = new Map();
    const failures: { name: string; error: unknown }[] = [];
    const milliseconds: Record<string, number> = {};

    /** Attempt each owner once and retain its actual return or original failure. */
    const read: (
      name: string,
      build: () => AutoMovieHumanF1Body.IFixedPart,
    ) => void = (
      name: string,
      build: () => AutoMovieHumanF1Body.IFixedPart,
    ): void => {
      const start: number = performance.now();
      try {
        const { mesh, included, diagnostics }: AutoMovieHumanF1Body.IFixedPart =
          build();
        if (mesh.indices.length === 0)
          throw new Error("The measured owner emitted no triangles");
        parts.set(name, mesh);
        sources.push({
          name,
          triangles: mesh.indices.length / 3,
          included,
          diagnostics,
        });
      } catch (error) {
        failures.push({ name, error });
      }
      milliseconds[name] = performance.now() - start;
    };
    read("trunk.archive", () => AutoMovieHumanTrunkS00.f1(ports));
    read("head", () => AutoMovieHumanHeadBuild.f1(ports.neck));
    for (const side of ["left", "right"] as const) {
      read(`arm.${side}`, () =>
        AutoMovieHumanF1Arm.trace(side, ports.arm[side]),
      );
      read(`leg.${side}`, () => AutoMovieHumanLegBuild.f1(side, ports.fork));
    }
    if (failures.length !== 0) {
      const messages: string[] = failures.map(
        ({ name, error }: { name: string; error: unknown }): string =>
          `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      const failure: Error = new Error(
        `Fixed F1 owner generation failed:\n${messages.join("\n")}\nAvailable owners: ${JSON.stringify(sources)}\nElapsed milliseconds: ${JSON.stringify(milliseconds)}`,
      );
      const cause: IFailureContext = {
        kind: "incomplete-f1-owner-generation",
        parts,
        sources,
        milliseconds,
        ports,
        failures,
      };

      // Preserve runtime buffers by reference, without serializing them into
      // the message or pretending that incomplete parts were sewn together.
      Object.defineProperty(failure, "cause", {
        value: cause,
        enumerable: false,
      });
      throw failure;
    }
    const start: number = performance.now();
    const assembled: IOutput = assemble(parts, ports);
    milliseconds.assembly = performance.now() - start;
    return { ...assembled, sources, milliseconds };
  }

  /** Share only complete, oppositely oriented uses of an authored connection. */
  export function assemble(
    parts: ReadonlyMap<string, AutoMovieMeshExtract.IMesh>,
    ports: IPorts,
  ): IOutput {
    const positions: number[] = [];
    const indices: number[] = [];
    const boundaries: Map<string, Free> = new Map();
    const hostNames: readonly string[] = [
      "trunk.archive",
      "head",
      "arm.left",
      "arm.right",
      "leg.left",
      "leg.right",
    ];
    for (const [name, mesh] of parts) {
      const base: number = positions.length / 3;
      if (hostNames.includes(name)) boundaries.set(name, freeEdges(mesh, base));
      for (let i: number = 0; i < mesh.positions.length; ++i)
        positions.push(mesh.positions[i]!);
      for (let i: number = 0; i < mesh.indices.length; ++i)
        indices.push(base + mesh.indices[i]!);
    }
    const crotch: string[] = keys(ports.fork.crotch, false);
    const median: Set<string> = new Set(crotch);

    /** Exclude the shared crotch line from each trunk-to-leg boundary comparison. */
    const half: (points: readonly V3[]) => string[] = (
      points: readonly V3[],
    ): string[] =>
      keys(points, true).filter((key: string): boolean => !median.has(key));
    const expected: { name: string; a: string; b: string; keys: string[] }[] = [
      {
        name: "neck",
        a: "trunk.archive",
        b: "head",
        keys: keys(ports.neck, true),
      },
      {
        name: "shoulder.left",
        a: "trunk.archive",
        b: "arm.left",
        keys: keys(ports.arm.left, true),
      },
      {
        name: "shoulder.right",
        a: "trunk.archive",
        b: "arm.right",
        keys: keys(ports.arm.right, true),
      },
      {
        name: "fork.left",
        a: "trunk.archive",
        b: "leg.left",
        keys: half(ports.fork.left),
      },
      {
        name: "fork.right",
        a: "trunk.archive",
        b: "leg.right",
        keys: half(ports.fork.right),
      },
      { name: "CROTCH_LINE", a: "leg.left", b: "leg.right", keys: crotch },
    ];
    const parents: Int32Array = Int32Array.from(
      { length: positions.length / 3 },
      (_: unknown, i: number): number => i,
    );

    /** Resolve an indexed weld representative without comparing nearby coordinates. */
    const root: (vertex: number) => number = (vertex: number): number => {
      while (parents[vertex] !== vertex) {
        parents[vertex] = parents[parents[vertex]!]!;
        vertex = parents[vertex]!;
      }
      return vertex;
    };
    const seams: IOutput["seams"] = expected.map(
      ({
        name,
        a,
        b,
        keys: rail,
      }: (typeof expected)[number]): IOutput["seams"][number] => {
        const left: Free | undefined = boundaries.get(a);
        const right: Free | undefined = boundaries.get(b);
        const matches: [FreeEdge, FreeEdge][] = [];
        let sameDirection: number = 0;
        for (const key of rail) {
          const l: FreeEdge | null | undefined = left?.get(key);
          const r: FreeEdge | null | undefined = right?.get(key);
          if (!l || !r) continue;
          if (l.increasing === r.increasing) ++sameDirection;
          matches.push([l, r]);
        }
        const sewn: boolean =
          rail.length > 0 &&
          matches.length === rail.length &&
          sameDirection === 0;
        if (sewn)
          for (const [l, r] of matches) {
            parents[root(r.low)] = root(l.low);
            parents[root(r.high)] = root(l.high);
          }
        return {
          name,
          parts: [a, b],
          expectedEdges: rail.length,
          matchingEdges: matches.length,
          sameDirection,
          sewn,
        };
      },
    );
    for (let i: number = 0; i < indices.length; ++i)
      indices[i] = root(indices[i]!);
    const stride: number = positions.length / 3;
    const used: Map<number, EdgeUse> = incidence(indices, stride);
    const components: Set<number> = new Set();
    let free: number = 0;
    let multiple: number = 0;
    let upperTrunk: number = 0;
    for (const [key, { count }] of used) {
      const first: number = Math.floor(key / stride);
      const second: number = key % stride;
      parents[root(second)] = root(first);
      if (count === 1) {
        ++free;
        const y0: number = positions[3 * first + 1]!;
        const y1: number = positions[3 * second + 1]!;
        if (Math.min(y0, y1) >= 1333.79 && Math.max(y0, y1) < 1458)
          ++upperTrunk;
      } else if (count > 2) ++multiple;
    }
    for (const vertex of indices) components.add(root(vertex));
    return {
      mesh: { positions, indices },
      seams,
      skin: {
        triangles: indices.length / 3,
        components: components.size,
        freeEdges: free,
        multipleEdges: multiple,
        upperTrunkFreeEdges: upperTrunk,
      },
    };
  }

  /** Count undirected indexed edge uses while retaining the first incident direction. */
  function incidence(
    indices: ArrayLike<number>,
    stride: number,
  ): Map<number, EdgeUse> {
    const uses: Map<number, EdgeUse> = new Map();
    for (let i: number = 0; i < indices.length; i += 3)
      for (let e: number = 0; e < 3; ++e) {
        const a: number = indices[i + e]!;
        const b: number = indices[i + ((e + 1) % 3)]!;
        const key: number = Math.min(a, b) * stride + Math.max(a, b);
        const use: EdgeUse | undefined = uses.get(key);
        if (use === undefined) uses.set(key, { start: a, count: 1 });
        else ++use.count;
      }
    return uses;
  }

  /** Read only unique free edges, leaving coincident sheets separate. */
  function freeEdges(mesh: AutoMovieMeshExtract.IMesh, base: number): Free {
    const stride: number = mesh.positions.length / 3;
    const free: Free = new Map();

    /** Encode a world-mm point exactly; no tolerance or rounding weld is applied. */
    const xyz: (i: number) => string = (i: number): string => {
      const j: number = 3 * i;
      return [
        mesh.positions[j]!,
        mesh.positions[j + 1]!,
        mesh.positions[j + 2]!,
      ].join(",");
    };
    for (const [key, { start, count }] of incidence(mesh.indices, stride)) {
      if (count !== 1) continue;
      const low: number = Math.floor(key / stride);
      const high: number = key % stride;
      const end: number = start === low ? high : low;
      const a: string = xyz(start);
      const b: string = xyz(end);
      if (a === b) continue;
      const name: string = a < b ? a + "|" + b : b + "|" + a;
      const edge: FreeEdge =
        a < b
          ? { low: base + start, high: base + end, increasing: true }
          : { low: base + end, high: base + start, increasing: false };
      free.set(name, free.has(name) ? null : edge);
    }
    return free;
  }

  /** Encode consecutive exact coordinate edges, keeping open lines open when requested. */
  function keys(points: readonly V3[], closed: boolean): string[] {
    const out: string[] = [];
    for (
      let i: number = 1;
      i < points.length + Number(closed) && points.length !== 0;
      ++i
    ) {
      const a: string = points[i - 1]!.join(",");
      const b: string = points[i % points.length]!.join(",");
      if (a !== b) out.push(a < b ? a + "|" + b : b + "|" + a);
    }
    return out;
  }
}
