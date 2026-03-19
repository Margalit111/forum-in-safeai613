import { Request, Response } from "express";
import { proxyChatCompletion } from "../services/proxyService";

export async function chatCompletionHandler(req: Request, res: Response) {
  // try {

  //   const user = (req as any).user;

  //   const result = await proxyChatCompletion(user, req.body);

  //   res.json(result);

  // } catch (err) {
  //     console.error("PROXY ERROR:", err);

  //   res.status(500).json({ error: "Proxy error" });
  // }
  try {
    // Type assertion
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }


    try {
      console.log("📥 Request received:", {
        model: req.body.model,
        messagesCount: req.body.messages?.length,
      });

      const response = await proxyChatCompletion(user, req.body);

      console.log("📤 Response type:", typeof response);
      console.log(
        "📤 Response keys:",
        response ? Object.keys(response) : "null",
      );

      // אם streaming
      if (req.body.stream) {
        console.log("🌊 Streaming response");
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        if (response instanceof ReadableStream) {
          const reader = response.getReader();
          const push = async () => {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              return;
            }
            res.write(value);
            push();
          };
          push();
        }
        return;
      }

      // אם לא streaming
      console.log("💬 Non-streaming response, sending JSON");
      return res.json(response);
    } catch (error: any) {
      console.error("❌ Chat completion error:", error);
      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
