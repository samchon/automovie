
/** Write classic PDF xref offsets calculated from the authored indirect-object byte lengths, independently of the reader. */
export const pdf = (
  objects: readonly string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [] /Count 0 >>",
  ],
): Uint8Array => {
  let text = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const [index, body] of objects.entries()) {
    offsets.push(Buffer.byteLength(text, "latin1"));
    text += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }
  const xref = Buffer.byteLength(text, "latin1");
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  text += offsets
    .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`)
    .join("");
  text += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(text, "latin1");
};
