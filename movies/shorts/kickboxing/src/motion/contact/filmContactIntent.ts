import type { BoutTechnique } from "../choreography/BoutTechnique";
import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";

/** One semantic weapon and receiving region shared by seed authoring, collider binding and event classification. This film chooses shin roundhouses and a forearm body shield; legal alternatives in other kickboxing styles do not silently change its declared technique. */
export function filmContactIntent(
  action: BoutScript.Action,
): filmContactIntent.IIntent {
  const spec: (typeof BoutScript.specs)[BoutScript.Technique] =
    BoutScript.specs[action.technique];
  const kick: boolean = spec.limb === "leg";
  const side: "left" | "right" = spec.side;
  const receiverSide: "left" | "right" = side === "left" ? "right" : "left";
  const relation: filmContactIntent.Relation | null =
    !spec.contact ||
    action.defense === "slip" ||
    action.defense === "weave" ||
    action.defense === "lean"
      ? null
      : action.defense === "check"
        ? "shin-check"
        : action.defense === "hit" || action.defense === "none"
          ? spec.target === "head"
            ? "head"
            : "body"
          : "guard";
  return {
    side,
    receiverSide,
    kick,
    relation,
    sourceBone: `${side}${SURFACE[spec.surface]}`,
    targetBone:
      relation === "head" || (relation === null && spec.target === "head")
        ? spec.feature === "jaw-neck"
          ? "neck"
          : "head"
        : relation === "guard"
          ? `${receiverSide}${kick ? "LowerArm" : "Hand"}`
          : relation === "shin-check"
            ? `${receiverSide}LowerLeg`
            : spec.target === "leg"
              ? `${receiverSide}UpperLeg`
              : "chest",
  };
}

/** Provider segment carrying each registered striking surface. */
const SURFACE: Readonly<Record<BoutTechnique.Surface, string>> = {
  fist: "Hand",
  shin: "LowerLeg",
  instep: "Foot",
  sole: "Foot",
  knee: "LowerLeg",
};

/** Movie semantics carry no pose, numerical solver or contact receipt. */
export namespace filmContactIntent {
  /** Accepted receiver roles; an evasion has no promised contact. */
  export type Relation = "head" | "body" | "guard" | "shin-check";
  /** Exact anatomical regions are resolved through the real provider shapes by consumers. */
  export interface IIntent {
    /** Attacking anatomical side. */ side: "left" | "right";
    /** Incoming-side defender region. */ receiverSide: "left" | "right";
    /** Shin technique rather than a glove technique. */ kick: boolean;
    /** Screenplay promise, or an intentional miss. */ relation: Relation | null;
    /** Selected authored striking region. */ sourceBone: string;
    /** Selected authored receiving region. */ targetBone: string;
  }
}
