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
 */
export const test_production_design_reference_svg_boundaries = (): void => {
  const root = '<svg xmlns="http://www.w3.org/2000/svg"';
  const read = (xml: string): unknown => inspect("bounds.svg", utf8(xml));
  const refusedStage = (xml: string): string => stage("boundary.svg", utf8(xml));
  const fractional = read(`${root} viewBox="-1,+2,4e1,.5"/>`) as {
    width: number;
    height: number;
  };
  TestValidator.predicate(
    "fraction and exponent spellings retain the independently calculated extent",
    nclose(fractional.width, 40) && nclose(fractional.height, 0.5),
  );
  TestValidator.equals(
    "supported lexical and user-unit neighbors retain their measured facts",
    [
      read(`${root} width=" +4px " height="3e1"/>`),
      read(`${root} id="&lt;&gt;&quot;&apos;&amp;&#65;&#x42;">&#9;&#10;&#13;&#xE000;&#x10000;</svg>`),
      read(`<?xml version="1.0" encoding="utf-8" standalone="yes"?>${root}><g xmlns=""><leaf/></g><![CDATA[legal]]><!-- tail --></svg>`),
      read(`${root}></svg>\r\n<!-- epilog --><?pi data?>`),
      read(`${root}/><!-- epilog -->`),
    ],
    [
      { media: "image/svg+xml", width: 4, height: 30 },
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
    ].map((attributes) => read(`${root} ${attributes}/>`)),
    Array.from({ length: 10 }, () => ({ media: "image/svg+xml" })),
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
};
