import {
  AutoMovieConstructionProfile,
  AutoMovieConstructionProfileBody,
  type AutoMovieConstructionRealization,
  AutoMovieSolidBody,
  AutoMovieSolidMesh,
  type IAutoMovieConstructionProfileSource,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionProfile,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionNativeContinuation as Native } from "../../internal/construction/ConstructionNativeContinuation";
import { ConstructionProfileRealization as Made } from "../../internal/construction/ConstructionProfileRealization";
import { nclose } from "../../internal/nclose";

/** The concave L has perimeter eight, with no hull or polar replacement. */
const CORNERS: readonly (readonly [number, number])[] = Made.corners;

/**
 * Actual original piecewise families produce retained body charts and one indexed skin.
 *
 * Scenarios:
 * 1. Six exact line families form a concave L prism: zero native chains, six
 *    original faces, area 8 square mm, every actual vertex replays its owner,
 *    and both sides consume each common longitudinal boundary index once.
 * 2. One full-period cone and four explicit quarter pieces retain an actual
 *    collapsed bottom Point0, regular open top and unavailable tip physical2.
 *    Reversed original clocks keep independent outward normals and exact
 *    cone equations without resampling the source into a compatibility chain.
 * 3. Retained charts reject outside stations/pieces while original supported
 *    neighborhoods retain real functions/period aliases; atlas kept/across
 *    preserves inclusive boundaries and actual qualified neighbor addresses.
 * 4. Missing/mismatched source, unavailable physical2 after partial publication,
 *    malformed collapse and original exceptions produce named atomic leaf
 *    diagnostics, with no faces, owners, positions or retained profile records.
 * 5. Original domain authorities remain open boundary occurrences, while a
 *    coincident actual trim stays uncappable. Wrong role, interior diagonal,
 *    out-of-grid authority and missing ID refuse before mesh mutation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public pure profile construction ingress through actual Body/Atlas drawing, boundary publication and Skin fans, inspecting mesh source replay, face incidence and named rollback results.
 * @evidence contracts/development/testing.md#independent-expectations Exact L line equations give perimeter and lateral area8; cone coordinates satisfy x²+z²=y², with outward normal proportional to(x,-y,z). Independent edge counts distinguish shared source identities from coincident duplicate vertices; no output snapshot or fitted mesh supplies expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes concavity, six pieces, one/multiple periodic-owner pieces, reversed clocks/orientation, actual pole versus open end, source neighborhoods, missing derivatives, wrong declaration and failed source callbacks. Existing Profile/phase/KnownPort questions own complete derivative and band-map equations.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous CPU construction_profile_realization entry uses synthetic immutable source functions and public construction APIs without a viewer, host process or Human generation.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Six exact line families form a concave L prism: zero native chains, six).
 */
export function test_construction_profile_realization(): void {
  const failures: string[] = [];
  collect("concave prism", failures, (): void => prism(failures));
  for (const count of [1, 4])
    for (const direction of [1, -1] as const)
      collect("cone " + count + "/" + direction, failures, (): void =>
        cone(count, direction, failures),
      );
  collect("atomic admission", failures, (): void => refused(failures));
  collect("domain authorities", failures, (): void => authorities(failures));
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Retain every case's findings rather than abandoning the round at its first refusal. */
function collect(label: string, failures: string[], run: () => void): void {
  try {
    run();
  } catch (error: unknown) {
    failures.push(
      label + ": " + (error instanceof Error ? error.stack : String(error)),
    );
  }
}

/** The author supplies one pure declaration and the corresponding complete original function owner. */
function realize(
  source: IAutoMovieConstructionProfileSource,
): AutoMovieConstructionRealization.IRealization {
  return realizeAutoMovieConstruction(
    {
      name: "analytic",
      root: { type: "profile", ...structuredClone(source.definition) },
    },
    { chord: 0.00002, profiles: new Map([[source.definition.name, source]]) },
  );
}

/** Exact polyhedral geometry supplies per-face area and native shared-edge oracles. */
function prism(failures: string[]): void {
  const source: IAutoMovieConstructionProfileSource = Made.prism();
  const result: AutoMovieConstructionRealization.IRealization = realize(source);
  clean(result, failures);
  if (
    result.chains.length !== 0 ||
    result.profiles?.length !== 1 ||
    result.body.faces.length !== 6
  )
    failures.push(
      "The composed source was converted to hidden lofts or lost original faces.",
    );
  if (!Made.wholeProfileDomains(result.body))
    failures.push(
      "Published original domain authorities were merged into actual cuts.",
    );
  let area: number = 0;
  const faceEdges: Map<string, number>[] = CORNERS.map(
    (): Map<string, number> => new Map(),
  );
  for (let k: number = 0; k < result.mesh.indices.length; k += 3) {
    const ids: number[] = result.mesh.indices.slice(k, k + 3);
    const p: [number, number, number][] = ids.map(
      (id: number): [number, number, number] => point(result, id),
    );
    area += Math.hypot(...normal(p)) / 2;
    for (let f: number = 0; f < CORNERS.length; f++) {
      const a: readonly [number, number] = CORNERS[f]!;
      const b: readonly [number, number] = CORNERS[(f + 1) % CORNERS.length]!;
      if (
        !p.every(
          (value: readonly number[]): boolean =>
            Math.abs(
              (value[0]! - a[0]) * (b[1] - a[1]) -
                (value[2]! - a[1]) * (b[0] - a[0]),
            ) < 1e-12 &&
            value[0]! >= Math.min(a[0], b[0]) - 1e-12 &&
            value[0]! <= Math.max(a[0], b[0]) + 1e-12 &&
            value[2]! >= Math.min(a[1], b[1]) - 1e-12 &&
            value[2]! <= Math.max(a[1], b[1]) + 1e-12,
        )
      )
        continue;
      for (let j: number = 0; j < 3; j++)
        add(faceEdges[f]!, ids[j]!, ids[(j + 1) % 3]!);
    }
  }
  if (!nclose(area, 8, 1e-10))
    failures.push(
      "Concave prism lateral area is " + area + ", expected8 square mm.",
    );
  for (let f: number = 0; f < CORNERS.length; f++) {
    const common: string[] = [...faceEdges[f]!.keys()].filter(
      (key: string): boolean => faceEdges[(f + 1) % CORNERS.length]!.has(key),
    );
    if (
      common.length === 0 ||
      common.some(
        (key: string): boolean =>
          faceEdges[f]!.get(key) !== 1 ||
          faceEdges[(f + 1) % CORNERS.length]!.get(key) !== 1,
      )
    )
      failures.push(
        "Neighboring original faces lost their actual common boundary.",
      );
  }
  const prepared: AutoMovieConstructionProfile.IPrepared = result.profiles![0]!;
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
    "actual atlas",
    [],
  );
  AutoMovieConstructionProfileBody.append(body, prepared, 0.02);
  const atlas: ReturnType<typeof AutoMovieSolidBody.atlas> =
    AutoMovieSolidBody.atlas(body);
  const next: ReturnType<typeof atlas.atlas.across> = atlas.atlas.across(
    0,
    0.5,
    1.1,
  );
  if (
    next?.face !== 1 ||
    next.u !== 0.5 ||
    next.v !== 0 ||
    !atlas.atlas.kept(0, 0.5, 0) ||
    atlas.atlas.kept(0, 0.5, -0.1) ||
    atlas.atlas.kept(0, -0.1, 0.5)
  )
    failures.push(
      "Body discarded the actual original atlas domain or neighbor map.",
    );
  if (AutoMovieSolidBody.atlas(body, 1).atlas.across(0, 0.5, 1.1) !== null)
    failures.push("An excluded original atlas neighbor was silently remapped.");
  const retained: IAutoMovieSolidSurface = prepared.surfaces.get("piece.0")!;
  const original: IAutoMovieSolidSurface = prepared.originals.get("piece.0")!;
  const outside: readonly number[] = original.point!(-0.5, -0.2);
  if (!nclose(outside[0]!, -0.4, 1e-12) || !nclose(outside[1]!, -0.5, 1e-12))
    failures.push(
      "Actual original neighborhood was replaced with its retained interval.",
    );
  let rejected: boolean = false;
  try {
    retained.point!(-0.5, -0.2);
  } catch {
    rejected = true;
  }
  if (
    !rejected ||
    !prepared.atlas.kept(0, 0.5, 0) ||
    prepared.atlas.kept(0, -0.5, 0.5) ||
    prepared.atlas.across(0, 0.5, 1.1)?.face !== 1
  )
    failures.push(
      "Retained atlas admission or actual neighbor address changed.",
    );
}

/** Both period-one and bounded quarter charts consume identical original collapsed topology. */
function cone(count: number, direction: 1 | -1, failures: string[]): void {
  const result: AutoMovieConstructionRealization.IRealization = realize(
    Made.cone(count, direction),
  );
  clean(result, failures);
  const edges: Map<string, number> = new Map();
  for (let id: number = 0; id < result.mesh.positions.length / 3; id++) {
    const p: readonly number[] = point(result, id);
    if (!nclose(p[0]! ** 2 + p[2]! ** 2, p[1]! ** 2, 1e-10))
      failures.push("A cap or wall vertex left the original cone.");
  }
  for (let i: number = 0; i < result.mesh.indices.length; i += 3) {
    const ids: number[] = result.mesh.indices.slice(i, i + 3);
    const p: [number, number, number][] = ids.map(
      (id: number): [number, number, number] => point(result, id),
    );
    const n: readonly number[] = normal(p);
    const centre: number[] = [0, 1, 2].map(
      (j: number): number =>
        p.reduce(
          (sum: number, v: readonly number[]): number => sum + v[j]!,
          0,
        ) / 3,
    );
    if (!(n[0]! * centre[0]! - n[1]! * centre[1]! + n[2]! * centre[2]! > 0))
      failures.push("Original cone winding faces inward.");
    for (let j: number = 0; j < 3; j++) add(edges, ids[j]!, ids[(j + 1) % 3]!);
  }
  let openCount: number = 0;
  for (const [key, incidence] of edges) {
    const ids: number[] = key.split("/").map(Number);
    if (incidence === 1) {
      openCount++;
      if (
        ids.some(
          (id: number): boolean => !nclose(point(result, id)[1], 1, 1e-12),
        )
      )
        failures.push("An actual collapsed tip retained an open boundary.");
    } else if (incidence !== 2)
      failures.push("Original cone has nonmanifold incidence.");
  }
  if (
    openCount === 0 ||
    !result.mesh.positions.some(
      (_value: number, i: number): boolean =>
        i % 3 === 1 && result.mesh.positions[i] === 0,
    )
  )
    failures.push("Regular top was capped or actual bottom tip omitted.");
  const profile: AutoMovieConstructionProfile.IPrepared = result.profiles![0]!;
  const original: IAutoMovieSolidSurface = profile.originals.get("piece.0")!;
  const piece: IAutoMovieConstructionProfile.IPiece =
    profile.definition.loops[0]!.pieces[0]!;
  const angle: number =
    ((2 * Math.PI) / 3) *
    (piece.clock[direction === 1 ? 0 : 1] +
      direction * (piece.clock[1] - piece.clock[0]) * 1.2 -
      2);
  const alias: readonly number[] = original.point!(0.4, 1.2);
  if (
    original.period !== count ||
    !nclose(alias[0]!, 0.4 * Math.cos(angle), 1e-12) ||
    !nclose(alias[2]!, 0.4 * Math.sin(angle), 1e-12)
  )
    failures.push(
      "The actual original periodic neighborhood lost its piece clock scale.",
    );
  let rejected: boolean = false;
  try {
    profile.originals.get("piece.0")!.jet(0, 0);
  } catch {
    rejected = true;
  }
  if (!rejected)
    failures.push("The actual collapsed tip received fabricated physical2.");
}

/** Every publication and emitted vertex retains its genuine original owner coordinates. */
function clean(
  result: AutoMovieConstructionRealization.IRealization,
  failures: string[],
): void {
  if (result.diagnostics.length !== 0 || result.mesh.indices.length === 0)
    failures.push(
      "Actual profile ingress refused: " + JSON.stringify(result.diagnostics),
    );
  const owners: Map<string, IAutoMovieSolidSurface> = new Map(
    result.surfaces.map(
      (surface: IAutoMovieSolidSurface): [string, IAutoMovieSolidSurface] => [
        surface.name,
        surface,
      ],
    ),
  );
  const used: Set<number> = new Set(result.mesh.indices);
  for (let id: number = 0; id < result.mesh.positions.length / 3; id++) {
    const c: number[] = result.mesh.coordinates.slice(3 * id, 3 * id + 3);
    const expected: readonly number[] = owners.get(result.mesh.owners[c[0]!]!)!
      .point!(c[1]!, c[2]!);
    if (
      !used.has(id) ||
      point(result, id).some(
        (value: number, i: number): boolean =>
          !nclose(value, expected[i]!, 1e-10),
      )
    )
      failures.push(
        "A real skin vertex lost its source replay or remained unused.",
      );
  }
}

/** Initial source failures roll back already registered original owners and faces. */
function refused(failures: string[]): void {
  Made.cutCap(failures);
  const source: IAutoMovieConstructionProfileSource = Made.prism();
  const branch: IAutoMovieConstructionProfileSource = Made.cone(1, 1);
  const rolled: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction(
      { name: "rollback", root: Made.rollbackTree(branch.definition) },
      {
        chord: 0.00002,
        sources: new Map([["outer.host", Native.source("outer.host", 16, 16)]]),
        profiles: new Map([[branch.definition.name, branch]]),
      },
    );
  if (
    rolled.body.faces.length !== 1 ||
    rolled.body.faces[0]!.chain !== "outer.host" ||
    rolled.body.points.length !== 0 ||
    rolled.profiles?.length !== 0 ||
    rolled.chains.length !== 1 ||
    rolled.surfaces.length !== 1 ||
    rolled.mesh.owners.some((name: string): boolean => name !== "outer.host") ||
    !rolled.diagnostics.some(
      (item: (typeof rolled.diagnostics)[number]): boolean =>
        item.node === "outer",
    )
  )
    failures.push(
      "Outer join rollback retained profile geometry, original owners or records.",
    );
  const root: AutoMovieConstructionNode = {
    type: "profile",
    ...structuredClone(source.definition),
  };
  const absent: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "absent", root }, { chord: 0.00002 });
  atomic(absent, failures);
  source.definition.revisions.source = "changed";
  atomic(
    realizeAutoMovieConstruction(
      { name: "mismatch", root },
      { chord: 0.00002, profiles: new Map([["L", source]]) },
    ),
    failures,
  );
  const missing: IAutoMovieConstructionProfileSource = Made.prism();
  const curve: IAutoMovieConstructionProfileSource.ICurve =
    missing.curves.get("source.3")!;
  missing.curves = new Map(missing.curves).set("source.3", {
    ...curve,
    jet: (): null => null,
  });
  atomic(realize(missing), failures);
  const collapse: IAutoMovieConstructionProfileSource = Made.prism();
  collapse.definition.loops[0]!.pole = "bottom";
  atomic(realize(collapse), failures);
  const foreign: IAutoMovieConstructionProfileSource = Made.prism();
  foreign.curves = new Map(foreign.curves).set("source.3", {
    ...curve,
    point: (): never => {
      throw new Error("actual original failure");
    },
  });
  const failed: AutoMovieConstructionRealization.IRealization =
    realize(foreign);
  atomic(failed, failures);
  if (
    !failed.diagnostics.some(
      (item: (typeof failed.diagnostics)[number]): boolean =>
        item.detail.includes("actual original failure"),
    )
  )
    failures.push(
      "Initial original exception disappeared from its named leaf diagnostic.",
    );
}

/** A refused original leaf publishes no fallback geometry or retained source record. */
function atomic(
  result: AutoMovieConstructionRealization.IRealization,
  failures: string[],
): void {
  if (
    result.diagnostics.length === 0 ||
    result.body.faces.length !== 0 ||
    result.mesh.positions.length !== 0 ||
    result.mesh.indices.length !== 0 ||
    result.mesh.owners.length !== 0 ||
    (result.profiles?.length ?? 0) !== 0
  )
    failures.push("Refused profile source left partial publication.");
}

/** World mm coordinates are independent of unchanged native chart units. */
function point(
  result: AutoMovieConstructionRealization.IRealization,
  id: number,
): [number, number, number] {
  return result.mesh.positions
    .slice(3 * id, 3 * id + 3)
    .map((value: number): number => 1000 * value) as [number, number, number];
}

/** Independent triangle cross products observe emitted winding and area only. */
function normal(p: readonly (readonly number[])[]): [number, number, number] {
  const a: number[] = [0, 1, 2].map(
    (k: number): number => p[1]![k]! - p[0]![k]!,
  );
  const b: number[] = [0, 1, 2].map(
    (k: number): number => p[2]![k]! - p[0]![k]!,
  );
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

/** Incidence is counted on authoritative IDs rather than compared positions. */
function add(edges: Map<string, number>, a: number, b: number): void {
  const key: string = Math.min(a, b) + "/" + Math.max(a, b);
  edges.set(key, (edges.get(key) ?? 0) + 1);
}

/** Domain authorities preserve actual open rims, reject interior cuts and leave all mesh buffers unchanged on refusal. */
function authorities(failures: string[]): void {
  const good: ReturnType<typeof Made.authorities> = Made.authorities(true);
  const open: AutoMovieSolidMesh.IOpen[] = AutoMovieSolidMesh.face(
    good.mesh,
    good.input,
  );
  if (
    open.length !== 1 ||
    open[0]!.vertices.length !== 4 ||
    open[0]!.vertices.some(
      (id: number): boolean =>
        !good.input.domainLoops![0]!.vertices.includes(id),
    )
  )
    failures.push(
      "Actual domain authorities became trim edges or lost shared identity.",
    );
  const cut: ReturnType<typeof Made.authorities> = Made.authorities();
  cut.input.loops = cut.input.domainLoops!;
  if (AutoMovieSolidMesh.face(cut.mesh, cut.input).length !== 0)
    failures.push(
      "A real coincident cutting loop was reclassified as a cap endpoint.",
    );
  for (const mode of ["diagonal", "outside", "role", "missing"]) {
    const made: ReturnType<typeof Made.authorities> = Made.authorities();
    const loop: AutoMovieSolidMesh.ILoop = made.input.domainLoops![0]!;
    if (mode === "diagonal") {
      loop.vertices = [0, 2, 1, 3];
      loop.chart = [
        [0, 0],
        [1, 1],
        [1, 0],
        [0, 1],
      ];
    }
    if (mode === "outside") made.input.stations = [0, 0.5];
    if (mode === "role") loop.kind = "hole";
    if (mode === "missing") loop.vertices[0] = 99;
    const before: string = JSON.stringify(made.mesh);
    let thrown: unknown;
    try {
      AutoMovieSolidMesh.face(made.mesh, made.input);
    } catch (error: unknown) {
      thrown = error;
    }
    if (!(thrown instanceof Error) || JSON.stringify(made.mesh) !== before)
      failures.push(
        mode +
          ": invalid domain authority was accepted or changed mesh buffers.",
      );
  }
}
