import { Vector3, cofactorAutoMovieJacobian } from "@automovie/engine";

import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonCellFrame } from "../structures/IAutoMovieHumanPersonCellFrame";
import type { IAutoMovieHumanPersonNormalStar } from "../structures/IAutoMovieHumanPersonNormalStar";
import type { IAutoMovieHumanPersonNormalTransportProps } from "../structures/IAutoMovieHumanPersonNormalTransportProps";
import type { IAutoMovieHumanPersonSourceNormalInput } from "../structures/IAutoMovieHumanPersonSourceNormalInput";
import { evaluateHumanPersonSourceCells } from "./evaluateHumanPersonSourceCells";

/**
 * Transport ancestral shading through fixed source-cell differentials.
 * Reference and current are final performed skins in the same body frame.
 * Each oriented tangent frame uses sqrt(current/reference area) for its
 * transverse extension, a numerical shading convention rather than tissue
 * thickness or clinical volume conservation. The engine owns cofactor math.
 * Reference-area densities accumulate over the complete fixed incidence,
 * including unchanged neighbors. Ancestral weighted-key identity and source
 * deformation domains remain distinct. Renderer refinement only interpolates
 * the resulting field through admitted frozen charts.
 * SourceNormals supplies the ancestral field and weighted-key identity from
 * admitted reference parent areas; transport does not rebuild either quantity.
 * Only requested stars consume reference normals, while every fixed physical
 * cell still supplies its actual points and nonsingular differential.
 * Exact unchanged geometry returns the supplied ancestral field byte for byte.
 * Only used coordinates define displacement. A binding whose active fixed
 * stars are all unchanged likewise retains its ancestral chart exactly;
 * unrelated motion does not rebuild that field through normalized fine stars.
 * Arrays are read only; returned unit normals are owned, dimensionless and
 * expressed in the shared metre/Y-up/Z-forward reference/current frame.
 * Geometry admission remains with evaluateHumanPersonSourceCells.
 *
 * @evidence contracts/common.md#principled-implementation Builds each differential from actual reference/current tangents and an explicit transverse convention, then applies the engine cofactor and fixed reference-area incidence.
 * @evidence contracts/common.md#clear-and-simple-design One transport owner separates ancestral fields, fixed source-star densities and final frozen-chart readback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No neutral arrays, personal vertex exceptions or renderer stars substitute for the actual final reference and source cells.
 * @evidence contracts/common.md#meaningful-documentation States the extension convention, frame, precision, incidence and exact return boundary without claiming tissue validity.
 * @evidence contracts/modeling.md#shared-boundaries Both complementary skins consume the same canonical source stars and admitted ordered charts.
 * @evidence contracts/modeling.md#spatial-conventions Tangents are metres, cross products square metres and final shading vectors dimensionless in the common performed frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines a field, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits normals for existing geometry only.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns actual observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The transverse convention is numerical shading, not anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical fields, not biological ranges.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes compiled lineage without personal vertex input.
 */
export function createHumanPersonNormalTransport(
  props: IAutoMovieHumanPersonNormalTransportProps,
): (input: IAutoMovieHumanPersonSourceNormalInput) => number[] {
  const { evaluation, transport } = props;
  const { plan } = evaluation;
  const used = [evaluation.faceIndices, evaluation.bodyIndices].map(
    (indices) => [...new Set(indices)],
  );
  const unit = (values: readonly number[]): number[] => {
    const length = Math.hypot(...values);
    if (!(length > 0) || !Number.isFinite(length))
      throw new Error(
        "Person normal transport needs a finite nonzero used field.",
      );
    return values.map((value) => value / length);
  };
  const interpolate = (
    values: readonly (readonly number[])[],
    uv: readonly [number, number],
  ): number[] =>
    unit(
      [0, 1, 2].map((axis) =>
        interpolateHumanBasisSourceTriangle(
          values.map((value) => value[axis]) as [number, number, number],
          uv,
        ),
      ),
    );
  const key = (sample: number, parent: number, domain: number): string =>
    `${sample}:${props.identity(sample, parent)}:${domain}`;
  const queries = transport.bindings.map((side, which) =>
    side.map((binding, vertex) => {
      if (binding === undefined) return undefined;
      const record = which === 0 ? plan.face : plan.body;
      const cell =
        binding.cell === undefined ? undefined : transport.cells[binding.cell];
      const chart = plan.chart(record.samples[vertex]);
      const coordinates = binding.coordinates ?? chart.coordinates;
      return {
        parent: binding.parent,
        coordinates,
        points: (cell?.samples ?? chart.originals).map((sample, corner) => ({
          sample,
          domain: cell?.domains[corner] ?? 0,
          active:
            interpolateHumanBasisSourceTriangle(
              [
                corner === 0 ? 1 : 0,
                corner === 1 ? 1 : 0,
                corner === 2 ? 1 : 0,
              ],
              coordinates,
            ) > 0,
        })),
      };
    }),
  );
  const required = new Set(
    queries.flatMap((side) =>
      side.flatMap(
        (query) =>
          query?.points
            .filter((point) => point.active)
            .map((point) => key(point.sample, query.parent, point.domain)) ??
          [],
      ),
    ),
  );
  const point = (
    positions: ReadonlyMap<number, readonly number[]>,
    sample: number,
  ): number[] => {
    const value = positions.get(sample);
    if (value === undefined)
      throw new Error(
        "Person normal transport needs every fixed source cell point.",
      );
    return [...value];
  };
  const frame = (
    points: number[][],
    scale: number,
  ): IAutoMovieHumanPersonCellFrame => {
    const vector = (one: number[]) => Vector3.create(one[0], one[1], one[2]);
    const a = Vector3.subtract(vector(points[1]), vector(points[0]));
    const b = Vector3.subtract(vector(points[2]), vector(points[0]));
    const cross = Vector3.cross(a, b);
    const normal = unit([cross.x, cross.y, cross.z]);
    return {
      matrix: [
        [a.x, b.x, normal[0] * scale],
        [a.y, b.y, normal[1] * scale],
        [a.z, b.z, normal[2] * scale],
      ].flat(),
      area: Math.hypot(cross.x, cross.y, cross.z),
    };
  };
  return (input) => {
    const reference = input.reference;
    if (
      reference === undefined ||
      reference.generation !== plan.face.generation
    )
      throw new Error(
        "Person normal transport needs its actual matching reference generation.",
      );
    const current = evaluateHumanPersonSourceCells({ ...evaluation, input });
    const before = evaluateHumanPersonSourceCells({
      ...evaluation,
      input: reference,
    });
    const referenceField = props.referenceField(before.parentAreas);
    const referenceNormals = referenceField.normals;
    if (
      [input.face, input.body].every((positions, side) =>
        used[side].every((vertex) =>
          [0, 1, 2].every(
            (axis) =>
              positions[vertex * 3 + axis] ===
              [reference.face, reference.body][side][vertex * 3 + axis],
          ),
        ),
      )
    ) {
      // Identity changes no density, but still needs an observed nonsingular
      // frame for every fixed cell. An ancestral chart cannot invent it.
      for (const cell of transport.cells)
        cofactorAutoMovieJacobian(
          frame(
            cell.samples.map((sample) => point(before.sourcePositions, sample)),
            1,
          ).matrix,
        );
      return referenceNormals;
    }
    const stars = new Map<string, IAutoMovieHumanPersonNormalStar>();
    for (const cell of transport.cells) {
      const prior = cell.samples.map((sample) =>
        point(before.sourcePositions, sample),
      );
      const actual = cell.samples.map((sample) =>
        point(current.sourcePositions, sample),
      );
      const changed = actual.some((one, corner) =>
        one.some((value, axis) => value !== prior[corner][axis]),
      );
      const sourceFrame = frame(prior, 1);
      const currentFrame = frame(actual, 1);
      const inverse = cofactorAutoMovieJacobian(sourceFrame.matrix);
      const target = frame(
        actual,
        Math.sqrt(currentFrame.area / sourceFrame.area),
      ).matrix;
      const jacobian = Array.from({ length: 9 }, (_, at) =>
        [0, 1, 2].reduce(
          (sum, k) =>
            sum +
            (target[Math.floor(at / 3) * 3 + k] *
              inverse.matrix[(at % 3) * 3 + k]) /
              inverse.determinant,
          0,
        ),
      );
      const cofactor = cofactorAutoMovieJacobian(jacobian).matrix;
      cell.samples.forEach((sample, corner) => {
        const id = key(sample, cell.parent, cell.domains[corner]);
        if (!required.has(id)) return;
        const normal = referenceField.at(sample, cell.parent);
        const density = changed
          ? [0, 1, 2].map((axis) =>
              [0, 1, 2].reduce(
                (sum, k) => sum + cofactor[axis * 3 + k] * normal[k],
                0,
              ),
            )
          : normal;
        unit(density);
        const star = stars.get(id) ?? {
          sum: [0, 0, 0],
          reference: normal,
          changed: false,
        };
        for (let axis = 0; axis < 3; axis++)
          star.sum[axis] += sourceFrame.area * density[axis];
        star.changed ||= changed;
        stars.set(id, star);
      });
    }
    const read = (sample: number, parent: number, domain: number) => {
      const star = stars.get(key(sample, parent, domain));
      if (star === undefined)
        throw new Error(
          "Person normal transport needs an unambiguous used source star.",
        );
      return star;
    };
    return queries.flatMap((side, which) =>
      side.flatMap((query, vertex) => {
        if (query === undefined) return [0, 0, 0];
        const active = query.points.map((point) =>
          point.active
            ? read(point.sample, query.parent, point.domain)
            : undefined,
        );
        // An unchanged source family retains its ancestral chart exactly.
        // Interpolating already-normalized finer fields would change q0 merely
        // because another disconnected cell or unused coordinate moved.
        if (active.every((star) => star?.changed !== true)) {
          const at =
            (which === 0 ? 0 : plan.face.samples.length * 3) + vertex * 3;
          return referenceNormals.slice(at, at + 3);
        }
        return interpolate(
          active.map((star) =>
            star === undefined
              ? [0, 0, 0]
              : star.changed
                ? unit(star.sum)
                : star.reference,
          ),
          query.coordinates,
        );
      }),
    );
  };
}
