import {
  AutoMovieBernstein64 as B,
  type IAutoMovieCurve64 as C,
  AutoMovieCurveMath64 as V,
} from "@automovie/engine/geometry/curve";

/**
 * Named cubic occurrences retain native coefficient owners and oriented parameter intervals.
 * Millimetre coefficients remain independent of source topology and material correspondence.
 *
 * @evidence contracts/common.md#principled-implementation Native parent controls, positive phase widths and exact endpoint names define source-free piecewise cubic charts. Restriction delegates to maintained Bernstein arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One namespace owns occurrence algebra; observation, fitting, surface construction and serialization remain separate callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source faces, proximity weld, endpoint averaging or parameter clamping supplies authority.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes parent endpoint identity, occurrence direction, canonical phase and physical millimetres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace initialization performs no traversal; members state their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work There is no cross-request cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Members return caller-owned arrays and retain no resources.
 */
export namespace AutoMovieRecoveryEventCurve {
  /**
   * One immutable native cubic and the oriented interval used by an occurrence.
   *
   * @evidence contracts/common.md#principled-implementation Parent P0/P3 names refer to native endpoints even when start exceeds end.
   * @evidence contracts/common.md#clear-and-simple-design Native geometry and occurrence interval travel in one record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Interior parameters do not borrow endpoint names.
   * @evidence contracts/common.md#meaningful-documentation Parent positions use millimetres; start and end use normalized native phase.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller owns parent sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type owns no runtime cache.
   * @author Samchon
   */
  export interface Source {
    /** Stable owner of all four native coefficients. */
    authority: string;
    /** Original P0/P1/P2/P3 positions in millimetres. */
    parent: C.Span;
    /** Native P0 and P3 identity, independent of occurrence orientation. */
    endpointAuthorities: [string, string];
    /** First normalized native parameter, in [0,1]. */
    start: number;
    /** Last normalized native parameter, in [0,1]. */
    end: number;
  }

  /**
   * One restricted cubic with a positive width in its enclosing chart.
   *
   * @evidence contracts/common.md#principled-implementation Four Bernstein controls represent the occurrence; source retains its native owner and interval.
   * @evidence contracts/common.md#clear-and-simple-design The positive width defines phase independently of spatial length.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Width is neither a fitted tangent speed nor material transport evidence.
   * @evidence contracts/common.md#meaningful-documentation Controls are millimetres and width uses the enclosing chart unit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ownership belongs to its caller.
   * @author Samchon
   */
  export interface Piece {
    /** Occurrence controls in its increasing local parameter. */
    net: C.Span;
    /** Positive phase interval width. */
    width: number;
    /** Original native coefficient authority. */
    source: Source;
  }

  /**
   * Ordered cubic occurrences with an optional retained normalized phase partition.
   *
   * @evidence contracts/common.md#principled-implementation Explicit knots preserve the declared phase rather than recomputing spatial correspondence.
   * @evidence contracts/common.md#clear-and-simple-design A closed arc declares periodic topology separately from endpoint checks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Closure and shared phase alone do not certify a simple curve or immersed surface.
   * @evidence contracts/common.md#meaningful-documentation Knots span [0,1]; controls remain millimetres and original widths remain available.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record performs no traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller may share native parents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No hidden array lifetime is imposed.
   * @author Samchon
   */
  export interface Arc {
    /** Stable named path. */
    id: string;
    /** Declared periodic topology. */
    closed: boolean;
    /** Ordered oriented cubic occurrences. */
    pieces: Piece[];
    /** Optional exact normalized partition, including both 0 and 1. */
    canonicalKnots?: number[];
  }

  /**
   * Compare three coefficient components exactly, accepting either signed zero.
   *
   * @evidence contracts/common.md#principled-implementation Component equality retains strict coefficient admission without an epsilon.
   * @evidence contracts/common.md#clear-and-simple-design One shared predicate owns positional identity checks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unequal finite components are never averaged or snapped.
   * @evidence contracts/common.md#meaningful-documentation This is coefficient equality, not curve or source-surface equivalence.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Three comparisons have fixed cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No comparison result is cached.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No storage is allocated.
   */
  export const same: (a: C.Vector, b: C.Vector) => boolean = (
    a: C.Vector,
    b: C.Vector,
  ): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

  /**
   * Admit saved cubic continuity and retain its original native controls and names.
   *
   * @evidence contracts/common.md#principled-implementation Adjacent and periodic endpoints require exact C0; one native owner is emitted per original span.
   * @evidence contracts/common.md#clear-and-simple-design Saved coefficient input becomes an occurrence chart without fitting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No new phase, corner or surface correspondence is inferred.
   * @evidence contracts/common.md#meaningful-documentation Optional canonical knots override width normalization but never the native controls.
   * @evidence contracts/performance.md#efficient-algorithms Admission and construction visit N spans once, using O(N) new records.
   * @evidence contracts/performance.md#reuse-equivalent-work Each source retains the original parent coefficient reference.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned records reference immutable caller inputs and retain no global state.
   */
  export function fromCurve(
    curve: C.Cubic & { canonicalKnots?: readonly number[] },
    authority: string = curve.name,
  ): Arc {
    if (
      !authority ||
      !curve.spans.length ||
      curve.spans.length !== curve.phaseIntervals.length
    )
      throw new Error(
        "Named cubic spans and widths must have equal positive cardinality",
      );
    for (const span of curve.spans)
      if (
        span.some((point: C.Vector): boolean =>
          point.some((x: number): boolean => !Number.isFinite(x)),
        )
      )
        throw new Error("Native controls must be finite");
    for (let i: number = 1; i < curve.spans.length; i++)
      if (!same(curve.spans[i - 1]![3], curve.spans[i]![0]))
        throw new Error(
          "Stored curve has conflicting C0 endpoint coefficients",
        );
    if (curve.closed && !same(curve.spans[0]![0], curve.spans.at(-1)![3]))
      throw new Error("Stored periodic curve has conflicting seam endpoints");
    const arc: Arc = {
      id: authority,
      closed: curve.closed,
      pieces: curve.spans.map(
        (net: C.Span, i: number): Piece => ({
          net,
          width: curve.phaseIntervals[i]!,
          source: {
            authority: `${authority}.span${i}`,
            parent: net,
            endpointAuthorities: [
              `${authority}.knot${i}`,
              `${authority}.knot${(i + 1) % (curve.closed ? curve.spans.length : curve.spans.length + 1)}`,
            ],
            start: 0,
            end: 1,
          },
        }),
      ),
      ...(curve.canonicalKnots
        ? { canonicalKnots: [...curve.canonicalKnots] }
        : {}),
    };
    knots(arc);
    return arc;
  }

  /**
   * Return the retained normalized partition or normalize the supplied positive widths.
   *
   * @evidence contracts/common.md#principled-implementation Canonical knots require finite strict order and exact domain endpoints; otherwise cumulative positive widths define the partition.
   * @evidence contracts/common.md#clear-and-simple-design All restriction and reversal callers use this one phase admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No tiny interval is merged or replaced with a handle floor.
   * @evidence contracts/common.md#meaningful-documentation The returned fresh array spans [0,1] and certifies neither material phase nor geometric conditioning.
   * @evidence contracts/performance.md#efficient-algorithms One O(N) width or knot pass returns O(N) values.
   * @evidence contracts/performance.md#reuse-equivalent-work Retained knots are copied rather than recomputed from spatial positions.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned array survives the call.
   */
  export function knots(arc: Arc): number[] {
    if (
      !arc.pieces.length ||
      arc.pieces.some(
        (p: Piece): boolean => !(p.width > 0 && Number.isFinite(p.width)),
      )
    )
      throw new Error("An arc requires positive finite piece widths");
    if (arc.canonicalKnots) {
      const q: number[] = arc.canonicalKnots;
      if (
        q.length !== arc.pieces.length + 1 ||
        q[0] !== 0 ||
        q.at(-1) !== 1 ||
        q.some(
          (u: number, i: number): boolean =>
            !Number.isFinite(u) || (i > 0 && u <= q[i - 1]!),
        )
      )
        throw new Error(
          "Canonical arc knots must be strictly increasing from zero to one",
        );
      return [...q];
    }
    const total: number = arc.pieces.reduce(
      (sum: number, p: Piece): number => sum + p.width,
      0,
    );
    if (!Number.isFinite(total))
      throw new Error("The phase-width total must be representable");
    const q: number[] = [0];
    let sum: number = 0;
    for (const p of arc.pieces) {
      sum += p.width;
      q.push(sum / total);
    }
    q[q.length - 1] = 1;
    if (q.some((u: number, i: number): boolean => i > 0 && u <= q[i - 1]!))
      throw new Error(
        "Positive widths must retain a representable strict partition",
      );
    return q;
  }

  /**
   * Resolve an oriented occurrence endpoint to its exact native P0 or P3 name.
   *
   * @evidence contracts/common.md#principled-implementation The native start/end parameter selects the parent's endpoint, and exact coefficient equality verifies the claimed alias.
   * @evidence contracts/common.md#clear-and-simple-design Annular seams and physical endpoint bindings share one direction interpretation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Proper interior parameters return null instead of borrowing either endpoint identity.
   * @evidence contracts/common.md#meaningful-documentation Endpoint is occurrence start or end; native phase determines the original owner.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Constant-size endpoint admission has no traversal strategy.
   * @evidence contracts/performance.md#reuse-equivalent-work The original parent endpoint is checked directly without restriction reevaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function allocates and retains no arrays.
   */
  export function endpointAuthority(
    piece: Piece,
    endpoint: 0 | 1,
  ): string | null {
    const parameter: number =
      endpoint === 0 ? piece.source.start : piece.source.end;
    if (
      (endpoint !== 0 && endpoint !== 1) ||
      !Number.isFinite(parameter) ||
      parameter < 0 ||
      parameter > 1
    )
      throw new Error(
        "An occurrence endpoint needs a normalized finite native parameter",
      );
    if (parameter !== 0 && parameter !== 1) return null;
    const index: 0 | 1 = parameter === 0 ? 0 : 1;
    const name: string = piece.source.endpointAuthorities[index];
    if (
      !name ||
      !same(
        piece.net[endpoint === 0 ? 0 : 3],
        piece.source.parent[index === 0 ? 0 : 3],
      )
    )
      throw new Error(
        "A native endpoint name requires its exact original coefficient",
      );
    return name;
  }

  /**
   * Restrict a nonempty chart interval while retaining oriented native provenance.
   *
   * @evidence contracts/common.md#principled-implementation Maintained Bernstein restriction supplies the cubic controls; affine parameter composition retains native endpoint phase.
   * @evidence contracts/common.md#clear-and-simple-design Each intersected original piece remains one distinct occurrence with its parent authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampling, refit, material correspondence or new endpoint alias replaces the declared field.
   * @evidence contracts/common.md#meaningful-documentation Input [a,b] is increasing normalized chart phase; native intervals may remain reversed.
   * @evidence contracts/performance.md#efficient-algorithms One O(N) knot scan and fixed-degree restrictions retain O(K) intersected pieces.
   * @evidence contracts/performance.md#reuse-equivalent-work Full pieces retain original controls; only proper restrictions allocate new controls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned pieces reference original native parents; temporary mutable control copies expire after restriction.
   */
  export function portion(arc: Arc, a: number, b: number): Arc {
    if (!(a >= 0 && a < b && b <= 1))
      throw new Error("A finite increasing normalized interval is required");
    const q: number[] = knots(arc),
      pieces: Piece[] = [];
    for (let i: number = 0; i < arc.pieces.length; i++) {
      const x: number = Math.max(a, q[i]!),
        y: number = Math.min(b, q[i + 1]!);
      if (!(x < y)) continue;
      const p: Piece = arc.pieces[i]!,
        lo: number = x === q[i] ? 0 : (x - q[i]!) / (q[i + 1]! - q[i]!),
        hi: number = y === q[i + 1] ? 1 : (y - q[i]!) / (q[i + 1]! - q[i]!);
      const phase: (t: number) => number = (t: number): number =>
        t === 0
          ? p.source.start
          : t === 1
            ? p.source.end
            : p.source.start + (p.source.end - p.source.start) * t;
      const restricted: B.Poly | null =
        lo === 0 && hi === 1
          ? null
          : B.restrict(
              p.net.map((point: C.Vector): B.Vec => [...point]),
              lo,
              hi,
            );
      if (restricted && restricted.length !== 4)
        throw new Error("Cubic restriction changed coefficient cardinality");
      pieces.push({
        ...p,
        net: restricted
          ? [restricted[0]!, restricted[1]!, restricted[2]!, restricted[3]!]
          : p.net,
        width: y - x,
        source: { ...p.source, start: phase(lo), end: phase(hi) },
      });
    }
    if (!pieces.length) throw new Error("Empty curve interval");
    return { id: arc.id, closed: false, pieces };
  }

  /**
   * Reverse path occurrence order and native intervals without renaming parent endpoints.
   *
   * @evidence contracts/common.md#principled-implementation Reversing Bernstein controls and swapping native interval ends represents the same geometric path in the opposite direction.
   * @evidence contracts/common.md#clear-and-simple-design Canonical knots reverse with the path while native coefficient identity remains fixed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reversal does not infer a winding, material side or surface normal policy.
   * @evidence contracts/common.md#meaningful-documentation The output has fresh occurrence records and retains original parent coefficients.
   * @evidence contracts/performance.md#efficient-algorithms O(N) piece and optional knot passes allocate O(N) records.
   * @evidence contracts/performance.md#reuse-equivalent-work Native parents and endpoint-name pairs are reused unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned arc and no global reversal cache survives.
   */
  export function reverse(arc: Arc): Arc {
    const q: number[] = knots(arc);
    const out: Arc = {
      ...arc,
      pieces: arc.pieces
        .slice()
        .reverse()
        .map(
          (p: Piece): Piece => ({
            ...p,
            net: [p.net[3], p.net[2], p.net[1], p.net[0]],
            source: { ...p.source, start: p.source.end, end: p.source.start },
          }),
        ),
    };
    if (arc.canonicalKnots) {
      out.canonicalKnots = q
        .reverse()
        .map((u: number, i: number): number =>
          i === 0 ? 0 : i === arc.pieces.length ? 1 : 1 - u,
        );
      knots(out);
    }
    return out;
  }

  /**
   * Return exactly one original-span occurrence for a declared chart cell.
   *
   * @evidence contracts/common.md#principled-implementation The same restriction path supplies controls and native phase, and a cell crossing a native knot is refused.
   * @evidence contracts/common.md#clear-and-simple-design Surface compilers ask for one cubic instead of silently merging multiple spans.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Composite sides are not approximated with a replacement cubic.
   * @evidence contracts/common.md#meaningful-documentation The caller must partition at every relevant native knot before requesting a cell.
   * @evidence contracts/performance.md#efficient-algorithms The delegated O(N) knot scan retains only intersected pieces before the cardinality check.
   * @evidence contracts/performance.md#reuse-equivalent-work Returned provenance uses the original parent rather than a separately fitted boundary.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned piece survives; a refused temporary portion is released normally.
   */
  export function piece(arc: Arc, a: number, b: number): Piece {
    const part: Arc = portion(arc, a, b);
    if (part.pieces.length !== 1)
      throw new Error("A cubic chart cell crosses an undeclared native knot");
    return part.pieces[0]!;
  }

  /**
   * Evaluate one declared phase using the maintained Bernstein endpoint contract.
   *
   * @evidence contracts/common.md#principled-implementation The admitted partition selects one cubic and an affine local phase; original knot values select exact local 0 or 1.
   * @evidence contracts/common.md#clear-and-simple-design Evaluation delegates all polynomial arithmetic to the maintained engine.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest sample, extrapolated fallback or parameter clamping changes the field.
   * @evidence contracts/common.md#meaningful-documentation The parameter belongs to the normalized declared chart and the returned position uses millimetres.
   * @evidence contracts/performance.md#efficient-algorithms Admission and location take O(N) time; cubic evaluation has fixed work and storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Original occurrence controls feed evaluation without reconstruction or refitting.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary controls and partition expire on return; the caller receives one fresh position.
   */
  export function evaluate(arc: Arc, t: number): C.Vector {
    const q: number[] = knots(arc);
    const index: number = q.findIndex(
      (u: number, i: number): boolean =>
        i + 1 < q.length && t >= u && t <= q[i + 1]!,
    );
    if (index < 0) throw new Error("Parameter is outside the declared arc");
    const local: number =
      t === q[index]
        ? 0
        : t === q[index + 1]
          ? 1
          : (t - q[index]!) / (q[index + 1]! - q[index]!);
    return B.value(
      arc.pieces[index]!.net.map((point: C.Vector): B.Vec => [...point]),
      local,
    );
  }

  /**
   * Concatenate exactly meeting paths while preserving every native piece boundary.
   *
   * @evidence contracts/common.md#principled-implementation Exact occurrence endpoints admit path continuity; every native owner and positive width remains explicit.
   * @evidence contracts/common.md#clear-and-simple-design One composite arc exposes a piecewise boundary without changing its constituent coefficients.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal coordinates do not rewrite native endpoint names or certify a physical attachment.
   * @evidence contracts/common.md#meaningful-documentation The resulting chart normalizes the concatenated supplied widths; individual optional canonical charts are not implicitly composed.
   * @evidence contracts/performance.md#efficient-algorithms O(N) validation and flattening retain all N original pieces.
   * @evidence contracts/performance.md#reuse-equivalent-work Original piece and parent records are referenced without duplicating coefficients.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one new piece-list array is retained by the returned composite.
   */
  export function concatenate(arcs: readonly Arc[], id: string): Arc {
    if (!id.trim() || !arcs.length)
      throw new Error("A composite needs a name and nonempty paths");
    for (const arc of arcs) knots(arc);
    for (let i: number = 1; i < arcs.length; i++)
      if (!same(arcs[i - 1]!.pieces.at(-1)!.net[3], arcs[i]!.pieces[0]!.net[0]))
        throw new Error(
          "Composite paths must share an exact endpoint coefficient",
        );
    return {
      id,
      closed: false,
      pieces: arcs.flatMap((arc: Arc): Piece[] => arc.pieces),
    };
  }

  /**
   * Construct a named straight cubic between two explicit physical endpoints.
   *
   * @evidence contracts/common.md#principled-implementation Degree elevation places the two handles at one-third and two-thirds of the endpoint displacement.
   * @evidence contracts/common.md#clear-and-simple-design The line uses the same named cubic admission as fitted paths.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero-length path is rejected rather than assigned a fabricated phase width.
   * @evidence contracts/common.md#meaningful-documentation Input positions and the positive chord-width phase use millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Fixed-degree line construction has constant cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Endpoints remain the supplied exact coefficient values; handles are constructed once.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned one-piece arc owns its handles and retains no global state.
   */
  export function line(a: C.Vector, b: C.Vector, id: string): Arc {
    const width: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (!(width > 0 && Number.isFinite(width)))
      throw new Error("A named line needs positive representable length");
    const ma: V.V = V.clone(a),
      mb: V.V = V.clone(b);
    return fromCurve({
      type: "cubicBezier",
      name: id,
      closed: false,
      unit: "mm",
      phaseUnit: "mm",
      phaseIntervals: [width],
      spans: [[a, V.mix(ma, mb, 1 / 3), V.mix(ma, mb, 2 / 3), b]],
    });
  }

  /**
   * Move a closed path's chart origin to an existing knot without altering native owners.
   *
   * @evidence contracts/common.md#principled-implementation A cyclic piece permutation preserves the closed coefficient path, and optional canonical phases are translated modulo one.
   * @evidence contracts/common.md#clear-and-simple-design The caller selects an existing knot; this owner only applies the declared phase change.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No exterior-point, nearest-bank or source-specific rule chooses the seam.
   * @evidence contracts/common.md#meaningful-documentation The selected knot must exist and the coefficient path must close exactly; this changes chart origin rather than material correspondence.
   * @evidence contracts/performance.md#efficient-algorithms O(N) piece permutation and optional phase translation allocate O(N) arrays.
   * @evidence contracts/performance.md#reuse-equivalent-work All original piece records and native parent coefficients remain shared.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned arc's arrays survive; no seam-selection state is cached.
   */
  export function rotateAtKnot(arc: Arc, index: number): Arc {
    const q: number[] = knots(arc);
    if (
      !Number.isSafeInteger(index) ||
      index < 0 ||
      index >= arc.pieces.length ||
      !same(arc.pieces[0]!.net[0], arc.pieces.at(-1)!.net[3])
    )
      throw new Error(
        "A periodic rotation must address an existing knot of a closed path",
      );
    const out: Arc = {
      ...arc,
      pieces: [...arc.pieces.slice(index), ...arc.pieces.slice(0, index)],
    };
    if (arc.canonicalKnots) {
      const offset: number = q[index]!;
      out.canonicalKnots = [
        ...q.slice(index, -1).map((u: number): number => u - offset),
        ...q.slice(0, index).map((u: number): number => 1 - offset + u),
        1,
      ];
      out.canonicalKnots[0] = 0;
      knots(out);
    }
    return out;
  }
}
