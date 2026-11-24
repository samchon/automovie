import type { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import type { IAutoMovieHumanSegmentFrame } from "@automovie/interface";

/** Explicit fixed source and operator-input framing. */
export namespace FamilyConicCaptureFraming {
  /**
   * Immutable historical comparison data, separate from current-generation admission.
   *
   * @evidence contracts/development/design.md#principled-representation Exact file identity, fixed figure-world metre samples and the pelvis world-mm/unit-axis frame define one comparison reference; the caller supplies the fixed source and its explicit connection associations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SourceCapture and the fixed plan share only the baseline curves/frame/provenance; Input, Human and renderer own their imported types.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The archived reference is never substituted for current source/field admission or interpreted as a current operator evaluation.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish file bytes, world units, coordinate registration and historical comparison scope.
   */
  export interface IBaseline {
    /** Exact absolute reference-file identity. */
    file: Input.IFile;

    /** Fixed pelvis origin in world mm and unit axes establish the comparison coordinate registration. */
    frame: IAutoMovieHumanSegmentFrame;
    /** Fixed original axis/guide samples, in figure-world metres. */
    originals: N.Curve[];
    /** Fixed submitted operator-input samples, in the same world metres. */
    submitted: N.Curve[];
    /** Construction owners supplied by the producer for each source. */
    owners: Readonly<Record<string, readonly string[]>>;
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
    /** Exact construction owner identities; null selects all fixed connection inputs. */
    operatorOwners: readonly string[] | null;

    /** False means no prepared-band association was declared for this family; it is not an empty successful boundary check. */
    operatorAssociationRegistered: boolean;
    /** Named registered owners with no retained finite input samples. */
    missingOperatorOwners: string[];
    /** Original source identity, which does not imply operator-family correspondence. */
    source: string;
  }

  /** Read the exact producer-owned delimiter; a similarly named neighbouring owner cannot match. */
  function owner(curve: N.Curve): string | null {
    const at: number = curve.id.indexOf("/submitted/");
    return at > 0 ? curve.id.slice(0, at) : null;
  }

  /**
   * Union fixed original samples with the complete associated fixed parent/child input sequences.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Explicit construction-owner names choose recorded baseline start/end sequences in figure-world metres; no changed-case data selects the frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Source identity selects authored guides and a small declared owner list; their borrowed points form the camera input.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No nearest matching, transformed bounds, fabricated point, new camera formula or current-case fit occurs; missing owners remain named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear scans in the fixed original and submitted curve catalogs retain only the selected point references.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every pass and case uses the same exact baseline file and declared neighbourhood; the existing Camera.fit/project own framing.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned one-scope point-reference array and small owner lists escape; no process, file or global case cache exists.
   * @evidence contracts/development/common.md#meaningful-documentation Names fixed comparison scope, world-metre units, explicit owner selection and missing-input limits.
   */
  export function plan(source: string, baseline: IBaseline): IPlan {
    const operators: readonly string[] | null =
      source === "figure" ? null : (baseline.owners[source] ?? []);
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
        source === "figure" || Object.hasOwn(baseline.owners, source),
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
        "Fixed framing baseline uses a different figure-world coordinate frame",
      );
  }
}
