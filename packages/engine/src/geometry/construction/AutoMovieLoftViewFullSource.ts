import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import type { AutoMovieLoftJet } from "./AutoMovieLoftJet";
import { AutoMovieLoftReliefCompose } from "./AutoMovieLoftReliefCompose";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";
import { AutoMovieLoftViewWorldJet } from "./AutoMovieLoftViewWorldJet";
import type { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** A fresh world coordinate or derivative vector. */
type V = AutoMovieSolidVector.Vec3;

/** One immutable station's Point0 preparation, without physical derivatives. */
interface Station {
  /** Actual physical station in mm. */
  s: number;
  /** Original axis value at that station. */
  frame: AutoMovieLoftFrame.IFrame;
  /** A declared collapsed pole has no polar point reader. */
  local: ReturnType<typeof AutoMovieLoftSectionNative.point> | null;
}

/**
 * Original native field values and physical2 before any loft or mesh.
 * Relief/shift composition is shared with chain consumers. This reader owns
 * no emitted rows, fitted source, legacy lift or geometry process.
 *
 * @evidence contracts/development/design.md#principled-representation One immutable scalar/axis/feature tuple owns Point0 and independently available physical2 in station mm and phase radians.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The factory exposes only the domain and two capabilities consumed by original-root construction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fake chain, fit, source-profile substitute or missing derivative is introduced; unavailable orders remain explicit admission failures.
 * @evidence contracts/development/common.md#meaningful-documentation States direct source ownership, independent capabilities and actual feature/shift scope.
 */
export namespace AutoMovieLoftViewFullSource {
  /**
   * Complete original scalar controls, their actual axis and immutable features.
   *
   * @evidence contracts/development/design.md#principled-representation Retains the existing direct-source input and actual axis/relief owners without display density or realized geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every member is read by preparation or the two native queries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original descriptor types; unsupported girth ownership is refused rather than lofted.
   * @evidence contracts/development/common.md#meaningful-documentation Source stations and feature shifts use mm; phase/turn use radians; borrowed inputs remain immutable for reader lifetime.
   */
  export type IInput = AutoMovieLoftViewSource.IInput &
    Pick<IAutoMovieViewPart, "axis" | "reliefs">;

  /**
   * Two independent full-native capabilities on one inclusive original domain.
   *
   * @evidence contracts/development/design.md#principled-representation Point0 does not require physical2; a collapsed pole may have a value while its regular physical2 chart is unavailable.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Root construction reads domain, point and jet; no surface orientation or topology certificate is asserted.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numeric unavailability throws AdmissionError; actual axis callback errors retain their identity.
   * @evidence contracts/development/common.md#meaningful-documentation Gives domain, fresh-vector ownership and the distinction between value and derivative admission.
   */
  export interface IReader {
    /** Inclusive physical station bounds, mm. */
    readonly domain: readonly [number, number];
    /**
     * Fresh full world Point0, mm; no axis.jet is requested.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Actual native scalar values and axis.at supply the bare point; the shared relief owner adds the original features including shift.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure A value capability remains separate from physical2 preparation.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A declared collapsed pole has its actual axis-origin value only while its features vanish; no derivative or substitute geometry is invented.
     * @evidence contracts/development/implementation.md#efficient-algorithms Point0 uses one bounded native station plan plus existing feature evaluation costs.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The reader's exact-station cache shares only immutable scalar/frame value preparation.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Every result owns its vector and the retaining reader owns at most eight station plans.
     * @evidence contracts/development/common.md#meaningful-documentation Gives mm/radian coordinates, independent capability and fresh output ownership.
     */
    point(s: number, t: number): V;
    /**
     * Actual world total2: p mm, u per mm, v per radian and corresponding second orders.
     *
     * @evidence contracts/development/implementation.md#principled-implementation ViewWorldJet owns actual local/frame product rules and the shared relief owner adds the original height/turn/shift total2.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct evaluation shares source preparation without acquiring a chain.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent axis2, true pole, failed source or nonfinite composition is refused rather than replaced by zero or Point0.
     * @evidence contracts/development/implementation.md#efficient-algorithms Each query retains existing scalar/axis/native preparation and O(R) bounded-support feature costs.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The source's immutable scalar preparation is shared; returned numeric jets are fresh.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Query temporaries escape only as the six returned vectors; no physical2 query cache is added.
     * @evidence contracts/development/common.md#meaningful-documentation States station-mm/phase-radian derivative units, error behavior and output ownership.
     */
    jet(s: number, t: number): IAutoMovieSolidSurface.IJet;
  }

  /**
   * Prepare one actual direct field and its bounded caller-owned value cache.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses ViewSource/Read, Native Point0, Frame.place and ViewWorldJet, then delegates feature addition to the shared composition owner. Declared pole values and regular physical2 admission stay distinct.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor owns the coherent source/axis/features tuple and inclusive-domain checks; separate value and jet methods preserve capability independence.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No chain, numerical derivative, cap replacement, implicit solve or failed-source fallback exists; original axis callback exceptions propagate and all unavailable numeric orders remain admission failures.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scalar preparation is linear in the source controls; eight Point0 stations retain native section preparation, while each physical2 query delegates its original scalar/axis costs to ViewWorldJet.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact station keys reuse value preparation only while the borrowed source/axis/features remain immutable; physical2 is never acquired by a Point0 request.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader owns one scalar preparation and at most eight native Point0 station plans; dropping it releases all borrowed references, with no module cache or process.
   * @evidence contracts/development/common.md#meaningful-documentation Names supported direct fullness, units, failure behavior, immutable lifetime and bounded value preparation.
   */
  export function create(input: IInput): IReader {
    const prepared: AutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(input);
    if (prepared === null || prepared.source === null)
      throw new AutoMovieLoftAdmissionError(
        "Full native reader needs an admitted direct scalar source: " +
          JSON.stringify(prepared?.diagnostics ?? []),
      );
    const source: AutoMovieLoftViewSource.ISource = prepared.source;
    const domain: readonly [number, number] = [
      source.domain[0],
      source.domain[1],
    ];
    const axis: IInput["axis"] = input.axis;
    const reliefs: NonNullable<IInput["reliefs"]> = [...(input.reliefs ?? [])];
    const stations: Station[] = [];

    /** Each capability admits the actual owned physical domain before reading. */
    const admit = (s: number, t: number): void => {
      if (
        !Number.isFinite(s) ||
        !Number.isFinite(t) ||
        s < domain[0] ||
        s > domain[1]
      )
        throw new AutoMovieLoftAdmissionError(
          "Full native query is outside its actual source domain.",
        );
    };

    /** Value preparation requests no physical-station derivatives. */
    const station = (s: number): Station => {
      const prior: Station | undefined = stations.find(
        (entry: Station): boolean => entry.s === s,
      );
      if (prior !== undefined) return prior;
      const values: AutoMovieLoftViewRead.IValues | string =
        AutoMovieLoftViewRead.values(source, s);
      if (typeof values === "string")
        throw new AutoMovieLoftAdmissionError(values);
      const frame: AutoMovieLoftFrame.IFrame = axis.at(s);
      if (
        frame === null ||
        typeof frame !== "object" ||
        ![frame.origin, frame.u, frame.v].every(
          (row: V): boolean =>
            Array.isArray(row) &&
            row.length === 3 &&
            row.every(Number.isFinite),
        )
      )
        throw new AutoMovieLoftAdmissionError(
          "The original native axis has no finite frame value.",
        );
      const pole: boolean = source.caps.some(
        (cap: AutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
          cap.pole === s,
      );
      if (
        pole &&
        !values.extents.every((extent: number): boolean => extent === 0)
      )
        throw new AutoMovieLoftAdmissionError(
          "The original cap tip differs from its actual collapsed source.",
        );
      const next: Station = {
        s,
        frame,
        local: pole ? null : AutoMovieLoftSectionNative.point(values),
      };
      stations.unshift(next);
      if (stations.length > 8) stations.pop();
      return next;
    };

    return {
      domain,
      point: (s: number, t: number): V => {
        admit(s, t);
        const at: Station = station(s);
        const local: [number, number] | null =
          at.local === null ? null : at.local(t);
        const p: V =
          local === null
            ? [...at.frame.origin]
            : AutoMovieLoftFrame.place(at.frame, local[0], local[1]);
        AutoMovieLoftReliefCompose.point(p, reliefs, s, t, at.local === null);
        if (!p.every(Number.isFinite))
          throw new AutoMovieLoftAdmissionError(
            "The full native Point0 is nonfinite.",
          );
        return p;
      },
      jet: (s: number, t: number): IAutoMovieSolidSurface.IJet => {
        admit(s, t);
        if (
          source.caps.some(
            (cap: AutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
              cap.pole === s,
          )
        )
          throw new AutoMovieLoftAdmissionError(
            "The collapsed original pole has no regular physical2 chart.",
          );
        const bare: IAutoMovieSolidSurface.IJet | string =
          AutoMovieLoftViewWorldJet(source, axis, s, t);
        if (typeof bare === "string")
          throw new AutoMovieLoftAdmissionError(bare);
        const full: AutoMovieLoftJet.IJet = {
          p: bare.p,
          s: bare.u,
          t: bare.v,
          ss: bare.uu,
          st: bare.uv,
          tt: bare.vv,
        };
        AutoMovieLoftReliefCompose.jet(full, reliefs, s, t);
        if (
          !Object.values(full).every((row: V): boolean =>
            row.every(Number.isFinite),
          )
        )
          throw new AutoMovieLoftAdmissionError(
            "The complete frame/local/lift/relief total2 is nonfinite.",
          );
        return {
          p: full.p,
          u: full.s,
          v: full.t,
          uu: full.ss,
          uv: full.st,
          vv: full.tt,
        };
      },
    };
  }
}
