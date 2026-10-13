import { IAutoMovieSoftAnalysis, IAutoMovieSoftBodyDomain, IAutoMovieSoftBodyState, IAutoMovieSoftFurnishing, AutoMovieSoftAnalysisStatus, IAutoMovieValidation, IAutoMovieSoftNamedState } from "@automovie/interface";
import { IAutoMovieSoftFurnishingFrame } from "./IAutoMovieSoftFurnishingFrame";
import { simulateSoftBody } from "./simulateSoftBody";
import { softBodyStepAt } from "./softBodyStepAt";
import { softBodySurfaceGeometry } from "./softBodySurfaceGeometry";
import { validateSoftBodyDomain } from "./validateSoftBodyDomain";
/** Lower one typed furnishing into a cloth surface and explicit rest/solved/not-run/unsupported status. Domain/reference/state/budget failures are reported before solve; unexpected numeric integration failures can still throw. No production/viewer currently calls this public lowering API.
 *
 * @evidence contracts/common.md#principled-implementation Domain admission, state membership and time/budget checks precede canonical rest or fixed-step replay, then the same solved particle field supplies surface geometry. Self-collision returns unsupported rest geometry rather than being presented as solved.
 * @evidence contracts/common.md#clear-and-simple-design Lowering owns analysis status and joins shared validation, quantization, simulation and surface owners; the result does not install a renderer or live boundary host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested unsupported self-collision is named, not hidden behind still geometry; numerical solver failures are not swallowed or represented as successful frames.
 * @evidence contracts/common.md#meaningful-documentation States status applicability, surface source, failure propagation and unwired host reach.
 * @evidence contracts/performance.md#efficient-algorithms Validation and mesh derivation scan P particles; simulated mode adds O(P*K*(I+C)) replay, while rest mode still allocates anchored configuration and surface arrays. Storage includes O(P) result and temporary geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work The selected state and computed particle field serve one surface derivation; no prior frame is reused under mutable domain/state/time assumptions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh mesh/state arrays and analysis rows transfer to the caller; failed admission retains no geometry, and thrown simulation retains no playback cursor or render task.
 *
 * @author Samchon
 */
export const lowerSoftFurnishing: (props: { furnishing: IAutoMovieSoftFurnishing; domain: IAutoMovieSoftBodyDomain; time: number; }) => IAutoMovieSoftFurnishingFrame = (props: {
  furnishing: IAutoMovieSoftFurnishing;
  domain: IAutoMovieSoftBodyDomain;
  time: number;
}): IAutoMovieSoftFurnishingFrame => {
  const { furnishing, domain }: typeof props = props;
  /** Create the explicit computation status and unsupported-case report for this furnishing domain. */
  const analysis: (status: AutoMovieSoftAnalysisStatus, reason: string | null, unsupported?: string[]) => IAutoMovieSoftAnalysis = (
    status: IAutoMovieSoftAnalysis["status"],
    reason: string | null,
    unsupported: string[] = [],
  ): IAutoMovieSoftAnalysis => ({
    domain: domain.id,
    kind: "soft-body",
    status,
    reason,
    unsupported,
  });
  const frame: (report: IAutoMovieSoftAnalysis, state: IAutoMovieSoftBodyState | null) => IAutoMovieSoftFurnishingFrame = (
    report: IAutoMovieSoftAnalysis,
    state: IAutoMovieSoftBodyState | null,
  ): IAutoMovieSoftFurnishingFrame => ({
    furnishing: furnishing.id,
    analysis: report,
    state,
    surface: state === null ? null : softBodySurfaceGeometry({ domain, state }),
  });

  // The two records arrive separately, so the pairing is checked rather than
  // trusted: solving one panel under another furnishing's identity would
  // produce a frame that looks solved and answers for nothing that was bound.
  if (furnishing.domain !== domain.id)
    return frame(
      analysis(
        "not-run",
        `soft furnishing "${furnishing.id}" draws soft body "${furnishing.domain}", not the supplied "${domain.id}"`,
      ),
      null,
    );
  const validation: IAutoMovieValidation = validateSoftBodyDomain({ domain });
  if (validation.success === false)
    return frame(
      analysis(
        "not-run",
        `soft body "${domain.id}" did not validate, so no state was computed`,
      ),
      null,
    );
  if (
    furnishing.state !== null &&
    domain.states.every((state: IAutoMovieSoftNamedState): boolean => state.id !== furnishing.state)
  )
    return frame(
      analysis(
        "not-run",
        `soft body "${domain.id}" does not declare a named state "${furnishing.state}"`,
      ),
      null,
    );
  if (domain.selfCollision === true)
    return frame(
      analysis(
        "unsupported",
        `soft body "${domain.id}" asks for cloth-on-cloth contact, which this solver tier does not provide; the rest configuration is returned and no solve is claimed`,
        ["self-collision"],
      ),
      simulateSoftBody(domain, 0, furnishing.state),
    );
  if (furnishing.mode === "rest")
    return frame(
      analysis("rest", null),
      simulateSoftBody(domain, 0, furnishing.state),
    );
  // Every remaining mode is checked by name rather than assumed. Falling
  // through to a solve would let a mode nobody recognises claim to have been
  // simulated, which is the same silent success this whole record exists to
  // refuse — and the one an `else` is cheapest to write.
  if (furnishing.mode !== "simulated")
    return frame(
      analysis(
        "not-run",
        `soft furnishing "${furnishing.id}" asks for mode "${String(furnishing.mode)}", which is not a mode this tier evaluates`,
      ),
      null,
    );
  const step: number | null = softBodyStepAt(domain, props.time);
  if (step === null)
    return frame(
      analysis(
        "not-run",
        `soft furnishing "${furnishing.id}" was asked for a shot second that is not a real number`,
      ),
      null,
    );
  if (step > domain.solver.maxSteps)
    return frame(
      analysis(
        "not-run",
        `shot second ${props.time} lands on step ${step} of soft body "${domain.id}", past the ${domain.solver.maxSteps} steps its own budget declares`,
      ),
      null,
    );
  return frame(
    analysis("solved", null),
    simulateSoftBody(domain, step, furnishing.state),
  );
};
