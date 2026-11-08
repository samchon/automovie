import { type AutoMovieConstructionRealization, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieVector3 } from "@automovie/interface";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/** Either explicitly requested realization result; the default type still requires its mesh. */
type Result = AutoMovieConstructionRealization.IRealization | AutoMovieConstructionRealization.IWithoutSkin;

/**
 * Final skin omission preserves the construction's operators, boundary publication and failures.
 * Scenarios:
 * 1. Compare default, true, false and variable requests across every construction node kind and rollback.
 * 2. Read independent cylinder guides, shared continuation points and radial trim feet, then refuse malformed admission.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public realizer in omitted, true, false and runtime-boolean modes on open/capped views, a nested merge, continuation, trim and rejected join. Reads actual mesh/null, boundary records, chains, diagnostics and surface/trim jets; default/true retain equal real buffers, while false retains the same boundary data without a placeholder mesh. Compiler assignments also require the default, literal false and general overloads to retain their distinct contracts.
 * @evidence contracts/testing.md#independent-expectations A 20 mm cylinder's four guide points are (20 cos phi,20 sin phi,-station); the 1e-7 mm guide limit is 1e-9 of its 100 mm length. A continuation shares one authoritative ring. A radial landmark's foot lies on the same radius, with 2e-4 mm allowed by twice the unchanged 0.1 mm chord/1000 foot tolerance. Cross-mode record/mesh comparisons are a separate compatibility oracle, not proof of all source geometry, triangulation or pole fidelity; the existing construction specs own those checks. A deliberately shifted expected cylinder must fail the analytic reader.
 * @evidence contracts/testing.md#distinguishing-cases Covers absent/true/false and variable flags, no-boundary open/capped views, nonempty shared boundaries from merges/continuation/trim, rollback of a disjoint part, input preservation, nonpositive/NaN chord refusal and duplicate/missing-face refusal. The default pole, merge, trim and surface-jet specifications remain in construction_ and are not replaced or relaxed.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by --include construction_without_skin; all trees are authored analytic data in process, with no Human person generation, runtime patch, process, browser or GPU.
 */
export function test_construction_without_skin(): void {
  /** Findings collected across all authored cases before one refusal. */
  const failures: string[] = [];

  /** Each supported node kind and the failed attaching node's rollback. */
  const cases: [string, AutoMovieConstructionNode][] = [
    ["open", ConstructionShapes.cylinder("tube", ConstructionShapes.DOWN, 0.02, 0.1)],
    ["poles", ConstructionShapes.ellipsoid("egg", ConstructionShapes.DOWN, 0.03, 0.02, 0.05)],
    ["join", ConstructionShapes.assembly(1, "left")],
    ["continue", continuation()],
    ["trim", trimmed()],
    ["rollback", apart()],
  ];
  for (const [name, root] of cases) {
    try {
      /** Original authored data, not an output snapshot oracle. */
      const before: string = JSON.stringify(root);

      /** Omitted and true flags retain the required full-mesh return type. */
      const normal: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name, root }, { chord: 1e-4 });

      /** Explicit true retains that same required-mesh contract. */
      const enabled: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name, root }, { chord: 1e-4, skin: true });

      /** A literal false call has a statically null mesh. */
      const without: AutoMovieConstructionRealization.IWithoutSkin = realizeAutoMovieConstruction({ name, root }, { chord: 1e-4, skin: false });
      if (normal.mesh.positions.length === 0 || normal.mesh.indices.length === 0) failures.push(`${name}: default made no real mesh`);
      if (JSON.stringify(normal.mesh) !== JSON.stringify(enabled.mesh)) failures.push(`${name}: true changed the default mesh`);
      if (without.mesh !== null) failures.push(`${name}: false returned a mesh`);
      compare(normal, without, name, failures);

      /** The general overload must admit both full and unskinned outcomes. */
      const general: ReturnType<typeof realizeAutoMovieConstruction>[] = [normal, without];
      if (general[0]!.mesh === null || general[1]!.mesh !== null) failures.push(`${name}: general result lost a mode`);
      for (const skin of [false, true]) {
        /** A boolean variable cannot promise a nonnull mesh. */
        const dynamic: ReturnType<typeof realizeAutoMovieConstruction> = realizeAutoMovieConstruction({ name, root }, { chord: 1e-4, skin });
        if ((dynamic.mesh !== null) !== skin) failures.push(`${name}: variable ${skin} returned the wrong mode`);
        if (dynamic.mesh !== null && JSON.stringify(dynamic.mesh) !== JSON.stringify(normal.mesh)) failures.push(`${name}: variable true changed the default mesh`);
        compare(normal, dynamic, `${name}/variable ${skin}`, failures);
      }
      if (JSON.stringify(root) !== before) failures.push(`${name}: an input record changed`);
      if (name === "open") {
        failures.push(...tube(without, 0));
        if (tube(without, 1).length === 0) failures.push("proof: a shifted cylinder passed the analytic reader");
      }
      if (name === "continue") ring(without, failures);
      if (name === "trim") feet(without, failures);
      if (name === "rollback") {
        if (without.chains.map((chain: IAutoMovieLoftChain): string => chain.name).join(",") !== "beam" || without.joins.length !== 0 || without.body.faces.length !== 1)
          failures.push("rollback: the rejected subtree remains");
        if (!without.diagnostics.some((diagnostic: { node: string }): boolean => diagnostic.node === "blend.post")) failures.push("rollback: the rejected join has no diagnostic");
      } else if (without.diagnostics.length !== 0) failures.push(`${name}: ${JSON.stringify(without.diagnostics)}`);
    } catch (error) {
      failures.push(`${name}: threw ${String(error)}`);
    }
  }
  refusals(failures);
  if (failures.length !== 0) throw new Error(`${failures.length} unskinned realization findings:\n${failures.join("\n")}`);
}

/** Compare retained numerical records and surface jets; geometry truth is checked separately. */
function compare(full: Result, other: Result, name: string, failures: string[]): void {
  /** The output data used by calibration and its existing operator readers. */
  const data: (result: Result) => string = (result: Result): string => JSON.stringify({
    name: result.name,
    chains: result.chains,
    surfaces: result.surfaces.map((surface: IAutoMovieSolidSurface): string => surface.name),
    joins: result.joins.map((join: AutoMovieConstructionRealization.IJoin): unknown[] => [join.name, join.hostFace, join.partFace, join.join.curve.points, join.blend.chain]),
    trims: result.trims.map((trim: Result["trims"][number]): unknown[] => [trim.surface, ...[0, Math.PI / 2, Math.PI].map((phase: number): unknown => trim.at(phase))]),
    body: result.body,
    diagnostics: result.diagnostics,
  });
  if (data(full) !== data(other)) failures.push(`${name}: retained data changed`);

  /** View and blend chains give each surface's interior station range. */
  const chains: IAutoMovieLoftChain[] = [...full.chains, ...full.joins.map((join: AutoMovieConstructionRealization.IJoin): IAutoMovieLoftChain => join.blend.chain)];
  for (const chain of chains) {
    /** Corresponding public surface functions from both modes. */
    const a: IAutoMovieSolidSurface | undefined = full.surfaces.find((surface: IAutoMovieSolidSurface): boolean => surface.name === chain.name);

    /** The same named surface retained by the compared request. */
    const b: IAutoMovieSolidSurface | undefined = other.surfaces.find((surface: IAutoMovieSolidSurface): boolean => surface.name === chain.name);
    if (a === undefined || b === undefined) {
      failures.push(`${name}: missing surface ${chain.name}`);
      continue;
    }
    for (const share of [0.37, 0.63]) {
      /** Strictly interior station, avoiding a physical pole singularity. */
      const station: number = chain.layers[0]!.y + share * (chain.layers[chain.layers.length - 1]!.y - chain.layers[0]!.y);
      for (const phase of [0, 1.3, Math.PI]) {
        /** Ordered value, station/phase and second derivative components. */
        const x: IAutoMovieSolidSurface.IJet = a.jet(station, phase);

        /** The compared mode at the identical kernel-mm/radian chart point. */
        const y: IAutoMovieSolidSurface.IJet = b.jet(station, phase);
        for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
          for (let k: number = 0; k < 3; k++)
            if (!Number.isFinite(x[key][k]) || !Object.is(x[key][k], y[key][k])) failures.push(`${name}: ${chain.name} ${key}[${k}] changed or is nonfinite`);
      }
    }
  }
}

/** Independent guide points on the authored cylinder, optionally shifted for the red proof. */
function tube(result: Result, shift: number): string[] {
  /** Cylinder's actual public surface and independent findings. */
  const surface: IAutoMovieSolidSurface | undefined = result.surfaces.find((entry: IAutoMovieSolidSurface): boolean => entry.name === "tube");

  /** Every analytic guide miss, including nonfinite values through the negated bound. */
  const failures: string[] = [];
  if (surface === undefined) return ["cylinder surface absent"];
  for (const phase of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
    /** The four guide phases are exact knots of the circular section. */
    const point: [number, number, number] = surface.jet(50, phase).p;

    /** Euclidean discrepancy from the independently shifted expected guide, mm. */
    const miss: number = Math.hypot(point[0] - 20 * Math.cos(phase) - shift, point[1] - 20 * Math.sin(phase), point[2] + 50);
    if (!(miss <= 1e-7)) failures.push(`cylinder guide ${phase}: ${miss} mm`);
  }
  return failures;
}

/** The continuation publishes one shared ring with independently known guide points. */
function ring(result: Result, failures: string[]): void {
  /** Two cycles must address the same authoritative boundary vertices. */
  const host: Result["body"]["faces"][number] | undefined = result.body.faces.find((face: Result["body"]["faces"][number]): boolean => face.chain === "trunk");

  /** The continuing face whose end refers to that same ring. */
  const part: Result["body"]["faces"][number] | undefined = result.body.faces.find((face: Result["body"]["faces"][number]): boolean => face.chain === "neck");
  if (host === undefined || part === undefined || host.cycles[0] === undefined || part.cycles[0] === undefined || host.cycles[0].points.length === 0) {
    failures.push("continuation has no shared boundary");
    return;
  }
  if (JSON.stringify(host.cycles[0].points) !== JSON.stringify(part.cycles[0].points)) failures.push("continuation copied rather than shared the ring addresses");

  /** Host-owned station/phase data must evaluate to the 20 mm ring at station 100 mm. */
  const surface: IAutoMovieSolidSurface | undefined = result.surfaces.find((entry: IAutoMovieSolidSurface): boolean => entry.name === "trunk");
  if (surface === undefined) return void failures.push("continuation host surface absent");
  for (const phase of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
    /** Only the four exact circular guide knots are used as analytic positions. */
    const point: Result["body"]["points"][number] | undefined = result.body.points.find((entry: Result["body"]["points"][number]): boolean => entry.chain === "trunk" && Math.abs(entry.chart[1] - phase) < 1e-12);
    if (point === undefined || point.chart[0] !== 100) {
      failures.push(`continuation lacks guide ${phase} at station 100`);
      continue;
    }

    /** Actual published coordinates, not a reconstructed ring. */
    const p: [number, number, number] = surface.jet(point.chart[0], point.chart[1]).p;
    if (!(Math.hypot(p[0] - 20 * Math.cos(phase), p[1] - 20 * Math.sin(phase), p[2] + 100) <= 1e-7)) failures.push(`continuation guide ${phase} misses the analytic ring`);
  }
}

/** A radial landmark's independent foot remains in the actual published trim boundary. */
function feet(result: Result, failures: string[]): void {
  /** Nonempty trim publication, alongside the retained trim operator. */
  const face: Result["body"]["faces"][number] | undefined = result.body.faces.find((entry: Result["body"]["faces"][number]): boolean => entry.chain === "tube");

  /** Surface evaluating the published radial feet. */
  const surface: IAutoMovieSolidSurface | undefined = result.surfaces.find((entry: IAutoMovieSolidSurface): boolean => entry.name === "tube");
  if (result.trims.length !== 1 || face?.cycles[0]?.kind !== "hole" || result.body.points.length === 0 || surface === undefined) {
    failures.push("trim lost its operator or published boundary");
    return;
  }
  for (let k: number = 0; k < 8; k++) {
    /** Authored knot parameters and exact radial foot in kernel millimetres. */
    const t: number = 2 * Math.PI * k / 8;

    /** A guide or adjacent exact cubic knot, radians. */
    const phase: number = [1, 1, 0, -1, -1, -1, 0, 1][k]! * 2 * Math.PI / 16;

    /** Authored knot's independent axial coordinate, mm. */
    const station: number = 50 + 10 * Math.sin(t);

    /** Closest published boundary sample to this analytic foot, mm. */
    let best: number = Infinity;
    for (const point of result.body.points) {
      if (point.chain !== "tube") continue;

      /** Evaluate the boundary that publish actually retained. */
      const p: [number, number, number] = surface.jet(point.chart[0], point.chart[1]).p;
      best = Math.min(best, Math.hypot(p[0] - 20 * Math.cos(phase), p[1] - 20 * Math.sin(phase), p[2] + station));
    }
    if (!(best <= 2e-4)) failures.push(`trim foot ${k}: ${best} mm`);
  }
}

/** The ordinary top-to-bottom continuation, with different interior radii. */
function continuation(): AutoMovieConstructionNode {
  return { type: "continue", name: "join.neck", host: ConstructionShapes.cylinder("trunk", ConstructionShapes.DOWN, 0.02, 0.1), hostFace: "trunk", hostEnd: "top", part: ConstructionShapes.cylinder("neck", { ...ConstructionShapes.DOWN, origin: { x: 0, y: 0, z: -0.1 } }, 0.015, 0.06), partFace: "neck", partEnd: "bottom" };
}

/** The existing trim specification's radial, exact-knot landmarks on a 20 mm cylinder. */
function trimmed(): AutoMovieConstructionNode {
  /** Eight authored landmarks, lifted 0.5 mm radially from their exact knot phases. */
  const phases: number[] = [1, 1, 0, -1, -1, -1, 0, 1].map((k: number): number => k * 2 * Math.PI / 16);
  return {
    type: "trim", name: "slot", host: ConstructionShapes.cylinder("tube", ConstructionShapes.DOWN, 0.02, 0.1), face: "tube",
    landmarks: phases.map((phase: number, k: number): IAutoMovieVector3 => ({ x: 0.0205 * Math.cos(phase), y: 0.0205 * Math.sin(phase), z: -(0.05 + 0.01 * Math.sin(2 * Math.PI * k / 8)) })),
    guesses: phases.map((phase: number, k: number): [number, number] => [0.05 + 0.01 * Math.sin(2 * Math.PI * k / 8) + 0.001, phase + 0.01]),
  };
}

/** A post that misses its beam, retaining the beam alone after rollback. */
function apart(): AutoMovieConstructionNode {
  return ConstructionShapes.join("merge", "blend.post", ConstructionShapes.cylinder("beam", { origin: { x: -0.1, y: 0, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } }, 0.03, 0.2), ConstructionShapes.cylinder("post", { origin: { x: 0, y: 0.2, z: 0 }, u: { x: 0, y: 1, z: 0 }, v: { x: 1, y: 0, z: 0 } }, 0.015, 0.08), { partFace: "post", hostFace: "beam", part: [0.031, Math.PI / 2], host: [0.115, 0.01] }, { part: { type: "chord", value: 0.005 }, host: { type: "chord", value: 0.005 } });
}

/** Chord and tree admission remain the same before either mode can do operator work. */
function refusals(failures: string[]): void {
  /** Structural negative cases are isolated from geometric diagnostics. */
  const duplicate: AutoMovieConstructionNode = continuation();
  if (duplicate.type !== "continue" || duplicate.part.type !== "view") throw new Error("authored continuation fixture changed");
  duplicate.part.name = "trunk";

  /** A valid continuation shape whose named host face is structurally absent. */
  const missing: AutoMovieConstructionNode = continuation();
  if (missing.type !== "continue") throw new Error("authored continuation fixture changed");
  missing.hostFace = "absent";

  /** One authored input per unchanged structural or chord-admission rule. */
  const cases: [string, AutoMovieConstructionNode, number][] = [
    ["used twice", duplicate, 1e-4], ["not a face", missing, 1e-4],
    ["not positive", ConstructionShapes.cylinder("tube", ConstructionShapes.DOWN, 0.02, 0.1), 0],
    ["not positive", ConstructionShapes.cylinder("tube", ConstructionShapes.DOWN, 0.02, 0.1), -1e-4],
    ["not positive", ConstructionShapes.cylinder("tube", ConstructionShapes.DOWN, 0.02, 0.1), NaN],
  ];
  for (const [message, root, chord] of cases)
    for (const skin of [false, true]) {
      /** The actual thrown admission message, not a swallowed success. */
      let observed: string | null = null;
      try {
        realizeAutoMovieConstruction({ name: "refused", root }, { chord, skin });
      } catch (error) {
        observed = String(error);
      }
      if (observed === null || !observed.includes(message)) failures.push(`admission ${message}/${skin}: ${observed}`);
    }
}
