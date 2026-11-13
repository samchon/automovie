import {
  HUMAN_LEXICON,
  HUMAN_LEXICON_SCHEMAS,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";

import { LexiconRowNet } from "./LexiconRowNet";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The net cast over every lexicon row with what an author may leave out or
 * get wrong: each row planned alone with no parameters at all, and each row
 * the lexicon's net gives a region planned with a region no body has
 * (`chest`). A row may plan or refuse; it may never fail as a program does.
 * A refusal must be the grammar's own (`HumanRefusal`), naming its axis,
 * and must not name `undefined` for a value the author did not give.
 * Every row is listed in `HUMAN_LEXICON_SCHEMAS`, whose entry the row's
 * parameters are checked against at its entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two casts, what passes and what a refusal must carry.
 * @evidence contracts/development/design.md#principled-representation One walk over the lexicon's rows in a stated order, cut into parts by position, so each part is its own test under the time bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cast and its parts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row is exempt: rows the lexicon's net stages elsewhere are cast too, since they must refuse without their staging.
 */
export namespace LexiconAbsentNet {
  /** A region no humanoid declares. */
  export const NOWHERE: string = "chest";

  /** The average man, prepared at the first cast and kept for the test process. */
  let body: IHumanBody | undefined;

  /** Every row of the lexicon, in family order. */
  const rows = (): IHumanActionLaw<never>[] =>
    Object.values(HUMAN_LEXICON).flat();

  /** A value with every `region` in it replaced by {@link NOWHERE}; null when it holds none. */
  const misplaced = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      let found: boolean = false;
      const out: unknown[] = value.map((item: unknown): unknown => {
        const replaced: unknown = misplaced(item);
        if (replaced === null) return item;
        found = true;
        return replaced;
      });
      return found ? out : null;
    }
    if (typeof value !== "object" || value === null) return null;
    let found: boolean = false;
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === "region" && typeof item === "string") {
        out[key] = NOWHERE;
        found = true;
        continue;
      }
      const replaced: unknown = misplaced(item);
      out[key] = replaced === null ? item : replaced;
      found ||= replaced !== null;
    }
    return found ? out : null;
  };

  /** Why an outcome is not the grammar's own, or null when it is. */
  const judge = (caught: unknown): string | null => {
    if (caught === null) return null;
    if (!(caught instanceof HumanRefusal))
      return `${caught instanceof Error ? caught.name : typeof caught}: ${caught instanceof Error ? caught.message : String(caught)}`;
    if (caught.axis.length === 0)
      return `a refusal on no axis: ${caught.message}`;
    if (/\bundefined\b/.test(`${caught.reason} ${caught.fix}`))
      return `a refusal that names undefined: ${caught.message}`;
    return null;
  };

  /**
   * Cast the net over one part of the lexicon's rows.
   *
   * @param part Which rows, as `[index, parts]`: those whose position in the lexicon leaves `index` when divided by `parts`.
   * @returns One complaint per row and cast that failed as a program or refused without naming what was missing; none when every row plans or refuses as the grammar does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, how a part is chosen and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each row is built alone on the average man after a short stand with no parameters, and, when the lexicon's net gives it a region, in that net's own scene with every region replaced; the build is the public input, so the refusal read is what an author would see.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the part, two casts per row, one judge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A part with no row is itself a complaint.
   * @evidence contracts/development/implementation.md#efficient-algorithms One performance per row and cast.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The average man is prepared once per process, and the region cast reuses the lexicon net's scenes.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each performance is dropped after it is built.
   */
  export function cast(part: readonly [number, number]): string[] {
    const complaints: string[] = [];
    const chosen: IHumanActionLaw<never>[] = rows().filter(
      (_: IHumanActionLaw<never>, index: number): boolean =>
        index % part[1] === part[0],
    );
    if (chosen.length === 0)
      complaints.push(`part ${part[0]} of ${part[1]} holds no row`);

    // A row the schema file does not list would be planned unchecked.
    for (const law of chosen)
      if (HUMAN_LEXICON_SCHEMAS.rows[law.name] === undefined)
        complaints.push(
          `${law.name} has no entry in HUMAN_LEXICON_SCHEMAS, so its parameters are not checked at its entry`,
        );
    body ??= motionHumanBody("m-average");
    const laws: IHumanActionLaw<never>[] = rows();
    for (const law of chosen) {
      let caught: unknown = null;
      try {
        new HumanPerformance({
          seed: "absent",
          laws,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered(law.name, {}).node,
        });
      } catch (error) {
        caught = error;
      }
      const bare: string | null = judge(caught);
      if (bare !== null)
        complaints.push(`${law.name} with no parameters: ${bare}`);
      const given: object | undefined = LexiconRowNet.given(law.name);
      const wrong: unknown = given === undefined ? null : misplaced(given);
      if (wrong === null) continue;
      const placed: string | null = judge(
        LexiconRowNet.attempt(law.name, wrong as object),
      );
      if (placed !== null)
        complaints.push(`${law.name} on the region ${NOWHERE}: ${placed}`);
    }
    return complaints;
  }
}
