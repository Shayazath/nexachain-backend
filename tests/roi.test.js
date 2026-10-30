import test from "node:test";
import assert from "node:assert/strict";
import { istDayKey } from "../src/utils/date.js";
import { roundMoney } from "../src/utils/money.js";

test("IST day key is stable and uses Asia/Kolkata timezone", () => {
  assert.equal(
    istDayKey(new Date("2026-10-29T01:23:45.000Z")),
    "2026-10-29"
  );

  assert.equal(
    istDayKey(new Date("2026-10-29T23:59:59.999Z")),
    "2026-10-30"
  );
});

test("money rounding uses two decimal places", () => {
  assert.equal(roundMoney(1.005), 1.01);
  assert.equal(roundMoney(1.236), 1.24);
  assert.equal(roundMoney(-1.236), -1.24);
});