import type { LabSettings } from "./LabSettings";

/**
 * Existing Viewer transport boundary shared by independent module and overlap cases.
 * @evidence contracts/common.md#implementation-and-ownership The Viewer owns actor objects and transport while each case owns its deterministic evaluation and explicit refusal. This common shape adds no timeline framework or admission policy.
 * @evidence contracts/common.md#authoring-interface Seconds are closed local display time. inspect returns detached actual evidence; an admissionError means the case must not replace the previous loaded selection.
 */
export interface LabPlayable {
  /** Requested reproducible module inputs. */ readonly settings: LabSettings;
  /** Complete display interval in seconds. */ readonly duration: number;
  /** Constructor refusal, distinct from a healthy Viewer. */ readonly admissionError:
    | string
    | null;
  /**
   * Evaluate the same applied state at arbitrary local time.
   *
   * @evidence contracts/common.md#implementation-and-ownership Each case samples its fixed action definitions and applies both actual actors; a failed physical fit restores the committed display state and retains separate diagnostics.
   * @evidence contracts/common.md#authoring-interface Supply finite seconds within [0,duration]. Play and seek use this same entry; refusals throw for the host to pause and display.
   */
  evaluate(seconds: number): void;

  /**
   * Read detached actual diagnostics and failure evidence.
   *
   * @evidence contracts/common.md#implementation-and-ownership Each case copies its retained requests, contact results and displayed actor observations, keeping failed evaluation evidence separate from the committed state.
   * @evidence contracts/common.md#authoring-interface The case-specific object is a diagnostic snapshot. Consumers must inspect its stated sampling and physical limits; it does not establish watched playback or force simulation.
   */
  inspect(): object;

  /**
   * Format the currently committed state.
   *
   * @evidence contracts/common.md#implementation-and-ownership Formats the case's current action clock, contact and support outcomes for the existing Viewer status element without evaluating another pose.
   * @evidence contracts/common.md#authoring-interface Returns display text for the loaded case; detailed measurements and retained failures belong to inspect().
   */
  summary(): string;

  /**
   * Retire case resources while preserving borrowed actors.
   *
   * @evidence contracts/common.md#implementation-and-ownership The case retires locally owned actor resources and retained work; the Viewer retains actors borrowed across selections and owns its transport, controls and renderer.
   * @evidence contracts/common.md#authoring-interface Call when replacing or retiring the case. This terminal cleanup does not close a server or dispose the host's shared scene.
   */
  dispose(): void;
}
