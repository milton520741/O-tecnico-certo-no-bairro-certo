import { supabase } from "@/integrations/supabase/client";

const sanitize = (n: string) => n.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");

/** Upload to a public bucket and return its public URL. */
export async function uploadPublic(userId: string, file: File, folder = "profile"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${folder}/${Date.now()}-${sanitize(file.name).slice(-40)}.${ext}`.replace(/\.\.+/g, ".");
  const { error } = await supabase.storage.from("public-assets").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Erro ao carregar ficheiro: ${error.message}`);
  }
  const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
  return data.publicUrl;
}

/** Upload to the private bucket. Returns the storage path. */
export async function uploadPrivate(userId: string, file: File, folder = "proofs"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${folder}/${Date.now()}-${sanitize(file.name).slice(-40)}.${ext}`.replace(/\.\.+/g, ".");
  const { error } = await supabase.storage.from("private-uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Erro ao carregar ficheiro: ${error.message}`);
  }
  return path;
}

export function fileFromInput(e: React.ChangeEvent<HTMLInputElement>): File | null {
  const f = e.target.files?.[0];
  if (!f) return null;
  if (f.size > 5 * 1024 * 1024) {
    throw new Error("Ficheiro maior que 5MB.");
  }
  return f;
}
