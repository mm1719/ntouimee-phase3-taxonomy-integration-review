import { describe, expect, it } from "vitest";
import { parseCsv, splitCell } from "../csv";

describe("parseCsv", () => {
  it("parses quoted fields, escaped quotes, and CRLF rows", () => {
    const rows = parseCsv<{ id: string; label: string; note: string }>(
      'id,label,note\r\n1,Tripos,plain\r\n2,"A,B","has comma"\r\n3,"quoted""name","line one\nline two"\r\n'
    );

    expect(rows).toEqual([
      { id: "1", label: "Tripos", note: "plain" },
      { id: "2", label: "A,B", note: "has comma" },
      { id: "3", label: 'quoted"name', note: "line one\nline two" }
    ]);
  });

  it("fills missing trailing cells with empty strings", () => {
    const rows = parseCsv<{ a: string; b: string; c: string }>("a,b,c\n1,2\n");

    expect(rows).toEqual([{ a: "1", b: "2", c: "" }]);
  });
});

describe("splitCell", () => {
  it("splits pipe-delimited cells and removes empty segments", () => {
    expect(splitCell("a||b|")).toEqual(["a", "b"]);
  });
});
