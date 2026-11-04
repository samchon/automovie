import type { AutoMovieLoftContract, AutoMovieSolidJoin, AutoMovieSolidVector, IAutoMovieLoftChain, IAutoMovieSolidSurface } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanFoldJoin } from "./AutoMovieHumanFoldJoin";
import { AutoMovieHumanMergeEntry } from "./AutoMovieHumanMergeEntry";

type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * Several branches merged onto one host side by side: the fingers onto the
 * palm's distal cap and the thumb onto its radial side, the toes onto the
 * forefoot's cap (#3049, #3051). Each branch is a part whose station lines
 * leave the host across its web, merged by `AutoMovieHumanFoldJoin` with its
 * own fold radius (the smaller neighbour's half breadth at the web: the web
 * spans the gap between the two digits' surfaces).
 *
 * Caps. Two neighbouring branches' host rails must not cross, so each
 * branch's chord is capped at half the distance from its base landmark to the
 * nearest other branch's (half the gap between the two curves' nearest
 * points, which the landmarks stand on); past that the web's saddle is a
 * corner the two-part merge does not close (gap 3), and the two blends meet
 * at the cap's edge with their own G2 edges.
 */
export namespace AutoMovieHumanBranchMerges {
  /** One branch. */
  export interface IBranch {
    /** The branch's chain. */
    chain: IAutoMovieLoftChain;

    /** Its surface. */
    surface: IAutoMovieSolidSurface;

    /** Its base's landmark on the host's skin (the knuckle's dorsal point), calibration mm. */
    landmark: Vec3;

    /** Chart guesses of the landmark's foot on the branch and on the host. */
    guess: { part: [number, number]; host: [number, number] };

    /** The fold's radius, mm: the smaller neighbour's half breadth at the web. */
    radius: number;
  }

  /** The merged branches. */
  export interface IOutput {
    /** The blend chains. */
    chains: IAutoMovieLoftChain[];

    /** One merge entry per joined branch. */
    merges: IAutoMovieHumanBodyCalibration.IMerge[];
  }

  /**
   * Merge each branch onto the host.
   *
   * @param host The host's chain and surface.
   * @param branches The branches.
   * @param limits The trace's limits and the blends' sampling.
   * @param diagnostics Where a failed branch is recorded; the others still merge.
   * @returns The blends and the merge entries.
   */
  export function create(
    host: { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface },
    branches: readonly IBranch[],
    limits: { count: number; tolerance: number; grazing: number; columns: number; gap: number },
    diagnostics: AutoMovieLoftContract.IDiagnostic[],
  ): IOutput {
    const chains: IAutoMovieLoftChain[] = [];
    const merges: IAutoMovieHumanBodyCalibration.IMerge[] = [];
    branches.forEach((b: IBranch, i: number): void => {
      const nearest: number = Math.min(
        ...branches.filter((_: IBranch, j: number): boolean => j !== i).map((o: IBranch): number => Math.hypot(o.landmark[0] - b.landmark[0], o.landmark[1] - b.landmark[1], o.landmark[2] - b.landmark[2])),
      );
      const cap: number = Number.isFinite(nearest) ? nearest / 2 : b.radius;
      const join: AutoMovieSolidJoin.IResult = AutoMovieHumanFoldJoin.create({
        part: b.surface,
        host: host.surface,
        landmark: b.landmark,
        guess: b.guess,
        radius: (): number => b.radius,
        cap: (): number => cap,
        count: limits.count,
        tolerance: limits.tolerance,
        grazing: limits.grazing,
      });
      diagnostics.push(...join.diagnostics);
      if (join.join === null) return;
      const entry: AutoMovieHumanMergeEntry.IEntry | null = AutoMovieHumanMergeEntry.of(`blend.${b.chain.name}`, host.chain.name, b.chain.name, join.join, limits.columns, limits.gap, false, diagnostics);
      if (entry === null) return;
      chains.push(entry.chain);
      merges.push(entry.merge);
    });
    return { chains, merges };
  }
}
