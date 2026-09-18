import { IAutoMovieSoftAnalysis, IAutoMovieSoftBodyDomain, IAutoMovieSoftBodyState, IAutoMovieSoftFurnishing } from "@automovie/interface";
import { simulateSoftBody } from "./simulateSoftBody";
import { softBodyStepAt } from "./softBodyStepAt";
import { softBodySurfaceGeometry } from "./softBodySurface";
import { validateSoftBodyDomain } from "./validateSoftBodyDomain";
import { IAutoMovieSoftFurnishingFrame } from "./IAutoMovieSoftFurnishingFrame";

/**
 * Lower one bound furnishing to everything a renderer needs at a shot second,
 * beside an honest account of what was computed.
 *
 * The account is the point. Four outcomes are possible and each one is named:
 *
 * | Condition                                                       | Status        | Geometry                            |
 * | --------------------------------------------------------------- | ------------- | ----------------------------------- |
 * | the furnishing draws a domain other than the supplied one       | `not-run`     | none                                |
 * | the domain does not validate                                    | `not-run`     | none                                |
 * | the furnishing asks to hold a state the domain does not declare | `not-run`     | none                                |
 * | the domain asks for self-collision                              | `unsupported` | the rest configuration              |
 * | `mode` is `rest`                                                | `rest`        | the rest configuration              |
 * | `mode` is neither `rest` nor `simulated`                        | `not-run`     | none                                |
 * | the shot second is not a real number                            | `not-run`     | none                                |
 * | the shot second lands past the declared `maxSteps`              | `not-run`     | none                                |
 * | `mode` is `simulated`                                           | `solved`      | the fixed-step solve at that second |
 *
 * A panel that could not be simulated is never handed back as though it had
 * been. Returning the rest configuration under an `unsupported` status is the
 * whole difference between a frame a reviewer can act on and a still curtain
 * nobody knew was still because the solver gave up.
 *
 * Nothing here throws. This is the call a builder makes once per furnishing
 * per shot second, so a curtain whose declared step budget stops before the cut
 * does must come back reported rather than take the whole render down with it —
 * and that budget is the author's own declaration, which is exactly the kind of
 * refusal this record exists to carry.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Lowers the furnishing through the selected bounded tier and preserves refusals.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Produces state, surface, and status as one coherent interior result.
 * @author Samchon
 */
export const lowerSoftFurnishing = (props: {
  furnishing: IAutoMovieSoftFurnishing;
  domain: IAutoMovieSoftBodyDomain;
  time: number;
}): IAutoMovieSoftFurnishingFrame => {
  const { furnishing, domain } = props;
  const analysis = (
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
  const frame = (
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
  const validation = validateSoftBodyDomain({ domain });
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
    domain.states.every((state) => state.id !== furnishing.state)
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
  const step = softBodyStepAt(domain, props.time);
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
