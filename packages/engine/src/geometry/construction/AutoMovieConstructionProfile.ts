import type { IAutoMovieConstructionProfile } from "@automovie/interface";

import { AutoMovieConstructionProfilePhase } from "./AutoMovieConstructionProfilePhase";
import { AutoMovieConstructionProfileSurface } from "./AutoMovieConstructionProfileSurface";
import { AutoMovieConstructionProfileTopology } from "./AutoMovieConstructionProfileTopology";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { IAutoMovieConstructionProfileSource } from "./IAutoMovieConstructionProfileSource";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** One actual original interval and its existing surface-chart consumer. */
interface Piece {
  /** Stable atlas ordinal and direct original neighbor ordinals. */
  index: number;
  /** Previous ordered piece of this same complete loop. */
  previous: number;
  /** Next ordered piece of this same complete loop. */
  next: number;
  /** Value-copied original interval declaration. */
  piece: IAutoMovieConstructionProfile.IPiece;
  /** Value-copied physical loop interval and explicit orientation. */
  loop: IAutoMovieConstructionProfile.ILoop;
  /** Borrowed immutable original function owner. */
  curve: IAutoMovieConstructionProfileSource.ICurve;
  /** Actual chart surface, physical station mm by normalized piece coordinate. */
  surface: IAutoMovieSolidSurface;
}

/**
 * Evaluate original piecewise sections through the existing surface/atlas contracts.
 *
 * Each normalized piece coordinate maps affinely to its actual original clock.
 * Complete source2 and actual plane2 use the existing world product rule, with
 * no interpolation, polar restriction or generated chain. Point0 remains
 * independently readable where total2 is unavailable. Numeric failures are
 * admission errors; exceptions from original functions/getters retain identity.
 *
 * Queried endpoint closure is a binary64 observation. Whole-domain simplicity, topology transitions and cross-face continuity remain separate admission obligations; branch identities survive.
 *
 * @evidence contracts/common.md#principled-implementation Exact original-clock pullback and actual frame product rules preserve the complete original functions and all six total2 vectors on declared domains.
 * @evidence contracts/common.md#clear-and-simple-design One preparation validates source references and makes ordinary SolidSurface charts plus an inclusive rectangular atlas; section closure remains an explicit query rather than an inferred global certificate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sample fit, generated-loft cut, implicit polar envelope, Taylor extension or fabricated jet appears. Declared winding does not prove simplicity, outward orientation or regularity across the entire continuum.
 * @evidence contracts/common.md#meaningful-documentation States metre-to-mm conversion, normalized piece coordinates, independent Point0, failure ownership and the limits of chart/section admission.
 * @evidence contracts/performance.md#efficient-algorithms Preparation indexes P pieces, G guides and R region references in O(P+G+R) expected Map/Set work. A section closes O(P) endpoint pairs; across/region index lookup is expected O(1), plus actual original geometry/membership query costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared indexes and original owners serve every query; no original geometry is reconstructed or duplicated per logical region.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A prepared assembly owns copied O(P+G+R) declaration data, surfaces and indexes while borrowing original closures; all are released with its caller, with no global cache or background resource.
 */
export namespace AutoMovieConstructionProfile {
  /** Original section/atlas readers with source identity and no final mesh claim. */
  export interface IPrepared {
    /** Detached pure declaration; edits require another preparation. */
    definition: IAutoMovieConstructionProfile;

    /** Existing atlas of actual piece charts, not final closed-solid certification. */
    atlas: IAutoMovieSolidAtlas;

    /** Piece id to the same actual atlas surface identity. */
    surfaces: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /** Same original functions on their actual supported neighborhoods, before retained-domain restrictions. */
    originals: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /** Active loop ids after explicit endpoint closure checks at this station mm. */
    section(station: number): readonly string[];

    /** Actual world phase derivatives; second phase may be null independently of physical2. */
    phase(
      piece: string,
      station: number,
      coordinate: number,
    ): AutoMovieConstructionProfilePhase.IReading;

    /** Read the same original region membership at an actual piece chart address. */
    contains(
      region: string,
      piece: string,
      station: number,
      coordinate: number,
    ): boolean;
  }

  /** Prepare immutable original owners; malformed domains/references throw before publication. */
  export function create(
    source: IAutoMovieConstructionProfileSource,
  ): IPrepared {
    const definition: IAutoMovieConstructionProfile = structuredClone(
      source.definition,
    );
    if (
      !definition.name ||
      !interval(definition.domain) ||
      definition.plane !== source.plane.id ||
      !definition.revisions.source ||
      !definition.revisions.constraints ||
      !definition.revisions.topology
    )
      fail(
        "The original profile has no finite retained domain or matching plane owner.",
      );
    AutoMovieConstructionProfileTopology.admit(definition, source);
    const records: Piece[] = [];
    const byPiece: Map<string, Piece> = new Map();
    const byLoop: Map<string, Piece[]> = new Map();
    const byRegion: Map<string, IAutoMovieConstructionProfile.IRegion> =
      new Map();
    for (const loop of definition.loops) {
      if (
        !loop.id ||
        byLoop.has(loop.id) ||
        !interval(loop.domain) ||
        !inside(loop.domain, definition.domain) ||
        loop.pieces.length === 0 ||
        (loop.orientation !== 1 && loop.orientation !== -1) ||
        (loop.surfaceOrientation !== undefined &&
          loop.surfaceOrientation !== 1 &&
          loop.surfaceOrientation !== -1) ||
        (loop.kind !== "outer" && loop.kind !== "hole")
      )
        fail("The original profile has a malformed, duplicate or empty loop.");
      const offset: number = records.length;
      const loopRecords: Piece[] = [];
      byLoop.set(loop.id, loopRecords);
      for (const piece of loop.pieces) {
        const curve: IAutoMovieConstructionProfileSource.ICurve | undefined =
          source.curves.get(piece.source);
        if (
          !piece.id ||
          byPiece.has(piece.id) ||
          !piece.branch ||
          !interval(piece.clock) ||
          (piece.direction !== 1 && piece.direction !== -1) ||
          curve === undefined ||
          typeof curve.point !== "function" ||
          typeof curve.jet !== "function" ||
          !interval(curve.domain) ||
          !interval(curve.clock) ||
          !inside(
            [1000 * loop.domain[0], 1000 * loop.domain[1]],
            curve.domain,
          ) ||
          !inside(piece.clock, curve.clock)
        )
          fail(
            `Original profile piece ${piece.id} has an unavailable owner or invalid interval.`,
          );
        const index: number = records.length;
        const record: Piece = {
          index,
          previous:
            offset +
            ((index - offset + loop.pieces.length - 1) % loop.pieces.length),
          next: offset + ((index - offset + 1) % loop.pieces.length),
          piece,
          loop,
          curve: curve!,
          surface: AutoMovieConstructionProfileSurface(
            source,
            definition.name,
            loop,
            piece,
            curve!,
          ),
        };
        records.push(record);
        loopRecords.push(record);
        byPiece.set(piece.id, record);
      }
    }
    if (records.length === 0)
      fail("An original profile needs at least one actual loop.");
    const guideIds: Set<string> = new Set();
    for (const guide of definition.guides) {
      const record: Piece | undefined = byPiece.get(guide.piece);
      if (
        !guide.id ||
        guideIds.has(guide.id) ||
        record === undefined ||
        !Number.isFinite(guide.clock) ||
        guide.clock < record.piece.clock[0] ||
        guide.clock > record.piece.clock[1]
      )
        fail(`Original guide ${guide.id} has no valid piece/clock address.`);
      guideIds.add(guide.id);
    }
    const regionPieces: Map<string, Set<string>> = new Map();
    for (const region of definition.regions) {
      if (
        !region.id ||
        byRegion.has(region.id) ||
        !region.material ||
        !region.binding ||
        region.pieces.length === 0 ||
        region.pieces.some((id: string): boolean => !byPiece.has(id))
      )
        fail(
          `Original region ${region.id} has no valid piece/material/binding address.`,
        );
      const domain: readonly [number, number] =
        region.domain ?? definition.domain;
      const hasTrim: boolean =
        region.trim !== undefined && region.trim !== null;
      const trim: IAutoMovieConstructionProfileSource.IRegion | undefined =
        hasTrim ? source.regions?.get(region.trim!) : undefined;
      if (
        !interval(domain) ||
        !inside(domain, definition.domain) ||
        (hasTrim &&
          (trim === undefined ||
            !interval(trim.domain) ||
            !inside([1000 * domain[0], 1000 * domain[1]], trim.domain)))
      )
        fail(
          `Original region ${region.id} has an unavailable active domain or trim owner.`,
        );
      regionPieces.set(region.id, new Set(region.pieces));
      byRegion.set(region.id, region);
    }
    const surfaces: Map<string, IAutoMovieSolidSurface> = new Map(
      records.map((record: Piece): [string, IAutoMovieSolidSurface] => [
        record.piece.id,
        record.surface,
      ]),
    );
    const originals: Map<string, IAutoMovieSolidSurface> = new Map(
      records.map((record: Piece): [string, IAutoMovieSolidSurface] => [
        record.piece.id,
        AutoMovieConstructionProfileSurface(
          source,
          definition.name,
          record.loop,
          record.piece,
          record.curve,
          record.curve.domain,
        ),
      ]),
    );
    const atlas: IAutoMovieSolidAtlas = {
      name: definition.name,
      faces: records.map(
        (record: Piece): IAutoMovieSolidSurface => record.surface,
      ),
      kept: (face: number, u: number, v: number): boolean => {
        const current: Piece | undefined = records[face];
        return (
          current !== undefined &&
          Number.isFinite(u) &&
          Number.isFinite(v) &&
          u >= current.surface.domain![0] &&
          u <= current.surface.domain![1] &&
          (current.surface.period !== undefined || (v >= 0 && v <= 1))
        );
      },
      across: (
        face: number,
        u: number,
        v: number,
      ): { face: number; u: number; v: number } | null => {
        const current: Piece | undefined = records[face];
        if (
          current === undefined ||
          current.surface.period !== undefined ||
          !Number.isFinite(u) ||
          !Number.isFinite(v) ||
          u < current.surface.domain![0] ||
          u > current.surface.domain![1] ||
          (v >= 0 && v <= 1)
        )
          return null;
        const neighbor: number = v < 0 ? current.previous : current.next;
        const target: number = v < 0 ? 1 : 0;
        joined(
          current.surface.point!(u, v < 0 ? 0 : 1),
          records[neighbor]!.surface.point!(u, target),
          current.loop.id,
        );
        return { face: neighbor, u, v: target };
      },
    };
    return {
      definition,
      atlas,
      surfaces,
      originals,
      phase: AutoMovieConstructionProfilePhase.create(source, definition),
      section: (station: number): readonly string[] => {
        if (
          !Number.isFinite(station) ||
          station < 1000 * definition.domain[0] ||
          station > 1000 * definition.domain[1]
        )
          fail("Original section query is outside its retained domain.");
        const active: string[] = [];
        for (const loop of definition.loops) {
          if (
            station < 1000 * loop.domain[0] ||
            station > 1000 * loop.domain[1]
          )
            continue;
          const pieces: Piece[] = byLoop.get(loop.id)!;
          for (let index: number = 0; index < pieces.length; index++) {
            const end: readonly number[] = pieces[index]!.surface.point!(
              station,
              1,
            );
            const start: readonly number[] = pieces[
              (index + 1) % pieces.length
            ]!.surface.point!(station, 0);
            joined(end, start, loop.id);
          }
          active.push(loop.id);
        }
        if (active.length === 0)
          fail("No original loop owns this profile station.");
        return active;
      },
      contains: (
        regionId: string,
        pieceId: string,
        station: number,
        coordinate: number,
      ): boolean => {
        const region: IAutoMovieConstructionProfile.IRegion | undefined =
          byRegion.get(regionId);
        const record: Piece | undefined = byPiece.get(pieceId);
        if (region === undefined || record === undefined)
          fail("Original region query has an unknown region or piece address.");
        const domain: readonly [number, number] =
          region!.domain ?? definition.domain;
        if (
          coordinate < 0 ||
          coordinate > 1 ||
          !regionPieces.get(regionId)!.has(pieceId) ||
          !atlas.kept(record!.index, station, coordinate) ||
          station < 1000 * domain[0] ||
          station > 1000 * domain[1]
        )
          return false;
        const original: number =
          record!.piece.clock[record!.piece.direction === 1 ? 0 : 1] +
          record!.piece.direction *
            (record!.piece.clock[1] - record!.piece.clock[0]) *
            coordinate;
        return region!.trim === undefined || region!.trim === null
          ? true
          : source.regions!.get(region!.trim)!.contains(station, original);
      },
    };
  }
}

/** Finite increasing owned intervals reject overflow as well as collapsed clocks. */
function interval(value: readonly [number, number]): boolean {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(Number.isFinite) &&
    value[1] > value[0] &&
    Number.isFinite(value[1] - value[0])
  );
}

/** Check this actual boundary query without claiming whole-domain equivalence. */
function joined(
  end: readonly number[],
  start: readonly number[],
  loop: string,
): void {
  if (
    end.some(
      (value: number, k: number): boolean =>
        Math.abs(value - start[k]!) >
        32 * Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(start[k]!)),
    )
  )
    fail(`Original loop ${loop} has a mismatched actual boundary query.`);
}

/** Restriction retains original parameter support without extending actual ownership. */
function inside(
  value: readonly [number, number],
  owner: readonly [number, number],
): boolean {
  return value[0] >= owner[0] && value[1] <= owner[1];
}

/** Named numerical/source admission failures remain distinct from foreign exceptions. */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}
