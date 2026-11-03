import type { IAutoMovieHumanBodyControls } from "../../../../packages/human/src/structures/body/IAutoMovieHumanBodyControls";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyArmProfile } from "./HumanAnatomyArmProfile";
import { HumanAnatomyArmSites } from "./HumanAnatomyArmSites";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyMirror } from "./HumanAnatomyMirror";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type IArm = HumanAnatomyShared.IArm;
const A: typeof HumanAnatomy = HumanAnatomy;
const { SIDES, SMALL, WRIST_PROXIMAL, WRIST_DISTAL, BULGE, identity, extraTurns }: typeof HumanAnatomyShared = HumanAnatomyShared;

/**
 * The arm audit: its rows, and the entry to the sites they are read at. The
 * sites live in {@link HumanAnatomyArmSites}, located on a subject's skin by
 * their published definitions.
 */
export namespace HumanAnatomyArm {
  /** The arms: tapes at ANSUR II and ISO sites, the forearm's and wrist's girth profile, the thumb side of the wrist. */
  export function arm(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const c: IAutoMovieHumanBodyControls = subject.params.body.controls;
    const skin: HumanAnatomy.ISkin = subject.bind();

    for (const side of SIDES) {
      const s: IArm = armSites(skin, side);
      const tape: (site: string, value: number, input: number | null) => void = (site: string, value: number, input: number | null): void => {
        if (input !== null) rows.push(identity(name, `${side} ${site}`, value, input, SMALL));
      };
      tape("upper arm girth midway acromion to olecranon, mm", s.bicep, c.bicep.value);
      tape("elbow girth over the olecranon, mm", s.elbow, c.elbow.value);
      tape("forearm girth, relaxed maximum below the elbow, mm", s.forearm, c.forearm.value);
      tape("wrist girth over stylion, mm", s.wrist, c.wrist.value);

      // A section that missed its bone leaves the profile unread, not a turn shorter.
      const profiled: boolean = s.forearmProfile.every((g: number): boolean => Number.isFinite(g));
      rows.push({
        person: name,
        site: `${side} forearm girth, elbow to wrist: maxima past the first deeper than a small-girth error`,
        value: profiled ? extraTurns(s.forearmProfile.map((g: number): number => -g), SMALL) : NaN,
        low: 0,
        high: 0,
        unit: "turns",
      });
      rows.push({
        person: name,
        site: `${side} least girth from the forearm's belly to the knuckles, mm from stylion (negative proximal)`,
        value: s.narrowest,
        low: -WRIST_PROXIMAL,
        high: WRIST_DISTAL,
        unit: "mm",
      });
      rows.push({
        person: name,
        site: `${side} wrist girth over stylion above that least girth, mm`,
        value: s.wrist - s.least,
        low: 0,
        high: SMALL,
        unit: "mm",
      });

      // The sections along the bones: the upper arm's run and the forearm's belly.
      rows.push(...HumanAnatomyArmProfile.rows(name, skin, side, s));

      for (const [joint, off] of Object.entries(s.outside))
        rows.push({
          person: name,
          site: `${side} arm's bone axis at the ${joint} outside its own section of skin, mm`,
          value: off,
          low: 0,
          high: 0,
          unit: "mm",
        });
      rows.push({
        person: name,
        site: `${side} wrist's thumb side: bulge over its own chord, stylion -40 to +10 mm, mm`,
        value: s.radialBulge,
        low: 0,
        high: BULGE,
        unit: "mm",
      });
    }

    // Both sides come from one construction and a reflection, each side from
    // its own hand inputs distal of the wrist; a real body's need not mirror.
    if (subject.construction)
      rows.push({
        person: name,
        site: "arms: each side's reflection, rebuilt to the other side's own hand inputs distal of the wrist, off the other side's skin, mm",
        value: HumanAnatomyMirror.offset(skin, /^arm/, HumanAnatomyMirror.limbs(subject.params, (bone: string): V3 => A.joint(skin, bone))),
        low: 0,
        high: HumanAnatomyMirror.MIRROR,
        unit: "mm",
      });
    return rows;
  }

  /** Locate an arm's sites at the bind. */
  export const armSites: typeof HumanAnatomyArmSites.armSites = HumanAnatomyArmSites.armSites;

  /** Triangles within reach of a limb's bone polyline. */
  export const limb: typeof HumanAnatomyArmSites.limb = HumanAnatomyArmSites.limb;

  /** Reach of a limb's skin from its bone, mm. */
  export const REACH: number = HumanAnatomyArmSites.REACH;
}
