import {
  type IAutoMovieCurveAssembly64 as A,
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
  generateAutoMovieCurveAssembly64,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { validateAutoMovieHumanCurveSupplement } from "../measure/validateAutoMovieHumanCurveSupplement";
import type { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";
import type { IAutoMovieCurveRegion64 as R } from "./IAutoMovieCurveRegion64";
import { createAutoMovieHumanCurveFactories } from "./createAutoMovieHumanCurveFactories";
import { currentAnatomicalEdges64 } from "./currentAnatomicalEdges64";
import { inspectAutoMovieCurve64 } from "./inspectAutoMovieCurve64";
import { describeAutoMoviePelvisPantsCurve64 } from "./pelvis/pants/describeAutoMoviePelvisPantsCurve64";

/** Inspect a separate curve design from this Human's existing admitted specimen.
 * Design refusal leaves identity validity and the existing skin route unchanged.
 * Exact primitives and operators are authoritative; metres are display output.
 * The currently staged public pelvis may refuse a representation; that is a
 * curve-design support limit and never a declaration that the body is invalid.
 */
export function inspectAutoMovieHumanCurveDesign(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  detailed?: unknown;
  pelvisRepresentation?: "external-r6b" | "pants-r6";
}): inspectAutoMovieHumanCurveDesign.Result {
  const admission: ReturnType<typeof validateAutoMovieHumanCurveSupplement> =
    validateAutoMovieHumanCurveSupplement(props.detailed);
  if (!admission.success)
    return {
      status: admission.errors.some(
        (finding: validateAutoMovieHumanCurveSupplement.Finding): boolean =>
          finding.kind === "invalid",
      )
        ? "invalid-measurements"
        : "missing-measurements",
      identityValidity: "unchanged",
      findings: admission.errors,
    };
  let region: string = "measurement-lowering";
  try {
    const prepared: ReturnType<typeof createAutoMovieHumanCurveFactories> =
      createAutoMovieHumanCurveFactories({
        ...props,
        detailed: admission.data,
      });
    const factories: R.Factory[] = prepared.factories.map(
      (factory: R.Factory): R.Factory => ({
        region: factory.region,
        construct(
          context: AutoMovieCurveParentContext,
          upstream: ReadonlyMap<string, C.Boundary>,
        ): R.Result {
          region = factory.region;
          return factory.construct(context, upstream);
        },
      }),
    );
    const assembly: A.Output<R.Result> = generateAutoMovieCurveAssembly64({
      frames: prepared.frames,
      edges: currentAnatomicalEdges64,
      factories,
    });
    const nets: IAutoMovieHumanConstructionNet[] = [];
    for (const [owner, actual] of assembly.regions)
      for (const group of actual.groups)
        nets.push(
          inspectAutoMovieCurve64(
            group.part,
            group.side,
            group.primitives,
            owner === "pelvis" && props.pelvisRepresentation === "pants-r6"
              ? (
                  curve: C.Primitive,
                ): {
                  kind: IAutoMovieHumanConstructionNet.Kind;
                  designRole: NonNullable<
                    IAutoMovieHumanConstructionNet.ICurve["designRole"]
                  >;
                  designQualification: string;
                } => {
                  const description: ReturnType<
                    typeof describeAutoMoviePelvisPantsCurve64
                  > = describeAutoMoviePelvisPantsCurve64(curve);
                  return {
                    kind: description.kind,
                    designRole:
                      description.role === "semantic-guide" ||
                      description.role === "roof-course"
                        ? "guide"
                        : description.role === "exterior-complement"
                          ? "section"
                          : description.role,
                    designQualification: description.qualification,
                  };
                }
              : undefined,
          ),
        );
    const pelvisRepresentation: "external-r6b" | "pants-r6" =
      props.pelvisRepresentation ?? "external-r6b";
    // Inspection transports exact coefficient data, not the factories' private
    // callable continuous-field diagnostics or their retained closure graphs.
    // Assembly already consumed the actual objects for publication and binding.
    const regions: Map<string, R.Result> = new Map();
    for (const [owner, actual] of assembly.regions)
      regions.set(owner, {
        groups: actual.groups,
        boundaries: actual.boundaries,
      });
    return {
      status: "ready",
      identityValidity: "unchanged",
      epoch: "public-curve-design-maintained-" + pelvisRepresentation,
      pelvisRepresentation,
      rest: "neutralT",
      detailed: admission.data,
      exact: { regions, operators: assembly.operators },
      nets,
      independentExistingSkin: true,
      roleQualification:
        "Design roles distinguish known engineering construction and chart boundaries. Unspecified courses are not approved exterior contours; no existing skin is generated by these curves. Control polygons are emitted for cubic, polynomial and pure rational courses; independent-Y hybrid courses retain their exact coefficients without an invented common control polygon.",
    };
  } catch (cause: unknown) {
    return {
      status: "design-unavailable",
      identityValidity: "unchanged",
      findings: [
        {
          path: "$design." + region,
          kind: "unsupported-design",
          message: cause instanceof Error ? cause.message : String(cause),
        },
      ],
    };
  }
}
/** Scoped inspection results; none of the refusal variants changes identity admission. */
export namespace inspectAutoMovieHumanCurveDesign {
  /** One measurement or generation limitation for a viewer to report without replacing its last valid design.
   *
   * @author Samchon
   */
  export interface Finding {
    /** Physical-document field, or the regional generation stage that refused support. */
    path: string;

    /** Distinguishes absent data, malformed data and a currently unsupported combination. */
    kind: "missing" | "invalid" | "unsupported-design";

    /** Cause reported by admission or the actual regional generator. */
    message: string;
  }

  /** Generated design whose exact primitives and display nets describe the same rest specimen.
   *
   * @author Samchon
   */
  export interface Ready {
    /** Successful design generation; separate from visual or surface acceptance. */
    status: "ready";

    /** Curve generation never grants or withdraws biological identity admission. */
    identityValidity: "unchanged";

    /** Representation and consumer epoch carried into capture provenance. */
    epoch: string;

    /** Actual pelvis provider used by this generation; not inferred from a saved caption. */
    pelvisRepresentation: "external-r6b" | "pants-r6";

    /** Generated rest chart; this output does not follow an arbitrary current skin pose. */
    rest: "neutralT";

    /** Admitted complete physical document used by this exact generation. */
    detailed: import("../structures/IAutoMovieHumanCurveSupplement").IAutoMovieHumanCurveSupplement;

    /** Snapshots of actual binary64 primitives and published shared operator fields in millimetres; copied operators are not live context binding tokens. */
    exact: Pick<A.Output<R.Result>, "regions" | "operators">;

    /** Sampled construction display in metres, derived from the exact primitives. */
    nets: IAutoMovieHumanConstructionNet[];

    /** Existing skin is generated independently and is never claimed to be lofted from this design. */
    independentExistingSkin: true;

    /** Explicit limits of the regional display-role classification. */
    roleQualification: string;
  }

  /** Design success or an explicit, non-destructive refusal with its findings. */
  export type Result = Ready | Refused;

  /** A failed design edit, independent of the Human instance's admitted identity.
   *
   * @author Samchon
   */
  export interface Refused {
    /** Whether the document is incomplete, malformed, or unsupported by a regional representation. */
    status:
      | "invalid-measurements"
      | "missing-measurements"
      | "design-unavailable";

    /** Biological identity admission is never changed by this failure. */
    identityValidity: "unchanged";

    /** All causes available from this admission or the first refusing generator. */
    findings: readonly Finding[];
  }
}
