import {
  AutoMovieConstructionProfile,
  AutoMovieConstructionProfileBody,
  AutoMovieConstructionProfileSkin,
  AutoMovieSolidBody,
  AutoMovieSolidMesh,
  AutoMovieViewAxis,
  type IAutoMovieConstructionProfileSource,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionProfile,
} from "@automovie/interface";

/**
 * Exact original L-prism and cone function owners for actual profile realization.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Straight L edges and elementary cone sin/cos equations provide independent original fields with explicit domains, clocks and derivatives.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Synthetic function ownership stays separate from the test entry that observes actual Body/skin behavior.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No expected output, source fit or consumer special case is supplied; only the actual analytic cone tip returns unavailable physical2.
 * @evidence contracts/development/common.md#meaningful-documentation Defines mm physical source coordinates, metre pure domains, original clock intervals and real source neighborhoods.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixture preparation is linear in declared piece count; each analytic point/jet query performs constant arithmetic.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A cone source is shared by its exact original quarter intervals; L pieces retain their original endpoint owners.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each call returns caller-owned pure metadata and curve closures; fixed corners are immutable borrowed numeric data and no mutable cache is global.
 */
export namespace ConstructionProfileRealization {
  /** The original concave L, with perimeter eight in its local millimetre plane. */
  export const corners: readonly (readonly [number, number])[] = [
    [0, 0],
    [2, 0],
    [2, 1],
    [1, 1],
    [1, 2],
    [0, 2],
  ];
  /** Pure common metadata names actual test-owned source/material/binding dependencies. */
  function definition(
    name: string,
    pieces: IAutoMovieConstructionProfile.IPiece[],
  ): IAutoMovieConstructionProfile {
    return {
      name,
      domain: [0, 0.001],
      plane: "plane",
      loops: [
        {
          id: "loop",
          kind: "outer",
          orientation: 1,
          surfaceOrientation: 1,
          domain: [0, 0.001],
          pieces,
        },
      ],
      guides: [],
      regions: [
        {
          id: "skin",
          logicalParts: ["logical"],
          pieces: pieces.map(
            (piece: (typeof pieces)[number]): string => piece.id,
          ),
          material: "actual.material",
          binding: "actual.binding",
        },
      ],
      revisions: {
        source: "source.1",
        constraints: "constraints.1",
        topology: "topology.1",
      },
    };
  }

  /** Exact straight original intervals, each with a wider real station/clock neighborhood. */
  export function prism(): IAutoMovieConstructionProfileSource {
    const curves: Map<string, IAutoMovieConstructionProfileSource.ICurve> =
      new Map();
    const pieces: IAutoMovieConstructionProfile.IPiece[] = corners.map(
      (
        from: readonly [number, number],
        i: number,
      ): IAutoMovieConstructionProfile.IPiece => {
        const to: readonly [number, number] =
          corners[(i + 1) % corners.length]!;
        const delta: [number, number] = [to[0] - from[0], to[1] - from[1]];
        const point: (s: number, t: number) => [number, number] = (
          _station: number,
          t: number,
        ): [number, number] => [
          from[0] + ((t - 2) * delta[0]) / 3,
          from[1] + ((t - 2) * delta[1]) / 3,
        ];
        curves.set("source." + i, {
          domain: [-1, 2],
          clock: [1, 6],
          point,
          jet: (
            s: number,
            t: number,
          ): IAutoMovieConstructionProfileSource.IJet => ({
            p: point(s, t),
            s: [0, 0],
            t: [delta[0] / 3, delta[1] / 3],
            ss: [0, 0],
            st: [0, 0],
            tt: [0, 0],
          }),
        });
        return {
          id: "piece." + i,
          source: "source." + i,
          clock: [2, 5],
          direction: 1,
          branch: "wall",
        };
      },
    );
    return {
      definition: definition("L", pieces),
      plane: { id: "plane", axis: AutoMovieViewAxis.horizontal() },
      curves,
    };
  }

  /** A cone is exact in its same original clock; only the true bottom point lacks physical2. */
  export function cone(
    count: number,
    direction: 1 | -1,
    both: boolean = false,
  ): IAutoMovieConstructionProfileSource {
    const k: number = (2 * Math.PI) / 3;
    const point: (s: number, t: number) => [number, number] = (
      s: number,
      t: number,
    ): [number, number] => [
      (both ? s * (1 - s) : s) * Math.cos(k * (t - 2)),
      (both ? s * (1 - s) : s) * Math.sin(k * (t - 2)),
    ];
    const curve: IAutoMovieConstructionProfileSource.ICurve = {
      domain: [0, 1],
      clock: [2, 5],
      period: 3,
      point,
      jet: (
        s: number,
        t: number,
      ): IAutoMovieConstructionProfileSource.IJet | null => {
        if (s === 0 || (both && s === 1)) return null;
        const r: number = both ? s * (1 - s) : s;
        const rate: number = both ? 1 - 2 * s : 1;
        const acceleration: number = both ? -2 : 0;
        const c: number = Math.cos(k * (t - 2));
        const z: number = Math.sin(k * (t - 2));
        return {
          p: point(s, t),
          s: [rate * c, rate * z],
          t: [-k * r * z, k * r * c],
          ss: [acceleration * c, acceleration * z],
          st: [-k * rate * z, k * rate * c],
          tt: [-k * k * r * c, -k * k * r * z],
        };
      },
    };
    const pieces: IAutoMovieConstructionProfile.IPiece[] = Array.from(
      { length: count },
      (
        _value: unknown,
        ordinal: number,
      ): IAutoMovieConstructionProfile.IPiece => {
        const i: number = direction === 1 ? ordinal : count - 1 - ordinal;
        return {
          id: "piece." + ordinal,
          source: "cone",
          clock: [2 + (3 * i) / count, 2 + (3 * (i + 1)) / count],
          direction,
          branch: "wall",
        };
      },
    );
    const data: IAutoMovieConstructionProfile = definition("cone", pieces);
    data.loops[0]!.pole = both ? "both" : "bottom";
    data.loops[0]!.orientation = direction;
    data.loops[0]!.surfaceOrientation = direction;
    return {
      definition: data,
      plane: { id: "plane", axis: AutoMovieViewAxis.horizontal() },
      curves: new Map([["cone", curve]]),
    };
  }
  /** A missing native part makes both nested joins refuse before any geometry solve, so the outer checkpoint must also release the profile subtree. */
  export function rollbackTree(
    profile: IAutoMovieConstructionProfile,
  ): IAutoMovieConstructionJoin {
    const join: (
      name: string,
      host: AutoMovieConstructionNode,
      part: AutoMovieConstructionNode,
      hostFace: string,
    ) => IAutoMovieConstructionJoin = (
      name: string,
      host: AutoMovieConstructionNode,
      part: AutoMovieConstructionNode,
      hostFace: string,
    ): IAutoMovieConstructionJoin => ({
      type: "join",
      name,
      kind: "merge",
      host,
      part,
      seed: {
        type: "point",
        partFace: "missing",
        hostFace,
        part: [0.0005, 0],
        host: [0.0005, 0],
      },
      parameter: { type: "phase" },
      partWidth: { type: "chord", value: 0.0001 },
      hostWidth: { type: "chord", value: 0.0001 },
      continuity: "G2",
      count: 8,
      rows: 1,
      tolerance: 0.000001,
      grazing: 0.001,
    });
    return join(
      "outer",
      { type: "source", name: "outer.host", source: "outer.host" },
      join(
        "inner",
        { type: "profile", ...structuredClone(profile) },
        { type: "source", name: "missing", source: "missing" },
        profile.name + "/" + profile.loops[0]!.pieces[0]!.id,
      ),
      "outer.host",
    );
  }
  /** Exact affine plane and authoritative domain corners, with no actual cut. */
  export function authorities(dense: boolean = false): {
    mesh: AutoMovieSolidMesh.IMesh;
    input: AutoMovieSolidMesh.IFace;
  } {
    const surface: IAutoMovieSolidSurface = {
      name: "authority.plane",
      domain: [0, 1],
      orientation: 1,
      point: (u: number, v: number): [number, number, number] => [u, v, 0],
      jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
        p: [u, v, 0],
        u: [1, 0, 0],
        v: [0, 1, 0],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0, 0, 0],
      }),
    };
    const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
    const owner: number = AutoMovieSolidMesh.owner(mesh, surface);
    const chart: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const vertices: number[] = chart.map(([u, v]: [number, number]): number =>
      AutoMovieSolidMesh.vertex(mesh, [u, v, 0], owner, u, v),
    );
    return {
      mesh,
      input: {
        surface,
        stations: dense ? [0, 0.5, 1] : [0, 1],
        phases: dense ? [0, 0.5, 1] : [0, 1],
        loops: [],
        domainLoops: [{ kind: "island", vertices, chart }],
      },
    };
  }
  /** Every uncut original fixture face publishes one real domain perimeter and no cutting cycle. */
  export function wholeProfileDomains(
    body: AutoMovieSolidBody.IPublished,
  ): boolean {
    return body.faces.every(
      (face: AutoMovieSolidBody.IPublished["faces"][number]): boolean =>
        face.cycles.length === 0 && face.domainLoops?.length === 1,
    );
  }
  /** An actual hole inside the original tip strip must receive a named refusal, never a whole-ring fan that covers it. */
  export function cutCap(failures: string[]): void {
    const prepared: AutoMovieConstructionProfile.IPrepared =
      AutoMovieConstructionProfile.create(cone(1, 1, true));
    const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
      "actual cap cut",
      [],
    );
    const ends: AutoMovieConstructionProfileBody.IEnd[] =
      AutoMovieConstructionProfileBody.append(body, prepared, 0.02);
    const end: AutoMovieConstructionProfileBody.IEnd = ends[0]!;
    const surface: IAutoMovieSolidSurface = body.faces[0]!.surface;
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, surface);
    // The regular domain is disjoint from this cap-only cut, so its actual mesh/open records remain valid.
    const diagnostics: { contract: string; detail: string }[] = [];
    const open: AutoMovieSolidMesh.IOpen[][] = AutoMovieSolidBody.draw(
      body,
      (_node: string, detail: string): void => {
        diagnostics.push({ contract: "face triangulation", detail });
      },
    );
    const chart: [number, number][] = [
      [end.regular * 0.2, 0.2],
      [end.regular * 0.4, 0.2],
      [end.regular * 0.4, 0.4],
      [end.regular * 0.2, 0.4],
    ];
    body.faces[0]!.cycles.push({
      kind: "hole",
      chart,
      vertices: chart.map(([u, v]: [number, number]): number =>
        AutoMovieSolidMesh.vertex(body.mesh, surface.point!(u, v), owner, u, v),
      ),
      neighbours: [],
    });
    AutoMovieConstructionProfileSkin(
      body,
      ends,
      open,
      (_node: string, contract: string, detail: string): void => {
        diagnostics.push({ contract, detail });
      },
    );
    const tip: (station: number) => boolean = (station: number): boolean =>
      body.mesh.coordinates.some(
        (value: number, i: number): boolean => i % 3 === 1 && value === station,
      );
    if (
      !diagnostics.some(
        (d: (typeof diagnostics)[number]): boolean =>
          d.contract === "profile pole" && d.detail.includes("cutting loop"),
      ) ||
      tip(end.station) ||
      !tip(ends[1]!.station)
    )
      failures.push(
        "A cap-only cut was hidden or its refusal leaked from bottom into the same face's untouched top pole.",
      );
  }
}
