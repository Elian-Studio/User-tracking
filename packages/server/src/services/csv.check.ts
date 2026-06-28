// rowsToCsv 런타임 체크 — `tsx src/services/csv.check.ts`로 실행
import assert from "node:assert/strict";
import { rowsToCsv } from "./csv.js";

assert.equal(rowsToCsv([]), "");
assert.equal(rowsToCsv([{ a: 1, b: "x" }]), "a,b\n1,x");
assert.equal(rowsToCsv([{ a: null, b: undefined }]), "a,b\n,");
assert.equal(rowsToCsv([{ a: "x,y", b: 'q"q' }]), 'a,b\n"x,y","q""q"');
assert.equal(rowsToCsv([{ a: "line\nbreak" }]), 'a\n"line\nbreak"');
assert.equal(rowsToCsv([{ t: new Date("2026-06-28T00:00:00.000Z") }]), "t\n2026-06-28T00:00:00.000Z");

console.log("csv.check OK");
