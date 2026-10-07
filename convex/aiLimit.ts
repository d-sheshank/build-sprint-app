import { ConvexError, v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { reserveCall } from "./callWindow";

export const reserve = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const record = await ctx.db.query("aiCallLimits")
      .withIndex("by_scope", q => q.eq("scope", "app")).unique();
    const calls = reserveCall(record?.calls ?? [], Date.now());
    if (!calls) throw new ConvexError("The app has reached its hourly story limit. Please try again later.");
    if (record) await ctx.db.patch(record._id, { calls });
    else await ctx.db.insert("aiCallLimits", { scope: "app", calls });
    return null;
  },
});
