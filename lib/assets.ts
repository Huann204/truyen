// Ảnh tải thẳng từ server gốc (không qua proxy của site) -> nhanh hơn, đỡ tốn băng thông server mình
export const ASSET_HOST = "https://api.khotruyen.site";
export const assetUrl = (u?: string | null) => (!u ? "" : u.startsWith("/") ? ASSET_HOST + u : u);
