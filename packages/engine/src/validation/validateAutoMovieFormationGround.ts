import { IAutoMovieDiagnostic, IAutoMovieFormationMotion, IAutoMovieFormationSlotMotion, IAutoMovieScene, IAutoMovieShotContract, IAutoMovieSpace, IAutoMovieVector3 } from "@automovie/interface";
import { formationSlotPosition, heightAt, placeFormationSlot, sampleFormationMotion, sampleFormationSlotMotion } from "../index";
import { engineDiagnostic } from "./engineDiagnostic";
import { IAutoMovieFormationPlacement } from "../IAutoMovieFormationPlacement";

/**
 * Metres a member may travel between neighbouring samples inside one cue.
 *
 * Ground is judged in metres, so the resolution is stated in metres too. What
 * it buys is exactly this: no measured member moves further than half a metre
 * between one sample and the next, so a stretch of void wider than that has a
 * sample in it. A narrower one can still be stepped over. Nothing requires an
 * authored surface to be wide, so that is a limit of the gate and not a claim
 * about spaces.
 */
const FORMATION_GROUND_SAMPLE_METRES = 0.5;

/**
 * Directions the outermost member of a formation is asked for.
 *
 * A formation is a set of members, and which of them is furthest out depends on
 * which way you look. Sixteen evenly spaced looks put a measured member within
 * eleven degrees of any direction, so the outermost member in a direction not
 * asked about stands at least `cos(11.25 deg)` of the way out as the one that
 * was. Every measured point is a member, so a coarser reading can only miss; it
 * cannot refuse a formation that was standing on its ground.
 */
const FORMATION_GROUND_SUPPORT_DIRECTIONS = 16;

/**
 * Members already found for one compiled formation.
 *
 * The set is a pure function of the formation, and the builder hands the same
 * compiled formation to every shot that stages it, so a crowd in fifty shots
 * would otherwise regenerate every one of its members fifty times over. Keyed
 * by the formation itself, so nothing outlives the compile that made it.
 */
const formationGroundMemberCache = new WeakMap<
  IAutoMovieFormationPlacement,
  IFormationGroundMember[]
>();

/**
 * One member the ground gate measures, kept with the slot that produced it.
 *
 * The point alone was enough while every member of a unit did the same thing. A
 * member with its own cue does not, so the slot has to travel with the point: a
 * member removed at four seconds must stop being measured, and a member that
 * stepped off its place must be measured where it stepped to.
 */
interface IFormationGroundMember {
  /** Zero-based slot this point belongs to. */
  slot: number;
  /** Designed world-space position of that slot at rest. */
  point: IAutoMovieVector3;
}

/**
 * The members a formation is judged by: its outermost in each asked direction.
 *
 * `bounds` is the axis-aligned box over every slot, and its corners are not
 * members. A full `line` or `column` grid happens to put a slot at each of
 * them; a `wedge`, an `arc` and a `scatter` do not, so judging the corners
 * refuses formations every member of which is carried. This asks the engine
 * where the members are and keeps the outermost ones, which is both sound and
 * the set a floor's edge is met by.
 *
 * One pass over the slots, so the cost is the formation's own size and not the
 * square of it. The same member is usually outermost in several directions; it
 * is measured once.
 */
const formationGroundMembers = (
  formation: IAutoMovieFormationPlacement,
): IFormationGroundMember[] => {
  const remembered = formationGroundMemberCache.get(formation);
  if (remembered !== undefined) return remembered;
  const looks = Array.from(
    { length: FORMATION_GROUND_SUPPORT_DIRECTIONS },
    (_, index) => {
      const radians =
        (2 * Math.PI * index) / FORMATION_GROUND_SUPPORT_DIRECTIONS;
      return { x: Math.cos(radians), z: Math.sin(radians) };
    },
  );
  const furthest = looks.map(() => Number.NEGATIVE_INFINITY);
  const outermost = looks.map((): IFormationGroundMember | null => null);
  // One record per slot rather than per direction, so a formation of a hundred
  // thousand members is asked for each of them once. A member outermost in
  // several directions is the same object in each, which is what the set below
  // dedupes on.
  for (let slot = 0; slot < formation.count; ++slot) {
    const member = { slot, point: formationSlotPosition(formation, slot) };
    for (let index = 0; index < looks.length; ++index) {
      const look = looks[index]!;
      const reach = member.point.x * look.x + member.point.z * look.z;
      if (reach <= furthest[index]!) continue;
      furthest[index] = reach;
      outermost[index] = member;
    }
  }
  // A type predicate rather than a plain test: `filter` does not narrow on
  // its own, so the null the loop starts from would travel into every
  // consumer of a member's slot.
  const members = [
    ...new Set(
      outermost.filter(
        (member): member is IFormationGroundMember => member !== null,
      ),
    ),
  ];
  formationGroundMemberCache.set(formation, members);
  return members;
};

/**
 * Samples one cue may take, however far it carries a unit.
 *
 * A cue's turn and travel are plain unbounded numbers, and holding the
 * resolution over a turn of a thousand revolutions would cost a unit of
 * ordinary size hundreds of thousands of samples. Past this the walk stays
 * bounded and the resolution coarsens in proportion, which is the trade a gate
 * that samples has to make somewhere and had better say out loud.
 */
const FORMATION_GROUND_SAMPLE_LIMIT = 360;

/**
 * One reading as a reader wants it: three decimals, so a metre is stated to the
 * millimetre and a second to the millisecond.
 */
const round = (value: number): number => Math.round(value * 1_000) / 1_000;

/**
 * When inside one cue a staged unit is worth measuring against its ground.
 *
 * Reading only the ends of a cue would be enough if ground were convex, because
 * every part of a cue interpolates monotonically and a corner therefore travels
 * a bounded path between two ends. Ground is not convex: a space is a union of
 * authored surfaces, so a unit can stand on one, end on another, and cross what
 * is between them. That is true of a turn, which swings a corner through an arc
 * neither end holds, and just as true of a straight walk between two roads.
 *
 * So the interior is walked, at a resolution stated in the same metres the
 * ground is. How far a corner can travel in one cue is bounded by what the cue
 * does to it: the anchor's own travel, the arc a turn sweeps it through at its
 * radius, and the reach a spacing change adds. The interior is walked in even
 * time steps rather than even distance steps, because the state at a time is
 * the engine's answer and inverting an easing to land on an exact distance
 * would be a second one. Every easing this engine has moves at most twice the
 * average rate, so `n` even steps hold a corner's travel between neighbours
 * below `2 * reach / n`, and the step count is chosen from that bound rather
 * than guessed. The bound holds until {@link FORMATION_GROUND_SAMPLE_LIMIT}
 * clamps the count; a cue that carries a unit far enough to reach it is
 * measured more coarsely, in proportion.
 *
 * This samples; it does not solve. The set of times a unit is off its ground
 * has no closed form — it depends on the authored polygons as much as on the
 * cue — so a resolution is stated instead of a guarantee. Every sampled time is
 * a state the unit really occupies, which is what keeps the gate from ever
 * refusing a shot that was correct.
 *
 * A `step` cue holds its start state until its end, so its interior samples all
 * repeat that one state. They cost a little and answer correctly, which is the
 * trade taken rather than a branch here for the one easing that does not move.
 */
const formationGroundSampleTimes = (
  cue: IAutoMovieFormationMotion,
  radius: number,
  reformReach: number,
): number[] => {
  // How many times its design reach a spacing change ever holds a member out
  // at, so the arc a turn sweeps it through is measured at the radius it really
  // turns on. Read as a magnitude: a negative scale mirrors a unit rather than
  // shrinking it past nothing, and a mirrored member travels just as far.
  const spread = Math.max(
    Math.abs(cue.from.spacingScale.lateral),
    Math.abs(cue.to.spacingScale.lateral),
    Math.abs(cue.from.spacingScale.depth),
    Math.abs(cue.to.spacingScale.depth),
  );
  const reach =
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
  const steps = Math.min(
    FORMATION_GROUND_SAMPLE_LIMIT,
    Math.ceil((2 * reach) / FORMATION_GROUND_SAMPLE_METRES),
  );
  const span = cue.end - cue.start;
  return [
    cue.start,
    ...Array.from(
      { length: Math.max(0, steps - 1) },
      (_, index) => cue.start + (span * (index + 1)) / steps,
    ),
    cue.end,
  ];
};

/**
 * When inside one member's own cue that member is worth measuring.
 *
 * The same argument as {@link formationGroundSampleTimes} and the same bound: a
 * member's cue displaces it along a straight segment, ground is not convex, and
 * both ends can stand on floor the middle does not. What the member travels is
 * the length of that displacement, so the step count follows from it rather
 * than from a guess, and the same cap keeps a member carried absurdly far
 * measured coarsely instead of endlessly.
 *
 * A turn of the member alone sweeps nothing, because a member is a point to
 * this gate: the ground under it does not move when it faces another way.
 */
const formationSlotGroundSampleTimes = (
  cue: IAutoMovieFormationSlotMotion,
): number[] => {
  const reach = Math.hypot(
    cue.to.offset.x - cue.from.offset.x,
    cue.to.offset.z - cue.from.offset.z,
  );
  const steps = Math.min(
    FORMATION_GROUND_SAMPLE_LIMIT,
    Math.ceil((2 * reach) / FORMATION_GROUND_SAMPLE_METRES),
  );
  const span = cue.end - cue.start;
  return [
    cue.start,
    ...Array.from(
      { length: Math.max(0, steps - 1) },
      (_, index) => cue.start + (span * (index + 1)) / steps,
    ),
    cue.end,
  ];
};

/**
 * How far under a surface a member may read before it is inside the ground.
 *
 * A millimetre, which is what the refusal states its metres to. Terrain height
 * is interpolated — along a ramp axis, across a heightfield cell — and a member
 * placed from one record and judged against another accumulates the last bits
 * of two such interpolations. Refusing at those bits would refuse a unit
 * standing exactly on its ground, and this gate's whole discipline is that it
 * never refuses a shot that was correct.
 */
const FORMATION_GROUND_SINK_TOLERANCE_METRES = 1e-3;

/**
 * Why one placed member is off the ground a shot staged, or `null` when it is
 * not off it at all.
 *
 * Two ways to leave a floor, and the second is as broken as the first: standing
 * where nothing carries you, and standing under what does. `carried` names
 * which — `null` for the void, the surface's own height for the sinking — so
 * the refusal can say what an author has to correct rather than the same
 * sentence twice.
 *
 * Standing _above_ the surface is not refused. `anchor.y` is the height a unit
 * was staged at and always has been, and a shot deliberately holding a unit
 * over the space it staged — a rank on structure the space does not model, a
 * unit whose terrain record and staged space are two readings of one place — is
 * a composition, not a mistake. Under the surface admits no such reading: the
 * member is inside the ground and nothing can see it.
 */
const formationGroundEscape = (
  space: IAutoMovieSpace,
  place: IAutoMovieVector3,
): { carried: number | null } | null => {
  const carried = heightAt(space, place.x, place.z);
  if (carried === null) return { carried: null };
  return place.y < carried - FORMATION_GROUND_SINK_TOLERANCE_METRES
    ? { carried }
    : null;
};

/**
 * Refuse a staged unit the ground it was staged on does not carry.
 *
 * A shot's space is what the scene keeps and what the viewer turns into real
 * meshes, so a formation reaching past it is a unit standing over a void. That
 * is not caught by the world design: a world surface is authored terrain and is
 * a different record from the space a shot stages, which is how a field
 * corrected in one went on drawing a floor a third the size of its unit in the
 * other.
 *
 * The bounds are the builder's own and both the placement and the containment
 * question go to the engine that owns them, so this compares answers that
 * already exist rather than deriving a third that could disagree with both.
 *
 * What is measured is members, chosen by {@link formationGroundMembers}: the
 * outermost slot in each of a stated set of directions, carried through a cue
 * as points. Every measured point is somewhere a member really stands, so a
 * refusal is always sound; a member not asked about is the honest gap, stated
 * the same way the time resolution is.
 *
 * Each measured member is judged in height as well as in plan, by
 * {@link formationGroundEscape}: standing under the surface that carries you is
 * as broken as standing where nothing does, and a gate that refused only the
 * second would pass a whole unit buried in the hill it was staged on. The same
 * measured set answers both questions, so the height reading inherits its
 * honest gap: a member not asked about in plan is not asked about in height.
 *
 * A shot that stages no space is not measured. The engine then falls back to
 * the scalar ground plane it assumed before spaces existed, and there is no
 * authored extent for a unit to leave.
 *
 * A unit is measured where it stands and along every cue that moves it, at the
 * times {@link formationGroundSampleTimes} picks: the ends always, and the
 * interior at a resolution stated in metres. The interior is walked because
 * ground is not convex — two ends a unit stands on say nothing about what lies
 * between them. Every sampled time is a state the unit really occupies, so the
 * gate never refuses a shot that was correct, and it samples rather than solves
 * because where a unit leaves authored ground has no closed form.
 *
 * A member with its own cue is measured too, and measured as itself. Every slot
 * a per-member cue names is added to the set above — the channel is sparse, so
 * that costs the exceptions and not the crowd — and each measured member is
 * carried through its own cue as well as its unit's. A member the shot has
 * removed is not measured at all while it is absent: refusing a shot because
 * something nobody can see stands over a void is exactly the false refusal this
 * gate is built never to make.
 *
 * @author Samchon
 */
export const validateAutoMovieFormationGround = (
  contract: Pick<IAutoMovieShotContract, "id">,
  value: {
    scene: Pick<IAutoMovieScene, "space">;
    formations: readonly IAutoMovieFormationPlacement[];
    formationMotions?: readonly IAutoMovieFormationMotion[];
    formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
  },
): IAutoMovieDiagnostic[] => {
  const space = value.scene.space;
  if (space === undefined || space === null) return [];
  const cues = value.formationMotions ?? [];
  const slotCues = value.formationSlotMotions ?? [];
  const diagnostics: IAutoMovieDiagnostic[] = [];
  for (const formation of value.formations) {
    const own = cues.filter((cue) => cue.formation === formation.id);
    const ownSlots = slotCues.filter((cue) => cue.formation === formation.id);
    // The outermost members, carried as points through the same transform the
    // runtime places them with, plus every member a cue singles out. The
    // outermost set is keyed by slot so a member that is both is measured once,
    // and measured with its own cue rather than without it.
    const members = new Map(
      formationGroundMembers(formation).map((member) => [member.slot, member]),
    );
    for (const cue of ownSlots)
      for (const slot of cue.slots) {
        if (
          members.has(slot) ||
          Number.isSafeInteger(slot) === false ||
          slot < 0 ||
          slot >= formation.count
        )
          continue;
        members.set(slot, {
          slot,
          point: formationSlotPosition(formation, slot),
        });
      }
    // How far out the furthest measured member sits, which is what turns an
    // angle a cue sweeps into the metres that member travels.
    const radius = Math.max(
      0,
      ...[...members.values()].map((member) =>
        Math.hypot(
          member.point.x - formation.anchor.x,
          member.point.z - formation.anchor.z,
        ),
      ),
    );
    const times = [
      ...new Set([
        ...own.flatMap((cue) =>
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
                  ...[...members.values()].map((member) => {
                    const target = formationSlotPosition(
                      formation,
                      member.slot,
                      { layout: cue.layout!, progress: 1 },
                    );
                    return Math.hypot(
                      target.x - member.point.x,
                      target.z - member.point.z,
                    );
                  }),
                ),
          ),
        ),
        ...ownSlots.flatMap(formationSlotGroundSampleTimes),
      ]),
    ].sort((left, right) => left - right);
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
    const first = times[0];
    const resting = first === undefined || first > 0;
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
          const off = formationGroundEscape(space, member.point);
          if (off === null) continue;
          escape = { time, place: member.point, ...off };
          break;
        }
        if (escape !== null) break;
        continue;
      }
      const motion = sampleFormationMotion(own, formation.id, time);
      for (const member of members.values()) {
        // Re-read where the design puts this member when a cue is re-forming
        // the unit: the arrangement itself is moving, so the point the cached
        // sweep found is where the member stood before the re-form began. Read
        // once per member per sampled time, and only when a re-form is under
        // way -- a unit that keeps its arrangement pays nothing.
        const designed =
          motion.reform === null
            ? member.point
            : formationSlotPosition(formation, member.slot, motion.reform);
        const placed = placeFormationSlot({
          position: designed,
          facingDeg: formation.facingDeg,
          anchor: formation.anchor,
          baseFacingDeg: formation.facingDeg,
          unit: motion,
          member: sampleFormationSlotMotion(
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
        const off = formationGroundEscape(space, placed.position);
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
};
