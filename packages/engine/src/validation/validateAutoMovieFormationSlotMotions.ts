import { IAutoMovieCompiledFormation, IAutoMovieDiagnostic, IAutoMovieFormationSlotMotion, IAutoMovieShotContract } from "@automovie/interface";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { engineDiagnostic } from "./engineDiagnostic";

/**
 * Validate sparse per-member exceptions against one compiled shot.
 *
 * Narrowed to what it reads, like the ground gate beside it: the unit's own
 * count and hero inventory decide which slots exist and which already belong to
 * an actor, and nothing else about a compiled shot bears on the question.
 *
 * @author Samchon
 */
export const validateAutoMovieFormationSlotMotions = (
  contract: Pick<
    IAutoMovieShotContract,
    "id" | "participants" | "durationSeconds"
  >,
  value: {
    formations: readonly Pick<
      IAutoMovieCompiledFormation,
      "id" | "count" | "heroes"
    >[];
    formationSlotMotions: readonly IAutoMovieFormationSlotMotion[];
  },
): IAutoMovieDiagnostic[] => {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const fail = (field: string, expectation: string): void => {
    diagnostics.push(engineDiagnostic(contract.id, field, expectation));
  };
  const cues = value.formationSlotMotions;
  if (cues.length > 256)
    fail(
      "formationSlotMotions",
      "must contain at most 256 sparse per-member cues",
    );
  const named = cues.reduce((sum, cue) => sum + cue.slots.length, 0);
  if (named > FORMATION_SLOT_EXCEPTION_LIMIT)
    fail(
      "formationSlotMotions",
      `must single out at most ${FORMATION_SLOT_EXCEPTION_LIMIT} members in one shot rather than author a curve per member`,
    );
  const ids = new Set<string>();
  const participating = new Set(
    contract.participants.flatMap((participant) =>
      participant.kind === "formation" ? [participant.id] : [],
    ),
  );
  const compiledById = new Map(
    value.formations.map((formation) => [formation.id, formation]),
  );
  // Keyed by formation and then by slot rather than by formation alone, because
  // two members of one crowd doing different things at the same second is the
  // whole point of the channel. One member doing two things at once is not.
  // Nested rather than joined into one string key, because a formation id is
  // author-chosen text and any separator picked to join them is one an id may
  // legitimately contain.
  const priorBySlot = new Map<
    string,
    Map<number, IAutoMovieFormationSlotMotion>
  >();
  for (const cue of [...cues].sort(
    (left, right) =>
      compareCodeUnits(left.formation, right.formation) ||
      left.start - right.start ||
      compareCodeUnits(left.id, right.id),
  )) {
    if (cue.id.trim().length === 0 || ids.has(cue.id))
      fail(
        `formationSlotMotion:${cue.id || "(blank)"}`,
        "must have one non-blank id unique inside the shot",
      );
    ids.add(cue.id);
    const compiled = compiledById.get(cue.formation);
    if (participating.has(cue.formation) === false || compiled === undefined)
      fail(
        `formationSlotMotion:${cue.id}.formation`,
        `must reference participating compiled formation "${cue.formation}"`,
      );
    if (
      Number.isFinite(cue.start) === false ||
      Number.isFinite(cue.end) === false ||
      cue.start < 0 ||
      cue.end <= cue.start ||
      cue.end > contract.durationSeconds
    )
      fail(
        `formationSlotMotion:${cue.id}.time`,
        `must be one positive interval inside 0..${contract.durationSeconds}s`,
      );
    if (
      cue.slots.length === 0 ||
      new Set(cue.slots).size !== cue.slots.length ||
      cue.slots.some(
        (slot) =>
          Number.isSafeInteger(slot) === false ||
          slot < 0 ||
          (compiled !== undefined && slot >= compiled.count),
      )
    )
      fail(
        `formationSlotMotion:${cue.id}.slots`,
        `must name at least one unique slot inside 0..${(compiled?.count ?? 0) - 1}`,
      );
    // A promoted hero is already an explicit scene node with a full authoring
    // surface of its own. Letting this channel move one too would give a member
    // two owners writing the same transform, and the frame would show whichever
    // wrote last.
    const heroes = (compiled?.heroes ?? []).filter((hero) =>
      cue.slots.includes(hero.slot),
    );
    if (heroes.length !== 0)
      fail(
        `formationSlotMotion:${cue.id}.slots`,
        `must not name slots promoted to named actors (${heroes
          .map((hero) => `${hero.slot} is "${hero.actor}"`)
          .join(", ")}); author those on the actor instead`,
      );
    for (const [name, state] of [
      ["from", cue.from],
      ["to", cue.to],
    ] as const) {
      if (
        [state.offset.x, state.offset.y, state.offset.z].some(
          (number) =>
            Number.isFinite(number) === false ||
            Math.abs(number) > 1_000_000_000,
        ) ||
        Number.isFinite(state.facingOffsetDeg) === false ||
        Math.abs(state.facingOffsetDeg) > 360_000
      )
        fail(
          `formationSlotMotion:${cue.id}.${name}`,
          "must keep offset inside +/-1000000000m and facing inside +/-360000 degrees",
        );
    }
    const priorSlots =
      priorBySlot.get(cue.formation) ??
      new Map<number, IAutoMovieFormationSlotMotion>();
    priorBySlot.set(cue.formation, priorSlots);
    for (const slot of cue.slots) {
      const prior = priorSlots.get(slot);
      // Never against itself. A cue naming one member twice is a malformed
      // slot list, already refused as one above; reading the second mention as
      // an overlap would refuse the same mistake a second time and name the
      // cue as its own prior, which is not a sentence an author can act on.
      if (prior !== undefined && prior !== cue && cue.start < prior.end)
        fail(
          `formationSlotMotion:${cue.id}.start`,
          `must not overlap prior cue "${prior.id}" on slot ${slot} ending at ${prior.end}s`,
        );
      priorSlots.set(slot, cue);
    }
  }
  return diagnostics;
};
