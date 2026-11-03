import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanInputResponseMade } from "./HumanInputResponseMade";
import { HumanOnce } from "./HumanOnce";

/**
 * Every perturbed person, generated once per process and shared by every
 * test that asks for it. A person is identified by its complete public
 * inputs, so the same edit asked for by two tests, or twice by one, is one
 * generation (about thirty seconds), and its readings, cached on the subject
 * by `HumanInputResponseReadings`, are taken once too.
 *
 * This is the keyed once-only cache `HumanPeople` uses for the named people
 * (`HumanOnce`), not the `tstl` `VariadicSingleton`: `tstl` is installed in
 * the workspace store but is no dependency of the test package.
 */
export namespace HumanInputResponseCache {
  /**
   * The subject of a named person, one object per name so its readings are
   * cached across tests; its skin is the shared one of `HumanAnatomy.bind`.
   *
   * @param name A person of `HumanPeople`.
   */
  export function named(name: string): HumanAnatomyAudit.ISubject {
    return names.read(name, (): HumanAnatomyAudit.ISubject => HumanAnatomyAudit.subject(name));
  }

  /**
   * The subject of a person, generated on first use of its skin.
   *
   * @param name Name in findings; the first caller's name is kept.
   * @param params The person's public inputs, an in-memory copy; two equal
   *   inputs are one person.
   */
  export function subject(name: string, params: IAutoMovieHumanParameters): HumanAnatomyAudit.ISubject {
    return subjects.read(JSON.stringify(params), (): HumanAnatomyAudit.ISubject => HumanInputResponseMade.subject(name, params));
  }
}

/** The named persons' subjects, by name. */
const names: HumanOnce<HumanAnatomyAudit.ISubject> = new HumanOnce();

/** The persons generated so far, by their complete inputs. */
const subjects: HumanOnce<HumanAnatomyAudit.ISubject> = new HumanOnce();
