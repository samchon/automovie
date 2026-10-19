import {
  AutoMovieBernstein64 as B,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";
import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";

import type { IAutoMovieHumanSurfaceDefinition as D } from "./IAutoMovieHumanSurfaceDefinition";

/**
 * Write one generated Human field into exact tensor patches and construction.
 * Semantic coefficient identities establish topology; equal coordinates do not
 * create an edge. A strip consumes full dP/ds coefficients in physical mm, and
 * uses the public Bernstein Hermite constructor without normalizing derivatives.
 * The same patch rows supply its actual section and longitudinal restrictions.
 *
 * This writer admits finite coefficients and exact shared-position consistency.
 * It does not infer anatomical incidence, solve branch ribbons, or certify G1,
 * immersion or embedding. The owning Human layout supplies those constraints.
 * All retained arrays belong to one definition; no reference catalogue is read.
 */
export class AutoMovieHumanSurfaceBuilder64 {
  private readonly controls: IAutoMovieBicubicAtlasGeometry["controls"] = [];
  private readonly addresses: Map<string, number> = new Map();
  private readonly patches: IAutoMovieBicubicAtlasGeometry["patches"] = [];
  private readonly owners: Map<string, D.Patch> = new Map();
  private readonly courses: D.Course[] = [];
  private readonly boundaries: D.Boundary[] = [];

  /** Scope physical identity and retain the caller's explicit realization policy. */
  public constructor(private readonly props: {
    domain: string;
    revision: string;
    toleranceMm: number;
    maxCells: number;
    maxVertices: number;
  }) {}

  /** Publish the same owner section and physical jet used by its incident charts. */
  public boundary(value: D.Boundary): void {
    if (this.boundaries.some((cut: D.Boundary): boolean => cut.id === value.id))
      throw new Error(`Duplicate generated cut ${value.id}`);
    this.boundaries.push(value);
  }

  /**
   * Publish one complete row-major bicubic net with explicit coefficient names.
   * Conflicting values at an existing name reject the definition before output.
   * A normal fan is not welded by position, and no missing coefficient is filled.
   */
  public patch(props: {
    id: string;
    grid: readonly (readonly C.Vector[])[];
    identities: readonly (readonly string[])[];
    owner: D.Patch;
    /** A strip publishes its own physical-mm restrictions instead. */
    inspection?: boolean;
  }): void {
    if (
      this.owners.has(props.id) ||
      props.grid.length !== 4 || props.identities.length !== 4 ||
      props.grid.some((row: readonly C.Vector[]): boolean => row.length !== 4) ||
      props.identities.some((row: readonly string[]): boolean => row.length !== 4)
    )
      throw new Error(`Invalid or duplicate generated patch ${props.id}`);
    const ids: number[] = [];
    for (let row: number = 0; row < 4; ++row)
      for (let column: number = 0; column < 4; ++column) {
        const point: C.Vector = props.grid[row]![column]!;
        const name: string = props.identities[row]![column]!;
        if (!name || !point.every(Number.isFinite))
          throw new Error(`Unresolved generated coefficient on ${props.id}`);
        const existing: number | undefined = this.addresses.get(name);
        if (existing !== undefined) {
          const value: IAutoMovieBicubicAtlasGeometry["controls"][number] =
            this.controls[existing]!;
          if (
            value.x !== point[0] / 1000 ||
            value.y !== point[1] / 1000 ||
            value.z !== point[2] / 1000
          )
            throw new Error(`Conflicting generated coefficient identity ${name}`);
          ids.push(existing);
        } else {
          this.addresses.set(name, this.controls.length);
          ids.push(this.controls.length);
          this.controls.push({x: point[0] / 1000, y: point[1] / 1000, z: point[2] / 1000});
        }
      }
    this.patches.push({ id: props.id, controlIds: ids });
    this.owners.set(props.id, props.owner);
    if (props.inspection !== false)
      for (const phase of [0, 0.5, 1]) {
        const controls: C.Span = props.grid.map((row: readonly C.Vector[]): C.Vector =>
          B.value(row.map((p: C.Vector): B.Vec => [...p]), phase),
        ) as unknown as C.Span;
        this.courses.push({name: `${props.id}/u${phase}`, part: props.owner.part,
          side: props.owner.side, role: "guide", patches: [props.id],
          curve: {type: "cubicBezier", name: `${props.id}/u${phase}`, closed: false,
            unit: "mm", phaseUnit: "normalized", phaseIntervals: [1], spans: [controls]}});
      }
  }

  /**
   * Generate a closed tube between two owner sections using complete physical
   * transverse jets. Both sections use the same declared angular correspondence.
   * The physical chart points along breadthAxis cross anteriorAxis for outward
   * orientation. A neighboring reversed chart must transform its full jets first.
   */
  public strip(props: {
    id: string;
    start: { id: string; curve: C.Cubic; fullJ: readonly C.Span[] };
    end: { id: string; curve: C.Cubic; fullJ: readonly C.Span[] };
    lengthMm: number;
    owner: D.Patch;
  }): void {
    const a: C.Cubic = props.start.curve;
    const b: C.Cubic = props.end.curve;
    const count: number = a.spans.length;
    if (
      !(Number.isFinite(props.lengthMm) && props.lengthMm > 0) ||
      !a.closed || !b.closed || count === 0 ||
      b.spans.length !== count || props.start.fullJ.length !== count ||
      props.end.fullJ.length !== count || a.phaseUnit !== b.phaseUnit ||
      a.phaseIntervals.length !== count || b.phaseIntervals.length !== count ||
      a.phaseIntervals.some((width: number, i: number): boolean =>
        !(width > 0) || width !== b.phaseIntervals[i])
    )
      throw new Error(`Incompatible physical strip ${props.id}`);
    const patchIds: string[] = [];
    const totalPhase: number = a.phaseIntervals.reduce(
      (sum: number, width: number): number => sum + width, 0,
    );
    let phaseStart: number = 0;
    /** Shared angular endpoints have one semantic node, including closure. */
    function angular(span: number, column: number): string {
      return column === 3 ? `${(span + 1) % count}/0` : `${span}/${column}`;
    }
    for (let span: number = 0; span < count; ++span) {
      const id: string = `${props.id}/${span}`;
      const copy: (net: readonly C.Vector[]) => B.Poly = (
        net: readonly C.Vector[],
      ): B.Poly => net.map((point: C.Vector): B.Vec => [...point]);
      const grid: B.Grid = B.hermite(
        copy(a.spans[span]!), copy(b.spans[span]!),
        copy(props.start.fullJ[span]!), copy(props.end.fullJ[span]!), props.lengthMm,
      );
      const identities: string[][] = grid.map(
        (_: B.Poly, row: number): string[] => [0,1,2,3].map(
          (column: number): string => {
            const node: string = angular(span, column);
            return row === 0 ? `${props.start.id}/${node}`
              : row === 3 ? `${props.end.id}/${node}`
                : `${props.id}/row${row}/${node}`;
          },
        ),
      );
      const rectangle: D.Patch["textureRectangle"] = props.owner.textureRectangle;
      const phaseEnd: number = phaseStart + a.phaseIntervals[span]!;
      const head: D.Patch["headChart"] = props.owner.headChart;
      const headAt: (u: number, v: number) => readonly [number, number] = (
        u: number, v: number,
      ): readonly [number, number] => [0, 1].map(
        (axis: number): number =>
          (1-u)*(1-v)*head![0][axis]! + u*(1-v)*head![1][axis]! +
          u*v*head![2][axis]! + (1-u)*v*head![3][axis]!,
      ) as unknown as readonly [number, number];
      this.patch({ id, grid, identities, inspection: false, owner: {
        ...props.owner,
        headChart: head === null ? null : [
          headAt(phaseStart/totalPhase, 0), headAt(phaseEnd/totalPhase, 0),
          headAt(phaseEnd/totalPhase, 1), headAt(phaseStart/totalPhase, 1),
        ],
        textureRectangle: [
          rectangle[0] + (rectangle[2] - rectangle[0]) * phaseStart / totalPhase,
          rectangle[1],
          rectangle[0] + (rectangle[2] - rectangle[0]) * phaseEnd / totalPhase,
          rectangle[3],
        ],
      } });
      phaseStart = phaseEnd;
      patchIds.push(id);
      for (const phase of [0, 0.5]) {
        // Evaluate each complete cross-course row. A coefficient column is not
        // an interior surface restriction and must not be drawn as one.
        const controls: C.Span = grid.map(
          (row: B.Poly): B.Vec => B.value(row, phase),
        ) as unknown as C.Span;
        this.courses.push({
          name: `${id}/longitudinal/${phase}`, part: props.owner.part,
          side: props.owner.side, role: "guide", patches: [id],
          curve: { type: "cubicBezier", name: `${id}/longitudinal/${phase}`,
            closed: false, unit: "mm", phaseUnit: "mm",
            phaseIntervals: [props.lengthMm], spans: [controls] },
        });
      }
    }
    for (const station of [props.start, props.end])
      this.courses.push({
        name: station.id, curve: station.curve, patches: patchIds,
        role: "section", part: props.owner.part, side: props.owner.side,
      });
  }

  /** Transfer the one complete coefficient registry and its actual consumer map. */
  public finish(qualifications: readonly string[]): D {
    return {
      revision: this.props.revision,
      atlas: {
        type: "bicubic-atlas", topologyDomain: this.props.domain,
        controls: this.controls, patches: this.patches,
        tolerance: this.props.toleranceMm / 1000,
        maxCells: this.props.maxCells, maxVertices: this.props.maxVertices,
        cellBudgetPolicy: "retain-coarse",
      },
      patches: this.owners, courses: this.courses, boundaries: this.boundaries,
      qualifications: [...qualifications],
    };
  }
}
