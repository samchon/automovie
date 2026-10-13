/**
 * Namespace-resolved root identity and decoded attributes of a complete XML
 * document. The container selector consumes these facts without rereading text.
 *
 * @author Samchon
 */
export interface IXmlRoot {
  /** Root name after its namespace prefix was resolved. */
  localName: string;

  /** Resolved namespace URI; undefined means the root has no namespace. */
  namespace: string | undefined;

  /** Decoded root attributes in their authored qualified-name spelling. */
  attributes: ReadonlyMap<string, string>;
}
