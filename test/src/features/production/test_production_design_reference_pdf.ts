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
 * 2. Refuse every malformed family input at its owning native parsing stage.
 */
export const test_production_design_reference_pdf = (): void => {
  const invalidPdf = Buffer.from(
    Buffer.from(pdf())
      .toString("latin1")
      .replace(/startxref\n\d+/, "startxref\n9999"),
    "latin1",
  );
  const missingPdfRoot = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("/Root 1 0 R", "/Root 9 0 R"),
    "latin1",
  );
  const wrongPdfOffset = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("0000000009", "0000000008"),
    "latin1",
  );
  const wrongPdfCount = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("xref\n0 3", "xref\n0 4"),
    "latin1",
  );
  const wrongPdfRootType = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("/Catalog", "/Pages"),
    "latin1",
  );
  const missingPdfSize = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("/Size 3 ", ""),
    "latin1",
  );
  const shortPdfSize = Buffer.from(
    Buffer.from(pdf()).toString("latin1").replace("/Size 3", "/Size 2"),
    "latin1",
  );
  const missingPages = pdf([
    "<< /Type /Catalog >>",
    "<< /Type /Pages /Kids [] /Count 0 >>",
  ]);
  const missingPagesObject = pdf([
    "<< /Type /Catalog /Pages 9 0 R >>",
    "<< /Type /Pages /Kids [] /Count 0 >>",
  ]);
  const wrongPagesGeneration = pdf([
    "<< /Type /Catalog /Pages 2 1 R >>",
    "<< /Type /Pages /Kids [] /Count 0 >>",
  ]);
  const wrongPagesType = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Page >>",
  ]);
  const missingKids = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 0 >>",
  ]);
  const missingPageCount = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [] >>",
  ]);
  const wrongPageCount = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [] /Count 1 >>",
  ]);
  const wrongPageParent = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 9 0 R >>",
  ]);
  const cyclicPages = pdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [2 0 R] /Count 0 >>",
  ]);
  const repeatedPage = pdf([
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
  const pdfText = (edit: (text: string) => string): Uint8Array =>
    latin1(pdf(), edit);
  const pageTree = (
    kid: string,
    pages = "/Kids [3 0 R] /Count 1",
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
        pdfText((text) => text.replace("%PDF-1.4", "%PDF-2.0")),
      ),
      pdfNoClosure: stage(
        "closure.pdf",
        pdfText((text) => text.replace("%%EOF\n", "")),
      ),
      pdfNoTrailerKeyword: stage(
        "keyword.pdf",
        pdfText((text) => text.replace("trailer", "trailor")),
      ),
      pdfXrefLineSuffix: stage(
        "xref-line.pdf",
        pdfText((text) => text.replace("xref\n0 3", "xref extra\n0 3")),
      ),
      pdfXrefHeading: stage(
        "xref-heading.pdf",
        pdfText((text) => text.replace("xref\n0 3\n", "xref\nzero 3\n")),
      ),
      pdfXrefEmptySubsection: stage(
        "xref-count.pdf",
        pdfText((text) => text.replace("xref\n0 3\n", "xref\n0 0\n")),
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

};
