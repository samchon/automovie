import type { IFaceSkinReading } from "./readFaceSkinReadings";
import {
  type IColourSampleSummary,
  summarizeColourSample,
} from "./summarizeColourSample";

/** One ethnic group's summaries: every subject (`all`) and each recorded sex. */
export type FaceSkinNormGroup = Record<string, IColourSampleSummary>;

/** The body location code of the cheek, the reference site. */
export const FACE_SKIN_CHEEK = 2;

const mean = (
  values: readonly (readonly [number, number, number])[],
): [number, number, number] =>
  [0, 1, 2].map(
    (channel) =>
      values.reduce((sum, value) => sum + value[channel]!, 0) / values.length,
  ) as [number, number, number];

/**
 * A subject's readings of every site, keyed by the subject and held with its
 * group. A subject is one (ethnic group, sex, subject) triple, so a subject
 * measured twice counts once.
 */
function bySubject(
  readings: readonly IFaceSkinReading[],
): Map<
  string,
  {
    ethnicity: string;
    sex: string | null;
    sites: Map<number, [number, number, number][]>;
  }
> {
  const subjects = new Map<
    string,
    {
      ethnicity: string;
      sex: string | null;
      sites: Map<number, [number, number, number][]>;
    }
  >();
  for (const reading of readings) {
    const key = JSON.stringify([
      reading.ethnicity,
      reading.sex,
      reading.subject,
    ]);
    const subject =
      subjects.get(key) ??
      { ethnicity: reading.ethnicity, sex: reading.sex, sites: new Map() };
    subjects.set(key, subject);
    subject.sites.set(reading.site, [
      ...(subject.sites.get(reading.site) ?? []),
      reading.rgb,
    ]);
  }
  return subjects;
}

const summarizeByKey = (
  groups: Map<string, [number, number, number][]>,
): FaceSkinNormGroup =>
  Object.fromEntries(
    [...groups.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, values]) => [key, summarizeColourSample(values)]),
  );

/**
 * Cheek albedo per ethnic group, overall and by sex, in linear sRGB.
 *
 * A subject's cheek readings are averaged first, so a subject measured twice
 * counts once, and each group reports the mean and sample deviation over its
 * subjects. A reading without a recorded sex counts in the group and in
 * neither sex. Pure.
 */
export function faceSkinAlbedoNorms(
  readings: readonly IFaceSkinReading[],
): Record<string, FaceSkinNormGroup> {
  const groups = new Map<string, Map<string, [number, number, number][]>>();
  for (const subject of bySubject(readings).values()) {
    const cheek = subject.sites.get(FACE_SKIN_CHEEK);
    if (cheek === undefined) continue;
    const albedo = mean(cheek);
    const group = groups.get(subject.ethnicity) ?? new Map();
    groups.set(subject.ethnicity, group);
    for (const key of ["all", ...(["F", "M"].includes(subject.sex ?? "") ? [subject.sex!] : [])])
      group.set(key, [...(group.get(key) ?? []), albedo]);
  }
  return Object.fromEntries(
    [...groups.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([ethnicity, group]) => [ethnicity, summarizeByKey(group)]),
  );
}

/**
 * Each head site's albedo as a per-channel ratio to the same subject's cheek,
 * per ethnic group, overall and by sex.
 *
 * Pairing within the subject removes the between-subject spread of overall
 * pigmentation, so the ratio is the regional pattern alone. A subject counts
 * for a site only when measured at both that site and the cheek. `sites` maps
 * the archive's location codes to the names the result carries. Pure.
 */
export function faceSkinSiteNorms(
  readings: readonly IFaceSkinReading[],
  sites: Readonly<Record<number, string>>,
): Record<string, Record<string, FaceSkinNormGroup>> {
  const groups = new Map<
    string,
    Map<string, Map<string, [number, number, number][]>>
  >();
  for (const subject of bySubject(readings).values()) {
    const cheekReadings = subject.sites.get(FACE_SKIN_CHEEK);
    if (cheekReadings === undefined) continue;
    const cheek = mean(cheekReadings);
    for (const [code, name] of Object.entries(sites)) {
      const site = subject.sites.get(Number(code));
      if (site === undefined) continue;
      const value = mean(site);
      const ratio = [0, 1, 2].map((channel) => value[channel]! / cheek[channel]!) as [
        number,
        number,
        number,
      ];
      const group = groups.get(subject.ethnicity) ?? new Map();
      groups.set(subject.ethnicity, group);
      const bySite = group.get(name) ?? new Map();
      group.set(name, bySite);
      for (const key of ["all", ...(["F", "M"].includes(subject.sex ?? "") ? [subject.sex!] : [])])
        bySite.set(key, [...(bySite.get(key) ?? []), ratio]);
    }
  }
  return Object.fromEntries(
    [...groups.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([ethnicity, group]) => [
        ethnicity,
        Object.fromEntries(
          [...group.entries()]
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([site, keyed]) => [site, summarizeByKey(keyed)]),
        ),
      ]),
  );
}
