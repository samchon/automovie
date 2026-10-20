import {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationHero,
  IAutoMovieDiagnostic,
  IAutoMovieFormationSlotMotion,
  IAutoMovieShotContract,
  IAutoMovieShotParticipant,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { engineDiagnostic } from "./engineDiagnostic";

/**
 * Members one shot may single out of its crowds, in total.
 *
 * The channel's whole promise is that a crowd of a hundred thousand does not
 * pay for the three members something happens to, and a promise nothing
 * enforces is a comment. Past this the answer is the other mechanism: a member
 * that needs a shot's full attention is promoted to a named actor, which exists
 * and is capped for the same reason. This is the cheaper thing and must not
 * become that.
 */
const FORMATION_SLOT_EXCEPTION_LIMIT: number = 1_024;

/**
 * Validate sparse member cue slots, states, ids, order and participant formation references.
 *
 * @evidence contracts/common.md#principled-implementation Validate sparse member cue slots, states, ids, order and participant formation references.
 * @evidence contracts/common.md#clear-and-simple-design Per-formation/slot prior maps enforce exception scheduling while base formation admission stays separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts More than 256 cues or 1024 total named slot entries report excess without truncation; promoted hero slots are refused to preserve their explicit actor owner.
 * @evidence contracts/common.md#meaningful-documentation Half-open nonoverlapping cue windows, unique in-range slots, offsets bounded to +/-1e9m and facing bounded to +/-360000deg are stated.
 * @evidence contracts/performance.md#efficient-algorithms F formations and C cues build maps/sort in O(F+C log C); S named slots drive admission/prior lookup, while hero filter with slots.includes adds O(H*S) per cue in the worst case.
 * @evidence contracts/performance.md#reuse-equivalent-work Request-local compiled formation and nested formation/slot prior maps share repeated identity lookup, without joined-string collisions or cross-shot caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only diagnostics return; no baked crowd, runtime member handle or cross-request state is retained.
 */
export const validateAutoMovieFormationSlotMotions: (
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
) => IAutoMovieDiagnostic[] = (
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
  const fail: (field: string, expectation: string) => void = (
    field: string,
    expectation: string,
  ): void => {
    diagnostics.push(engineDiagnostic(contract.id, field, expectation));
  };
  const cues: readonly IAutoMovieFormationSlotMotion[] =
    value.formationSlotMotions;
  if (cues.length > 256)
    fail(
      "formationSlotMotions",
      "must contain at most 256 sparse per-member cues",
    );
  const named: number = cues.reduce(
    (sum: number, cue: IAutoMovieFormationSlotMotion): number =>
      sum + cue.slots.length,
    0,
  );
  if (named > FORMATION_SLOT_EXCEPTION_LIMIT)
    fail(
      "formationSlotMotions",
      `must single out at most ${FORMATION_SLOT_EXCEPTION_LIMIT} members in one shot rather than author a curve per member`,
    );
  const ids: Set<string> = new Set<string>();
  const participating: Set<string> = new Set(
    contract.participants.flatMap(
      (participant: IAutoMovieShotParticipant): string[] =>
        participant.kind === "formation" ? [participant.id] : [],
    ),
  );
  const compiledById: Map<
    string,
    Pick<IAutoMovieCompiledFormation, "id" | "count" | "heroes">
  > = new Map(
    value.formations.map(
      (
        formation: Pick<IAutoMovieCompiledFormation, "id" | "count" | "heroes">,
      ): [
        string,
        Pick<IAutoMovieCompiledFormation, "id" | "count" | "heroes">,
      ] => [formation.id, formation],
    ),
  );
  // Keyed by formation and then by slot rather than by formation alone, because
  // two members of one crowd doing different things at the same second is the
  // whole point of the channel. One member doing two things at once is not.
  // Nested rather than joined into one string key, because a formation id is
  // author-chosen text and any separator picked to join them is one an id may
  // legitimately contain.
  const priorBySlot: Map<
    string,
    Map<number, IAutoMovieFormationSlotMotion>
  > = new Map<string, Map<number, IAutoMovieFormationSlotMotion>>();
  for (const cue of [...cues].sort(
    (
      left: IAutoMovieFormationSlotMotion,
      right: IAutoMovieFormationSlotMotion,
    ): number =>
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
    const compiled:
      | Pick<IAutoMovieCompiledFormation, "id" | "count" | "heroes">
      | undefined = compiledById.get(cue.formation);
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
        (slot: number): boolean =>
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
    const heroes: IAutoMovieCompiledFormationHero[] = (
      compiled?.heroes ?? []
    ).filter((hero: IAutoMovieCompiledFormationHero): boolean =>
      cue.slots.includes(hero.slot),
    );
    if (heroes.length !== 0)
      fail(
        `formationSlotMotion:${cue.id}.slots`,
        `must not name slots promoted to named actors (${heroes
          .map(
            (hero: IAutoMovieCompiledFormationHero): string =>
              `${hero.slot} is "${hero.actor}"`,
          )
          .join(", ")}); author those on the actor instead`,
      );
    for (const [name, state] of [
      ["from", cue.from],
      ["to", cue.to],
    ] as const) {
      if (
        [state.offset.x, state.offset.y, state.offset.z].some(
          (number: number): boolean =>
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
    const priorSlots: Map<number, IAutoMovieFormationSlotMotion> =
      priorBySlot.get(cue.formation) ??
      new Map<number, IAutoMovieFormationSlotMotion>();
    priorBySlot.set(cue.formation, priorSlots);
    for (const slot of cue.slots) {
      const prior: IAutoMovieFormationSlotMotion | undefined =
        priorSlots.get(slot);
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
