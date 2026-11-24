import { checkAutoMovieFormExpectation } from "@automovie/engine";
import type {
  IAutoMovieFormCheck,
  IAutoMovieFormExpectation,
  IAutoMovieMesh,
  IAutoMovieModel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { geometryModelPart } from "../../../internal/geometryModelPart";
import { geometryPartsModel } from "../../../internal/geometryPartsModel";
import { outwardBoxMesh } from "../../../internal/outwardBoxMesh";
import { throwsError } from "../../../internal/predicates";

/**
 * A form is checked against an expectation written before measuring, and the
 * same shape expectation must reject the form's box and hull.
 *
 * The L-shaped prism covers (0,0), (2,0), (2,1), (1,1), (1,2), (0,2) over z 0
 * to 1. Its box is [0,2]x[0,2]x[0,1], and its hull in the XY plane is bounded
 * by the line on which x and y sum to 3, between (2,1) and (1,2), so the point
 * (1.25, 1.25, 0.5), whose x and y sum to 2.5, is inside both mutants and
 * outside the L. A square frame of outer side 3 m around a centred 1 m hole has
 * one handle; its box and hull have none. The seat and leg stand 5e-7 m apart,
 * below the 1e-6 m contact distance, and the point (0.11, 0.11, 0.2875) under
 * the seat beside the leg is the midpoint of the seat's interior point (0.2,
 * 0.2, 0.475) and the leg's (0.02, 0.02, 0.1), so the hull holds it.
 *
 * Scenarios:
 *
 * 1. Expectation E on the L passes; the box and the hull each fail `empty`, and
 *    `loose` is empty.
 * 2. E without `empty` passes on the L and reports `box` and `hull` loose.
 * 3. The frame passes `genera` [1], and both mutants fail it with genus 0.
 * 4. The unit cube passes a size expectation with `matches` box and hull and
 *    nothing loose; without `matches` both are loose.
 * 5. A seat and leg 5e-7 m apart pass `pairs` touching and an `empty` point under
 *    the seat with nothing loose; lowered 0.003 m further, the pair is a form
 *    finding.
 * 6. `pairs` without `contact` throws.
 */
export function test_unit_engine_geometry_geometry_form_expectation(): void {
  const l: IAutoMovieModel = single(
    prism(
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
        [1, 1],
        [0, 1],
        [1, 2],
        [0, 2],
      ],
      [
        [0, 1, 4, 5],
        [1, 2, 3, 4],
        [5, 4, 6, 7],
      ],
      [[0, 1, 2, 3, 4, 6, 7, 5]],
    ),
  );
  const e: IAutoMovieFormExpectation = {
    size: { x: [1.99, 2.01], y: [1.99, 2.01], z: [0.99, 1.01] },
    pieces: 1,
    genera: [0],
    solid: [{ x: 0.5, y: 0.5, z: 0.5 }],
    empty: [{ x: 1.25, y: 1.25, z: 0.5 }],
  };
  const full: IAutoMovieFormCheck = checkAutoMovieFormExpectation(l, e);
  TestValidator.equals(
    "the L passes and each mutant fails its empty point",
    summary(full),
    { form: [], box: ["empty"], hull: ["empty"], loose: [] },
  );

  const withoutEmpty: IAutoMovieFormExpectation = { ...e };
  delete withoutEmpty.empty;
  TestValidator.equals(
    "without the empty point both mutants pass and are loose",
    summary(checkAutoMovieFormExpectation(l, withoutEmpty)),
    { form: [], box: [], hull: [], loose: ["box", "hull"] },
  );

  const frame: IAutoMovieModel = single(
    prism(
      [
        [0, 0],
        [3, 0],
        [3, 3],
        [0, 3],
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
      ],
      [0, 1, 2, 3].map((at: number): number[] => [
        at,
        (at + 1) % 4,
        4 + ((at + 1) % 4),
        4 + at,
      ]),
      [
        [0, 1, 2, 3],
        [4, 7, 6, 5],
      ],
    ),
  );
  TestValidator.equals(
    "a frame has one handle its box and hull lack",
    summary(checkAutoMovieFormExpectation(frame, { genera: [1] })),
    { form: [], box: ["genera"], hull: ["genera"], loose: [] },
  );

  const cube: IAutoMovieModel = single(
    outwardBoxMesh({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }),
  );
  const unit: IAutoMovieFormExpectation = {
    size: { x: [0.99, 1.01], y: [0.99, 1.01], z: [0.99, 1.01] },
  };
  TestValidator.equals(
    "a cube may declare that it matches its box and hull",
    summary(
      checkAutoMovieFormExpectation(cube, {
        ...unit,
        matches: ["box", "hull"],
      }),
    ),
    { form: [], box: [], hull: [], loose: [] },
  );
  TestValidator.equals(
    "and without saying so both are loose",
    summary(checkAutoMovieFormExpectation(cube, unit)),
    { form: [], box: [], hull: [], loose: ["box", "hull"] },
  );

  const chair: (drop: number) => IAutoMovieModel = (
    drop: number,
  ): IAutoMovieModel =>
    geometryPartsModel([
      geometryModelPart("seat", {
        type: "mesh",
        mesh: outwardBoxMesh(
          { x: 0, y: 0, z: 0.45 },
          { x: 0.4, y: 0.4, z: 0.5 },
        ),
      }),
      geometryModelPart("leg", {
        type: "mesh",
        mesh: outwardBoxMesh(
          { x: 0, y: 0, z: -drop },
          { x: 0.04, y: 0.04, z: 0.45 - 5e-7 - drop },
        ),
      }),
    ]);
  const seated: IAutoMovieFormExpectation = {
    pairs: [{ part: "seat", other: "leg", relation: "touching" }],
    contact: 1e-6,
    empty: [{ x: 0.11, y: 0.11, z: 0.2875 }],
  };
  TestValidator.equals(
    "a leg just under the seat touches it",
    summary(checkAutoMovieFormExpectation(chair(0), seated)),
    { form: [], box: ["empty"], hull: ["empty"], loose: [] },
  );
  const dropped: IAutoMovieFormCheck = checkAutoMovieFormExpectation(
    chair(0.003),
    seated,
  );
  TestValidator.predicate(
    "a leg 3 mm lower is a form finding naming the pair",
    dropped.findings.some(
      (finding: IAutoMovieFormCheck.IFinding): boolean =>
        finding.field === "pairs" &&
        finding.subject === "form" &&
        finding.measured.part === "seat" &&
        finding.measured.other === "leg" &&
        finding.measured.relation === "apart",
    ),
  );

  TestValidator.predicate(
    "pairs without a contact distance are refused",
    throwsError(() =>
      checkAutoMovieFormExpectation(chair(0), {
        pairs: [{ part: "seat", other: "leg", relation: "touching" }],
      }),
    ),
  );
}

/** Each subject's failed fields, and the loose mutants. */
const summary: (check: IAutoMovieFormCheck) => {
  form: string[];
  box: string[];
  hull: string[];
  loose: string[];
} = (
  check: IAutoMovieFormCheck,
): { form: string[]; box: string[]; hull: string[]; loose: string[] } => {
  const of: (subject: IAutoMovieFormCheck.Subject) => string[] = (
    subject: IAutoMovieFormCheck.Subject,
  ): string[] =>
    check.findings
      .filter(
        (finding: IAutoMovieFormCheck.IFinding): boolean =>
          finding.subject === subject,
      )
      .map((finding: IAutoMovieFormCheck.IFinding): string => finding.field);
  return {
    form: of("form"),
    box: of("box"),
    hull: of("hull"),
    loose: [...check.loose],
  };
};

/** A model of one mesh part authored in the model frame. */
const single: (mesh: IAutoMovieMesh) => IAutoMovieModel = (
  mesh: IAutoMovieMesh,
): IAutoMovieModel =>
  geometryPartsModel([geometryModelPart("form", { type: "mesh", mesh })]);

/**
 * A plane region extruded over z from 0 to 1 as one closed outward mesh.
 *
 * `quads` cover the region, each counter-clockwise seen from +z, and become the
 * top and, reversed, the bottom. `loops` are the region's boundaries, each with
 * the region on its left, and become the walls.
 */
const prism: (
  points: readonly (readonly [number, number])[],
  quads: readonly (readonly number[])[],
  loops: readonly (readonly number[])[],
) => IAutoMovieMesh = (
  points: readonly (readonly [number, number])[],
  quads: readonly (readonly number[])[],
  loops: readonly (readonly number[])[],
): IAutoMovieMesh => {
  const count: number = points.length;
  const positions: number[] = [];
  for (const z of [0, 1]) for (const [x, y] of points) positions.push(x, y, z);
  const indices: number[] = [];
  const quad: (a: number, b: number, c: number, d: number) => void = (
    a: number,
    b: number,
    c: number,
    d: number,
  ): void => {
    indices.push(a, b, c, a, c, d);
  };
  for (const [a, b, c, d] of quads) {
    quad(count + a!, count + b!, count + c!, count + d!);
    quad(d!, c!, b!, a!);
  }
  for (const loop of loops)
    loop.forEach((from: number, at: number): void => {
      const to: number = loop[(at + 1) % loop.length]!;
      quad(from, to, count + to, count + from);
    });
  return { positions, indices, normals: null, uvs: null, skin: null };
};
