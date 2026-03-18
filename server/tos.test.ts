import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: string = "admin"): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@tamiyouz.com",
    name: "Test User",
    loginMethod: "manus",
    role: role as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("admin");
  });

  it("returns null when not authenticated", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("role-based access", () => {
  it("employee cannot access departments.create (superAdmin only)", async () => {
    const { ctx } = createContext("employee");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.departments.create({ name: "Test Dept" })
    ).rejects.toThrow();
  });

  it("employee cannot access userManagement.list (superAdmin only)", async () => {
    const { ctx } = createContext("employee");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.userManagement.list()
    ).rejects.toThrow();
  });

  it("team_leader cannot access trelloSettings.get (superAdmin only)", async () => {
    const { ctx } = createContext("team_leader");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.trelloSettings.get()
    ).rejects.toThrow();
  });

  it("employee cannot access analytics.overview (teamLeader required)", async () => {
    const { ctx } = createContext("employee");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.analytics.overview()
    ).rejects.toThrow();
  });
});
