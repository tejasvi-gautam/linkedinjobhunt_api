import dotenv from "dotenv";

import { createApp } from "./app.js";

dotenv.config();

const app = createApp();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "127.0.0.1";

app.listen(port, host, () => {
  console.log(`API running at http://${host}:${port}`);
});
