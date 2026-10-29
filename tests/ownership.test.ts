import { describe, expect, it } from "vitest";
import {
  assertOwner,
  isOwner,
  scopeToOwner,
  SHARED_OWNER,
} from "../app/lib/ownership";

type Row = { id: string; ownerId: string; name: string };

describe("user data isolation", () => {
  const rows: Row[] = [
    { id: "a-1", ownerId: "user-a", name: "A one" },
    { id: "a-2", ownerId: "user-a", name: "A two" },
    { id: "b-1", ownerId: "user-b", name: "B one" },
    { id: "s-1", ownerId: SHARED_OWNER, name: "Shared" },
  ];

  it("returns only the owner's private records", () => {
    expect(scopeToOwner(rows, "user-a").map((row) => row.id)).toEqual([
      "a-1",
      "a-2",
    ]);
    expect(scopeToOwner(rows, "user-b").map((row) => row.id)).toEqual(["b-1"]);
    expect(scopeToOwner(rows, "user-c")).toEqual([]);
  });

  it("keeps the legacy shared workspace separate from a user workspace", () => {
    expect(scopeToOwner(rows, SHARED_OWNER).map((row) => row.id)).toEqual(["s-1"]);
    expect(isOwner(rows[0], "user-b")).toBe(false);
  });

  it("blocks writes to another owner's record", () => {
    expect(() => assertOwner(rows[0], "user-a")).not.toThrow();
    expect(() => assertOwner(rows[0], "user-b")).toThrow(
      "Not allowed to access another owner's record",
    );
  });
});
