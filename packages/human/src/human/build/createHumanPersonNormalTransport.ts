import { Vector3, cofactorAutoMovieJacobian } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonCellFrame } from "../structures/IAutoMovieHumanPersonCellFrame";
import type { IAutoMovieHumanPersonNormalStar } from "../structures/IAutoMovieHumanPersonNormalStar";
import type { IAutoMovieHumanPersonNormalTransportProps } from "../structures/IAutoMovieHumanPersonNormalTransportProps";
import type { IAutoMovieHumanPersonSourceNormalInput } from "../structures/IAutoMovieHumanPersonSourceNormalInput";
import { evaluateHumanPersonSourceCells } from "./evaluateHumanPersonSourceCells";

/**
 * Transport ancestral shading through fixed source-cell differentials.
 * Reference and current are final performed skins in the same body frame. Each oriented tangent frame uses sqrt(current/reference area) for its transverse extension, a numerical shading convention rather than tissue thickness or clinical volume conservation. The engine owns cofactor math. Reference-area densities accumulate over the complete fixed incidence, including unchanged neighbors. Ancestral weighted-key identity and source deformation domains remain distinct. Renderer refinement only interpolates the resulting field through admitted frozen charts.
 *
 * SourceNormals supplies the ancestral field and weighted-key identity from admitted reference parent areas; transport does not rebuild either quantity. Only requested stars consume reference normals, while every fixed physical cell still supplies its actual points and nonsingular differential. Exact unchanged geometry returns the supplied ancestral field byte for byte. Only used coordinates define displacement. A binding whose active fixed stars are all unchanged likewise retains its ancestral chart exactly; unrelated motion does not rebuild that field through normalized fine stars.
 *
 * Arrays are read only; returned unit normals are owned, dimensionless and expressed in the shared metre/Y-up/Z-forward reference/current frame. Geometry admission remains with evaluateHumanPersonSourceCells. The compiled plan and identity callbacks must remain unchanged. Each call re-evaluates both current and reference cells, including the identity case, so unchanged shading never bypasses nonsingular source-cell admission. This differential shading convention supplies no tissue constitutive law or global embeddedness/visual qualification.
 *
 * @evidence contracts/common.md#principled-implementation Oriented fixed-cell frames produce current-times-inverse-reference Jacobians with sqrt area-ratio transverse extension; cofactors transport ancestral normals and reference-area weights accumulate only required source/domain stars.
 * @evidence contracts/common.md#clear-and-simple-design Source evaluation owns geometric admission, the supplied ancestral-field owner owns reference shading/identity and the engine owns cofactors; this compiler owns fixed differential incidence and final chart interpolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact unchanged coordinates retain ancestral bytes only after source/frame admission, while unused vertices remain zero; sqrt area extension is a shading convention rather than clinical volume conservation or hidden neutral-geometry substitution.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre/area/normal units, fixed-plan purity, unchanged-family semantics and separate anatomical/global/visual limits.
 * @evidence contracts/performance.md#efficient-algorithms Compilation visits bindings and required three-corner keys; each call pays two full source evaluations and ancestral-field construction, then fixed arithmetic per transport cell and required output binding plus actual source-identity callback cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Used vertex sets, chart queries and required keys compile once for unchanged incidence; one per-call reference field and star map serve all output normals, with no stale reference reused across changed geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains compiled query/key populations and borrowed immutable plan/callbacks until dropped; evaluation, reference field and star arrays are call-local and output normals are caller-owned.
 */
export function createHumanPersonNormalTransport(
  props: IAutoMovieHumanPersonNormalTransportProps,
): (input: IAutoMovieHumanPersonSourceNormalInput) => number[] {
  const { evaluation, transport }: IAutoMovieHumanPersonNormalTransportProps = props;
  const { plan }: IAutoMovieHumanPersonNormalTransportProps["evaluation"] = evaluation;
  const used: number[][] = [evaluation.faceIndices, evaluation.bodyIndices].map(
    (indices: readonly number[]): number[] => [...new Set(indices)],
  );
  const unit: (values: readonly number[]) => number[] = (values: readonly number[]): number[] => {
    const length: number = Math.hypot(...values);
    if (!(length > 0) || !Number.isFinite(length))
      throw new Error(
        "Person normal transport needs a finite nonzero used field.",
      );
    return values.map((value: number): number => value / length);
  };
  const interpolate: (values: readonly (readonly number[])[], uv: readonly [number, number]) => number[] = (
    values: readonly (readonly number[])[],
    uv: readonly [number, number],
  ): number[] =>
    unit(
      [0, 1, 2].map((axis: number): number =>
        interpolateHumanBasisSourceTriangle(
          values.map((value: readonly number[]): number => value[axis]) as [number, number, number],
          uv,
        ),
      ),
    );
  const key: (sample: number, parent: number, domain: number) => string = (sample: number, parent: number, domain: number): string =>
    `${sample}:${props.identity(sample, parent)}:${domain}`;
  const queries: ({ parent: number; coordinates: readonly [number, number]; points: { sample: number; domain: number; active: boolean }[] } | undefined)[][] = transport.bindings.map((side: IAutoMovieHumanPersonNormalTransportProps["transport"]["bindings"][number], which: number): typeof queries[number] =>
    side.map((binding: IAutoMovieHumanPersonNormalTransportProps["transport"]["bindings"][number][number], vertex: number): typeof queries[number][number] => {
      if (binding === undefined) return undefined;
      const record: typeof plan.face = which === 0 ? plan.face : plan.body;
      const cell: typeof transport.cells[number] | undefined =
        binding.cell === undefined ? undefined : transport.cells[binding.cell];
      const chart: ReturnType<typeof plan.chart> = plan.chart(record.samples[vertex]);
      const coordinates: readonly [number, number] = binding.coordinates ?? chart.coordinates;
      return {
        parent: binding.parent,
        coordinates,
        points: (cell?.samples ?? chart.originals).map((sample: number, corner: number): { sample: number; domain: number; active: boolean } => ({
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
  const required: Set<string> = new Set(
    queries.flatMap((side: typeof queries[number]): string[] =>
      side.flatMap(
        (query: typeof queries[number][number]): string[] =>
          query?.points
            .filter((point: NonNullable<typeof queries[number][number]>["points"][number]): boolean => point.active)
            .map((point: NonNullable<typeof queries[number][number]>["points"][number]): string => key(point.sample, query.parent, point.domain)) ??
          [],
      ),
    ),
  );
  const point: (positions: ReadonlyMap<number, readonly number[]>, sample: number) => number[] = (
    positions: ReadonlyMap<number, readonly number[]>,
    sample: number,
  ): number[] => {
    const value: readonly number[] | undefined = positions.get(sample);
    if (value === undefined)
      throw new Error(
        "Person normal transport needs every fixed source cell point.",
      );
    return [...value];
  };
  const frame: (points: number[][], scale: number) => IAutoMovieHumanPersonCellFrame = (
    points: number[][],
    scale: number,
  ): IAutoMovieHumanPersonCellFrame => {
    const vector: (one: number[]) => IAutoMovieVector3 = (one: number[]): IAutoMovieVector3 => Vector3.create(one[0], one[1], one[2]);
    const a: IAutoMovieVector3 = Vector3.subtract(vector(points[1]), vector(points[0]));
    const b: IAutoMovieVector3 = Vector3.subtract(vector(points[2]), vector(points[0]));
    const cross: IAutoMovieVector3 = Vector3.cross(a, b);
    const normal: number[] = unit([cross.x, cross.y, cross.z]);
    return {
      matrix: [
        [a.x, b.x, normal[0] * scale],
        [a.y, b.y, normal[1] * scale],
        [a.z, b.z, normal[2] * scale],
      ].flat(),
      area: Math.hypot(cross.x, cross.y, cross.z),
    };
  };
  return (input: IAutoMovieHumanPersonSourceNormalInput): number[] => {
    const reference: IAutoMovieHumanPersonSourceNormalInput["reference"] = input.reference;
    if (
      reference === undefined ||
      reference.generation !== plan.face.generation
    )
      throw new Error(
        "Person normal transport needs its actual matching reference generation.",
      );
    const current: ReturnType<typeof evaluateHumanPersonSourceCells> = evaluateHumanPersonSourceCells({ ...evaluation, input });
    const before: ReturnType<typeof evaluateHumanPersonSourceCells> = evaluateHumanPersonSourceCells({
      ...evaluation,
      input: reference,
    });
    const referenceField: ReturnType<IAutoMovieHumanPersonNormalTransportProps["referenceField"]> = props.referenceField(before.parentAreas);
    const referenceNormals: number[] = referenceField.normals;
    if (
      [input.face, input.body].every((positions: readonly number[], side: number): boolean =>
        used[side].every((vertex: number): boolean =>
          [0, 1, 2].every(
            (axis: number): boolean =>
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
            cell.samples.map((sample: number): number[] => point(before.sourcePositions, sample)),
            1,
          ).matrix,
        );
      return referenceNormals;
    }
    const stars: Map<string, IAutoMovieHumanPersonNormalStar> = new Map<string, IAutoMovieHumanPersonNormalStar>();
    for (const cell of transport.cells) {
      const prior: number[][] = cell.samples.map((sample: number): number[] =>
        point(before.sourcePositions, sample),
      );
      const actual: number[][] = cell.samples.map((sample: number): number[] =>
        point(current.sourcePositions, sample),
      );
      const changed: boolean = actual.some((one: number[], corner: number): boolean =>
        one.some((value: number, axis: number): boolean => value !== prior[corner][axis]),
      );
      const sourceFrame: IAutoMovieHumanPersonCellFrame = frame(prior, 1);
      const currentFrame: IAutoMovieHumanPersonCellFrame = frame(actual, 1);
      const inverse: ReturnType<typeof cofactorAutoMovieJacobian> = cofactorAutoMovieJacobian(sourceFrame.matrix);
      const target: number[] = frame(
        actual,
        Math.sqrt(currentFrame.area / sourceFrame.area),
      ).matrix;
      const jacobian: number[] = Array.from({ length: 9 }, (_: unknown, at: number): number =>
        [0, 1, 2].reduce(
          (sum: number, k: number): number =>
            sum +
            (target[Math.floor(at / 3) * 3 + k] *
              inverse.matrix[(at % 3) * 3 + k]) /
              inverse.determinant,
          0,
        ),
      );
      const cofactor: number[] = cofactorAutoMovieJacobian(jacobian).matrix;
      cell.samples.forEach((sample: number, corner: number): void => {
        const id: string = key(sample, cell.parent, cell.domains[corner]);
        if (!required.has(id)) return;
        const normal: readonly number[] = referenceField.at(sample, cell.parent);
        const density: readonly number[] = changed
          ? [0, 1, 2].map((axis: number): number =>
              [0, 1, 2].reduce(
                (sum: number, k: number): number => sum + cofactor[axis * 3 + k] * normal[k],
                0,
              ),
            )
          : normal;
        unit(density);
        const star: IAutoMovieHumanPersonNormalStar = stars.get(id) ?? {
          sum: [0, 0, 0],
          reference: normal,
          changed: false,
        };
        for (let axis: number = 0; axis < 3; axis++)
          star.sum[axis] += sourceFrame.area * density[axis];
        star.changed ||= changed;
        stars.set(id, star);
      });
    }
    const read: (sample: number, parent: number, domain: number) => IAutoMovieHumanPersonNormalStar = (sample: number, parent: number, domain: number): IAutoMovieHumanPersonNormalStar => {
      const star: IAutoMovieHumanPersonNormalStar | undefined = stars.get(key(sample, parent, domain));
      if (star === undefined)
        throw new Error(
          "Person normal transport needs an unambiguous used source star.",
        );
      return star;
    };
    return queries.flatMap((side: typeof queries[number], which: number): number[] =>
      side.flatMap((query: typeof queries[number][number], vertex: number): number[] => {
        if (query === undefined) return [0, 0, 0];
        const active: (IAutoMovieHumanPersonNormalStar | undefined)[] = query.points.map((point: typeof query.points[number]): IAutoMovieHumanPersonNormalStar | undefined =>
          point.active
            ? read(point.sample, query.parent, point.domain)
            : undefined,
        );
        // An unchanged source family retains its ancestral chart exactly.
        // Interpolating already-normalized finer fields would change q0 merely
        // because another disconnected cell or unused coordinate moved.
        if (active.every((star: IAutoMovieHumanPersonNormalStar | undefined): boolean => star?.changed !== true)) {
          const at: number =
            (which === 0 ? 0 : plan.face.samples.length * 3) + vertex * 3;
          return referenceNormals.slice(at, at + 3);
        }
        return interpolate(
          active.map((star: IAutoMovieHumanPersonNormalStar | undefined): readonly number[] =>
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
