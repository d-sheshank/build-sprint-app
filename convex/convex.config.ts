import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";
const app = defineApp({ httpPrefix: "/api" });
app.use(agent);
app.use(staticHosting, { httpPrefix: "/" });
export default app;
