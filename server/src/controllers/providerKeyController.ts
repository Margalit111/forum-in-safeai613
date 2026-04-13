import { Request, Response } from "express";
import { 
  addProviderKey, 
  listProviderKeys, 
  getProviderKeyById, 
  updateProviderKey, 
  deleteProviderKey 
} from "../services/providerKeyService";

export async function addProviderKeyHandler(req: Request, res: Response) {
  try {
    const keyDoc = await addProviderKey(req.body);

    res.json({
      success: true,
      key: {
        _id: keyDoc._id,
        provider: keyDoc.provider,
        keyPrefix: keyDoc.keyPrefix,
        isSystem: keyDoc.isSystem,
        isActive: keyDoc.isActive,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to add provider key" });
  }
}

export async function listProviderKeysHandler(_req: Request, res: Response) {
  try {
    const keys = await listProviderKeys();
    res.json(keys);
  } catch {
    res.status(500).json({ error: "Failed to fetch provider keys" });
  }
}

export async function getProviderKeyHandler(req: Request<{ id: string }>, res: Response) {
  try {
    const key = await getProviderKeyById(req.params.id);

    if (!key) {
      return res.status(404).json({ error: "Provider key not found" });
    }

    res.json(key);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

export async function updateProviderKeyHandler(req: Request<{ id: string }>, res: Response) {
  try {
    const key = await updateProviderKey(req.params.id, req.body);

    if (!key) {
      return res.status(404).json({ error: "Provider key not found" });
    }

    res.json({ success: true, key });
  } catch {
    res.status(500).json({ error: "Failed to update provider key" });
  }
}

export async function deleteProviderKeyHandler(req: Request<{ id: string }>, res: Response) {
  try {
    await deleteProviderKey(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}
