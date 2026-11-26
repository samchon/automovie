import type {
  IAutoMovieFormCheck,
  IAutoMovieFormExpectation,
  IAutoMovieMesh,
  IAutoMovieMeshPiece,
  IAutoMovieMeshWinding,
  IAutoMovieModel,
  IAutoMovieModelContact,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieModelPartMatrices } from "../autoMovieModelPartMatrices";
import { buildAutoMovieConvexHull } from "./buildAutoMovieConvexHull";
import { createAutoMovieMeshWindingQuery } from "./createAutoMovieMeshWindingQuery";
import { measureAutoMovieMeshPieces } from "./internal/measureAutoMovieMeshPieces";
import { measureAutoMovieModelContacts } from "./measureAutoMovieModelContacts";
import { placeAutoMovieModelPartMesh } from "./internal/placeAutoMovieModelPartMesh";
import { realizeAutoMovieGeometry } from "./internal/realizeAutoMovieGeometry";
import { triangleIndicesOf } from "./internal/triangleIndicesOf";

/**
 * Check a form against the expectation written before measuring it, and run the
 * same shape expectation against the form's box and hull, which it must
 * reject.
 *
 * Every part is realized and placed in the model frame as
 * `measureAutoMovieModelContacts` places it, and the placed parts are merged
 * into one mesh by concatenation. Each given field is then measured: `size`
 * from the merged positions' axis-aligned extents, `pieces` and `genera` from
 * `measureAutoMovieMeshPieces`, `solid` and `empty` from
 * `createAutoMovieMeshWindingQuery`, and `pairs` from
 * `measureAutoMovieModelContacts` with the expectation's `contact`. Each
 * failure becomes one finding naming its field, its subject and the measured
 * value against the expected one.
 *
 * The shape fields, every field but `pairs` and `contact`, also run on two
 * one-part mutants built from every placed vertex: the 12-triangle axis-aligned
 * box and the convex hull from `buildAutoMovieConvexHull`. Their failures are
 * findings with subject `box` or `hull`. A mutant that fails no given shape
 * field and is not listed in `matches` is `loose`: the expectation cannot tell
 * it from the form, so it says too little. An expectation with no shape field
 * therefore reports both mutants loose, and the mutants are not built. The form
 * passes when no finding names the form and `loose` is empty.
 *
 * The model is only read. Throws when `pairs` is given without `contact`, when
 * a pair names a part the model lacks or one part twice, when a shape field
 * needs the hull of placed vertices that span no volume, and passes on the
 * refusals of the realization, placement, winding query and contact report.
 *
 * @param model A built model, whatever composed it.
 * @param expectation What the form must be.
 * @returns The findings and the loose mutants.
 */
export const checkAutoMovieFormExpectation: (
  model: IAutoMovieModel,
  expectation: IAutoMovieFormExpectation,
) => IAutoMovieFormCheck = (
  model: IAutoMovieModel,
  expectation: IAutoMovieFormExpectation,
): IAutoMovieFormCheck => {
  if (expectation.pairs !== undefined && expectation.contact === undefined)
    throw new Error("A form expectation with pairs needs a contact distance.");
  const ids: Set<string> = new Set(
    model.parts.map((part: IAutoMovieModelPart): string => part.id),
  );
  for (const pair of expectation.pairs ?? []) {
    for (const id of [pair.part, pair.other])
      if (!ids.has(id))
        throw new Error(`A form expectation pair names no part "${id}".`);
    if (pair.part === pair.other)
      throw new Error(`A form expectation pair names "${pair.part}" twice.`);
  }

  const form: IAutoMovieMesh = merged(model);
  const findings: IAutoMovieFormCheck.IFinding[] = shape(
    "form",
    form,
    expectation,
  );
  if (expectation.pairs !== undefined)
    findings.push(...pairs(model, expectation.pairs, expectation.contact!));

  const loose: IAutoMovieFormExpectation.Mutant[] = [];
  const shaped: boolean = SHAPE_FIELDS.some(
    (field: keyof IAutoMovieFormExpectation): boolean =>
      expectation[field] !== undefined,
  );
  const points: IAutoMovieVector3[] = shaped ? pointsOf(form) : [];
  for (const mutant of MUTANTS) {
    const own: IAutoMovieFormCheck.IFinding[] = shaped
      ? shape(
          mutant,
          mutant === "box" ? boxOf(points) : buildAutoMovieConvexHull(points),
          expectation,
        )
      : [];
    findings.push(...own);
    if (own.length === 0 && !(expectation.matches ?? []).includes(mutant))
      loose.push(mutant);
  }
  return { findings, loose };
};

/** The mutants every shape expectation runs on, in report order. */
const MUTANTS: readonly IAutoMovieFormExpectation.Mutant[] = ["box", "hull"];

/** The fields that describe shape and so also run on the mutants. */
const SHAPE_FIELDS: readonly (keyof IAutoMovieFormExpectation)[] = [
  "size",
  "pieces",
  "genera",
  "solid",
  "empty",
];

/**
 * Every part realized, placed in the model frame and concatenated into one
 * mesh.
 */
const merged: (model: IAutoMovieModel) => IAutoMovieMesh = (
  model: IAutoMovieModel,
): IAutoMovieMesh => {
  const matrices: Map<IAutoMovieModelPart, number[] | null> =
    autoMovieModelPartMatrices(model);
  const positions: number[] = [];
  const indices: number[] = [];
  for (const part of model.parts) {
    const label: string = `form part "${part.id}"`;
    const mesh: IAutoMovieMesh = placeAutoMovieModelPartMesh(
      realizeAutoMovieGeometry(part.geometry).mesh,
      matrices.get(part) ?? null,
      label,
    );
    const base: number = positions.length / 3;
    for (const value of mesh.positions) positions.push(value);
    for (const index of triangleIndicesOf(mesh, label))
      indices.push(base + index);
  }
  return { positions, indices, normals: null, uvs: null, skin: null };
};

/** Every vertex of a mesh as a point, the mutants' input. */
const pointsOf: (mesh: IAutoMovieMesh) => IAutoMovieVector3[] = (
  mesh: IAutoMovieMesh,
): IAutoMovieVector3[] => {
  const points: IAutoMovieVector3[] = [];
  for (let at: number = 0; at < mesh.positions.length; at += 3)
    points.push({
      x: mesh.positions[at]!,
      y: mesh.positions[at + 1]!,
      z: mesh.positions[at + 2]!,
    });
  return points;
};

/** The closed outward axis-aligned box of a point set, 12 triangles. */
const boxOf: (points: readonly IAutoMovieVector3[]) => IAutoMovieMesh = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieMesh => {
  const low: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const high: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const point of points)
    for (const axis of AXES) {
      low[axis] = Math.min(low[axis], point[axis]);
      high[axis] = Math.max(high[axis], point[axis]);
    }
  const positions: number[] = [];
  for (let corner: number = 0; corner < 8; ++corner)
    positions.push(
      corner & 1 ? high.x : low.x,
      corner & 2 ? high.y : low.y,
      corner & 4 ? high.z : low.z,
    );

  // Corner i takes the high X for bit 0, Y for bit 1 and Z for bit 2; each
  // face is listed counter-clockwise seen from outside.
  const indices: number[] = [];
  for (const [a, b, c, d] of BOX_FACES) indices.push(a, b, c, a, c, d);
  return { positions, indices, normals: null, uvs: null, skin: null };
};

/** The three axes in order. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/**
 * A box's faces by corner, counter-clockwise from outside, in -X, +X, -Y, +Y,
 * -Z, +Z order.
 */
const BOX_FACES: readonly (readonly [number, number, number, number])[] = [
  [0, 4, 6, 2],
  [1, 3, 7, 5],
  [0, 1, 5, 4],
  [2, 6, 7, 3],
  [0, 2, 3, 1],
  [4, 5, 7, 6],
];

/**
 * The findings of every given shape field on one subject's mesh, in field
 * order.
 */
const shape: (
  subject: IAutoMovieFormCheck.Subject,
  mesh: IAutoMovieMesh,
  expectation: IAutoMovieFormExpectation,
) => IAutoMovieFormCheck.IFinding[] = (
  subject: IAutoMovieFormCheck.Subject,
  mesh: IAutoMovieMesh,
  expectation: IAutoMovieFormExpectation,
): IAutoMovieFormCheck.IFinding[] => {
  const findings: IAutoMovieFormCheck.IFinding[] = [];
  if (expectation.size !== undefined) {
    const extents: number[] = [0, 1, 2].map((axis: number): number => {
      let low: number = Infinity;
      let high: number = -Infinity;
      for (let at: number = axis; at < mesh.positions.length; at += 3) {
        low = Math.min(low, mesh.positions[at]!);
        high = Math.max(high, mesh.positions[at]!);
      }
      return high - low;
    });
    AXES.forEach((axis: "x" | "y" | "z", at: number): void => {
      const expected: IAutoMovieFormExpectation.Range | undefined =
        expectation.size![axis];
      const measured: number = extents[at]!;
      if (
        expected !== undefined &&
        !(measured >= expected[0] && measured <= expected[1])
      )
        findings.push({ field: "size", subject, axis, measured, expected });
    });
  }

  if (expectation.pieces !== undefined || expectation.genera !== undefined) {
    const pieces: IAutoMovieMeshPiece[] = measureAutoMovieMeshPieces(mesh);
    if (
      expectation.pieces !== undefined &&
      pieces.length !== expectation.pieces
    )
      findings.push({
        field: "pieces",
        subject,
        measured: pieces.length,
        expected: expectation.pieces,
      });
    if (expectation.genera !== undefined) {
      const measured: (number | null)[] = pieces
        .map((piece: IAutoMovieMeshPiece): number | null => piece.genus)
        .sort(ascending);
      const expected: number[] = [...expectation.genera].sort(ascending);
      if (
        measured.length !== expected.length ||
        measured.some(
          (genus: number | null, at: number): boolean => genus !== expected[at],
        )
      )
        findings.push({
          field: "genera",
          subject,
          measured,
          expected: expectation.genera,
        });
    }
  }

  if (expectation.solid !== undefined || expectation.empty !== undefined) {
    const winding: (point: readonly number[]) => IAutoMovieMeshWinding =
      createAutoMovieMeshWindingQuery(mesh);
    for (const field of ["solid", "empty"] as const)
      (expectation[field] ?? []).forEach(
        (point: IAutoMovieVector3, index: number): void => {
          const measured: IAutoMovieMeshWinding = winding([
            point.x,
            point.y,
            point.z,
          ]);
          const held: boolean =
            field === "solid"
              ? measured.inside
              : !measured.inside && !measured.surface;
          if (!held)
            findings.push({
              field,
              subject,
              index,
              point: { ...point },
              measured,
            });
        },
      );
  }
  return findings;
};

/** Ascending order with nulls last. */
const ascending: (a: number | null, b: number | null) => number = (
  a: number | null,
  b: number | null,
): number => (a === null ? (b === null ? 0 : 1) : b === null ? -1 : a - b);

/** The findings of the expected pairs against the form's contact report. */
const pairs: (
  model: IAutoMovieModel,
  expected: readonly IAutoMovieFormExpectation.IPair[],
  contact: number,
) => IAutoMovieFormCheck.IFinding[] = (
  model: IAutoMovieModel,
  expected: readonly IAutoMovieFormExpectation.IPair[],
  contact: number,
): IAutoMovieFormCheck.IFinding[] => {
  const report: IAutoMovieModelContact[] = measureAutoMovieModelContacts(
    model,
    { contact },
  );
  const findings: IAutoMovieFormCheck.IFinding[] = [];
  for (const pair of expected) {
    // The report holds every unordered pair of distinct parts, and admission
    // has checked that the pair names two distinct parts of the model.
    const measured: IAutoMovieModelContact = report.find(
      (entry: IAutoMovieModelContact): boolean =>
        (entry.part === pair.part && entry.other === pair.other) ||
        (entry.part === pair.other && entry.other === pair.part),
    )!;
    if (
      measured.relation !== pair.relation ||
      (pair.gap !== undefined &&
        !(measured.gap >= pair.gap[0] && measured.gap <= pair.gap[1]))
    )
      findings.push({
        field: "pairs",
        subject: "form",
        expected: pair,
        measured,
      });
  }
  return findings;
};
