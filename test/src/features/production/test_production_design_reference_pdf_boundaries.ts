import { TestValidator } from "@nestia/e2e";

import { pdf } from "../internal/designReference/pdf";
import { latin1 } from "../internal/designReference/latin1";
import { stage } from "../internal/designReference/stage";
import { utf8 } from "../internal/designReference/utf8";

/**
 * Classic PDF admission follows exact xref identity and page-tree parent/count
 * records. A recognizable PDF prefix does not replace those closed records.
 *
 * Scenarios:
 *
 * 1. Admit a two-level page tree with independently counted one leaf.
 * 2. Refuse unclosed objects, malformed/duplicate xref rows and unsafe trailer
 *    identities without interpreting them as a different supported profile.
 * 3. Refuse unused/generation-mismatched Catalog entries and malformed page
 *    parent, type, Kids and Count identities at the native owner.
 *
 * @evidence contracts/testing.md#behavioral-verification Inspects a nested classic PDF and malformed xref/trailer/page-tree records, asserting unmeasured admission or exact typed refusal stages; unsafe/coerced identities and inconsistent ancestry cannot become accepted metadata.
 * @evidence contracts/testing.md#independent-expectations Authored indirect identities, exact byte offsets, safe-integer limits, parent links and one counted leaf define expected results independently of parser output. This bounded profile does not establish full PDF semantics, page extent or rendering.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts a two-level positive tree with absent objects, malformed/duplicate xref rows, unsafe/duplicate Root/Size, free or wrong-generation Root, invalid root/leaf parents and unsafe/duplicate counts or missing type; basic framing and cycles belong to the PDF unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all edits of existing in-memory PDF fixtures and calls production inspection through existing helpers; it starts no PDF host or dynamically registered cases.
 */
export function test_production_design_reference_pdf_boundaries(): void {
  const good: Uint8Array = pdf();
  const edit: (fn: (text: string) => string) => string = (fn: (text: string) => string): string =>
    stage("xref.pdf",latin1(good,fn));
  const tree: (root: string, branch: string, leaf: string) => string = (root: string, branch: string, leaf: string): string =>
    stage("tree.pdf",pdf([
      "<< /Type /Catalog /Pages 2 0 R >>",root,branch,leaf,
    ]));
  TestValidator.equals(
    "nested page Count and Parent records agree with the one leaf",
    tree(
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Pages /Parent 2 0 R /Kids [4 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 3 0 R >>",
    ),
    JSON.stringify({ media: "application/pdf" }),
  );
  TestValidator.equals(
    "incomplete xref and Catalog identities are never admitted",
    [
      stage("objects.pdf",utf8("%PDF-1.4\nstartxref\n0\n%%EOF\n")),
      edit((text: string): string=>text.replace("0000000000 65535 f","malformed row")),
      edit((text: string): string=>text.replace("xref\n0 3","xref\n9007199254740992 3")),
      edit((text: string): string=>text.replace("xref\n0 3","xref\n0 9007199254740992")),
      edit((text: string): string=>text.replace("trailer\n", "0 1\n0000000000 65535 f \ntrailer\n")),
      edit((text: string): string=>text.replace("/Root 1 0 R", "/Root 1 0 R /Root 1 0 R")),
      edit((text: string): string=>text.replace("/Size 3", "/Size 3 /Size 3")),
      edit((text: string): string=>text.replace("/Size 3", "/Size 9007199254740992")),
      edit((text: string): string=>text.replace("/Root 1 0 R", "/Root 1 9007199254740992 R")),
      edit((text: string): string=>text.replace("/Size 3", "/Size 0")),
      edit((text: string): string=>text.replace("0000000009 00000 n", "0000000009 00000 f")),
      edit((text: string): string=>text.replace("/Root 1 0 R", "/Root 1 1 R")),
    ],
    ["PDF:object","PDF:trailer","PDF:trailer","PDF:trailer","PDF:trailer",
      "PDF:trailer","PDF:trailer","PDF:trailer","PDF:trailer","PDF:trailer",
      "PDF:Root","PDF:Root"],
  );
  TestValidator.equals(
    "page-tree declarations keep their exact parent and count boundary",
    [
      stage("root-parent.pdf",pdf(["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Parent 1 0 R /Kids [] /Count 0 >>"])),
      stage("no-parent.pdf",pdf(["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page >>"])),
      stage("double-parent.pdf",pdf(["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /Parent 2 0 R >>"])),
      stage("parent-generation.pdf",pdf(["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 1 R >>"])),
      stage("unsafe-count.pdf",pdf(["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [] /Count 9007199254740992 >>"])),
      stage("double-count.pdf",pdf(["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [] /Count 0 /Count 0 >>"])),
      stage("missing-type.pdf",pdf(["<< /Type /Catalog /Pages 2 0 R >>","<< /Kids [] /Count 0 >>"])),
    ],
    Array.from({length:7},(): string=>"PDF:Pages"),
  );
}
