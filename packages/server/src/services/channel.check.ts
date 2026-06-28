// classifyChannel 런타임 체크 — `tsx src/services/channel.check.ts`로 실행
import assert from "node:assert/strict";
import { classifyChannel } from "./channel.js";

assert.equal(classifyChannel(null, null), "direct");
assert.equal(classifyChannel("", undefined), "direct");
assert.equal(classifyChannel("https://www.google.com/search?q=청년적금"), "google");
assert.equal(classifyChannel("https://search.naver.com/search.naver?query=x"), "naver");
assert.equal(classifyChannel("https://m.search.daum.net/"), "daum");
assert.equal(classifyChannel("https://www.instagram.com/"), "social");
assert.equal(classifyChannel("https://t.co/abc"), "social");
assert.equal(classifyChannel("https://example.com/blog/post"), "referral");
assert.equal(classifyChannel("naver.com"), "naver"); // 스킴 없는 referrer
assert.equal(classifyChannel("https://www.google.com/", "newsletter"), "newsletter"); // UTM 우선

console.log("channel.check OK");
