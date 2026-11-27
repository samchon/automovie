import {
  IAutoMovieDiagnostic,
  IAutoMovieFormationMotion,
  type IAutoMovieFormationPlacement,
  IAutoMovieFormationSlotMotion,
  type IAutoMovieFormationSlotPlacement,
  type IAutoMovieSampledFormationMotion,
  IAutoMovieShotContract,
  IAutoMovieSpace,
  type IAutoMovieValidateFormationGround,
  IAutoMovieVector3,
} from "@automovie/interface";

import { formationSlotPosition } from "../../populationRuntime/formation/internal/formationSlotPosition";
import { placeFormationSlot } from "../../populationRuntime/formation/internal/placeFormationSlot";
import { AutoMovieEnginePopulationFormation } from "../../populationRuntime/formation/AutoMovieEnginePopulationFormation";
import { heightAt } from "../../space/internal/heightAt";
import { engineDiagnostic } from "./engineDiagnostic";

/**
 * Sample actual placed members against authored space coverage and height,
 * reporting the first void or sink per formation.
 */
export function validateAutoMovieFormationGround(
  contract: Pick<IAutoMovieShotContract, "id">,
  value: IAutoMovieValidateFormationGround.IValue,
): IAutoMovieDiagnostic[] {
  const space: IAutoMovieSpace | null | undefined = value.scene.space;
  if (space === undefined || space === null) return [];
  const cues: readonly IAutoMovieFormationMotion[] =
    value.formationMotions ?? [];
  const slotCues: readonly IAutoMovieFormationSlotMotion[] =
    value.formationSlotMotions ?? [];
  const diagnostics: IAutoMovieDiagnostic[] = [];
  for (const formation of value.formations) {
    const own: IAutoMovieFormationMotion[] = cues.filter(
      (cue: IAutoMovieFormationMotion): boolean =>
        cue.formation === formation.id,
    );
    const ownSlots: IAutoMovieFormationSlotMotion[] = slotCues.filter(
      (cue: IAutoMovieFormationSlotMotion): boolean =>
        cue.formation === formation.id,
    );
    // The outermost members, carried as points through the same transform the
    // runtime places them with, plus every member a cue singles out. The
    // outermost set is keyed by slot so a member that is both is measured once,
    // and measured with its own cue rather than without it.
    const members: Map<number, IFormationGroundMember> = new Map(
      formationGroundMembers(formation).map(
        (member: IFormationGroundMember): [number, IFormationGroundMember] => [
          member.slot,
          member,
        ],
      ),
    );
    for (const cue of ownSlots)
      for (const slot of cue.slots) {
        if (members.has(slot) || slot < 0 || slot >= formation.count) continue;
        members.set(slot, {
          slot,
          point: formationSlotPosition(formation, slot),
        });
      }
    // How far out the furthest measured member sits, which is what turns an
    // angle a cue sweeps into the metres that member travels.
    const radius: number = Math.max(
      0,
      ...[...members.values()].map((member: IFormationGroundMember): number =>
        Math.hypot(
          member.point.x - formation.anchor.x,
          member.point.z - formation.anchor.z,
        ),
      ),
    );
    const times: number[] = [
      ...new Set([
        ...own.flatMap((cue: IAutoMovieFormationMotion): number[] =>
          formationGroundSampleTimes(
            cue,
            radius,
            // How far the furthest member this gate measures travels between
            // the two arrangements. Read off the members it walks rather than
            // bounded by the layouts' radii, so the sampling density is the
            // density of what is actually being asked.
            cue.layout === undefined
              ? 0
              : Math.max(
                  0,
                  ...[...members.values()].map(
                    (member: IFormationGroundMember): number => {
                      const target: IAutoMovieVector3 = formationSlotPosition(
                        formation,
                        member.slot,
                        { layout: cue.layout!, progress: 1 },
                      );
                      return Math.hypot(
                        target.x - member.point.x,
                        target.z - member.point.z,
                      );
                    },
                  ),
                ),
          ),
        ),
        ...ownSlots.flatMap(formationSlotGroundSampleTimes),
      ]),
    ].sort((left: number, right: number): number => left - right);
    // Where it was staged is measured only when the unit is ever there: with no
    // cue it never moves, and with a cue starting after zero it stands still
    // until then. A cue starting at zero means the unit begins somewhere its
    // design bounds never describe, and measuring those would refuse a shot for
    // a position it never holds.
    //
    // Asked of the earliest sampled time itself. A unit with no cue has none,
    // which is the same answer as a cue that starts later, and reading it once
    // spares a fallback for a `times` that cannot be empty when `own` is not:
    // a branch nothing can reach is a branch nothing can test.
    const first: number = times[0];
    const resting: boolean = first === undefined || first > 0;
    // Walked rather than collected, and stopped at the first escape. A cue is
    // sampled up to the cap, so gathering every member at every sampled time
    // before taking the first would measure a unit hundreds of times over to
    // report the moment it already found.
    let escape: {
      time: number | null;
      place: IAutoMovieVector3;
      carried: number | null;
    } | null = null;
    for (const time of [...(resting ? [null] : []), ...times]) {
      // The rest pass is its own loop rather than a branch inside the moving
      // one. At rest no cue of either kind has begun, so the member is exactly
      // where its design put it and is read as the designed point rather than
      // through an identity transform that would only round it -- and asking
      // the question here is what tells the sampler below that it has a time.
      if (time === null) {
        for (const member of members.values()) {
          const off: { carried: number | null } | null = formationGroundEscape(
            space,
            member.point,
          );
          if (off === null) continue;
          escape = { time, place: member.point, ...off };
          break;
        }
        if (escape !== null) break;
        continue;
      }
      const motion: IAutoMovieSampledFormationMotion = AutoMovieEnginePopulationFormation.sampleFormationMotion(
        own,
        formation.id,
        time,
      );
      for (const member of members.values()) {
        // Re-read where the design puts this member when a cue is re-forming
        // the unit: the arrangement itself is moving, so the point the cached
        // sweep found is where the member stood before the re-form began. Read
        // once per member per sampled time, and only when a re-form is under
        // way -- a unit that keeps its arrangement pays nothing.
        const designed: IAutoMovieVector3 =
          motion.reform === null
            ? member.point
            : formationSlotPosition(formation, member.slot, motion.reform);
        const placed: IAutoMovieFormationSlotPlacement = placeFormationSlot({
          position: designed,
          facingDeg: formation.facingDeg,
          anchor: formation.anchor,
          baseFacingDeg: formation.facingDeg,
          unit: motion,
          member: AutoMovieEnginePopulationFormation.sampleFormationSlotMotion(
            ownSlots,
            formation.id,
            member.slot,
            time,
          ),
        });
        // A member the shot has taken out is standing nowhere, so no surface
        // has to carry it. Refusing a shot for a member nobody can see is the
        // false refusal this gate exists never to make.
        if (placed.present === false) continue;
        const off: { carried: number | null } | null = formationGroundEscape(
          space,
          placed.position,
        );
        if (off === null) continue;
        escape = { time, place: placed.position, ...off };
        break;
      }
      if (escape !== null) break;
    }
    if (escape === null) continue;
    diagnostics.push(
      engineDiagnostic(
        contract.id,
        `formation:${formation.id}`,
        // Reported to the millimetre and the millisecond. A sampled interior
        // time and a turned member are both long fractions, and a diagnostic an
        // author reads to find a place on a field gains nothing from the digits
        // below that. Only the reading is rounded; the comparison above is not.
        `must stand on the space this shot staged, but ${
          escape.time === null
            ? "a member of it stands at"
            : `at ${round(escape.time)}s its cue takes a member of it to`
        } (${round(escape.place.x)}, ${round(escape.place.z)}) ${
          escape.carried === null
            ? "where no walkable surface carries it"
            : `at ${round(escape.place.y)}m, below the ${round(escape.carried)}m the surface there stands at`
        }`,
      ),
    );
  }
  return diagnostics;
}

/**
 * Target travel resolution in metres, subject to the capped step count and cue
 * reach/easing estimation limits.
 */
const FORMATION_GROUND_SAMPLE_METRES: number = 0.5;

/**
 * Sixteen fixed XZ directions choose actual support members; unsampled
 * members/extrema can still leave the ground.
 */
const FORMATION_GROUND_SUPPORT_DIRECTIONS: number = 16;

/**
 * Pair a zero-based slot with its designed world-space point.
 *
 * Slot identity lets sparse exceptions/removal carry the same member through
 * runtime placement.
 *
 * This sampled point is not a body envelope or all-member ground certificate.
 *
 * Slot and rest-world-point meanings are documented.
 *
 * Each row has constant scalar/point fields and selected population drives
 * storage.
 *
 * Directional selection shares one row per slot across its16 support
 * directions.
 *
 * Rows belong to the one validation that measured them.
 */
interface IFormationGroundMember {
  /** Zero-based slot this point belongs to. */
  slot: number;

  /** Designed world-space position of that slot at rest. */
  point: IAutoMovieVector3;
}

/**
 * Scan slots and keep the actual maximizing member in each of16 XZ support
 * directions, deduplicating shared maxima.
 *
 * Measured members replace box corners that may not belong to the formation.
 *
 * Only sampled directional extrema are checked.
 *
 * Returned rows pair slot identity with designed world points.
 *
 * N slots times16 fixed directions cost O(N), returning at most16 distinct
 * members.
 *
 * Each call measures the placement afresh; no row outlives the call.
 */
function formationGroundMembers(
  formation: IAutoMovieFormationPlacement,
): IFormationGroundMember[] {
  const looks: { x: number; z: number }[] = Array.from(
    { length: FORMATION_GROUND_SUPPORT_DIRECTIONS },
    (_: unknown, index: number): { x: number; z: number } => {
      const radians: number =
        (2 * Math.PI * index) / FORMATION_GROUND_SUPPORT_DIRECTIONS;
      return { x: Math.cos(radians), z: Math.sin(radians) };
    },
  );
  const furthest: number[] = looks.map((): number => Number.NEGATIVE_INFINITY);
  const outermost: (IFormationGroundMember | null)[] = looks.map(
    (): IFormationGroundMember | null => null,
  );
  // One record per slot rather than per direction, so a formation of a hundred
  // thousand members is asked for each of them once. A member outermost in
  // several directions is the same object in each, which is what the set below
  // dedupes on.
  for (let slot: number = 0; slot < formation.count; ++slot) {
    const member: { slot: number; point: IAutoMovieVector3 } = {
      slot,
      point: formationSlotPosition(formation, slot),
    };
    for (let index: number = 0; index < looks.length; ++index) {
      const look: { x: number; z: number } = looks[index]!;
      const reach: number = member.point.x * look.x + member.point.z * look.z;
      if (reach <= furthest[index]!) continue;
      furthest[index] = reach;
      outermost[index] = member;
    }
  }
  // A type predicate rather than a plain test: `filter` does not narrow on
  // its own, so the null the loop starts from would travel into every
  // consumer of a member's slot.
  const members: IFormationGroundMember[] = [
    ...new Set(
      outermost.filter(
        (
          member: IFormationGroundMember | null,
        ): member is IFormationGroundMember => member !== null,
      ),
    ),
  ];
  return members;
}

/**
 * Maximum subdivided steps per cue; endpoint-inclusive output has at most 361
 * times and the cap coarsens resolution.
 */
const FORMATION_GROUND_SAMPLE_LIMIT: number = 360;

/**
 * Round a diagnostic quantity to three decimals with
 * Math.round(value*1000)/1000.
 *
 * The validateAutoMovieFormationGround owner applies presentation rounding
 * after its actual predicate.
 *
 * Binary64 rounding is not an exact decimal serialization or decision
 * tolerance.
 *
 * Only displayed metre/second quantities are rounded, leaving comparison
 * arithmetic unchanged.
 *
 * Fixed scalar arithmetic takes constant work.
 *
 * Diagnostics reuse the same presentation rule within
 * validateAutoMovieFormationGround, not cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
function round(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

/**
 * Estimate translation, turn, spacing and reform reach, then choose
 * endpoint-inclusive even-time samples with0.5m target and360-step cap.
 *
 * Cue-aware reach gives the gate a physical sampling policy rather than
 * endpoints alone.
 *
 * The cap coarsens resolution, step easing jumps and sequential layout
 * reach/radius assumptions limit a universal spacing guarantee.
 *
 * Inputs are metre radius/reform reach and a cue's second interval; output is a
 * fresh time array.
 *
 * At most361 times are generated per cue; scalar reach arithmetic is
 * fixed-size.
 *
 * The ground coordinator reuses selected member geometry and passes measured
 * reform reach.
 *
 * The caller owns the bounded time array; no cue or sampling session is
 * retained.
 */
function formationGroundSampleTimes(
  cue: IAutoMovieFormationMotion,
  radius: number,
  reformReach: number,
): number[] {
  // How many times its design reach a spacing change ever holds a member out
  // at, so the arc a turn sweeps it through is measured at the radius it really
  // turns on. Read as a magnitude: a negative scale mirrors a unit rather than
  // shrinking it past nothing, and a mirrored member travels just as far.
  const spread: number = Math.max(
    Math.abs(cue.from.spacingScale.lateral),
    Math.abs(cue.to.spacingScale.lateral),
    Math.abs(cue.from.spacingScale.depth),
    Math.abs(cue.to.spacingScale.depth),
  );
  const reach: number =
    Math.hypot(
      cue.to.translation.x - cue.from.translation.x,
      cue.to.translation.z - cue.from.translation.z,
    ) +
    ((Math.abs(cue.to.facingOffsetDeg - cue.from.facingOffsetDeg) * Math.PI) /
      180) *
      radius *
      spread +
    Math.max(
      Math.abs(cue.to.spacingScale.lateral - cue.from.spacingScale.lateral),
      Math.abs(cue.to.spacingScale.depth - cue.from.spacingScale.depth),
    ) *
      radius +
    // A re-form moves members without moving the unit, so none of the terms
    // above sees it: a crowd changing shape in place has zero translation,
    // zero turn and unit spacing, and would be sampled at its two ends only.
    // The ground between two arrangements is exactly what an author cannot see
    // from either of them.
    reformReach;
  const steps: number = Math.min(
    FORMATION_GROUND_SAMPLE_LIMIT,
    Math.ceil((2 * reach) / FORMATION_GROUND_SAMPLE_METRES),
  );
  const span: number = cue.end - cue.start;
  return [
    cue.start,
    ...Array.from(
      { length: Math.max(0, steps - 1) },
      (_: unknown, index: number): number =>
        cue.start + (span * (index + 1)) / steps,
    ),
    cue.end,
  ];
}

/**
 * Estimate a member's XZ offset displacement and sample its interval at the
 * same capped physical resolution.
 *
 * Member-only turns do not move the point this gate measures.
 *
 * Only endpoint displacement is modeled; the360-step cap and point proxy leave
 * sub-sample/body-envelope gaps.
 *
 * Cue seconds/metre offsets and endpoint-inclusive output are stated.
 *
 * At most361 time scalars are generated per member cue.
 *
 * The helper shares ground sampling constants/policy, not cached mutable cue
 * values.
 *
 * Only a fresh bounded array escapes; no member handle or task remains.
 */
function formationSlotGroundSampleTimes(
  cue: IAutoMovieFormationSlotMotion,
): number[] {
  const reach: number = Math.hypot(
    cue.to.offset.x - cue.from.offset.x,
    cue.to.offset.z - cue.from.offset.z,
  );
  const steps: number = Math.min(
    FORMATION_GROUND_SAMPLE_LIMIT,
    Math.ceil((2 * reach) / FORMATION_GROUND_SAMPLE_METRES),
  );
  const span: number = cue.end - cue.start;
  return [
    cue.start,
    ...Array.from(
      { length: Math.max(0, steps - 1) },
      (_: unknown, index: number): number =>
        cue.start + (span * (index + 1)) / steps,
    ),
    cue.end,
  ];
}

/**
 * Absolute one-millimetre sinking policy; smaller discrepancies are not
 * reported by this gate.
 */
const FORMATION_GROUND_SINK_TOLERANCE_METRES: number = 1e-3;

/**
 * Query heightAt and return a void or a sink beyond1mm, otherwise null.
 *
 * The height owner decides authored support and this helper owns the sinking
 * policy.
 *
 * Standing above support is allowed; a scalar query does not prove whole-body
 * contact.
 *
 * Carried null means void and a numeric carried height identifies sinking.
 *
 * Cost follows heightAt's surface/ring/lattice queries; local arithmetic is
 * constant.
 *
 * All measured members share the canonical height query rather than another
 * polygon classifier.
 *
 * Only a small fault description returns; space and point references are not
 * retained.
 */
function formationGroundEscape(
  space: IAutoMovieSpace,
  place: IAutoMovieVector3,
): { carried: number | null } | null {
  const carried: number | null = heightAt(space, place.x, place.z);
  if (carried === null) return { carried: null };
  return place.y < carried - FORMATION_GROUND_SINK_TOLERANCE_METRES
    ? { carried }
    : null;
}
