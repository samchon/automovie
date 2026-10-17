import type {
  IAutoMovieHumanConstructionNet,
  inspectAutoMovieHumanCurveDesign as Inspect,
} from "@automovie/human";

/** Ordinary page state for the explicit skin-construction/design selector.
 * One state belongs to one admitted Human instance. Failed edits preserve its
 * last valid design, while replacing the Human clears that cache. Capture uses
 * the same selection and provenance as the visible page, without a hidden mode.
 *
 * @evidence contracts/common.md#principled-implementation Separates identity validity from a nullable last valid separate curve design and its current edit findings.
 * @evidence contracts/common.md#clear-and-simple-design One page editor owns its displayed source and design cache; generation remains with the admitted Human.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Design refusal retains the previous actual result without fabricating skin or authoritative control data.
 * @evidence contracts/common.md#meaningful-documentation Describes cache invalidation, the source selector and capture provenance.
 * @evidence contracts/performance.md#efficient-algorithms Metadata scans selected net roles and copies its bounded document; it does not reevaluate primitive geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Selection changes reuse the last valid result until specimen replacement or a successful new edit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The editor owns one last valid Ready result and latest findings; replacing the editor releases them.

 */
export class HumanCurveDesignInspectionState {
  private identityKey: string;
  private source: "current-skin" | "curve-design" = "current-skin";
  private design: Inspect.Ready | null = null;
  private findings: readonly Inspect.Finding[] = [];
  /** Start with existing skin and no generated separate design. */
  public constructor(identityKey: string) {
    this.identityKey = identityKey;
  }
  /** Invalidate the cached design when the supplied specimen key changes.
   *
   * @evidence contracts/common.md#principled-implementation Compares the supplied key and clears Ready/findings/source only when it differs.
   * @evidence contracts/common.md#clear-and-simple-design Specimen cache invalidation is separate from selecting a display source or generating a design.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An equal key is only this method's no-reset condition, not proof that arbitrary foreign Human objects are equivalent.
   * @evidence contracts/common.md#meaningful-documentation States the changed-key reset and same-key no-op, including return to current-skin.
   * @evidence contracts/performance.md#efficient-algorithms Performs one string comparison and fixed assignments without scanning curves.
   * @evidence contracts/performance.md#reuse-equivalent-work Preserves the current cached result for the same key; a changed key discards it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Drops references to the previous Ready and findings; this state owns no GPU object or listener.
   */
  public replaceHuman(identityKey: string): void {
    if (this.identityKey === identityKey) return;
    this.identityKey = identityKey;
    this.design = null;
    this.findings = [];
    this.source = "current-skin";
  }
  /** Choose the typed construction source without discarding the last valid design.
   *
   * @evidence contracts/common.md#principled-implementation Assigns the current-skin or curve-design selector supplied by the ordinary admitted page controls.
   * @evidence contracts/common.md#clear-and-simple-design Source selection changes display intent; update remains the owner of generation results.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fabricate a Ready result or claim that selected design generated the existing skin.
   * @evidence contracts/common.md#meaningful-documentation States the closed source choices and that identity and cached design remain unchanged.
   * @evidence contracts/performance.md#efficient-algorithms Changes one scalar field without traversing design points.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the cached Ready when toggling between the two sources.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Adds no retained object or event handle beyond the existing state.
   */
  public select(source: "current-skin" | "curve-design"): void {
    this.source = source;
  }
  /** Accept a successful design result or retain the last valid result with new findings.
   *
   * @evidence contracts/common.md#principled-implementation The ready discriminator selects replacement of the actual Ready; every failure status updates findings only.
   * @evidence contracts/common.md#clear-and-simple-design Result caching is separate from the Human producer and from scene resource allocation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused measurement edit does not invent controls, replace identity or silently call a different producer.
   * @evidence contracts/common.md#meaningful-documentation Explains replacement on success and last-valid retention on failure.
   * @evidence contracts/performance.md#efficient-algorithms Stores supplied references in fixed work; generation and validation already occurred in the producer.
   * @evidence contracts/performance.md#reuse-equivalent-work Failed edits preserve the previous Ready; successful edits invalidate it with the supplied new result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one Ready and latest findings; replacing either releases the old reference for collection.
   */
  public update(result: Inspect.Result): void {
    if (result.status === "ready") {
      this.design = result;
      this.findings = [];
    } else this.findings = result.findings;
  }
  /** Clone the last valid physical measurement supplement for session persistence.
   *
   * @evidence contracts/common.md#principled-implementation Uses structuredClone on Ready.detailed, or returns null before any valid result.
   * @evidence contracts/common.md#clear-and-simple-design Persistence exposes named inputs without serializing exact operator Maps or display geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source frame, control vector or generated mesh is substituted for the physical supplement.
   * @evidence contracts/common.md#meaningful-documentation States null-before-ready and detached-copy ownership.
   * @evidence contracts/performance.md#efficient-algorithms Copy cost is proportional to the physical supplement, not the sampled curve point population.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns a fresh copy so caller edits cannot mutate the state's last valid measurements.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned document; this method retains no additional copy.
   */
  public savedDetailed(): Inspect.Ready["detailed"] | null {
    return structuredClone(this.design?.detailed ?? null);
  }
  /** Describe the actually cached design and its current display qualification.
   *
   * @evidence contracts/common.md#principled-implementation Counts actual cached net roles/qualifications, then returns source-qualified copied metadata with actual displayed representation.
   * @evidence contracts/common.md#clear-and-simple-design Capture provenance is a projection of inspection state; requested representation is added separately by the mounted editor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Role labels and the independent-surface flag do not claim skin generation, exterior approval or successful refused edits.
   * @evidence contracts/common.md#meaningful-documentation Documents actual epoch, rest mode, physical measurements, edit availability and owner qualifications.
   * @evidence contracts/performance.md#efficient-algorithms Scans cached nets/curves and copies the selected metadata; it does not reevaluate coefficients or sample geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the last valid Ready rather than regenerating it; each call copies metadata for its current comparison flag.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary count maps and qualification Set expire after copying; the caller owns the resulting metadata.
   */
  public metadata(
    compareExistingSurface: boolean = false,
  ): Record<string, unknown> {
    if (this.source === "current-skin")
      return {
        constructionSource: "current-skin",
        identityKey: this.identityKey,
      };
    const curveRoles: Record<string, number> = {};
    const controlRoles: Record<string, number> = {};
    const qualifications: Set<string> = new Set();
    const courses: Array<{
      part: string;
      side: "left" | "right" | null;
      name: string;
      role: string;
      qualification: string | null;
    }> = [];
    for (const net of this.design?.nets ?? []) {
      const role: string = net.cage.controlRole ?? "unspecified";
      controlRoles[role] = (controlRoles[role] ?? 0) + 1;
      for (const curve of net.curves) {
        const curveRole: string = curve.designRole ?? "unspecified";
        courses.push({
          part: net.part,
          side: net.side,
          name: curve.name,
          role: curveRole,
          qualification: curve.designQualification ?? null,
        });
        curveRoles[curveRole] = (curveRoles[curveRole] ?? 0) + 1;
        if (curve.designQualification !== undefined)
          qualifications.add(curve.designQualification);
      }
    }
    return structuredClone({
      constructionSource: "curve-design",
      identityKey: this.identityKey,
      designEpoch: this.design?.epoch ?? null,
      displayedPelvisRepresentation: this.design?.pelvisRepresentation ?? null,
      rest: this.design?.rest ?? null,
      displayedDetailed: this.design?.detailed ?? null,
      curveRoles,
      courses,
      controlRoles,
      designQualifications: [...qualifications],
      currentEditAvailable: this.design !== null && this.findings.length === 0,
      independentlyGeneratedSurface: compareExistingSurface,
      roleQualification: this.design?.roleQualification ?? null,
    });
  }
  /** Return selected nets with their label and independent existing-surface policy.
   *
   * @evidence contracts/common.md#principled-implementation Calls currentSkin only for current-skin; otherwise returns cached design nets or an empty unavailable design.
   * @evidence contracts/common.md#clear-and-simple-design The state supplies display facts while the page owns Three object creation, replacement and disposal.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A last-valid design after a refused edit is labeled as such, and comparison skin is explicitly independently generated.
   * @evidence contracts/common.md#meaningful-documentation States metre-valued borrowed nets, availability findings and hidden/existing-skin policy.
   * @evidence contracts/performance.md#efficient-algorithms Design selection projects cached arrays plus metadata scans; currentSkin cost belongs to its supplied callback.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the existing last-valid net references instead of copying or reevaluating their point buffers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record borrows net arrays; the state owns their cached Ready and the scene owns separately allocated draw objects.
   */
  public display(
    currentSkin: () => IAutoMovieHumanConstructionNet[],
    compareExistingSurface: boolean = false,
  ): {
    nets: IAutoMovieHumanConstructionNet[];
    label: string;
    surface: "existing-skin" | "hidden";
    findings: readonly Inspect.Finding[];
    metadata: Record<string, unknown>;
  } {
    if (this.source === "current-skin")
      return {
        nets: currentSkin(),
        label: "기존 피부 생성 구조선",
        surface: "existing-skin",
        findings: [],
        metadata: this.metadata(compareExistingSurface),
      };
    return {
      nets: this.design?.nets ?? [],
      label:
        this.design === null
          ? "곡선 설계 지원 미완료: 기존 인물 입력의 유효성과는 별개입니다"
          : this.findings.length !== 0
            ? "이전 유효 곡선 표시 중: 현재 수정값으로는 생성할 수 없습니다"
            : "중립 곡선: 함께 표시한 기존 피부는 별도로 생성된 형상입니다",
      surface: compareExistingSurface ? "existing-skin" : "hidden",
      findings: this.findings,
      metadata: this.metadata(compareExistingSurface),
    };
  }
}
/** Display facts consumed by the ordinary scene and capture owners. */
export namespace HumanCurveDesignInspectionState {
  /** Type the exact display record returned by the state method.
   *
   * @evidence contracts/common.md#principled-implementation ReturnType derives the display shape from display itself, keeping source and surface qualifications aligned.
   * @evidence contracts/common.md#clear-and-simple-design The namespace exposes a single display-consumer type without another runtime wrapper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries existing nets and findings rather than replacing them with fabricated geometry.
   * @evidence contracts/common.md#meaningful-documentation Documents metre-valued nets and metadata authority for scene and capture consumers.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type alias runs no bounds, cloning or drawing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased alias coordinates no cache or cross-request work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It owns no resource; the state and scene have the actual retention boundaries.
   */
  export type Display = ReturnType<HumanCurveDesignInspectionState["display"]>;
}
