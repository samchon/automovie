import { IAutoMovieDiagnostic, IAutoMovieFormationMotion, IAutoMovieFormationSlotMotion, IAutoMovieModel, IAutoMovieShotContract, IAutoMovieVector3 } from "@automovie/interface";
import { formationSlotPosition, placeFormationSlot, sampleFormationMotion, sampleFormationSlotMotion } from "../index";
import { engineDiagnostic } from "./engineDiagnostic";
import { IAutoMovieFormationPlacement } from "../IAutoMovieFormationPlacement";
import { IAutoMovieModelColumn } from "./IAutoMovieModelColumn";
import { autoMovieModelColumns } from "./autoMovieModelColumns";

/**
 * One reading as a reader wants it: three decimals, so a metre is stated to the
 * millimetre and a second to the millisecond.
 */
const round = (value: number): number => Math.round(value * 1_000) / 1_000;

/**
 * Members of one unit the overlap gate measures.
 *
 * Every measured member is a point placed into a grid at every sampled time,
 * and a unit may be a hundred thousand of them. Past this many the walk stays
 * bounded and what is measured is the unit's first slots, which is the trade a
 * gate that samples has to make somewhere and had better say out loud. Below it
 * — where nearly every authored unit sits — every member is measured, so every
 * pair standing inside its own bodies is found.
 */
const FORMATION_OVERLAP_MEMBER_LIMIT = 4096;

/**
 * Times inside one shot the overlap gate places its units at.
 *
 * Zero and both ends of every cue are always among them, because those are
 * states the shot certainly holds; whatever budget is left fills the gaps
 * between them evenly. The interior is what catches two units standing clear at
 * both ends of a cue and walking through one another in between, and a cue that
 * closes a gap for less than one such interval is the honest limit this number
 * states rather than hides.
 */
const FORMATION_OVERLAP_SAMPLE_LIMIT = 16;

/** One unit the overlap gate measures, with everything it is measured by. */
interface IFormationOverlapUnit {
  /** Position in the shot's own order, which is the order refusals come in. */
  index: number;
  /** The staged unit itself. */
  formation: IAutoMovieFormationPlacement & {
    lod: ReadonlyArray<{ model: string }>;
  };
  /** Where each measured member stands at rest, with the slot it is. */
  members: ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }>;
  /** Columns of every runtime one of its members may be drawn as. */
  tiers: ReadonlyArray<readonly IAutoMovieModelColumn[]>;
}

/** One measured member, placed where the sampled time really puts it. */
interface IFormationOverlapPlacement {
  /** Unit this member stands in. */
  unit: IFormationOverlapUnit;
  /** Zero-based slot it is. */
  slot: number;
  /** Where it stands at the sampled time. */
  point: IAutoMovieVector3;
}

/**
 * The members one unit is measured by, found once and remembered.
 *
 * The set is a pure function of the unit, and the builder hands the same
 * compiled unit to every shot that stages it, so a crowd in fifty shots would
 * otherwise be regenerated fifty times over. Keyed by the unit itself, so
 * nothing outlives the compile that made it.
 */
const formationOverlapMemberCache = new WeakMap<
  IAutoMovieFormationPlacement,
  ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }>
>();

const formationOverlapMembers = (
  formation: IAutoMovieFormationPlacement,
): ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }> => {
  const remembered = formationOverlapMemberCache.get(formation);
  if (remembered !== undefined) return remembered;
  const members = Array.from(
    { length: Math.min(formation.count, FORMATION_OVERLAP_MEMBER_LIMIT) },
    (_, slot) => ({ slot, point: formationSlotPosition(formation, slot) }),
  );
  formationOverlapMemberCache.set(formation, members);
  return members;
};

/**
 * When one shot is worth placing its units at.
 *
 * Ends first, because the ends of a cue are states the shot certainly holds and
 * zero is where a unit that has no cue at all stands. Then the gaps between
 * them, filled evenly with whatever budget is left, because two units clear at
 * both ends of a cue can walk straight through one another in between and a
 * spacing that closes and reopens inside one cue never shows at either end.
 *
 * This samples; it does not solve. Whether two members are ever inside one
 * another has no closed form — it depends on the layouts, the easings and the
 * cues together — so a resolution is stated instead of a guarantee. Every
 * sampled time is a state the shot really holds, which is what keeps the gate
 * from refusing a production that was correct.
 */
const formationOverlapSampleTimes = (
  cues: readonly IAutoMovieFormationMotion[],
  slotCues: readonly IAutoMovieFormationSlotMotion[],
): number[] => {
  const ends = [
    ...new Set([
      0,
      ...cues.flatMap((cue) => [cue.start, cue.end]),
      ...slotCues.flatMap((cue) => [cue.start, cue.end]),
    ]),
  ].sort((left, right) => left - right);
  const gaps = Math.max(1, ends.length - 1);
  const inside = Math.max(
    0,
    Math.floor((FORMATION_OVERLAP_SAMPLE_LIMIT - ends.length) / gaps),
  );
  return [
    ...new Set(
      ends.flatMap((time, index) => {
        const next = ends[index + 1];
        return next === undefined
          ? [time]
          : [
              time,
              ...Array.from(
                { length: inside },
                (_, step) => time + ((next - time) * (step + 1)) / (inside + 1),
              ),
            ];
      }),
    ),
  ];
};

/**
 * How close two members of two units may stand before they are in one place.
 *
 * The least any pair of the runtimes they may be drawn as allows, because which
 * tier a member is drawn at is the camera's decision and a refusal has to hold
 * whichever one it makes. Zero when no pair of their columns ever meets in
 * height, which is two bodies that pass each other at different levels rather
 * than through each other.
 */
const formationOverlapClearance = (
  left: IFormationOverlapUnit,
  right: IFormationOverlapUnit,
  lift: number,
): number => {
  let least = Number.POSITIVE_INFINITY;
  for (const near of left.tiers)
    for (const far of right.tiers) {
      let widest = 0;
      for (const one of near)
        for (const other of far)
          if (
            Math.max(one.bottom, other.bottom + lift) <
              Math.min(one.top, other.top + lift) &&
            one.radius + other.radius > widest
          )
            widest = one.radius + other.radius;
      least = Math.min(least, widest);
    }
  return least;
};

/**
 * Refuse a shot that stands one member of a crowd inside another.
 *
 * Two bodies cannot occupy one place. That is a fact about dancers, animals,
 * vehicles and machines alike, and until this gate existed nothing in the
 * pipeline checked it: a unit could be laid out at a tenth of its members' own
 * width, a cue could pull one to a fifth of its spacing, and two units could be
 * staged on the same ground, and every one of those compiled clean and rendered
 * as figures standing through each other.
 *
 * A member's own size is not asked of the author. It is read from the runtime
 * the builder already built for it by {@link autoMovieModelColumns}, so the
 * measure follows the geometry rather than sitting beside it going stale, and a
 * unit whose runtime this shot does not carry is not measured at all rather
 * than measured against a guess.
 *
 * What is measured is members, at the times {@link formationOverlapSampleTimes}
 * picks and in the places {@link placeFormationSlot} puts them, which is the
 * same answer the renderer places them by. Both units of a pair are placed at
 * one time and compared to each other, which is what the ground gate's
 * per-formation loop structurally cannot see: two crowds each standing
 * perfectly well on the floor, in each other.
 *
 * Sound by construction and incomplete by design, in three stated ways: a
 * column is inscribed in a member and never around it, so a refusal means two
 * bodies really share a place; only the first
 * {@link FORMATION_OVERLAP_MEMBER_LIMIT} slots of an enormous unit are measured;
 * and time is sampled rather than solved. Each of those loses overlaps this
 * gate could have found. None of them can make it refuse a production that was
 * correct, which is the discipline the ground gate beside it is built on and
 * the only one worth having here.
 *
 * A member the shot has taken out is not measured, because nothing can stand
 * inside a body that is not there.
 *
 * @author Samchon
 */
export const validateAutoMovieFormationOverlap = (
  contract: Pick<IAutoMovieShotContract, "id">,
  value: {
    models: readonly IAutoMovieModel[];
    formations: ReadonlyArray<
      IAutoMovieFormationPlacement & {
        lod: ReadonlyArray<{ model: string }>;
      }
    >;
    formationMotions?: readonly IAutoMovieFormationMotion[];
    formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
  },
): IAutoMovieDiagnostic[] => {
  const runtimes = new Map(value.models.map((model) => [model.id, model]));
  const units = value.formations.flatMap(
    (formation, index): IFormationOverlapUnit[] => {
      const tiers = formation.lod.map((tier) => {
        const runtime = runtimes.get(tier.model);
        return runtime === undefined ? [] : autoMovieModelColumns(runtime);
      });
      // A unit with a tier this shot does not carry, or one whose geometry fills
      // no column at all, has no size this gate can prove. Measuring it against
      // a stand-in number is how a gate starts refusing productions that were
      // correct, so it is left alone instead.
      return tiers.length === 0 || tiers.some((columns) => columns.length === 0)
        ? []
        : [
            {
              index,
              formation,
              members: formationOverlapMembers(formation),
              tiers,
            },
          ];
    },
  );
  if (units.length === 0) return [];
  const cues = value.formationMotions ?? [];
  const slotCues = value.formationSlotMotions ?? [];
  // One cell wide enough that no pair inside its own clearance can fall outside
  // the ring of cells around either of them. A height difference narrows a
  // clearance and never widens it, so twice the widest column in the shot bounds
  // every clearance there is.
  const cell =
    2 *
    Math.max(
      ...units.flatMap((unit) =>
        unit.tiers.flatMap((columns) => columns.map((column) => column.radius)),
      ),
    );
  const found = new Map<
    string,
    {
      time: number;
      left: IFormationOverlapPlacement;
      right: IFormationOverlapPlacement;
      apart: number;
      clearance: number;
    }
  >();
  for (const time of formationOverlapSampleTimes(cues, slotCues)) {
    const grid = new Map<string, IFormationOverlapPlacement[]>();
    for (const unit of units) {
      const motion = sampleFormationMotion(cues, unit.formation.id, time);
      for (const member of unit.members) {
        // Where the design puts this member NOW: a re-forming unit is moving
        // its own arrangement, so the cached point is where the member stood
        // before the cue began. Members crossing each other mid-re-form is
        // exactly the collision this gate exists to catch.
        const designed =
          motion.reform === null
            ? member.point
            : formationSlotPosition(unit.formation, member.slot, motion.reform);
        const placed = placeFormationSlot({
          position: designed,
          facingDeg: unit.formation.facingDeg,
          anchor: unit.formation.anchor,
          baseFacingDeg: unit.formation.facingDeg,
          unit: motion,
          member: sampleFormationSlotMotion(
            slotCues,
            unit.formation.id,
            member.slot,
            time,
          ),
        });
        if (placed.present === false) continue;
        const here: IFormationOverlapPlacement = {
          unit,
          slot: member.slot,
          point: placed.position,
        };
        const column = Math.floor(placed.position.x / cell);
        const row = Math.floor(placed.position.z / cell);
        for (let across = -1; across <= 1; ++across)
          for (let along = -1; along <= 1; ++along)
            for (const other of grid.get(`${column + across}:${row + along}`) ??
              []) {
              // Ordered by the unit each stands in, and every member already in
              // the grid was placed by a unit no later than this one, so one
              // reading of a pair of units is the whole of what it reports.
              const pair = `${other.unit.index}:${unit.index}`;
              if (found.has(pair)) continue;
              const clearance = formationOverlapClearance(
                other.unit,
                unit,
                here.point.y - other.point.y,
              );
              const apart = Math.hypot(
                here.point.x - other.point.x,
                here.point.z - other.point.z,
              );
              if (apart >= clearance) continue;
              found.set(pair, {
                time,
                left: other,
                right: here,
                apart,
                clearance,
              });
            }
        const key = `${column}:${row}`;
        const neighbours = grid.get(key);
        if (neighbours === undefined) grid.set(key, [here]);
        else neighbours.push(here);
      }
    }
  }
  return [...found.values()].map((overlap) =>
    engineDiagnostic(
      contract.id,
      `formation:${overlap.left.unit.formation.id}`,
      // Reported to the millimetre and the millisecond, the same as every other
      // reading a shot's author reads to find a place on a field. Only the
      // reading is rounded; the comparison above is not.
      `must not stand a member where another body already is, but at ${round(
        overlap.time,
      )}s ${
        overlap.left.unit === overlap.right.unit
          ? `its slots ${overlap.left.slot} and ${overlap.right.slot}`
          : `its slot ${overlap.left.slot} and slot ${overlap.right.slot} of "${overlap.right.unit.formation.id}"`
      } stand ${round(overlap.apart)}m apart at (${round(
        (overlap.left.point.x + overlap.right.point.x) / 2,
      )}, ${round(
        (overlap.left.point.z + overlap.right.point.z) / 2,
      )}), inside the ${round(overlap.clearance)}m their bodies fill`,
    ),
  );
};
