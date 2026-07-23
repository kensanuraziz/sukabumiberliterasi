export default async (request, context) => {
  const url = new URL(request.url);
  const titleParam = url.searchParams.get("title");
  const productIdParam = url.searchParams.get("productId");
  
  // Hapus header cache komparatif agar server selalu mengembalikan 200 OK HTML utuh (bukan 304 Not Modified)
  let originRequest = request;
  if (titleParam || productIdParam) {
    const freshHeaders = new Headers(request.headers);
    freshHeaders.delete("if-none-match");
    freshHeaders.delete("if-modified-since");
    originRequest = new Request(request.url, {
      method: request.method,
      headers: freshHeaders,
      body: request.body
    });
  }

  // Ambil respon asli dari server
  const response = await context.next(originRequest);
  
  // Hanya proses jika respon berupa dokumen HTML
  if (response.headers.get("content-type")?.includes("text/html") || response.status === 200) {
    try {
      let html = await response.text();
      let metaUpdated = false;
      let title = "";
      let summary = "";
      let imageUrl = "";
      let pageTitleSuffix = "Sukabumi Berliterasi";

      // Kasus 1: Membagikan berita spesifik (ada parameter title)
      if (titleParam) {
        const bloggerUrl = 'https://peradma.blogspot.com/feeds/posts/default?alt=json&max-results=500';
        const bloggerRes = await fetch(bloggerUrl);
        if (bloggerRes.ok) {
          const data = await bloggerRes.json();
          const entries = data.feed.entry || [];
          
          const slugify = (text) => {
            return String(text)
              .toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '')
              .replace(/[\s_-]+/g, '-')
              .replace(/^-+|-+$/g, '');
          };
          
          const matchingEntry = entries.find(e => slugify(e.title.$t) === titleParam);
          
          if (matchingEntry) {
            title = matchingEntry.title.$t;
            const contentHtml = matchingEntry.content ? matchingEntry.content.$t : '';
            
            let plainText = contentHtml ? contentHtml.replace(/<[^>]*>?/gm, '').trim() : '';
            plainText = plainText.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
            summary = plainText ? (plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText) : 'Portal Warta Sukabumi Berliterasi';
            
            let rawImg = '';
            const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
            const match = imgRegex.exec(contentHtml);
            if (match && match[1]) {
              rawImg = match[1];
            } else if (matchingEntry.media$thumbnail) {
              rawImg = matchingEntry.media$thumbnail.url;
            }
            
            if (rawImg) {
              rawImg = rawImg.trim();
              if (rawImg.startsWith('//')) {
                rawImg = 'https:' + rawImg;
              } else if (rawImg.startsWith('http://')) {
                rawImg = rawImg.replace('http://', 'https://');
              }
              rawImg = rawImg.replace(/\/s\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
              imageUrl = rawImg.replace(/\/w\d+-h\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
            } else {
              imageUrl = `${url.origin}/og-cover.jpg`;
            }
            pageTitleSuffix = "Sukabumi Berliterasi";
            metaUpdated = true;
          }
        }
      }
      // Kasus 2: Membagikan produk spesifik (ada parameter productId)
      else if (productIdParam) {
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1GVjNbE1ugqGxuIB9EWMCP8oTgEK8Vi8S56Owpk_45tc/gviz/tq?tqx=out:json';
        const sheetRes = await fetch(sheetUrl);
        if (sheetRes.ok) {
          const sheetText = await sheetRes.text();
          const jsonStart = sheetText.indexOf('google.visualization.Query.setResponse(');
          if (jsonStart !== -1) {
            const rawJson = sheetText.substring(jsonStart + 'google.visualization.Query.setResponse('.length, sheetText.length - 2);
            const parsed = JSON.parse(rawJson);
            const rows = parsed.table?.rows || [];
            
            const productRows = rows.slice(1);
            let matchingRow = null;
            
            for (let idx = 0; idx < productRows.length; idx++) {
              const r = productRows[idx];
              if (!r || !r.c) continue;
              
              const rawCol0 = r.c[0] && r.c[0].v !== null && r.c[0].v !== undefined ? String(r.c[0].v).trim() : '';
              const computedId = rawCol0 || `p-${idx}`;
              
              if (computedId === productIdParam || rawCol0 === productIdParam || String(idx + 1) === productIdParam) {
                matchingRow = r;
                break;
              }
            }

            if (matchingRow) {
              title = matchingRow.c[2]?.v || 'Produk Tokolitera';
              const rawDesc = matchingRow.c[10]?.v || '';
              summary = rawDesc.length > 120 ? rawDesc.substring(0, 120) + '...' : rawDesc;
              
              // Cari gambar di semua kolom gambar produk (kolom 3, 5, 6, 7, 8)
              const rawImg = (matchingRow.c && (
                matchingRow.c[3]?.v || 
                matchingRow.c[5]?.v || 
                matchingRow.c[6]?.v || 
                matchingRow.c[7]?.v || 
                matchingRow.c[8]?.v
              )) || '';

              const getImageUrl = (src) => {
                if (!src) return '';
                let srcUrl = String(src).trim();
                if (srcUrl.startsWith('//')) {
                  srcUrl = 'https:' + srcUrl;
                } else if (srcUrl.startsWith('http://')) {
                  srcUrl = srcUrl.replace('http://', 'https://');
                }
                
                // Ekstraksi ID Google Drive secara komprehensif
                const driveIdMatch = srcUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                                     srcUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                                     srcUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                
                if (driveIdMatch && driveIdMatch[1]) {
                  return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}=w800`;
                }
                
                return srcUrl;
              };
              imageUrl = getImageUrl(rawImg) || `${url.origin}/og-cover.jpg`;
              pageTitleSuffix = "Tokolitera";
              metaUpdated = true;
            }
          }
        }
      }

      if (metaUpdated) {
        // Hapus tag meta og & twitter bawaan yang mungkin ada (baik self-closing /> maupun >)
        html = html.replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?>/gi, "");
        html = html.replace(/<meta\s+property="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/gi, "");
        html = html.replace(/<title>[^<]*<\/title>/gi, "");

        // Sisipkan tag baru yang valid & absolut langsung setelah tag <head>
        const newMetaTags = `
<title>${title} - ${pageTitleSuffix}</title>
<meta property="og:type" content="website" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${summary}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:title" content="${title}" />
<meta property="twitter:description" content="${summary}" />
<meta property="twitter:image" content="${imageUrl}" />`;

        html = html.replace(/<head>/i, `<head>${newMetaTags}`);
      } else {
        // Fallback default: pastikan URL image absolut agar minimal logo website utama muncul
        const absoluteImage = `${url.origin}/og-cover.jpg`;
        html = html.replace(/content="\/og-cover.jpg"/g, `content="${absoluteImage}"`);
      }

      const freshResponseHeaders = new Headers(response.headers);
      freshResponseHeaders.set("cache-control", "public, max-age=0, must-revalidate");

      return new Response(html, {
        status: 200,
        headers: freshResponseHeaders
      });
    } catch (e) {
      console.error("Gagal memproses Edge Function meta dinamis:", e);
    }
  }
  
  return response;
};
