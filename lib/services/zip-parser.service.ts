import { load } from "cheerio";
import JSZip from "jszip";

export type ZipEntry = {
  name: string;
  content: Buffer;
  type: string;
  isDependency: boolean;
  dependencyType?: string;
  parentPath?: string;
};

export type ZipDependency = {
  zipPath: string;
  dependencyType: string;
};

export type HTMLDependencyMap = {
  htmlPath: string;
  dependencies: ZipDependency[];
};

export const ZipParserService = {
  async parseAndIdentifyDependencies(
    zipBuffer: Buffer
  ): Promise<HTMLDependencyMap[]> {
    const { analysis } = await this.parseWithAllEntries(zipBuffer);
    return analysis;
  },

  async parseWithAllEntries(
    zipBuffer: Buffer
  ): Promise<{ entries: ZipEntry[]; analysis: HTMLDependencyMap[] }> {
    const zip = await JSZip.loadAsync(zipBuffer);
    const entries: ZipEntry[] = [];
    const fileContents: Record<string, string> = {};
    const rawBuffers: Record<string, Buffer> = {};

    // First pass: Read all files
    for (const [path, file] of Object.entries(zip.files)) {
      if (file.dir || path.startsWith("__") || path.startsWith(".")) continue;

      const buffer = await file.async("nodebuffer");
      rawBuffers[path] = buffer;

      if (
        path.endsWith(".html") ||
        path.endsWith(".htm") ||
        path.endsWith(".css")
      ) {
        fileContents[path] = buffer.toString("utf-8"); // Simplified encoding handling for now
      }
    }

    const resolve = (baseFile: string, relPath: string): string => {
      const clean = relPath.split(/[?#]/)[0].trim();
      if (
        !clean ||
        /^(https?:\/\/|\/\/|data:|mailto:|tel:|javascript:)/i.test(clean)
      )
        return "";

      const parts = baseFile.split("/");
      parts.pop(); // remove filename

      const relParts = clean.split("/");
      for (const segment of relParts) {
        if (segment === "." || segment === "") continue;
        if (segment === "..") {
          if (parts.length > 0) parts.pop();
        } else {
          parts.push(segment);
        }
      }

      const final = parts.join("/");
      return zip.files[final] ? final : "";
    };

    const getAssetType = (path: string): string => {
      if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(path)) return "image";
      if (/\.(woff2?|ttf|otf|eot)$/i.test(path)) return "font";
      if (/\.css$/i.test(path)) return "style";
      if (/\.js$/i.test(path)) return "script";
      return "asset";
    };

    const extractFromCSS = (
      content: string,
      cssPath: string
    ): ZipDependency[] => {
      const deps: ZipDependency[] = [];
      const urlRegex = /url\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi;
      let match;
      while ((match = urlRegex.exec(content)) !== null) {
        const resolved = resolve(cssPath, match[1]);
        if (resolved) {
          deps.push({
            zipPath: resolved,
            dependencyType: getAssetType(resolved),
          });
        }
      }
      return deps;
    };

    const analysis: HTMLDependencyMap[] = [];
    const dependencyInfo = new Map<string, { type: string; parent: string }>();

    // Parse each HTML file
    for (const [path, content] of Object.entries(fileContents)) {
      if (!path.endsWith(".html") && !path.endsWith(".htm")) continue;

      const $ = load(content);
      const htmlDeps: ZipDependency[] = [];

      const selectors = [
        { s: "img", a: "src", t: "image" },
        { s: "script", a: "src", t: "script" },
        { s: 'link[rel="stylesheet"]', a: "href", t: "style" },
        { s: "source", a: "srcset", t: "image" },
        { s: "video", a: "poster", t: "image" },
        { s: "audio", a: "src", t: "audio" },
        { s: "iframe", a: "src", t: "iframe" },
      ];

      selectors.forEach(({ s, a, t }) => {
        $(s).each((_, el) => {
          const raw = $(el).attr(a);
          if (!raw) return;

          if (a === "srcset") {
            raw.split(",").forEach((part) => {
              const res = resolve(path, part.trim().split(" ")[0]);
              if (res) {
                htmlDeps.push({ zipPath: res, dependencyType: t });
                dependencyInfo.set(res, { type: t, parent: path });
              }
            });
          } else {
            const res = resolve(path, raw);
            if (res) {
              htmlDeps.push({ zipPath: res, dependencyType: t });
              dependencyInfo.set(res, { type: t, parent: path });
              if (t === "style" && fileContents[res]) {
                const cssDeps = extractFromCSS(fileContents[res], res);
                cssDeps.forEach((cd) => {
                  htmlDeps.push(cd);
                  dependencyInfo.set(cd.zipPath, {
                    type: cd.dependencyType,
                    parent: path,
                  });
                });
              }
            }
          }
        });
      });

      $("style").each((_, el) => {
        const cssDeps = extractFromCSS($(el).text(), path);
        cssDeps.forEach((cd) => {
          htmlDeps.push(cd);
          dependencyInfo.set(cd.zipPath, {
            type: cd.dependencyType,
            parent: path,
          });
        });
      });

      const uniqueDeps = htmlDeps.filter(
        (v, i, a) => a.findIndex((t) => t.zipPath === v.zipPath) === i
      );

      analysis.push({
        htmlPath: path,
        dependencies: uniqueDeps,
      });
    }

    // Final entry assembly
    for (const [path, buffer] of Object.entries(rawBuffers)) {
      const dep = dependencyInfo.get(path);
      entries.push({
        name: path,
        content: buffer,
        type: this.guessType(path),
        isDependency: !!dep,
        dependencyType: dep?.type,
        parentPath: dep?.parent,
      });
    }

    return { entries, analysis };
  },

  guessType(name: string) {
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name))
      return "image/" + name.split(".").pop();
    if (/\.html?$/i.test(name)) return "text/html";
    if (/\.css$/i.test(name)) return "text/css";
    if (/\.js$/i.test(name)) return "application/javascript";
    return "application/octet-stream";
  },
};
