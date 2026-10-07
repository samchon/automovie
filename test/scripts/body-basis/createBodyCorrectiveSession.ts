import { createHumanBodyBasisBuilder } from "@automovie/human/body/basis/createHumanBodyBasisBuilder";
import { createHumanBodySegmenter } from "@automovie/human/body/measure/createHumanBodySegmenter";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IBodyCorrectiveRecord } from "./IBodyCorrectiveRecord";
import type { IBodyCorrectiveSession } from "./IBodyCorrectiveSession";
import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";
import type { IBodyCorrectiveVisit } from "./IBodyCorrectiveVisit";
import type { IBodyCorrectiveWorld } from "./IBodyCorrectiveWorld";
import { bodyCorrectiveVerificationAccepts } from "./bodyCorrectiveVerificationAccepts";
import { buildBodyCorrectiveSample } from "./buildBodyCorrectiveSample";
import { isBodyLimbContact } from "./classifyBodyContact";
import { createBodyCorrectiveDrivers } from "./createBodyCorrectiveDrivers";
import { createBodyCorrectiveWorld } from "./createBodyCorrectiveWorld";
import { pushBodyContacts } from "./pushBodyContacts";
import {
  type IBodyContactPair,
  countBodyContactTriangles,
  readBodyContacts,
  readMovedBodyContacts,
  summarizeBodyContacts,
} from "./readBodyContacts";
import { readBodyCorrectiveShoulderMotion } from "./readBodyCorrectiveShoulderMotion";
import { readBodyCorrectiveShoulderRest } from "./readBodyCorrectiveShoulderRest";
import { readBodyCorrectiveVerification } from "./readBodyCorrectiveVerification";
import { withBodyCorrective } from "./withBodyCorrective";

/** Bisection resolution of a joint onset, degrees, and of a channel onset, weight. */
const RESOLUTION = 2.5;
const WEIGHT_RESOLUTION = 0.05;

/** Outer solve-then-verify passes per state. */
const PASSES = 3;

/** Visits per state, counting queued midpoints. */
const VISITS = 10;

/**
 * Solve crossing states into pose correctives on the dual quaternion skin.
 *
 * A state is a shape and a pose the public builder poses with a crossing the
 * rest pose does not have. Its corrective is the product of one ramp per
 * posed joint axis and per nonzero shape channel. The joint ramps' onset is
 * the largest fraction `t` of the pose (every angle scaled from its rest) at
 * which nothing crosses on the whole shape, bisected to 2.5 degrees of the
 * widest travel, and each runs to the full angle. The channel ramps' onset is
 * the largest fraction `u` of the shape (every weight scaled from zero) at
 * which the full pose crosses nothing, bisected to 0.05 of the largest weight,
 * so a corrective solved at an envelope extreme stays off the milder bodies
 * whose pose the shapeless correctives already carry. The push is
 * `pushBodyContacts`, and every candidate is verified through the public
 * builder and the crossing instrument at the full state, at the midpoint of
 * the joint ramp and at half the shape; a midpoint or a half shape that still
 * crosses is queued as its own state (its ramp wider than four bisection
 * bands). A candidate whose remaining crossings are no fewer triangles than
 * before is not accepted. Up to three passes solve on the previous pass's
 * rows.
 *
 * A pair of a distal limb segment against a segment outside its limb is
 * recorded as limb contact and never pushed. Solving order matters: a state
 * wears every corrective accepted before it, so the caller keeps the states of
 * one group in one session, in the order the state lister gives.
 *
 * The session owns the working basis and its compiled builder; the input basis
 * is not mutated. Compiling a builder costs seconds, so a candidate's builder
 * is compiled once per pass and kept when the candidate is accepted.
 */
export function createBodyCorrectiveSession(
  input: IAutoMovieHumanBodyBasis,
  log: (line: string) => void = () => undefined,
): IBodyCorrectiveSession {
  const world: IBodyCorrectiveWorld = createBodyCorrectiveWorld(input);
  const segment = createHumanBodySegmenter(input);
  const macros = new Set(
    input.channels
      .filter((channel) => channel.group === "macro")
      .map((channel) => channel.id),
  );
  let working = input;
  let build = createHumanBodyBasisBuilder(working);
  const correctives: NonNullable<IAutoMovieHumanBodyBasis["correctives"]> = [];
  const rows: Record<string, number[]> = {};
  const records: IBodyCorrectiveRecord[] = [];

  const builtAt = (
    basis: IAutoMovieHumanBodyBasis,
    compiled: typeof build,
    state: IBodyCorrectiveState,
    t: number,
    u: number,
  ) =>
    buildBodyCorrectiveSample({
      world,
      state,
      t,
      u,
      basis: basis.id,
      build: compiled,
    });
  const pairsOn = (
    basis: IAutoMovieHumanBodyBasis,
    compiled: typeof build,
    state: IBodyCorrectiveState,
    t: number,
    u: number,
  ): IBodyContactPair[] =>
    readBodyContacts(segment(builtAt(basis, compiled, state, t, u)));
  const pairsMoved = (
    basis: IAutoMovieHumanBodyBasis,
    compiled: typeof build,
    state: IBodyCorrectiveState,
    t: number,
    u: number,
    moved: ReadonlySet<number>,
    known: IBodyContactPair[],
  ): IBodyContactPair[] =>
    readMovedBodyContacts(
      segment(builtAt(basis, compiled, state, t, u)),
      moved,
      known,
    );

  const solveState = (state: IBodyCorrectiveState): void => {
    const posedAxes = state.pose.flatMap((joint) =>
      (["flexion", "abduction", "twist"] as const)
        .filter((axis) => joint[axis] !== null)
        .map((axis) => ({
          bone: joint.bone,
          axis,
          angle: joint[axis]!,
          rest: world.neutral.get(joint.bone)![axis],
        })),
    );
    // a rest finding (a channel or trait set) has no travel to bisect
    const clinicalWidest = Math.max(
      0,
      ...posedAxes.map((one) => Math.abs(one.angle - one.rest)),
    );
    const heaviest = Math.max(0, ...Object.values(state.shape).map(Math.abs));
    let clean = 0;
    const queue: IBodyCorrectiveVisit[] = [{ t: 1, u: 1 }];
    let visits = 0;
    while (queue.length > 0 && visits++ < VISITS) {
      const { t, u } = queue.shift()!;
      const started = Date.now();
      const label =
        `${state.set}:${state.name}` +
        (t === 1 ? "" : `@${t}`) +
        (u === 1 ? "" : `~${u}`);
      const taken = new Set((working.correctives ?? []).map((c) => c.id));
      const prefix =
        state.set === "single"
          ? `pose/${label.slice(label.indexOf(":") + 1)}`
          : `state/${label}`;
      let suffix = 0;
      while (taken.has(prefix + (suffix > 0 ? `#${suffix + 1}` : ""))) suffix++;
      const id = prefix + (suffix > 0 ? `#${suffix + 1}` : "");
      const record = (
        outcome: string,
        crossing: IBodyCorrectiveRecord["crossing"],
      ): void => {
        records.push({
          group: `${state.set}:${state.name}`,
          state: label,
          angle: t,
          weight: u,
          outcome,
          crossing,
          ms: Date.now() - started,
        });
      };
      let before: IBodyContactPair[];
      let widest = clinicalWidest;
      let shoulderMotion: ReturnType<typeof readBodyCorrectiveShoulderMotion> =
        [];
      try {
        const goals = state.shoulders ?? [];
        if (goals.length > 0) {
          const rests = readBodyCorrectiveShoulderRest(
            builtAt(working, build, state, 0, u),
          );
          shoulderMotion = readBodyCorrectiveShoulderMotion({ goals, rests });
          widest = Math.max(
            widest,
            ...shoulderMotion.map((motion) => motion.travelDegrees),
          );
        }
        before = pairsOn(working, build, state, t, u);
      } catch (error) {
        record(
          "refused: " +
            (error instanceof Error ? error.message : String(error)),
          null,
        );
        log(`${label.padEnd(56)} REFUSED ${String(error).slice(0, 120)}`);
        continue;
      }
      const contact = before.find((pair) =>
        isBodyLimbContact(pair.part, pair.other),
      );
      if (contact !== undefined) {
        record(`limb contact: ${contact.part} x ${contact.other}`, null);
        log(
          `${label.padEnd(56)} cross ${summarizeBodyContacts(before)} -> limb contact`,
        );
        continue;
      }
      let outcome = "clear";
      let crossing: IBodyCorrectiveRecord["crossing"] = null;
      if (before.length > 0) {
        // onset: the largest pose fraction that is clean on this shape
        let lo = clean;
        let hi = t;
        while (widest > 0 && (hi - lo) * widest > RESOLUTION) {
          const mid = (lo + hi) / 2;
          let crossesAtMid = true;
          try {
            crossesAtMid = pairsOn(working, build, state, mid, u).length > 0;
          } catch {
            // a pose the builder refuses is no evidence of a clean onset
          }
          if (crossesAtMid) hi = mid;
          else lo = mid;
        }
        const midpoint = (lo + t) / 2;
        // channel onset, measured as the joint's is: in a posed state, the
        // largest fraction of the shape at which the full pose is clean
        let from = 0;
        if (widest > 0 && heaviest > 0) {
          let low = 0;
          let high = u;
          while ((high - low) * heaviest > WEIGHT_RESOLUTION) {
            const mid = (low + high) / 2;
            let crossesAtMid = true;
            try {
              crossesAtMid = pairsOn(working, build, state, t, mid).length > 0;
            } catch {
              // a refused shape is no evidence of a clean onset
            }
            if (crossesAtMid) high = mid;
            else low = mid;
          }
          from = low;
        }
        let inputs: ReturnType<typeof createBodyCorrectiveDrivers>;
        try {
          inputs = createBodyCorrectiveDrivers({
            state,
            macros,
            axes: posedAxes,
            shoulderMotion,
            onset: lo,
            full: t,
            from,
            to: u,
          });
        } catch (error: unknown) {
          record(
            "driver refused: " +
              (error instanceof Error ? error.message : String(error)),
            null,
          );
          continue;
        }
        outcome = "beyond the budget";
        let attempt: ReturnType<typeof pushBodyContacts> | null = null;
        let verification: object[] = [];
        let pairs = before;
        for (let pass = 0; pass < PASSES && pairs.length > 0; pass++) {
          attempt = pushBodyContacts(
            world,
            working,
            builtAt(working, build, state, t, u),
            attempt?.rest ?? null,
          );
          const candidate = withBodyCorrective(
            working,
            id,
            inputs,
            attempt.rest,
          );
          if (candidate === null) break;
          const candidateBuild = createHumanBodyBasisBuilder(candidate);
          const moved = new Set(attempt.rest.keys());
          const full = readBodyCorrectiveVerification(() =>
            pairsMoved(candidate, candidateBuild, state, t, u, moved, before),
          );
          const mid = readBodyCorrectiveVerification(
            widest > 0
              ? () => pairsOn(candidate, candidateBuild, state, midpoint, u)
              : undefined,
          );
          const lighter = readBodyCorrectiveVerification(
            heaviest > 0
              ? () => pairsOn(candidate, candidateBuild, state, t, u / 2)
              : undefined,
          );
          verification = [
            { t, u, sample: full },
            { t: midpoint, u, sample: mid },
            { t, u: u / 2, sample: lighter },
          ];
          if (full.kind === "refused") {
            outcome = "verification refused: " + full.reason;
            break;
          }
          const refused = [mid, lighter].find(
            (sample) => sample.kind === "refused",
          );
          if (refused !== undefined) {
            outcome = "verification refused: " + refused.reason;
            break;
          }
          const atFull = full.pairs;
          const atMid = mid.kind === "measured" ? mid.pairs : [];
          const atLighter = lighter.kind === "measured" ? lighter.pairs : [];
          if (atFull.length > 0) {
            if (
              countBodyContactTriangles(atFull) >=
              countBodyContactTriangles(pairs)
            )
              break;
            pairs = atFull;
            continue;
          }
          outcome = bodyCorrectiveVerificationAccepts({
            full,
            midpoint: mid,
            lighter,
          })
            ? "repaired"
            : atMid.length > 0
              ? "repaired; the midpoint of the joint ramp still crosses and is queued"
              : "repaired; the midpoint of the channel ramp still crosses and is queued";
          working = candidate;
          build = candidateBuild;
          const corrective = candidate.correctives!.find((c) => c.id === id)!;
          correctives.push(corrective);
          rows[id] = candidate.surfaces[0].targets[id];
          if (atMid.length > 0 && (t - lo) * widest > 4 * RESOLUTION)
            queue.unshift({ t: midpoint, u }, { t, u });
          else if (
            atMid.length === 0 &&
            atLighter.length > 0 &&
            (u / 2) * heaviest > 4 * WEIGHT_RESOLUTION
          )
            queue.unshift({ t, u: u / 2 }, { t, u });
          pairs = [];
        }
        let most = 0;
        for (const d of attempt?.posed.values() ?? [])
          most = Math.max(most, Math.hypot(d[0], d[1], d[2]));
        crossing = {
          id,
          onset: lo,
          full: t,
          weight: u,
          pairs: before,
          vertices: attempt?.rest.size ?? 0,
          mostPosed: most,
          log: attempt?.log ?? [],
          verification,
        };
        if (outcome === "repaired" && u === 1) clean = t;
        else if (outcome.includes("joint ramp") && u === 1) clean = lo;
        else if (
          outcome === "beyond the budget" &&
          // a body passing through the body is not tissue a nearer pose on
          // the same path would reach
          !(attempt?.log ?? []).some((line) => line.includes("bone through")) &&
          (t - lo) * widest > 4 * RESOLUTION &&
          !records.some((r) => r.state === `${label}@${midpoint}`)
        )
          queue.unshift({ t: midpoint, u });
      } else if (u === 1) clean = Math.max(clean, t);
      record(outcome, crossing);
      log(
        `${label.padEnd(56)} cross ${summarizeBodyContacts(before)} -> ${outcome} ${Date.now() - started} ms`,
      );
    }
  };

  return {
    solve: solveState,
    published: () => ({ correctives, rows, records }),
    working: () => working,
  };
}
