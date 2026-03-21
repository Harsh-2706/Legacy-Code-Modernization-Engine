"use client";

import { useState } from "react";
import { Github, UploadCloud, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IngestPage() {
  const [repoType, setRepoType] = useState("github");
  const [githubUrl, setGithubUrl] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleIngest = async (e: any) => {
    e.preventDefault();
    setUploading(true);
    setSuccess(false);
    setError(null);
    
    try {
      let response: Response;

      if (repoType === "github") {
        // Normalize URL — append .git if missing
        let url = githubUrl.trim();
        if (!url.endsWith(".git")) url = url + ".git";

        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/repo/clone?url=${encodeURIComponent(url)}`,
          { method: "POST" }
        );
      } else {
        if (!zipFile) return;
        const formData = new FormData();
        formData.append("file", zipFile);
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/repo/upload?name=${zipFile.name.replace(".zip", "")}`,
          { method: "POST", body: formData }
        );
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.detail || `Server error: ${response.status}`);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/explorer"), 1500);
    } catch (err: any) {
      setError(
        err?.message?.includes("fetch")
          ? "Cannot reach backend — make sure it is running on port 8000."
          : err?.message || "Unknown error during ingestion."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8 w-full h-full justify-center">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Ingest Repository</h1>
        <p className="text-slate-400">Connect a GitHub repository or upload a local ZIP archive to begin context parsing and modernization.</p>
      </div>

      <div className="bg-[#1e293b]/80 border border-slate-700/50 shadow-2xl rounded-2xl p-8">
        <div className="flex bg-slate-900/80 rounded-xl p-1 mb-8 border border-slate-800">
          <button onClick={() => setRepoType("github")} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${repoType === "github" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>
            <Github className="w-5 h-5" /> GitHub Clone
          </button>
          <button onClick={() => setRepoType("zip")} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${repoType === "zip" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>
            <UploadCloud className="w-5 h-5" /> Upload ZIP
          </button>
        </div>

        <form onSubmit={handleIngest} className="flex flex-col gap-6">
          {repoType === "github" ? (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Repository URL</label>
              <input
                type="url" required placeholder="https://github.com/user/repo"
                value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 text-lg"
              />
              <p className="text-xs text-slate-500 mt-2">Works with or without .git suffix. E.g. https://github.com/OpenGenus/calculator-in-java</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Select Archive</label>
              <div className="relative border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30 hover:bg-slate-800/50 transition-colors group cursor-pointer p-12">
                <input
                  type="file" required accept=".zip"
                  onChange={e => setZipFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  {zipFile ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                      <p className="text-lg font-bold text-white mb-1">{zipFile.name}</p>
                      <p className="text-sm text-slate-400">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-12 h-12 text-slate-500 mb-4 group-hover:text-blue-400 transition-colors" />
                      <p className="text-lg font-medium text-slate-300">Click to browse or drag ZIP file here</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-400" />
              <div>
                <p className="font-bold mb-0.5">Ingestion Failed</p>
                <p className="text-red-300/80">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 bg-emerald-900/30 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-bold">Ingestion Successful! Redirecting to Explorer...</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
            <button
              disabled={uploading || (repoType === "github" ? !githubUrl : !zipFile) || success}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg flex justify-center items-center gap-3 text-lg"
            >
              {uploading ? (
                <><RefreshCw className="w-6 h-6 animate-spin"/> Processing...</>
              ) : "Execute Parsing Engine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
