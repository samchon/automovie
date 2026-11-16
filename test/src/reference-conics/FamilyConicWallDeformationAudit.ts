import { type AutoMovieLoftFrame, AutoMovieViewChain } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicSection as S } from "@automovie/human";
import { FamilyConicDeformationAudit as A } from "./FamilyConicDeformationAudit";

/** Read corresponding authored conic arcs without substituting a world-angle or nearest-mesh match. */
export namespace FamilyConicWallDeformationAudit {
  /** Finite-grid discrepancies; none is a whole-surface bound or an anatomical acceptance test. */
  export interface IReading {
    /** Number of paired points actually read, including every arc start and midpoint. */
    samples: number;

    /** Largest Euclidean discrepancy in millimetres. */
    maximumMm: number;

    /** Largest discrepancy normal to the candidate's declared section plane, in millimetres. */
    normalMm: number;

    /** Largest in-plane discrepancy, in millimetres. */
    inPlaneMm: number;

    /** Largest angle of a corresponding finite wall-arc chord under the map, in degrees; null if none has a direction. */
    maximumChordDegrees: number | null;

    /** Chords whose mapped reference or candidate has zero length; these are unavailable angles, not agreement. */
    unavailableChords: number;
  }

  /**
   * Compare two sections sharing the original layout at corresponding source stations. Each rational arc keeps its authored identity and
   * parameter t, independently of its polar angle or a downstream mesh's sampling. The requested grid is rounded up to an even number of
   * subdivisions per arc, at least two, so every arc start and midpoint is read. The end of an arc is the next arc's start.
   * Finite chords join consecutive samples of the same authored arc; their angles are wall observations, never emitted-band angles. Reliefs, caps, emitted loft interpolation, derivatives and connecting bands are outside this wall-only observation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States correspondence, millimetre units, actual sample count, refusals and the unobserved geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original rational arc parameter through AutoMovieViewChain.evaluate and each family's actual source frame; the shared layout supplies arc identity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolves each section and frame once, then one finite grid uses the pure point observer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A changed layout, inadmissible section or unavailable value throws; no nearest point, matching numerical phase or pass tolerance is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the actual sample count after source/frame preparation; arithmetic and retained maxima are constant per point.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each section and frame is prepared once for all its arc samples.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the immutable families for this call and retains only two sections/frames and scalar maxima; no point population or callback escapes.
   */
  export function section(reference: H.IFamily, candidate: H.IFamily, from: number, to: number, map: (p: A.V3) => A.V3, samples: number): IReading {
    if (reference.layout !== candidate.layout) throw new Error("The wall sections have no shared authored arc layout");
    if (![from, to].every(Number.isFinite) || !Number.isSafeInteger(samples) || samples < 1) throw new Error("The wall observer needs finite stations and a positive sample count");
    const before: AutoMovieViewChain.ISection = S.chain(H.reader(reference)(from), reference.layout);
    const after: AutoMovieViewChain.ISection = S.chain(H.reader(candidate)(to), candidate.layout);
    if (before.fault !== null || after.fault !== null || before.arcs.length === 0 || before.arcs.length !== after.arcs.length)
      throw new Error(`Unavailable corresponding conic sections: ${before.fault ?? after.fault ?? "arc count changed"}`);
    const source: AutoMovieLoftFrame.IFrame = H.axis(reference).at(from);
    const target: AutoMovieLoftFrame.IFrame = H.axis(candidate).at(to);
    const world: (frame: AutoMovieLoftFrame.IFrame, p: S.P) => A.V3 = (frame: AutoMovieLoftFrame.IFrame, p: S.P): A.V3 => [0, 1, 2].map((i: number): number => frame.origin[i]! + p[0] * frame.u[i]! + p[1] * frame.v[i]!) as A.V3;
    const divisions: number = Math.max(2, 2 * Math.ceil(samples / (2 * before.arcs.length)));
    const result: IReading = { samples: divisions * before.arcs.length, maximumMm: 0, normalMm: 0, inPlaneMm: 0, maximumChordDegrees: null, unavailableChords: 0 };
    for (const [arc, original] of before.arcs.entries()) {
      let previousSource: A.V3 = world(source, AutoMovieViewChain.evaluate(original, 0));
      let previousTarget: A.V3 = world(target, AutoMovieViewChain.evaluate(after.arcs[arc]!, 0));
      for (let k: number = 0; k < divisions; ++k) {
        const reading: A.IPoint = A.point(map, previousSource, previousTarget, [...target.u], [...target.v]);
        result.maximumMm = Math.max(result.maximumMm, reading.distanceMm);
        result.normalMm = Math.max(result.normalMm, reading.normalMm);
        result.inPlaneMm = Math.max(result.inPlaneMm, reading.inPlaneMm);
        const t: number = (k + 1) / divisions;
        const nextSource: A.V3 = world(source, AutoMovieViewChain.evaluate(original, t));
        const nextTarget: A.V3 = world(target, AutoMovieViewChain.evaluate(after.arcs[arc]!, t));
        const chord: A.IColumn = A.column(map, [previousSource, nextSource], [previousTarget, nextTarget]);
        if (chord.degrees === null) result.unavailableChords++;
        else result.maximumChordDegrees = Math.max(result.maximumChordDegrees ?? 0, chord.degrees);
        previousSource = nextSource;
        previousTarget = nextTarget;
      }
    }
    return result;
  }
}
