import {
  type IAutoMovieHumanBodyBasis,
  assertHumanBodyBasis,
  createHumanBodyBasisBuilder,
  createHumanBodySurfaceSag,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];
type Sag = NonNullable<Surface["sag"]>;

const SEGMENTS = 8;
const RINGS = 21;
const SAG: Sag = {
  lean: { width: -1 },
  gain: 0.2,
  sweeps: 0,
  softness: { base: 0.5, channels: { tall: 0.4 }, range: [0.2, 1] },
};

/**
 * A tube of radius 0.1 m from y = 0 to 2 m, open at both ends, over the
 * analytic fixture's `hips` (below 0.8 m) and `spine` (above 1.2 m), linear
 * between; the fixture's `wide` and `narrow` endpoints move every vertex
 * along X by +0.05 and -0.02 on its own side.
 */
function tube(): Surface {
  const positions: number[] = [];
  const boneIndices: number[] = [];
  const weights: number[] = [];
  for (let r = 0; r < RINGS; r++) {
    const y = r / 10;
    const spine = Math.min(1, Math.max(0, (y - 0.8) / 0.4));
    for (let s = 0; s < SEGMENTS; s++) {
      const angle = (2 * Math.PI * s) / SEGMENTS;
      positions.push(0.1 * Math.cos(angle), y, 0.1 * Math.sin(angle));
      boneIndices.push(0, 1, 0, 0);
      weights.push(1 - spine, spine, 0, 0);
    }
  }
  const indices: number[] = [];
  for (let r = 0; r + 1 < RINGS; r++)
    for (let s = 0; s < SEGMENTS; s++) {
      const a = r * SEGMENTS + s;
      const b = r * SEGMENTS + ((s + 1) % SEGMENTS);
      indices.push(a, a + SEGMENTS, b, b, a + SEGMENTS, b + SEGMENTS);
    }
  const all = positions.length / 3;
  const along = (dx: (x: number) => number) =>
    Array.from({ length: all }, (_, v) => [
      v,
      dx(positions[v * 3]),
      0,
      0,
    ]).flat();
  return {
    id: "tube",
    positions,
    indices,
    targets: {
      wide: along((x) => (x > 1e-9 ? 0.05 : x < -1e-9 ? -0.05 : 0.0001)),
      narrow: along((x) => (x > 1e-9 ? -0.02 : x < -1e-9 ? 0.02 : -0.0001)),
      raised: Array.from({ length: SEGMENTS }, (_, s) => [
        (RINGS - 1) * SEGMENTS + s,
        0,
        0.5,
        0,
      ]).flat(),
      leftOut: [RINGS * SEGMENTS - 4, -0.01, 0, 0],
      rightOut: [RINGS * SEGMENTS - 3, 0.01, 0, 0],
      wideTall: [RINGS * SEGMENTS - 2, 0, 0, 0.01],
    },
    regions: [{ id: "tube/skin", material: "skin", indices, uvs: null }],
    skin: { joints: ["hips", "spine"], boneIndices, weights },
  };
}

/** Built vertex order: each region corner's source in first-occurrence order. */
const order = (surface: Surface): number[] => {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const source of surface.regions[0].indices)
    if (!seen.has(source)) {
      seen.add(source);
      out.push(source);
    }
  return out;
};

/**
 * Soft tissue sags as gravity turns in the skin's frame, by the tissue the
 * body carries over its lean self and a softness its channels set.
 *
 * Scenarios, on the tube unless named:
 * 1. With the skin's rest down still pointing down (no turn) the skin is
 *    left as skinned.
 * 2. With it turned to point up, unswept, a vertex carrying 2 cm of tissue
 *    at softness 0.5 moves `0.2 · 0.02 · 0.5 · (0, -2, 0)`, and one whose
 *    lean body lies outside it (negative thickness) does not move.
 * 3. The open boundary holds its skinned position, and swept, the field
 *    fades toward it (the ring beside it moves less than the one past it).
 * 4. Through the builder: a neutral document builds exactly as without the
 *    sag; the spine flexed 90 degrees moves a spine-rigid vertex on the
 *    +X side, with 2 cm of tissue over the narrowed tube, by
 *    `0.2 · 0.02 · s · (0, -1, 1)`, `s` the softness `0.5 + 0.4 · tall`,
 *    and a `tall` weight past the range is held at its top.
 * 5. Admission refuses an undeclared lean channel, a lean weight outside
 *    its range, a negative or nonfinite gain, fractional or negative sweeps,
 *    a nonfinite softness base, an inverted or negative range, an undeclared
 *    softness channel and a nonfinite softness gain, and admits the valid
 *    twin of each.
 */
export const test_human_body_surface_sag = (): void => {
  const surface = tube();
  const count = surface.positions.length / 3;
  const sag = createHumanBodySurfaceSag(surface, SAG);
  const rest = surface.positions;
  const lean = rest.map((value, i) =>
    i % 3 === 0 && Math.abs(value) > 1e-9 ? value * 0.8 : value,
  );
  const down = Array.from({ length: count }, () => [0, -1, 0]).flat();
  const up = Array.from({ length: count }, () => [0, 1, 0]).flat();
  TestValidator.predicate(
    "no turn leaves the skin as skinned",
    sag({ rest, lean, skinned: rest, hanging: down, softness: 0.5 }).every(
      (value, i) => value === rest[i],
    ),
  );

  const turned = sag({ rest, lean, skinned: rest, hanging: up, softness: 0.5 });
  const middle = 10 * SEGMENTS; // angle 0, x = 0.1, 2 cm over its lean self
  const back = 10 * SEGMENTS + 4; // angle 180, x = -0.1, 2 cm too
  const side = 10 * SEGMENTS + 2; // angle 90, no x: no tissue
  TestValidator.predicate(
    "a turned vertex moves by gain, tissue and softness",
    nclose(
      turned[middle * 3 + 1] - rest[middle * 3 + 1],
      -0.2 * 0.02 * 0.5 * 2,
      1e-12,
    ) &&
      nclose(
        turned[back * 3 + 1] - rest[back * 3 + 1],
        -0.2 * 0.02 * 0.5 * 2,
        1e-12,
      ) &&
      turned[side * 3 + 1] === rest[side * 3 + 1],
  );
  const inverted = sag({
    rest,
    lean: rest.map((value, i) => (i % 3 === 0 ? value * 1.2 : value)),
    skinned: rest,
    hanging: up,
    softness: 0.5,
  });
  TestValidator.predicate(
    "a lean body outside the rest carries no tissue",
    inverted.every((value, i) => value === rest[i]),
  );

  const swept = createHumanBodySurfaceSag(surface, { ...SAG, sweeps: 6 })({
    rest,
    lean,
    skinned: rest,
    hanging: up,
    softness: 0.5,
  });
  const shift = (v: number) => Math.abs(swept[v * 3 + 1] - rest[v * 3 + 1]);
  TestValidator.predicate(
    "the boundary holds and the field fades toward it",
    shift(0) === 0 &&
      shift((RINGS - 1) * SEGMENTS) === 0 &&
      shift(SEGMENTS) < shift(3 * SEGMENTS) &&
      shift(3 * SEGMENTS) > 0,
  );

  const { basis, document } = humanBodyBasisFixture();
  const withSag = (declared: Sag | undefined): IAutoMovieHumanBodyBasis => ({
    ...basis,
    surfaces: [{ ...tube(), sag: declared }],
  });
  const plain = createHumanBodyBasisBuilder(withSag(undefined));
  const sagging = createHumanBodyBasisBuilder(withSag(SAG));
  const positionsOf = (built: ReturnType<typeof plain>): number[] => {
    const geometry = built.model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("expected a mesh");
    return geometry.mesh.positions;
  };
  const unsagged = positionsOf(plain(document));
  TestValidator.predicate(
    "a neutral document builds as without the sag",
    positionsOf(sagging(document)).every((value, i) => value === unsagged[i]),
  );
  const built = order(tube());
  const at = built.indexOf(16 * SEGMENTS); // y = 1.6, angle 0: spine-rigid
  const displacement = (tall: number): number[] => {
    const bent = {
      ...document,
      shape: { tall },
      pose: [
        { bone: "spine" as const, flexion: 90, abduction: null, twist: null },
      ],
    };
    const a = positionsOf(sagging(bent));
    const b = positionsOf(plain(bent));
    return [0, 1, 2].map((k) => a[at * 3 + k] - b[at * 3 + k]);
  };
  const half = displacement(0.5);
  const full = displacement(1);
  const expected = (softness: number) =>
    [0, -1, 1].map((d) => 0.2 * 0.02 * softness * d);
  TestValidator.predicate(
    "a bent spine sags its tissue by the softness its channels set",
    half.every((value, k) =>
      nclose(value, expected(0.5 + 0.4 * 0.5)[k], 1e-9),
    ) && full.every((value, k) => nclose(value, expected(0.9)[k], 1e-9)),
  );
  const firm = createHumanBodyBasisBuilder(
    withSag({ ...SAG, softness: { ...SAG.softness, channels: { tall: 4 } } }),
  );
  const clamped = (() => {
    const bent = {
      ...document,
      shape: { tall: 1 },
      pose: [
        { bone: "spine" as const, flexion: 90, abduction: null, twist: null },
      ],
    };
    const a = positionsOf(firm(bent));
    const b = positionsOf(plain(bent));
    return [0, 1, 2].map((k) => a[at * 3 + k] - b[at * 3 + k]);
  })();
  TestValidator.predicate(
    "a softness past its range is held at the top",
    clamped.every((value, k) => nclose(value, expected(1)[k], 1e-9)),
  );

  for (const [title, bad, good] of [
    [
      "undeclared lean channel",
      { lean: { missing: 0 } },
      { lean: { tall: 0 } },
    ],
    ["lean weight out of range", { lean: { tall: 2 } }, { lean: { tall: 1 } }],
    ["negative gain", { gain: -0.1 }, { gain: 0 }],
    ["nonfinite gain", { gain: Number.NaN }, { gain: 0.3 }],
    ["fractional sweeps", { sweeps: 1.5 }, { sweeps: 2 }],
    ["negative sweeps", { sweeps: -1 }, { sweeps: 0 }],
    [
      "nonfinite base",
      { softness: { ...SAG.softness, base: Number.NaN } },
      { softness: { ...SAG.softness, base: 0 } },
    ],
    [
      "inverted range",
      { softness: { ...SAG.softness, range: [1, 0.5] } },
      { softness: { ...SAG.softness, range: [0.5, 0.5] } },
    ],
    [
      "negative range",
      { softness: { ...SAG.softness, range: [-0.1, 1] } },
      { softness: { ...SAG.softness, range: [0, 1] } },
    ],
    [
      "infinite range",
      { softness: { ...SAG.softness, range: [0, Number.POSITIVE_INFINITY] } },
      { softness: { ...SAG.softness, range: [0, 9] } },
    ],
    [
      "undeclared softness channel",
      { softness: { ...SAG.softness, channels: { missing: 1 } } },
      { softness: { ...SAG.softness, channels: { width: 1 } } },
    ],
    [
      "nonfinite softness gain",
      { softness: { ...SAG.softness, channels: { tall: Number.NaN } } },
      { softness: { ...SAG.softness, channels: { tall: -1 } } },
    ],
  ] as const) {
    TestValidator.predicate(
      `sag ${title} refused`,
      throwsError(
        () => assertHumanBodyBasis(withSag({ ...SAG, ...bad } as Sag)),
        "Body surface sag",
      ),
    );
    TestValidator.predicate(
      `sag ${title} twin admitted`,
      !throwsError(() =>
        assertHumanBodyBasis(withSag({ ...SAG, ...good } as Sag)),
      ),
    );
  }
};
