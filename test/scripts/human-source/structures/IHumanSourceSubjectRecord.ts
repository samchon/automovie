import type { IHumanSourceSubjectAge } from "./IHumanSourceSubjectAge.ts";

/**
 * The conversion record of one subject person: its age path, how its sex was
 * carried, and whether it was converted or refused.
 *
 * @author Samchon
 */
export interface IHumanSourceSubjectRecord {
  /** Subject id. */
  id: string;

  /** How the body age was set. */
  age: IHumanSourceSubjectAge;

  /** The body macroGender weight carried from the face value (same signed unit). */
  macroGender: number;

  /** Whether the person was converted or refused. */
  converted: boolean;
}
