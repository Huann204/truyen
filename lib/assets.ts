// Ảnh tải thẳng từ server gốc (không qua proxy của site) -> nhanh hơn, đỡ tốn băng thông server mình
export const ASSET_HOST = "https://api.khotruyen.site";
export const assetUrl = (u?: string | null) => {
  if (!u) return "";
  if (u.startsWith("data:") || u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/covers/")) {
    return u;
  }
  return u.startsWith("/") ? ASSET_HOST + u : u;
};
