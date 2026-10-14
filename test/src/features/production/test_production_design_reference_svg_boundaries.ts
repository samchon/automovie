import { TestValidator } from "@nestia/e2e";

import { inspect } from "../internal/designReference/inspect";
import { stage } from "../internal/designReference/stage";
import { utf8 } from "../internal/designReference/utf8";
import { nclose } from "../internal/predicates";

/**
 * SVG admission keeps lexical namespace and scalar boundaries separate from
 * user-unit extent measurement. Invalid or physical-unit bounds remain absent.
 *
 * Scenarios:
 *
 * 1. Admit exponent/fraction user units, decoded predefined/numeric references,
 *    XML declarations, namespace undeclaration and complete CDATA/comments.
 * 2. Withhold zero, negative, missing, infinite and non-SVG numeric bounds.
 * 3. Refuse reserved URI/prefix bindings, invalid character references,
 *    processing instructions, comments and exact closing-tag mismatches.
 * 4. Require XML whitespace between attributes and forbid a comment body ending in a hyphen, while admitting adjacent legal spellings.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual container inspector through shared direct-source helpers, asserting measured facts and typed family/stage refusals. Adjacent attributes and trailing-hyphen comments catch malformed XML previously admitted as SVG.
 * @evidence contracts/testing.md#independent-expectations Literal user-unit extents and XML 1.0 Start-tag production 40 and Comment production 15 define the independent expected results; https://www.w3.org/TR/xml/#sec-starttags and https://www.w3.org/TR/xml/#sec-comments supply the grammar basis rather than a parser snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Preserves fraction/exponent/entity/declaration/namespace/CDATA positives, ten unsupported bounds and fourteen existing grammar refusals; adds root/child adjacent-attribute and prolog/body/epilog bad-comment cases alongside whitespace and legal-hyphen neighbors. Full SVG family selection belongs to the companion test.
 * @evidence contracts/testing.md#execution-ownership The exported portable unit owns all authored in-memory XML cases and calls shared inspector/stage/UTF-8 helpers; it starts no filesystem consumer, process, browser, GPU or native build and replaces no foreign method.
 */
export function test_production_design_reference_svg_boundaries(): void {
  const root: string = '<svg xmlns="http://www.w3.org/2000/svg"';
  function read(xml: string): unknown { return inspect("bounds.svg", utf8(xml)); }
  function refusedStage(xml: string): string { return stage("boundary.svg", utf8(xml)); }
  const fractional: { width: number; height: number } = read(`${root} viewBox="-1,+2,4e1,.5"/>`) as {
    width: number;
    height: number;
  };
  TestValidator.predicate(
    "fraction and exponent spellings retain the independently calculated extent",
    nclose(fractional.width, 40) && nclose(fractional.height, 0.5),
  );
  const supported: unknown[] = [
      read(`${root} width=" +4px " height="3e1"/>`),
      read(`${root} id="&lt;&gt;&quot;&apos;&amp;&#65;&#x42;">&#9;&#10;&#13;&#xE000;&#x10000;</svg>`),
      read(`<?xml version="1.0" encoding="utf-8" standalone="yes"?>${root}><g xmlns=""><leaf/></g><![CDATA[legal]]><!-- tail --></svg>`),
      read(`${root}></svg>\r\n<!-- epilog --><?pi data?>`),
      read(`${root}/><!-- epilog -->`),
    ];
  const { width, height, ...supportedFacts }: { media: string; width: number; height: number } = supported[0] as { media: string; width: number; height: number };
  TestValidator.predicate("unitless and px neighbors keep the exact authored extent", nclose(width, 4, 0) && nclose(height, 30, 0));
  TestValidator.equals(
    "supported lexical and user-unit neighbors retain their measured facts",
    [supportedFacts, ...supported.slice(1)],
    [
      { media: "image/svg+xml" },
      { media: "image/svg+xml" },
      { media: "image/svg+xml" },
      { media: "image/svg+xml" },
      { media: "image/svg+xml" },
    ],
  );
  TestValidator.equals(
    "unsupported extent syntax never becomes a guessed measurement",
    [
      'viewBox="0 0 0 2"',
      'viewBox="0 0 2 -1"',
      'viewBox="0 0 2"',
      'viewBox="0 0 Infinity 2"',
      'viewBox="0 0 0x10 2"',
      'viewBox="0 0 1e999 2"',
      'width="3mm" height="4"',
      'width="4"',
      'height="4"',
      'width="0" height="4"',
    ].map((attributes: string): unknown => read(`${root} ${attributes}/>`)),
    Array.from({ length: 10 }, (): { media: string } => ({ media: "image/svg+xml" })),
  );
  TestValidator.equals(
    "reserved and malformed lexical inputs retain the owning refusal stage",
    [
      refusedStage(`${root} xmlns:xmlns="urn:x"/>`),
      refusedStage(`${root} xmlns:a="http://www.w3.org/2000/xmlns/"/>`),
      refusedStage(`${root} xmlns:a="http://www.w3.org/XML/1998/namespace"/>`),
      refusedStage(`${root} xmlns:a=""/>`),
      refusedStage(`${root}>raw & text</svg>`),
      refusedStage(`${root}>&#55296;</svg>`),
      refusedStage(`${root}>&#1114112;</svg>`),
      refusedStage(`${root}>&#${"9".repeat(400)};</svg>`),
      refusedStage(`${root}><?1wrong?></svg>`),
      refusedStage(`<?XML version="1.0"?>${root}/>`),
      refusedStage(`<!-- \u000b -->${root}/>`),
      refusedStage(`${root}><!-- \u000b --></svg>`),
      refusedStage(`${root}><g></svg>`),
      refusedStage(`${root} a:="1"/>`),
    ],
    [
      "XML:namespace", "XML:namespace", "XML:namespace", "XML:namespace",
      "SVG:text", "SVG:entity", "SVG:entity", "SVG:entity", "XML:instruction",
      "XML:instruction", "XML:character", "XML:character", "SVG:closure", "SVG:name",
    ],
  );
  const neighbors: unknown[] = [
    read(`${root}\twidth="1"\r\nheight="2"/>`),
    read(`<!---x-->${root}><g a="1" b="2"/><!--x- --></svg>`),
    read(`${root}/><!-- -->`),
  ];
  const { width: neighborWidth, height: neighborHeight, ...neighborFacts }: { media: string; width: number; height: number } = neighbors[0] as { media: string; width: number; height: number };
  TestValidator.predicate("XML whitespace keeps both exact dimensions", nclose(neighborWidth, 1, 0) && nclose(neighborHeight, 2, 0));
  TestValidator.equals("XML whitespace and comment hyphen neighbors remain admissible", [neighborFacts, ...neighbors.slice(1)], [{ media: "image/svg+xml" }, { media: "image/svg+xml" }, { media: "image/svg+xml" }]);
  TestValidator.equals("malformed attribute adjacency and comment closure refuse", [
    refusedStage(`${root}width="1"/>`),
    refusedStage(`${root}><g a="1"b="2"/></svg>`),
    refusedStage(`<!--x--->${root}/>`),
    refusedStage(`${root}><!--x---></svg>`),
    refusedStage(`${root}/><!--x--->`),
  ], ["SVG:root", "SVG:root", "XML:comment", "SVG:comment", "XML:comment"]);
}
