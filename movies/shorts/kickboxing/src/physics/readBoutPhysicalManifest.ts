import { validatePhysicalProfile } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { BoutFormulaResponse } from "../motion/reactions/BoutFormulaResponse";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";

/** Admit the movie archive's mode, numerical freshness and declared loading budget before fetching binary bytes. This pure product boundary is shared by real loading and unit validation; no network substitute or test-only path is supplied. */
export function readBoutPhysicalManifest(
  value: unknown,
  sourceIdentity: string,
): readBoutPhysicalManifest.IManifest {
  if (!value || typeof value !== "object")
    throw new Error("Bout physics manifest must be an object");
  const manifest: readBoutPhysicalManifest.IManifest =
    value as readBoutPhysicalManifest.IManifest;
  if (manifest.mode !== "simulated" && manifest.mode !== "kinematic")
    throw new Error(
      "Bout physics manifest requires an explicit simulated or kinematic mode",
    );
  if (manifest.stale || manifest.sourceIdentity !== sourceIdentity)
    throw new Error(
      "Bout physics is stale: regenerate the archive from current numerical source",
    );
  if (
    !Number.isSafeInteger(manifest.bytes) ||
    manifest.bytes <= 0 ||
    manifest.bytes > 536870912 ||
    !Number.isFinite(manifest.startSeconds) ||
    manifest.startSeconds < 0 ||
    !Number.isFinite(manifest.duration) ||
    manifest.duration <= 0 ||
    !Number.isInteger(manifest.duration * Settings.rate) ||
    manifest.startSeconds + manifest.duration > 180 ||
    manifest.rate !== Settings.rate
  )
    throw new Error("Bout physics manifest exceeds its declared budget");
  if (
    typeof manifest.identity !== "string" ||
    !/^sha256:[a-f0-9]{64}$/.test(manifest.identity)
  )
    throw new Error("Invalid bout physics input identity");
  for (const body of ["a", "b", "referee"] as const) {
    const errors: string[] = validatePhysicalProfile(manifest.profiles?.[body]);
    if (errors.length)
      throw new Error(
        `Invalid bout physics profile ${body}: ${errors.join(", ")}`,
      );
  }
  const formulaResponses: BoutFormulaResponse.IContact[] =
    BoutFormulaResponse.admit(
      manifest.formulaResponses === undefined ? [] : manifest.formulaResponses,
    );
  if (manifest.mode === "simulated" && formulaResponses.length)
    throw new Error("Native bout cannot load formula body responses");
  if (
    formulaResponses.some(
      (contact: BoutFormulaResponse.IContact): boolean =>
        contact.seconds > manifest.startSeconds + manifest.duration,
    )
  )
    throw new Error(
      "Formula response lies outside the declared archive history",
    );
  return { ...manifest, formulaResponses };
}

/** Declared archive metadata, independent from binary decoding or available host controls. */
export namespace readBoutPhysicalManifest {
  /** Current-source numerical input and an explicitly bounded physical/geometric mode. */
  export interface IManifest {
    /** Digest enforced again by the binary reader. */ identity: string;
    /** Numerical source closure enforced by this movie. */ sourceIdentity: string;
    /** Explicit cache provenance. */ mode: "simulated" | "kinematic";
    /** Geometric response prefix used before target fitting, including carry-in before a bounded archive's start. */
    formulaResponses?: BoutFormulaResponse.IContact[];
    /** Marked historical bytes must be regenerated. */ stale?: boolean;
    /** Absolute first film second. */ startSeconds: number;
    /** Positive cache duration in seconds. */ duration: number;
    /** Fixed film cache rate in Hz. */ rate: number;
    /** Complete binary byte length. */ bytes: number;
    /** Exact provider descriptions used by the producer. */ profiles: Record<
      "a" | "b" | "referee",
      P
    >;
  }
}
