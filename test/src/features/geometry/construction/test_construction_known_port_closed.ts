import {
  AutoMovieConstructionKnownPort,
  AutoMovieSolidMesh,
  type IAutoMovieConstructionKnownPortSource,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { ConstructionKnownPortCircular as Made } from "../../internal/construction/ConstructionKnownPortCircular";
import { nclose } from "../../internal/nclose";

/**
 * Closed original ports reach the existing periodic seam and both real face meshes.
 *
 * Scenarios:
 * 1. The plane/cylinder original fields give radius2-w+y(w), where
 *    y=-10w³+25w⁴-21w⁵+6w⁶. Every kernel (w,clock) total2 vector, its actual
 *    second-coordinate period and outward orientation use independent equations.
 *    Clocks [0,2pi], [-pi,pi], [0,1] and [2,5] retain offsets and every derivative scale.
 * 2. Swapping parent/child and reversing the actual transverse maps gives
 *    B_inverse(w,t)=B(1-w,t), with both mixed/first signs reversed correctly.
 * 3. The existing SolidMesh.seam then both SolidMesh.face consumers use one
 *    authoritative index per rail point. Each face-side edge has incidence1
 *    opposite the band's edge, and actual adjacent vertices retain that face's
 *    independent plane/cylinder law. Pole fans and positional welds are absent.
 * 4. Published material/binding addresses and actual original field/map objects
 *    survive. Their presence does not establish evaluated skeletal weights.
 * 5. Open or unoriented bands and malformed columns refuse before mesh writes;
 *    an actual source exception restores the existing mesh and retains identity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads closed KnownPort surface jets and Point0, then actual legacy seam plus both source-face meshes; observes each rail's two independent triangle populations and source geometry.
 * @evidence contracts/development/testing.md#independent-expectations Plane and unit-cylinder equations yield the explicit sixth-degree radial/vertical band polynomial. Its derivatives determine all six vectors within2e-10 arithmetic allowance. Shared mesh indices, incidence and opposite edge directions are exact combinatorial expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Closed periodic versus existing open port, both rails/interior, inverse transverse ownership, kernel period/order/sign, actual source addresses and both face-side strips distinguish a scalar/metadata-only pass. Existing open/null/rank/domain/foreign questions retain negative contracts.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU construction_known_port_closed question uses made original fields and existing tessellation only; no Human generation, host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The plane/cylinder original fields give radius2-w+y(w), where).
 */
export function test_construction_known_port_closed(): void {
  const failures: string[] = [];
  const native: IAutoMovieConstructionKnownPortSource = Made.create();
  const originals: IAutoMovieConstructionKnownPortSource[] = [
    native,
    Made.clock(native, [-Math.PI, Math.PI]),
    Made.clock(native, [0, 1]),
    Made.clock(native, [2, 5]),
  ];
  for (const original of originals)
    for (const inverse of [false, true]) {
      const source: IAutoMovieConstructionKnownPortSource = inverse
        ? Made.inverse(original)
        : original;
      const band: AutoMovieConstructionKnownPort.IPrepared =
        AutoMovieConstructionKnownPort(source);
      const period: number = source.definition.period!;
      const start: number = source.definition.domain[0];
      const factor: number = (2 * Math.PI) / period;
      if (
        band.period !== period ||
        band.domain?.[0] !== 0 ||
        band.domain[1] !== 1 ||
        band.orientation !== (inverse ? -1 : 1)
      )
        failures.push(
          "Kernel transverse/period/outward metadata changed meaning.",
        );
      for (const w of [0, 0.11, 0.5, 0.89, 1])
        for (const share of [0, 0.17, 0.51, 0.83, 1]) {
          const t: number = start + period * share;
          const expected: IAutoMovieSolidSurface.IJet = Made.oracle(
            inverse ? 1 - w : w,
            2 * Math.PI * share,
          );
          const actual: IAutoMovieSolidSurface.IJet = band.jet(w, t);
          for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const) {
            const scale: number =
              (key === "vv"
                ? factor * factor
                : key === "v" || key === "uv"
                  ? factor
                  : 1) * (inverse && (key === "u" || key === "uv") ? -1 : 1);
            vector(
              actual[key],
              expected[key].map((v: number): number => scale * v),
              failures,
            );
          }
          vector(band.point!(w, t), expected.p, failures);
        }
      for (const side of ["parent", "child"] as const) {
        const key: typeof source.definition.parent = source.definition[side];
        if (
          band.rails[side].field !== source.fields.get(key.field) ||
          band.rails[side].map !== source.maps.get(key.map) ||
          band.definition[side].binding !== "skin.binding" ||
          band.definition[side].material !== key.material
        )
          failures.push(
            "An actual rail owner or its material/binding address was replaced.",
          );
      }
      mesh(band, inverse, failures);
    }
  admission(native, failures);
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Closed seam admission precedes writes; later original failures restore the same append checkpoint. */
function admission(
  source: IAutoMovieConstructionKnownPortSource,
  failures: string[],
): void {
  const band: AutoMovieConstructionKnownPort.IPrepared =
    AutoMovieConstructionKnownPort(source);
  const angles: number[] = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const seam: AutoMovieSolidMesh.ISeam = {
    host: band.rails.parent.field,
    part: band.rails.child.field,
    blend: band,
    length: 1,
    rows: 4,
    hostLoop: {
      kind: "hole",
      chart: angles.map((t: number): [number, number] => [
        2 * Math.cos(t),
        2 * Math.sin(t),
      ]),
    },
    partLoop: {
      kind: "start",
      chart: angles.map((t: number): [number, number] => [0, t]),
    },
  };
  const cases: AutoMovieSolidMesh.ISeam[] = [
    { ...seam, blend: { ...band, period: undefined } },
    { ...seam, blend: { ...band, orientation: undefined as unknown as 1 } },
    { ...seam, phases: [] },
    { ...seam, phases: [0, 1, 1, 2] },
    { ...seam, phases: [0, 1, 2, Infinity] },
    { ...seam, phases: [0, 1, 2, 7] },
    {
      ...seam,
      host: {
        ...seam.host,
        jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
          ...seam.host.jet(u, v),
          p: [NaN, 0, 0],
        }),
      },
    },
  ];
  for (const input of cases) {
    const output: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
    let caught: unknown;
    try {
      AutoMovieSolidMesh.seam(output, input);
    } catch (error: unknown) {
      caught = error;
    }
    if (
      !(caught instanceof Error) ||
      output.positions.length !== 0 ||
      output.indices.length !== 0 ||
      output.coordinates.length !== 0 ||
      output.owners.length !== 0
    )
      failures.push(
        "A failed closed seam wrote a partial mesh or accepted an unsupported premise.",
      );
  }
  const output: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const owner: number = AutoMovieSolidMesh.owner(output, seam.host);
  AutoMovieSolidMesh.vertex(output, [3, 0, 3], owner, 3, 3);
  const positions: number[] = output.positions.slice();
  const coordinates: number[] = output.coordinates.slice();
  const marker: Error = new Error("actual original neighboring field");
  let calls: number = 0;
  const broken: IAutoMovieSolidSurface = {
    ...band,
    jet: (w: number, t: number): IAutoMovieSolidSurface.IJet => {
      if (++calls === 3) throw marker;
      return band.jet(w, t);
    },
  };
  let caught: unknown;
  try {
    AutoMovieSolidMesh.seam(output, { ...seam, blend: broken });
  } catch (error: unknown) {
    caught = error;
  }
  if (
    caught !== marker ||
    output.positions.length !== positions.length ||
    output.positions.some(
      (value: number, k: number): boolean => value !== positions[k],
    ) ||
    output.coordinates.length !== coordinates.length ||
    output.coordinates.some(
      (value: number, k: number): boolean => value !== coordinates[k],
    ) ||
    output.indices.length !== 0 ||
    output.owners.length !== 1 ||
    output.owners[0]!.name !== seam.host.name
  )
    failures.push(
      "An original seam exception changed identity or its existing mesh checkpoint.",
    );
}

/** Read the actual seam, parent cut and child start through existing mesh consumers. */
function mesh(
  band: AutoMovieConstructionKnownPort.IPrepared,
  inverse: boolean,
  failures: string[],
): void {
  const output: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const phases: number[] = Array.from(
    { length: 24 },
    (_: unknown, k: number): number => (2 * Math.PI * k) / 24,
  );
  const clocks: number[] = phases.map(
    (t: number): number =>
      band.definition.domain[0] + (t / (2 * Math.PI)) * band.definition.period!,
  );
  const parent: IAutoMovieSolidSurface =
    band.rails[inverse ? "child" : "parent"].field;
  const child: IAutoMovieSolidSurface =
    band.rails[inverse ? "parent" : "child"].field;
  const planeChart: [number, number][] = phases.map(
    (t: number): [number, number] => [2 * Math.cos(t), 2 * Math.sin(t)],
  );
  const cylinderChart: [number, number][] = phases.map(
    (t: number): [number, number] => [0, t],
  );
  const joined: AutoMovieSolidMesh.IJoined = AutoMovieSolidMesh.seam(output, {
    host: band.rails.parent.field,
    part: band.rails.child.field,
    blend: band,
    length: 1,
    rows: 8,
    phases: clocks,
    hostLoop: {
      kind: inverse ? "start" : "hole",
      chart: inverse ? cylinderChart : planeChart,
    },
    partLoop: {
      kind: inverse ? "hole" : "start",
      chart: inverse ? planeChart : cylinderChart,
    },
  });
  const bandEnd: number = output.indices.length;
  for (let i: number = 0; i < bandEnd; i += 3) {
    const ids: number[] = output.indices.slice(i, i + 3);
    const p: number[][] = ids.map((id: number): number[] => point(output, id));
    const w: number =
      ids.reduce(
        (sum: number, id: number): number =>
          sum +
          (output.owners[output.coordinates[3 * id]!]!.name === band.name
            ? output.coordinates[3 * id + 1]!
            : output.owners[output.coordinates[3 * id]!]!.name === parent.name
              ? inverse
                ? 1
                : 0
              : inverse
                ? 0
                : 1),
        0,
      ) / 3;
    const t: number = Math.atan2(
      p[0]![2]! + p[1]![2]! + p[2]![2]!,
      p[0]![0]! + p[1]![0]! + p[2]![0]!,
    );
    const expected: IAutoMovieSolidSurface.IJet = Made.oracle(
      inverse ? 1 - w : w,
      t,
    );
    const normal: number[] = cross(sub(p[1]!, p[0]!), sub(p[2]!, p[0]!));
    const outward: number[] = cross(expected.u, expected.v);
    if (
      !(
        normal.reduce(
          (sum: number, value: number, k: number): number =>
            sum + value * outward[k]!,
          0,
        ) > 0
      )
    )
      failures.push(
        "The actual band triangle opposes its independent source outward normal.",
      );
  }
  const planeRail: AutoMovieSolidMesh.ILoop = inverse
    ? joined.part
    : joined.host;
  const cylinderRail: AutoMovieSolidMesh.ILoop = inverse
    ? joined.host
    : joined.part;
  const planeOpen: AutoMovieSolidMesh.IOpen[] = AutoMovieSolidMesh.face(
    output,
    {
      surface: parent,
      stations: [-3, -1.4, 0.2, 1.6, 3],
      phases: [-3, -1.4, 0.2, 1.6, 3],
      loops: [planeRail],
      onFailure: (detail: string): void => {
        failures.push("parent: " + detail);
      },
    },
  );
  const parentEnd: number = output.indices.length;
  const cylinderOpen: AutoMovieSolidMesh.IOpen[] = AutoMovieSolidMesh.face(
    output,
    {
      surface: child,
      stations: [0, 0.25, 0.5, 0.75, 1],
      phases,
      loops: [cylinderRail],
      onFailure: (detail: string): void => {
        failures.push("child: " + detail);
      },
    },
  );
  const childEnd: number = output.indices.length;
  if (planeOpen.length !== 1 || cylinderOpen.length !== 1)
    failures.push(
      "A closed port left an unshared internal rim or lost an external open rim.",
    );
  strip(
    output,
    planeRail.vertices,
    0,
    bandEnd,
    bandEnd,
    parentEnd,
    true,
    failures,
  );
  strip(
    output,
    cylinderRail.vertices,
    0,
    bandEnd,
    parentEnd,
    childEnd,
    false,
    failures,
  );
  for (let k: number = 0; k < output.positions.length / 3; k++) {
    const owner: AutoMovieSolidMesh.IOwner =
      output.owners[output.coordinates[3 * k]!]!;
    const p: number[] = point(output, k);
    vector(
      p,
      owner.point(
        output.coordinates[3 * k + 1]!,
        output.coordinates[3 * k + 2]!,
      ),
      failures,
    );
  }
}

/** Independent chord vector, used only to observe emitted winding. */
function sub(a: readonly number[], b: readonly number[]): number[] {
  return a.map((value: number, k: number): number => value - b[k]!);
}

/** Independent cross product, used only by the output observer. */
function cross(a: readonly number[], b: readonly number[]): number[] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

/** Separate each face's actual adjacent strip from the band's triangle population. */
function strip(
  output: AutoMovieSolidMesh.IMesh,
  rail: number[],
  a0: number,
  a1: number,
  b0: number,
  b1: number,
  parent: boolean,
  failures: string[],
): void {
  for (let k: number = 0; k < rail.length; k++) {
    const a: number = rail[k]!;
    const b: number = rail[(k + 1) % rail.length]!;
    const band: { direction: number; third: number }[] = edges(
      output,
      a,
      b,
      a0,
      a1,
    );
    const face: { direction: number; third: number }[] = edges(
      output,
      a,
      b,
      b0,
      b1,
    );
    if (
      band.length !== 1 ||
      face.length !== 1 ||
      band[0]!.direction !== -face[0]!.direction
    ) {
      failures.push("A rail lost per-face incidence1 or opposite traversal.");
      continue;
    }
    const p: number[] = point(output, face[0]!.third);
    if (
      parent
        ? !nclose(p[1]!, 0, 2e-10)
        : !nclose(Math.hypot(p[0]!, p[2]!), 1, 2e-10) || p[1]! < 0
    )
      failures.push(
        "An actual adjacent strip changed its original plane/cylinder law.",
      );
  }
}

/** Observe one exact edge in the selected actual triangle population. */
function edges(
  mesh: AutoMovieSolidMesh.IMesh,
  a: number,
  b: number,
  from: number,
  to: number,
): { direction: number; third: number }[] {
  const found: { direction: number; third: number }[] = [];
  for (let i: number = from; i < to; i += 3)
    for (let k: number = 0; k < 3; k++) {
      const x: number = mesh.indices[i + k]!;
      const y: number = mesh.indices[i + ((k + 1) % 3)]!;
      if ((x === a && y === b) || (x === b && y === a))
        found.push({
          direction: x === a ? 1 : -1,
          third: mesh.indices[i + ((k + 2) % 3)]!,
        });
    }
  return found;
}

/** Existing indexed positions, observed without changing the geometry. */
function point(mesh: AutoMovieSolidMesh.IMesh, index: number): number[] {
  return mesh.positions.slice(3 * index, 3 * index + 3);
}

/** Arithmetic tolerance never welds source positions or modifies original fields. */
function vector(
  actual: readonly number[],
  expected: readonly number[],
  failures: string[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some(
      (value: number, k: number): boolean =>
        !nclose(value, expected[k]!, 2e-10),
    )
  )
    failures.push(`Closed port actual ${actual}, expected ${expected}.`);
}
