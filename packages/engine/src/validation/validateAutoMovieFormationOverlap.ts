import { IAutoMovieDiagnostic, IAutoMovieFormationMotion, IAutoMovieFormationSlotMotion, IAutoMovieModel, IAutoMovieShotContract } from "@automovie/interface";
import { formationSlotPosition, placeFormationSlot, sampleFormationMotion, sampleFormationSlotMotion } from "../index";
import { engineDiagnostic } from "./engineDiagnostic";
import { IAutoMovieFormationPlacement } from "../IAutoMovieFormationPlacement";
import { autoMovieModelColumns } from "./autoMovieModelColumns";

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
