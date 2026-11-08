import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftCapSource } from "./AutoMovieLoftCapSource";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftRelief } from "./AutoMovieLoftRelief";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/** Fresh world value and phase tangent; no station derivative is asserted. */
type Phase = { p: [number, number, number]; t: [number, number, number] };

/**
 * Actual original-cap value and independently available physical2 preparation.
 *
 * @evidence contracts/common.md#principled-implementation Retained original scalar and actual axis owners supply positive cap geometry; at a collapsed original tip only its actual Point0 is admitted.
 * @evidence contracts/common.md#clear-and-simple-design Separate value/phase and physical2 factories reuse existing scalar/native/world product owners without extending principal basis data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Cartesian Taylor, artificial dome, finite difference or missing pole2 is supplied; axis callback errors propagate unchanged.
 * @evidence contracts/common.md#meaningful-documentation Gives physical-mm/radian coordinates, immutable dependencies, actual collapsed-value behavior and separate derivative failure.
 * @evidence contracts/performance.md#efficient-algorithms Cold preparation validates O(K+N) ownership then original scalar lookups; native phase work follows the shared numeric/AD owners and relief count R.
 * @evidence contracts/performance.md#reuse-equivalent-work Caller-owned station closures reuse one native preparation and actual frame value or frame2 across phases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No new module cache exists; existing Point/Jet caches or held samplers own each returned plan and release it under their existing policies.
 */
export namespace AutoMovieLoftCapRead {
  /**
   * Prepare original cap world values/phase tangents, or null on regular rows.
   *
   * @evidence contracts/common.md#principled-implementation The actual original scalar values and actual axis.at define P=o+xU+zV; the true collapsed tip has constant phase value but no asserted physical station2.
   * @evidence contracts/common.md#clear-and-simple-design A caller-owned phase closure handles original cap values independently of Jet admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A tip is accepted only when all actual extents are zero and its actual frame origin equals the retained pole; nonzero relief at that tip fails rather than inventing a phase-dependent apex.
   * @evidence contracts/common.md#meaningful-documentation Null is ordinary-row absence; present invalid values throw the numeric admission error while callbacks and stale bindings retain their errors.
   * @evidence contracts/performance.md#efficient-algorithms One source/axis value reading and fixed native preparation precede each inverse and O(R) relief evaluation.
   * @evidence contracts/performance.md#reuse-equivalent-work All phases reuse scalar geometry and one frame; no physical axis.jet is requested.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the closure and fresh p/t vectors; it retains the immutable chain/frame until released.
   */
  export function phase(
    chain: IAutoMovieLoftChain,
    station: number,
  ): ((phi: number) => Phase) | null {
    const owner: AutoMovieLoftCapSource.ISource | null =
      AutoMovieLoftCapSource.at(chain, station);
    if (owner === null) return null;
    const inputs: AutoMovieLoftViewRead.IValues | string =
      AutoMovieLoftViewRead.values(chain.nativeSource!.data, station);
    if (typeof inputs === "string")
      throw new AutoMovieLoftAdmissionError(inputs);
    const frame: AutoMovieLoftFrame.IFrame = owner.axis.at(station);
    if (!finite(frame))
      throw new AutoMovieLoftAdmissionError(
        "The original cap axis has no finite frame value.",
      );
    const collapsed: boolean =
      station === owner.station &&
      inputs.extents.every((x: number): boolean => x === 0);
    if (
      station === owner.station &&
      (!collapsed ||
        frame.origin.some(
          (x: number, k: number): boolean => x !== owner.point[k],
        ))
    )
      throw new AutoMovieLoftAdmissionError(
        "The original cap tip differs from its actual collapsed source.",
      );
    const local: ReturnType<typeof AutoMovieLoftSectionNative.phase> | null =
      collapsed ? null : AutoMovieLoftSectionNative.phase(inputs);
    return (phi: number): Phase => {
      if (!Number.isFinite(phi))
        throw new AutoMovieLoftAdmissionError("A cap phase must be finite.");
      let p: [number, number, number];
      let t: [number, number, number];
      if (local === null) {
        p = [...owner.point];
        t = [0, 0, 0];
      } else {
        const at: ReturnType<typeof local> = local(phi);
        p = AutoMovieLoftFrame.place(frame, at.p[0], at.p[1]);
        t = [0, 1, 2].map(
          (k: number): number => at.t[0] * frame.u[k]! + at.t[1] * frame.v[k]!,
        ) as [number, number, number];
      }
      for (const relief of chain.reliefs ?? []) {
        const h: [number, number, number] = AutoMovieLoftRelief.height(
          relief,
          station,
          phi,
        );
        if (collapsed && h.some((x: number): boolean => x !== 0))
          throw new AutoMovieLoftAdmissionError(
            "A deformed pole has no retained collapsed cap value.",
          );
        for (let k: number = 0; k < 3; k++) {
          p[k]! += h[0] * relief.axis[k]!;
          t[k]! += h[2] * relief.axis[k]!;
        }
      }
      if (![...p, ...t].every(Number.isFinite))
        throw new AutoMovieLoftAdmissionError(
          "The original cap world value/phase is nonfinite.",
        );
      return { p, t };
    };
  }

  /**
   * Prepare original positive-cap local2 and actual frame2, independently of Point0.
   *
   * @evidence contracts/common.md#principled-implementation Original physical scalar2 and the same actual axis2 supply the existing LoftWorldJet product rule; truezero and unavailable physical derivatives remain inadmissible.
   * @evidence contracts/common.md#clear-and-simple-design Returns the exact station-plan fields already consumed by LoftJet, without another world formula or cache.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not infer frame2 from finite axis values or continue the regular endpoint Taylor map.
   * @evidence contracts/common.md#meaningful-documentation Null means ordinary rows; numeric unavailability throws AdmissionError and actual callback/getter errors propagate.
   * @evidence contracts/performance.md#efficient-algorithms O(K+N) ownership checks, original scalar lookups, one actual axis2 call and fixed native AD preparation precede phase queries.
   * @evidence contracts/performance.md#reuse-equivalent-work Native and frame plans are returned together for the existing eight-station Jet cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The retaining caller owns the native closure and three copied frame rows; no module cache or registry is acquired.
   */
  export function jet(
    chain: IAutoMovieLoftChain,
    station: number,
  ): {
    native: ReturnType<typeof AutoMovieLoftSectionNative.jet>;
    f: number[][];
  } | null {
    const owner: AutoMovieLoftCapSource.ISource | null =
      AutoMovieLoftCapSource.at(chain, station);
    if (owner === null) return null;
    if (station === owner.station)
      throw new AutoMovieLoftAdmissionError(
        "The collapsed original pole has no regular physical2 chart.",
      );
    const inputs: AutoMovieLoftViewRead.IJets | string =
      AutoMovieLoftViewRead.jets(chain.nativeSource!.data, station);
    if (typeof inputs === "string")
      throw new AutoMovieLoftAdmissionError(inputs);
    if (typeof owner.axis.jet !== "function")
      throw new AutoMovieLoftAdmissionError(
        "The original cap axis has no physical2 owner.",
      );
    const frame: ReturnType<NonNullable<typeof owner.axis.jet>> =
      owner.axis.jet(station);
    if (
      frame === null ||
      ![frame.value, frame.first, frame.second].every(finite)
    )
      throw new AutoMovieLoftAdmissionError(
        "The original cap axis has no finite physical2 at this station.",
      );
    return {
      native: AutoMovieLoftSectionNative.jet(inputs),
      f: [frame.value, frame.first, frame.second].map(
        (value: AutoMovieLoftFrame.IFrame): number[] => [
          ...value.origin,
          ...value.u,
          ...value.v,
        ],
      ),
    };
  }
}

/** Finite returned frame data is distinct from a callback throwing its own error. */
function finite(frame: AutoMovieLoftFrame.IFrame): boolean {
  return [frame.origin, frame.u, frame.v].every(
    (row: number[]): boolean => row.length === 3 && row.every(Number.isFinite),
  );
}
