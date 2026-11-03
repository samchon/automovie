import { HumanAnatomyAudit } from "./HumanAnatomyAudit";

/**
 * The base person of an input response, one subject object per name within a
 * test, so its readings (kept on the subject by `HumanInputResponseReadings`)
 * are taken once while every perturbation is compared with it. Perturbed
 * people are built by `HumanInputResponseMade` for their own perturbation
 * alone and never kept.
 */
export namespace HumanInputResponseCache {
  /**
   * The subject of a named person; its skin is the one of `HumanAnatomy.bind`.
   *
   * @param name A person of `HumanPeople`.
   */
  export function named(name: string): HumanAnatomyAudit.ISubject {
    return HumanAnatomyAudit.subject(name);
  }
}

