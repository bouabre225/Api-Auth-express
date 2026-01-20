import express from "express";
import cors from "cors";
import helmet from "helmet";

import { httpLogger } from "#lib/logger";
import { errorHandler } from "#middlewares/error-handler";
import { notFoundHandler } from "#middlewares/not-found";
import authRouter from "#routes/auth.routes"
// Les routes seront importez ici

// import userRoutes from "#routes/user.routes";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(httpLogger);
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "API Express opérationnelle" });
});

//utilisation des routes
app.use(authRouter)


// Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;