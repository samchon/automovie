/**
 * Derive cheek skin albedo norms from the International Skin Spectra Archive,
 * from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/derive-skin-albedo-norms.ts ISSA.xlsx OUTPUT.json
 *
 * ISSA.xlsx is the archive's single workbook (Lu Y, Xiao K, Pointer M, et al.,
 * "The International Skin Spectra Archive (ISSA): a multicultural human skin
 * phenotype and colour spectra collection", Sci Data 2025;12:487,
 * doi:10.1038/s41597-025-04857-5; data doi:10.6084/m9.figshare.28228571.v4,
 * file ISSA_17_Jan_2025_Yan_Lu.xlsx, CC BY 4.0). Every record is one
 * spectrophotometer reading (CIE di:8 geometry, specular included) of one body
 * site of one subject. OUTPUT.json must be new; it receives the norms
 * (`faceSkinAlbedoNorms`, integrated by `faceSkinSpectrumRgb`) and the
 * workbook's SHA-256, and `faceSkinAlbedo` reads it as `skin-albedo-norms.json`.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";

import { FACE_SKIN_CHEEK, faceSkinAlbedoNorms } from "./faceSkinNormGroups";
import { readFaceSkinReadings } from "./readFaceSkinReadings";
import { readXlsxSheet } from "./readXlsxSheet";

const [source, output] = process.argv.slice(2);
if (source === undefined || output === undefined || fs.existsSync(output))
  throw new Error("Supply the ISSA workbook and a new output file.");
const bytes = fs.readFileSync(source);
const groups = faceSkinAlbedoNorms(
  readFaceSkinReadings(
    readXlsxSheet(bytes, "ISSA"),
    new Set([FACE_SKIN_CHEEK]),
  ),
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
      site: "cheek",
      space: "linear sRGB albedo under D65, CIE 1931 2 degree observer",
      groups,
    },
    null,
    1,
  ),
);
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(groups).map(([name, group]) => [name, group.all!.mean]),
    ),
  ),
);
