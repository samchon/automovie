import type { createForeheadContact } from "./createForeheadContact";

/** Hypothetical deeper probes retain their admission without becoming film poses. */
type ContactSample = ReturnType<ReturnType<typeof createForeheadContact>> & { supportAdmitted?: boolean; supportErrors?: number[]; armErrors?: number[] };

/**
 * Stop the shared bend at a measured original-surface contact course.
 *
 * @evidence contracts/common.md#implementation-and-ownership Samples the complete declared0–1 bend course at eight intervals, retains every result, then bisects its first exterior-to2mm bracket sixteen times. Each supplied sample must place both actual public-fitted actors. The measured bend extent supplies the shared stop/recovery; time derives from the original39–42s eased approach. No contact, skin or support is fabricated when no valid bracket exists.
 * @evidence contracts/common.md#authoring-interface sample is an asynchronous actual-geometry observer, not a body proxy. Returns the contact time/progress and complete bounded measurement trace, or refuses with that trace. The event authoring tolerance remains2mm; this is not global collision, balance or continuous-time proof.
 */
export async function resolveSharedContact(sample: (progress: number) => Promise<ContactSample>): Promise<{
  time: number; progress: number; measurements: { progress: number; reading: ContactSample }[];
}> {
  const measurements: { progress: number; reading: ContactSample }[] = [];

  /** Retain each actual observation once, including a rejected candidate. */
  async function at(progress: number): Promise<ContactSample> {
    const reading: ContactSample = await sample(progress);
    if (![reading.gap, reading.distance, reading.alignment].every(Number.isFinite)) throw new Error("Nonfinite actual forehead course");
    measurements.push({ progress, reading }); return reading;
  }
  let previous: ReturnType<typeof measurements.at>;
  let bracket: [number, number] | undefined;
  for (let index: number = 0; index <= 8; index++) {
    const progress: number = index / 8;
    const reading: Awaited<ReturnType<typeof at>> = await at(progress);
    if (bracket === undefined && previous !== undefined && previous.reading.gap > 0.002 && reading.gap <= 0.002) bracket = [previous.progress, progress];
    previous = { progress, reading };
  }
  if (bracket === undefined) throw new Error(`The actual shared forehead course has no exterior contact bracket: ${JSON.stringify(measurements)}`);
  let [low, high]: [number, number] = bracket;
  for (let index: number = 0; index < 16; index++) { const middle: number = (low + high) / 2; if ((await at(middle)).gap > 0.002) low = middle; else high = middle; }
  const reading: Awaited<ReturnType<typeof at>> = await at(high);
  if (!reading.admitted || reading.supportAdmitted === false)
    throw new Error(`Actual shared contact is not a gentle forehead brush: ${JSON.stringify({ progress: high, reading, measurements })}`);
  let first: number = 0; let last: number = 1;
  for (let index: number = 0; index < 32; index++) { const middle: number = (first + last) / 2; if (middle * middle * (3 - 2 * middle) < high) first = middle; else last = middle; }
  return { time: 39 + 3 * (first + last) / 2, progress: high, measurements };
}
