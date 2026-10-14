import { TestValidator } from "@nestia/e2e";
import { utf8 } from "../internal/designReference/utf8";
import { pdf } from "../internal/designReference/pdf";
import { inspect } from "../internal/designReference/inspect";
import { stage } from "../internal/designReference/stage";
import { latin1 } from "../internal/designReference/latin1";
import { refuses } from "../internal/designReference/refuses";

/**
 * Classic PDF xref offsets and a closed parent-consistent Catalog page tree are required; no geometric extent is invented.
 *
 * Scenarios:
 *
 * 1. Admit the adjacent supported grammar and independently stated facts.
 * 2. Refuse every authored malformed family input at its owning production parsing stage.
 *
 * @evidence contracts/testing.md#behavioral-verification Inspects authored classic PDFs, requiring unmeasured empty/one-page admission and typed exact-stage refusals for invalid header, closure, xref, Root and Pages relationships; prefix-only or inconsistent tree admission fails.
 * @evidence contracts/testing.md#independent-expectations The fixture computes byte offsets from independently authored object lengths; exact xref identity, Catalog reference, parent links, unique descendants and counted leaves define expected admission. The supported regex-based profile does not certify arbitrary dictionaries, streams, visual content or page extent.
 * @evidence contracts/testing.md#distinguishing-cases Covers truncated/signature-only documents, offsets, xref counts, Root/Size and generation/type failures, missing or wrong Pages/Kids/Count, repeated/cyclic children and invalid parents, with empty/one-page positives; deeper and safe-integer boundaries belong to the adjacent PDF unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns authored byte inputs and direct assertions through existing production-inspector helpers; it starts no PDF process, filesystem fixture or dynamic case.
 */
export function test_production_design_reference_pdf(): void {
  const invalidPdf: Buffer = Buffer.from(
    Buffer.from(pdf())
      .toString("latin1")
      .replace(/startxref\n\d+/, "startxref\n9999"),
    "latin1",
  );
  const missingPdfRoot: Buffer = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("/Root 1 0 R", "/Root 9 0 R"),
    "latin1",
  );
  const wrongPdfOffset: Buffer = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("0000000009", "0000000008"),
    "latin1",
  );
  const wrongPdfCount: Buffer = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("xref\n0 3", "xref\n0 4"),
    "latin1",
  );
  const wrongPdfRootType: Buffer = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("/Catalog", "/Pages"),
    "latin1",
  );
  const missingPdfSize: Buffer = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("/Size 3 ", ""),
    "latin1",
  );
  const shortPdfSize: Buffer = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("/Size 3", "/Size 2"),
    "latin1",
  );
  const missingPages: Uint8Array = pdf([
    "<< /Type /Catalog >>",
    "<< /Type /Pages /Kids [] /Count 0 >>",
  ]);
  const missingPagesObject: Uint8Array = pdf([
    "<< /Type /Catalog /Pages 9 0 R >>",
    "<< /Type /Pages /Kids [] /Count 0 >>",
  ]);
  const wrongPagesGeneration: Uint8Array = pdf([
    "<< /Type /Catalog /Pages 2 1 R >>",
    "<< /Type /Pages /Kids [] /Count 0 >>",
  ]);
  const wrongPagesType: Uint8Array = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Page >>",
  ]);
  const missingKids: Uint8Array = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 0 >>",
  ]);
  const missingPageCount: Uint8Array = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [] >>",
  ]);
  const wrongPageCount: Uint8Array = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [] /Count 1 >>",
  ]);
  const wrongPageParent: Uint8Array = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 9 0 R >>",
  ]);
  const cyclicPages: Uint8Array = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [2 0 R] /Count 0 >>",
  ]);
  const repeatedPage: Uint8Array = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 3 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R >>",
  ]);
  TestValidator.equals(
    "classic xref and Catalog page-tree refusals",
    [
      refuses("prefix.pdf", utf8("%PDF-1.7\n")),
      refuses("xref.pdf", invalidPdf),
      refuses("root.pdf", missingPdfRoot),
      refuses("offset.pdf", wrongPdfOffset),
      refuses("count.pdf", wrongPdfCount),
      refuses("root-type.pdf", wrongPdfRootType),
      refuses("missing-size.pdf", missingPdfSize),
      refuses("short-size.pdf", shortPdfSize),
      refuses("missing-pages.pdf", missingPages),
      refuses("missing-pages-object.pdf", missingPagesObject),
      refuses("pages-generation.pdf", wrongPagesGeneration),
      refuses("pages-type.pdf", wrongPagesType),
      refuses("missing-kids.pdf", missingKids),
      refuses("missing-page-count.pdf", missingPageCount),
      refuses("wrong-page-count.pdf", wrongPageCount),
      refuses("wrong-page-parent.pdf", wrongPageParent),
      refuses("cyclic-pages.pdf", cyclicPages),
      refuses("repeated-page.pdf", repeatedPage),
    ],
    new Array(18).fill(true),
  );
  TestValidator.equals("closed empty and one-page PDF trees remain unmeasured", [inspect("sheet.pdf",pdf()), inspect("page.pdf",pdf(["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R >>"]))], [{media:"application/pdf"},{media:"application/pdf"}]);
  const pdfText: (edit: (text: string) => string) => Uint8Array = (edit: (text: string) => string): Uint8Array =>
    latin1(pdf(), edit);
  const pageTree: (kid: string, pages?: string) => Uint8Array = (
    kid: string,
    pages: string = "/Kids [3 0 R] /Count 1",
  ): Uint8Array =>
    pdf([
      "<< /Type /Catalog /Pages 2 0 R >>",
      `<< /Type /Pages ${pages} >>`,
      kid,
    ]);
  TestValidator.equals(
    "native parser stages retain exact family and refusal identity",
    {
      pdfHeader: stage(
        "header.pdf",
        pdfText((text: string): string => text.replace("%PDF-1.4", "%PDF-2.0")),
      ),
      pdfNoClosure: stage(
        "closure.pdf",
        pdfText((text: string): string => text.replace("%%EOF\n", "")),
      ),
      pdfNoTrailerKeyword: stage(
        "keyword.pdf",
        pdfText((text: string): string => text.replace("trailer", "trailor")),
      ),
      pdfXrefLineSuffix: stage(
        "xref-line.pdf",
        pdfText((text: string): string => text.replace("xref\n0 3", "xref extra\n0 3")),
      ),
      pdfXrefHeading: stage(
        "xref-heading.pdf",
        pdfText((text: string): string => text.replace("xref\n0 3\n", "xref\nzero 3\n")),
      ),
      pdfXrefEmptySubsection: stage(
        "xref-count.pdf",
        pdfText((text: string): string => text.replace("xref\n0 3\n", "xref\n0 0\n")),
      ),
      pdfPageKidType: stage(
        "kid-type.pdf",
        pageTree("<< /Type /Foo /Parent 2 0 R >>"),
      ),
      pdfKidsResidue: stage(
        "kids-residue.pdf",
        pageTree(
          "<< /Type /Page /Parent 2 0 R >>",
          "/Kids [3 0 R junk] /Count 1",
        ),
      ),
    },
    {
      pdfHeader: "PDF:header",
      pdfNoClosure: "PDF:closure",
      pdfNoTrailerKeyword: "PDF:trailer",
      pdfXrefLineSuffix: "PDF:trailer",
      pdfXrefHeading: "PDF:trailer",
      pdfXrefEmptySubsection: "PDF:trailer",
      pdfPageKidType: "PDF:Pages",
      pdfKidsResidue: "PDF:Pages",
    },
  );

}
