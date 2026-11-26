import type { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import type { IAutoMovieHumanSegmentFrame } from "@automovie/interface";

/** Fixed authored-F1 source and explicitly associated operator-input framing; never a changed-case fit. */
export namespace FamilyConicCaptureFraming {
  /**
   * Immutable historical comparison data, separate from current-generation admission.
   *
   * @evidence contracts/development/design.md#principled-representation Exact file identity, fixed figure-world metre samples and the pelvis world-mm/unit-axis frame define one comparison reference; the file reader validates schema, f1 identity and finite coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SourceCapture and the fixed plan share only the baseline curves/frame/provenance; Input, Human and renderer own their imported types.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The archived reference is never substituted for current source/field admission or interpreted as a current operator evaluation.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish file bytes, world units, coordinate registration and historical comparison scope.
   */
  export interface IBaseline {
    /** Exact absolute reference-file identity. */
    file: Input.IFile;

    /** Fixed pelvis origin in world mm and unit axes establish the comparison coordinate registration. */
    frame: IAutoMovieHumanSegmentFrame;
    /** Fixed F1 original axis/guide samples, in figure-world metres. */
    originals: N.Curve[];
    /** Fixed F1 submitted operator-input samples, in the same world metres. */
    submitted: N.Curve[];
    /** Original scope, source and producer provenance; not current generation evidence. */
    provenance: unknown;
  }
  /**
   * One explicit source/connection neighbourhood before the existing camera owner fits it.
   *
   * @evidence contracts/development/design.md#principled-representation Borrowed fixed world-metre points and exact declared construction owners define a shared camera input; absent input owners remain named.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The existing camera owner consumes points while receipts consume the source/owner/missing identities.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No new camera, current-case geometry model, nearest association or inferred source/operator equality is represented.
   * @evidence contracts/development/common.md#meaningful-documentation Members state fixed coordinates, explicit owner matching and missing-bound evidence.
   */
  export interface IPlan {
    /** Borrowed fixed world-metre samples only. */
    points: N.Point[];
    /** Exact construction owner identities; null selects the whole fixed F1 layer. */
    operatorOwners: readonly string[] | null;

    /** False means no prepared-band association was declared for this family; it is not an empty successful boundary check. */
    operatorAssociationRegistered: boolean;
    /** Named registered owners with no retained finite input samples. */
    missingOperatorOwners: string[];
    /** Original source identity, which does not imply operator-family correspondence. */
    source: string;
  }
  /** Explicit associations read from F1's port/continue declarations and their actual prepared-event names. */
  const OWNERS: Readonly<Record<string, readonly string[]>> = {
    trunk: [
      "band.arm",
      "band.arm.mirror",
      "band.breast",
      "band.breast.mirror",
      "band.nose",
      "band.leg",
      "band.leg.mirror",
    ],
    arm: ["band.arm", "wrist.arm"],
    "arm.mirror": ["band.arm.mirror", "wrist.arm.mirror"],
    nose: ["band.nose"],
    breast: ["band.breast"],
    "breast.mirror": ["band.breast.mirror"],
    hand: [
      "wrist.arm",
      "band.finger.pinky",
      "band.finger.ring",
      "band.finger.middle",
      "band.finger.index",
    ],
    "hand.mirror": [
      "wrist.arm.mirror",
      "band.finger.pinky.mirror",
      "band.finger.ring.mirror",
      "band.finger.middle.mirror",
      "band.finger.index.mirror",
    ],
    leg: [
      "band.leg",
      "band.toe.little",
      "band.toe.ring",
      "band.toe.middle",
      "band.toe.index",
      "band.toe.big",
    ],
    "leg.mirror": [
      "band.leg.mirror",
      "band.toe.little.mirror",
      "band.toe.ring.mirror",
      "band.toe.middle.mirror",
      "band.toe.index.mirror",
      "band.toe.big.mirror",
    ],
    axilla: ["band.arm"],
    "axilla.mirror": ["band.arm.mirror"],
  };

  /** Read the exact producer-owned delimiter; a similarly named neighbouring owner cannot match. */
  function owner(curve: N.Curve): string | null {
    const at: number = curve.id.indexOf("/submitted/");
    return at > 0 ? curve.id.slice(0, at) : null;
  }

  /**
   * Union fixed original samples with the complete associated fixed parent/child input sequences.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Explicit F1 construction-owner names choose recorded baseline start/end sequences in figure-world metres; no changed-case data selects the frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Source identity selects authored guides and a small declared owner list; their borrowed points form the camera input.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No nearest matching, transformed bounds, fabricated point, new camera formula or current-case fit occurs; missing owners remain named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear scans in the fixed original and submitted curve catalogs retain only the selected point references.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every pass and case uses the same exact baseline file and declared neighbourhood; the existing Camera.fit/project own framing.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned one-scope point-reference array and small owner lists escape; no process, file or global case cache exists.
   * @evidence contracts/development/common.md#meaningful-documentation Names fixed comparison scope, world-metre units, explicit owner selection and missing-input limits.
   */
  export function plan(source: string, baseline: IBaseline): IPlan {
    const operators: readonly string[] | null =
      source === "figure" ? null : (OWNERS[source] ?? []);
    const chosen: Set<string> = new Set(operators ?? []);
    const selected: N.Curve[] = baseline.submitted.filter(
      (curve: N.Curve): boolean =>
        operators === null || chosen.has(owner(curve) ?? ""),
    );
    const originals: N.Curve[] = baseline.originals.filter(
      (curve: N.Curve): boolean =>
        source === "figure" || curve.id.startsWith(source + "/"),
    );
    const points: N.Point[] = [...originals, ...selected].flatMap(
      (curve: N.Curve): N.Point[] => [...curve.points],
    );
    const missing: string[] = (operators ?? []).filter(
      (name: string): boolean =>
        !selected.some((curve: N.Curve): boolean => owner(curve) === name),
    );
    return {
      source,
      points,
      operatorOwners: operators,
      operatorAssociationRegistered:
        source === "figure" || OWNERS[source] !== undefined,
      missingOperatorOwners: missing,
    };
  }

  /**
   * Require the same fixed figure-world registration before sharing historical framing.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact finite pelvis origin-mm and unit-axis identities bind the old comparison data to this invocation coordinate frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One existing canonical identity comparison refuses a missing or different frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No alignment, inferred transform or changed-case fit compensates a foreign frame.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size frame serialization and comparison retain bounded text.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared Identity recipe checks both frames without another coordinate implementation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No input mutation, cache or external resource is retained.
   * @evidence contracts/development/common.md#meaningful-documentation Names exact coordinate registration and absence of a compensating transform.
   */
  export function compatible(
    baseline: IBaseline,
    actual: IAutoMovieHumanSegmentFrame | undefined,
  ): void {
    if (
      actual === undefined ||
      Identity.dataHash(actual) !== Identity.dataHash(baseline.frame)
    )
      throw new Error(
        "Fixed F1 framing baseline uses a different figure-world coordinate frame",
      );
  }
}
