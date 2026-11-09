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
 * @evidence contracts/development/common.md#meaningful-documentation States metre-to-mm conversion, normalized piece coordinates, independent Point0, failure ownership and the limits of chart/section admission.
 * @evidence contracts/development/design.md#principled-representation Represents Evaluate original piecewise sections through the existing surface/atlas contracts: companion namespace of 2 members (`IPrepared`, `create`); units and frames named in its text: world, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionProfile` in packages/engine/src/geometry/construction/AutoMovieConstructionProfile.ts; its surface is the 2 members listed and the text shows 13 other files naming it, mostly packages/engine (6), test (4), packages/human (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieConstructionProfile {
  /**
   * Original section/atlas readers with source identity and no final mesh claim.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Original section/atlas readers with source identity and no final mesh claim.
   * @evidence contracts/development/design.md#principled-representation Represents Original section/atlas readers with source identity and no final mesh claim: interface of 7 members (`definition`, `atlas`, `surfaces`, `originals`, `section`, `phase`, ...); units and frames named in its text: world, second. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IPrepared` in packages/engine/src/geometry/construction/AutoMovieConstructionProfile.ts; its surface is the 7 members listed and the text shows 62 other files naming it, mostly packages/human (37), packages/engine (12), test (10), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IPrepared {
    /** Detached pure declaration; edits require another preparation. */
    definition: IAutoMovieConstructionProfile;

    /** Existing atlas of actual piece charts, not final closed-solid certification. */
    atlas: IAutoMovieSolidAtlas;

    /** Piece id to the same actual atlas surface identity. */
    surfaces: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /** Same original functions on their actual supported neighborhoods, before retained-domain restrictions. */
    originals: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /**
     * Active loop ids after explicit endpoint closure checks at this station mm.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Active loop ids after explicit endpoint closure checks at this station mm.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Active loop ids after explicit endpoint closure checks at this station mm.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    section(station: number): readonly string[];

    /**
     * Actual world phase derivatives; second phase may be null independently of physical2.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Actual world phase derivatives; second phase may be null independently of physical2.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Actual world phase derivatives; second phase may be null independently of physical2.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    phase(
      piece: string,
      station: number,
      coordinate: number,
    ): AutoMovieConstructionProfilePhase.IReading;

    /**
     * Read the same original region membership at an actual piece chart address.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Read the same original region membership at an actual piece chart address.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Read the same original region membership at an actual piece chart address.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    contains(
      region: string,
      piece: string,
      station: number,
      coordinate: number,
    ): boolean;
  }

  /**
   * Prepare immutable original owners; malformed domains/references throw before publication.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Prepare immutable original owners; malformed domains/references throw before publication.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Prepare immutable original owners; malformed domains/references throw before publication) directly over its typed inputs (`source`) as nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces; for-of over definition.guides), delegating to `structuredClone`, `interval`, `fail`, `AutoMovieConstructionProfileTopology.admit`, `byLoop.has`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1000, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 264 lines and 17 top-level statements that reuses `structuredClone`, `interval`, `fail`, `AutoMovieConstructionProfileTopology.admit`, `byLoop.has` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 28 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `source`; the dominant cost is nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces; for-of over definition.guides), performed once per call with 19 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 19 allocation sites become the returned value or die with the call, so nothing grows.
   */
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
