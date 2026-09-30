/**
 * Derive facial skin site albedo relative to the cheek from the International
 * Skin Spectra Archive, from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/derive-skin-site-norms.ts ISSA.xlsx OUTPUT.json
 *
 * ISSA.xlsx is the archive workbook `derive-skin-albedo-norms.ts` reads (Lu Y,
 * Xiao K, Pointer M, et al., Sci Data 2025;12:487; data
 * doi:10.6084/m9.figshare.28228571.v4, CC BY 4.0). Its coding scheme numbers
 * the body locations; the head's are 2 cheek, 3 cheek bone, 4 chin, 5 ear
 * lobe, 6 forehead, 8 neck and 9 nose tip. Every reading is integrated into
 * linear sRGB as the cheek norms are, and `faceSkinSiteNorms` takes each
 * site's ratio to the cheek within the subject. OUTPUT.json must be new; it
 * receives the norms and the workbook's SHA-256, and `faceSkinSites` reads it
 * as `skin-site-norms.json`.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";

import { FACE_SKIN_CHEEK, faceSkinSiteNorms } from "./faceSkinNormGroups";
import { readFaceSkinReadings } from "./readFaceSkinReadings";
import { readXlsxSheet } from "./readXlsxSheet";

const SITES = {
  3: "cheekBone",
  4: "chin",
  5: "earLobe",
  6: "forehead",
  8: "neck",
  9: "noseTip",
};
const [source, output] = process.argv.slice(2);
if (source === undefined || output === undefined || fs.existsSync(output))
  throw new Error("Supply the ISSA workbook and a new output file.");
const bytes = fs.readFileSync(source);
const groups = faceSkinSiteNorms(
  readFaceSkinReadings(
    readXlsxSheet(bytes, "ISSA"),
    new Set([FACE_SKIN_CHEEK, ...Object.keys(SITES).map(Number)]),
  ),
  SITES,
);
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      source: {
        citation:
          "Lu Y, Xiao K, Pointer M, et al. The International Skin Spectra Archive (ISSA): a multicultural human skin phenotype and colour spectra collection. Sci Data 2025;12:487. doi:10.1038/s41597-025-04857-5",
        data: "doi:10.6084/m9.figshare.28228571.v4, ISSA_17_Jan_2025_Yan_Lu.xlsx, CC BY 4.0",
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
      reference: "cheek",
      space:
        "per-channel ratio of linear sRGB albedo under D65, CIE 1931 2 degree observer, paired within subject",
      groups,
    },
    null,
    1,
  ),
);
for (const [ethnicity, sites] of Object.entries(groups))
  console.log(
    ethnicity,
    Object.fromEntries(
      Object.entries(sites).map(([site, v]) => [
        site,
        [v.all!.subjects, v.all!.mean],
      ]),
    ),
  );
