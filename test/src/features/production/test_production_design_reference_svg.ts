import { TestValidator } from "@nestia/e2e";
import { utf8 } from "../internal/designReference/utf8";
import { inspect } from "../internal/designReference/inspect";
import { stage } from "../internal/designReference/stage";
import { refuses } from "../internal/designReference/refuses";

/**
 * XML namespace scope, expanded attribute identity, lexical references and root closure own admitted SVG facts.
 *
 * Scenarios:
 *
 * 1. Admit the adjacent supported grammar and independently stated facts.
 * 2. Refuse every malformed family input at its owning native parsing stage.
 */
export const test_production_design_reference_svg = (): void => {
  const svg = utf8(
    '<?xml version="1.0"?><!-- viewBox="0 0 999 999" --><svg xmlns="http://www.w3.org/2000/svg" viewBox=\'0 0 420 297\'><g><path d="M0 0"/></g></svg><!-- epilog -->',
  );
  const sizedSvg = utf8(
    '<s:svg xmlns:s="http://www.w3.org/2000/svg" width="800px" height="600"><s:g/></s:svg>',
  );
  TestValidator.equals(
    "the namespace root owns SVG family and bounds, not comments or children",
    [
      inspect("plan.svg", svg),
      inspect("sized.svg", sizedSvg),
      inspect(
        "foreign.xml",
        utf8('<root><!-- <svg viewBox="0 0 9 9"/> --></root>'),
      ),
    ],
    [
      { media: "image/svg+xml", width: 420, height: 297 },
      { media: "image/svg+xml", width: 800, height: 600 },
      null,
    ],
  );
  TestValidator.equals(
    "XML namespace scope and expanded attribute names are enforced",
    [
      inspect(
        "bound.svg",
        utf8(
          '<s:svg xmlns:s="http://www.w3.org/2000/svg" xmlns:a="urn:a" id="plain" a:id="qualified" xml:lang="en"><a:g/></s:svg>',
        ),
      ),
      refuses(
        "unbound-root.svg",
        utf8('<s:svg xmlns="http://www.w3.org/2000/svg"/>'),
      ),
      refuses(
        "unbound-child.svg",
        utf8('<svg xmlns="http://www.w3.org/2000/svg"><a:g/></svg>'),
      ),
      refuses(
        "scope.svg",
        utf8(
          '<svg xmlns="http://www.w3.org/2000/svg"><g xmlns:a="urn:a"><a:path/></g><a:path/></svg>',
        ),
      ),
      refuses(
        "expanded-duplicate.svg",
        utf8(
          '<svg xmlns="http://www.w3.org/2000/svg" xmlns:a="urn:same" xmlns:b="urn:same" a:id="one" b:id="two"/>',
        ),
      ),
      refuses(
        "reserved-binding.svg",
        utf8(
          '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xml="urn:not-xml"/>',
        ),
      ),
    ],
    [{ media: "image/svg+xml" }, true, true, true, true, true],
  );
  TestValidator.equals(
    "malformed SVG and raw malformed UTF-8 never become measured evidence",
    [
      refuses(
        "broken.svg",
        utf8('<svg xmlns="http://www.w3.org/2000/svg"><g></svg>'),
      ),
      refuses(
        "comment.svg",
        utf8(
          '<svg xmlns="http://www.w3.org/2000/svg"><!-- bad--comment --></svg>',
        ),
      ),
      refuses(
        "space.svg",
        utf8('\u000b<svg xmlns="http://www.w3.org/2000/svg"/>'),
      ),
      refuses(
        "cdata.svg",
        utf8(
          '<svg xmlns="http://www.w3.org/2000/svg"><![CDATA[\u000b]]></svg>',
        ),
      ),
      refuses(
        "declaration.svg",
        utf8('<svg xmlns="http://www.w3.org/2000/svg"/><?xml version="1.0"?>'),
      ),
      refuses(
        "qualified-name.svg",
        utf8('<svg xmlns="http://www.w3.org/2000/svg"><a:b:c/></svg>'),
      ),
      refuses(
        "character-reference.svg",
        utf8('<svg xmlns="http://www.w3.org/2000/svg">&#11;</svg>'),
      ),
      refuses(
        "non-character.svg",
        utf8('<svg xmlns="http://www.w3.org/2000/svg">\uffff</svg>'),
      ),
      refuses(
        "late-declaration.svg",
        utf8(
          '<!-- first --><?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>',
        ),
      ),
      refuses(
        "encoding-declaration.svg",
        utf8(
          '<?xml version="1.0" encoding="UTF-16"?><svg xmlns="http://www.w3.org/2000/svg"/>',
        ),
      ),
      inspect(
        "nbsp-bounds.svg",
        utf8(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0\u00a00\u00a01\u00a01"/>',
        ),
      ),
      refuses(
        "encoding.svg",
        new Uint8Array([
          ...utf8('<svg xmlns="http://www.w3.org/2000/svg">'),
          0x80,
          ...utf8("</svg>"),
        ]),
        "encoding",
      ),
      inspect(
        "replacement.svg",
        utf8(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">�</svg>',
        ),
      ),
    ],
    [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      { media: "image/svg+xml" },
      true,
      { media: "image/svg+xml", width: 1, height: 1 },
    ],
  );
  const svgRoot = '<svg xmlns="http://www.w3.org/2000/svg"';
  const svgOnly = JSON.stringify({ media: "image/svg+xml" });
  TestValidator.equals(
    "native parser stages retain exact family and refusal identity",
    {
      xmlDoctype: stage("doctype.svg", utf8(`<!DOCTYPE svg>${svgRoot}/>`)),
      xmlUnstartableRoot: stage("digit.svg", utf8("<1abc/>")),
      svgMalformedAttribute: stage("attribute.svg", utf8(`${svgRoot} a=b/>`)),
      svgAttributeName: stage("name.svg", utf8(`${svgRoot} a:b:c="1"/>`)),
      svgDuplicateAttribute: stage(
        "duplicate.svg",
        utf8(`${svgRoot} id="1" id="2"/>`),
      ),
      svgUndeclaredDefaultNamespace: stage(
        "undeclared.svg",
        utf8('<svg xmlns=""/>'),
      ),
      xmlnsElementName: stage(
        "xmlns-element.svg",
        utf8('<xmlns:svg xmlns:svg="http://www.w3.org/2000/svg"/>'),
      ),
      svgTailAfterSelfClose: stage("tail-self.svg", utf8(`${svgRoot}/>tail`)),
      svgUnclosedWithText: stage("unclosed-text.svg", utf8(`${svgRoot}>text`)),
      svgUnterminatedComment: stage("comment.svg", utf8(`${svgRoot}><!-- x`)),
      svgUnterminatedCdata: stage("cdata.svg", utf8(`${svgRoot}><![CDATA[x`)),
      svgInstruction: stage(
        "instruction.svg",
        utf8(`${svgRoot}><?pi data?></svg>`),
      ),
      svgUnterminatedInstruction: stage("pi.svg", utf8(`${svgRoot}><?pi`)),
      svgCloseName: stage("close-name.svg", utf8(`${svgRoot}></a:b:c>`)),
      svgTailAfterRoot: stage("tail-root.svg", utf8(`${svgRoot}></svg>tail`)),
      svgMalformedChild: stage("child.svg", utf8(`${svgRoot}><1/></svg>`)),
      svgUnclosedRoot: stage("unclosed.svg", utf8(`${svgRoot}><g>`)),
      xmlDeclarationAfterSpace: stage(
        "spaced-declaration.svg",
        utf8(` <?xml version="1.0"?>${svgRoot}/>`),
      ),
      xmlUnterminatedProlog: stage("prolog.svg", utf8('<?xml version="1.0"')),
      xmlPrologCommentDashes: stage(
        "prolog-comment.svg",
        utf8(`<!-- a--b -->${svgRoot}/>`),
      ),
      svgCdataEndInText: stage("cdata-end.svg", utf8(`${svgRoot}>]]></svg>`)),
      svgAstralText: stage("astral.svg", utf8(`${svgRoot}>\u{1f600}</svg>`)),
      svgUnescapedAttribute: stage(
        "ampersand.svg",
        utf8(`${svgRoot} id="a&b"/>`),
      ),
      svgEntities: stage(
        "entities.svg",
        utf8(`${svgRoot} id="&amp;&#65;&#x42;"/>`),
      ),
    },
    {
      xmlDoctype: "XML:prolog",
      xmlUnstartableRoot: "null",
      svgMalformedAttribute: "SVG:root",
      svgAttributeName: "SVG:name",
      svgDuplicateAttribute: "SVG:root",
      svgUndeclaredDefaultNamespace: "null",
      xmlnsElementName: "XML:namespace",
      svgTailAfterSelfClose: "SVG:closure",
      svgUnclosedWithText: "SVG:closure",
      svgUnterminatedComment: "SVG:closure",
      svgUnterminatedCdata: "SVG:closure",
      svgInstruction: svgOnly,
      svgUnterminatedInstruction: "SVG:closure",
      svgCloseName: "SVG:name",
      svgTailAfterRoot: "SVG:closure",
      svgMalformedChild: "SVG:closure",
      svgUnclosedRoot: "SVG:closure",
      xmlDeclarationAfterSpace: "XML:instruction",
      xmlUnterminatedProlog: "XML:misc",
      xmlPrologCommentDashes: "XML:comment",
      svgCdataEndInText: "SVG:text",
      svgAstralText: svgOnly,
      svgUnescapedAttribute: "SVG:attribute",
      svgEntities: svgOnly,
    },
  );

};
