import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

app.use(express.json());

const errors: any[] = [];

app.post("/api/errors", (req, res) => {
  const error = {
    id: Date.now().toString(),
    ...req.body,
    receivedAt: new Date().toISOString(),
    count: 1,
  };

  const existing = errors.find(e => e.message === error.message && e.stack === error.stack);
  if (existing) {
    existing.count++;
    existing.lastSeen = error.receivedAt;
  } else {
    errors.push(error);
  }

  wss.clients.forEach(client => {
    client.send(JSON.stringify({ type: "new-error", error }));
  });

  res.status(201).json({ id: error.id });
});

app.get("/api/errors", (_req, res) => {
  res.json(errors.sort((a, b) => b.count - a.count));
});

app.get("/api/errors/stats", (_req, res) => {
  res.json({
    total: errors.length,
    totalOccurrences: errors.reduce((sum, e) => sum + e.count, 0),
    criticalCount: errors.filter(e => e.severity === "critical").length,
  });
});

server.listen(3000, () => console.log("Error Monitor running on port 3000"));
