import { Singleton } from "tstl";

import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyArmProfile } from "./HumanAnatomyArmProfile";
import { HumanAnatomyArmSites } from "./HumanAnatomyArmSites";
import { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyFoot } from "./HumanAnatomyFoot";
import { HumanAnatomyFootProfile } from "./HumanAnatomyFootProfile";
import { HumanAnatomyLegProfile } from "./HumanAnatomyLegProfile";
import { HumanAnatomyLegSites } from "./HumanAnatomyLegSites";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type IRow = HumanAnatomyAudit.IRow;
const SIDES: typeof HumanAnatomyShared.SIDES = HumanAnatomyShared.SIDES;

/**
 * The section-profile rows of the arm, the leg and the foot of each generated
 * person, read once per process: one `Singleton` per region and person, so the
 * profile tests of a region share one reading however many of them ask.
 */
export namespace HumanProfileRows {
  /** Singletons by `region:person`. */
  const cache: Map<string, Singleton<IRow[]>> = new Map();

  /** The foot's profile rows of a person: dorsum, arch and toes, both feet. */
  export function foot(person: string): IRow[] {
    return once(`foot:${person}`, (): IRow[] => {
      const subject: HumanAnatomyAudit.ISubject = subjectOf(person);
      const skin: HumanAnatomy.ISkin = subject.neutral();
      return SIDES.flatMap((side: "left" | "right"): IRow[] =>
        HumanAnatomyFootProfile.rows(subject.name, skin, side, HumanAnatomyFoot.footSites(skin, side)),
      );
    });
  }

  /** The leg's profile rows of a person: thigh run, height and girth orders, the least ankle, both legs. */
  export function leg(person: string): IRow[] {
    return once(`leg:${person}`, (): IRow[] => {
      const subject: HumanAnatomyAudit.ISubject = subjectOf(person);
      const skin: HumanAnatomy.ISkin = subject.bind();
      const stature: number = subject.params.body.controls.height.value!;
      const levels: HumanAnatomyLegSites.ILevels = {
        crotch: HumanAnatomyLegSites.crotchHeight(skin, stature),
        vertex: HumanAnatomyLegSites.vertexHeight(skin),
      };
      return SIDES.flatMap((side: "left" | "right"): IRow[] =>
        HumanAnatomyLegProfile.rows(
          subject.name,
          skin,
          side,
          levels,
          HumanAnatomyLegSites.legSites(skin, side, levels),
          {
            ankleHeight: subject.params.extremities?.feet?.[side]?.ankleHeight,
            knee: subject.params.body.controls.knee.value,
            calf: subject.params.body.controls.calf.value,
          },
        ),
      );
    });
  }

  /** The arm's profile rows of a person: the upper arm's run and the forearm's belly, both arms. */
  export function arm(person: string): IRow[] {
    return once(`arm:${person}`, (): IRow[] => {
      const subject: HumanAnatomyAudit.ISubject = subjectOf(person);
      const skin: HumanAnatomy.ISkin = subject.bind();
      return SIDES.flatMap((side: "left" | "right"): IRow[] =>
        HumanAnatomyArmProfile.rows(subject.name, skin, side, HumanAnatomyArmSites.armSites(skin, side)),
      );
    });
  }

  /** The value of a key's singleton, computed on the first ask. */
  function once(key: string, closure: () => IRow[]): IRow[] {
    let found: Singleton<IRow[]> | undefined = cache.get(key);
    if (found === undefined) {
      found = new Singleton(closure);
      cache.set(key, found);
    }
    return found.get();
  }

  /** A generated person as a subject. */
  function subjectOf(person: string): HumanAnatomyAudit.ISubject {
    return HumanAnatomyAudit.subject(person);
  }
}
