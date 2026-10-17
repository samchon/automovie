import type { IAutoMovieHumanIdentity } from "../../../structures/IAutoMovieHumanIdentity";
import type { IAutoMovieFootIdentityBridge64 as I } from "./IAutoMovieFootIdentityBridge64";

/**
 * Resolve optional foot measurements into a complete scalar rest-form recipe.
 *
 * Heel breadth 0.27L is an uncalibrated caller convention. A prior secondary
 * research note attributed it to ANSUR-II, but its original heel-breadth table,
 * definition, protocol and pooling calculation have not been established.
 * Supply heelBreadthMm when that independent measurement is known; this default
 * neither estimates a population percentile nor establishes a biological norm.
 * Other defaults are geometric conventions: width weights distribute the available
 * ball band, toe length decrements preserve the available hallux projection, and
 * pad/arch/instep heights close the sparse construction without native calibration.
 *
 * Explicit overrides replace individual dimensions, not curve controls. Rejects
 * unknown fields, nonfinite values, invalid toe tuples and incompatible widths or
 * heights without modifying caller inputs. This is not biological range validation.
 */
export function resolveAutoMovieFootIndependent64(
  leg: IAutoMovieHumanIdentity.ILeg,
  overrides: Partial<I.Independent> = {},
  jointDefaults?: {
    /** Posterior heel reach from the actual current Foot joint, in millimetres. */
    heelBehindAnkleMm: number;

    /** Public foot length minus heel reach and actual Toes forward distance. */
    availableHalluxExtentMm: number;

    /** Actual shared Toes centre elevation above the explicit standing datum. */
    mtpCenterHeightMm: number;
  },
): I.Independent {
  const keys: Set<string> = new Set([
    "heelBreadthMm",
    "heelBehindAnkleMm",
    "heelPadHeightMm",
    "ballHeightMm",
    "instepHeightMm",
    "plantarArchHeightMm",
    "toeLengthMm",
    "toeBreadthMm",
    "toeThicknessMm",
    "toeRootRetractionMm",
    "toeSplayRad",
    "toePadHeightMm",
    "webGapMm",
  ]);
  for (const key of Object.keys(overrides))
    if (!keys.has(key))
      throw new Error("Unknown independent foot measurement: " + key);
  const L: number = leg.footLength;
  const B: number = leg.footBreadth;
  const gap: number = overrides.webGapMm ?? 0.015 * B;
  // Hallux-biased widths, 12% digit decrement and 3-degree rest-splay steps are
  // common blockout conventions, not measured toe-population coefficients.
  const weights: number[] = [0, 1, 2, 3, 4].map((i: number): number =>
    i === 0 ? 1.5 : 1 - 0.12 * (i - 1),
  );
  const sum: number = weights.reduce(
    (a: number, b: number): number => a + b,
    0,
  );
  const widths: I.Five = weights.map(
    (w: number): number => (w / sum) * (B - 4 * gap),
  ) as unknown as I.Five;
  const available: number = jointDefaults?.availableHalluxExtentMm ?? 0.26 * L;
  const value: I.Independent = {
    heelBreadthMm: 0.27 * L,
    heelBehindAnkleMm: jointDefaults?.heelBehindAnkleMm ?? 0.22 * L,
    heelPadHeightMm: 0.06 * L,
    ballHeightMm: Math.max(
      0.11 * L,
      (jointDefaults?.mtpCenterHeightMm ?? 0) +
        0.55 * Math.max(...widths) * 0.65,
    ),
    instepHeightMm: leg.navicularHeight + 0.12 * L,
    plantarArchHeightMm: 0.35 * leg.navicularHeight,
    toeLengthMm: [0, 1, 2, 3, 4].map(
      (i: number): number =>
        (available * (1 - 0.12 * i)) / Math.cos(((i - 1) * 3 * Math.PI) / 180),
    ) as unknown as I.Five,
    toeBreadthMm: widths,
    toeThicknessMm: widths.map(
      (w: number): number => 0.65 * w,
    ) as unknown as I.Five,
    toeRootRetractionMm: [0, 1, 2, 3, 4].map(
      (i: number): number => 0.02 * L * i,
    ) as unknown as I.Five,
    toeSplayRad: [0, 1, 2, 3, 4].map(
      (i: number): number => ((i - 1) * 3 * Math.PI) / 180,
    ) as unknown as I.Five,
    toePadHeightMm: 0.01 * L,
    webGapMm: gap,
    ...overrides,
  };
  for (const [name, v] of Object.entries(value)) {
    if (typeof v !== "number" && !Array.isArray(v))
      throw new Error(
        "A scalar or five physical toe measurements required: " + name,
      );
    const numbers: readonly number[] = typeof v === "number" ? [v] : v;
    if (numbers.some((x: number): boolean => !Number.isFinite(x)))
      throw new Error("Finite independent foot measurements required: " + name);
    if (Array.isArray(v) && v.length !== 5)
      throw new Error("Five independent toe measurements required: " + name);
  }
  if (
    !(
      L > 0 &&
      B > 4 * gap &&
      value.heelBehindAnkleMm > 0 &&
      value.heelBreadthMm > 0 &&
      value.heelBreadthMm < B &&
      value.instepHeightMm > value.ballHeightMm &&
      value.plantarArchHeightMm >= 0 &&
      value.heelPadHeightMm > 0 &&
      value.ballHeightMm > 0 &&
      value.toePadHeightMm >= 0 &&
      gap > 0
    )
  )
    throw new Error("Inconsistent positive foot measurements");
  for (let i: number = 0; i < 5; i++)
    if (
      !(
        value.toeLengthMm[i]! > 0 &&
        value.toeBreadthMm[i]! > 0 &&
        value.toeThicknessMm[i]! > 0 &&
        value.toeRootRetractionMm[i]! >= 0 &&
        Math.abs(value.toeSplayRad[i]!) < Math.PI / 4
      )
    )
      throw new Error(
        "Positive toe dimensions and less than 45-degree rest splay required",
      );
  if (
    value.toeBreadthMm.reduce((a: number, b: number): number => a + b, 0) +
      4 * gap >
    B + 1e-7
  )
    throw new Error(
      "Toe breadths and four web gaps must fit the metatarsal band",
    );
  return value;
}
