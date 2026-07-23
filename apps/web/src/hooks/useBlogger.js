import { useState, useEffect } from 'react';

export function useBlogger() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Generate a unique callback function name
    const callbackName = 'blogger_callback_' + Math.floor(Math.random() * 1000000);
    
    const extractFirstImageFromContent = (contentHtml, mediaThumbnailUrl) => {
      if (contentHtml) {
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
        const match = imgRegex.exec(contentHtml);
        if (match && match[1]) {
          let imgUrl = match[1];
          imgUrl = imgUrl.replace(/\/s\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
          imgUrl = imgUrl.replace(/\/w\d+-h\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
          return imgUrl;
        }
      }
      if (mediaThumbnailUrl) {
        let imgUrl = mediaThumbnailUrl;
        imgUrl = imgUrl.replace(/\/s\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
        imgUrl = imgUrl.replace(/\/w\d+-h\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
        return imgUrl;
      }
      return 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=800&q=80';
    };

    const decodeHtmlEntities = (str) => {
      if (!str) return '';
      return str
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&bull;/g, '•')
        .replace(/&middot;/g, '·')
        .replace(/\s+/g, ' ');
    };

    window[callbackName] = (data) => {
      try {
        const entries = data.feed.entry || [];
        const formatted = entries.map(e => {
          const contentHtml = e.content ? e.content.$t : '';
          const thumbnailUrl = e.media$thumbnail ? e.media$thumbnail.url : null;
          let plainText = contentHtml ? contentHtml.replace(/<[^>]*>?/gm, '').trim() : '';
          plainText = decodeHtmlEntities(plainText);
          return {
            title: e.title.$t,
            summary: plainText ? (plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText) : '',
            content: plainText ? (plainText.length > 400 ? plainText.substring(0, 400) + '...' : plainText) : '',
            image: extractFirstImageFromContent(contentHtml, thumbnailUrl),
            date: new Date(e.published.$t).toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }),
            categories: e.category ? e.category.map(cat => cat.term) : [],
            link: e.link.find(l => l.rel === 'alternate')?.href || '#'
          };
        });
        
        setNews(formatted);
      } catch (err) {
        console.error('Error parsing Blogger JSONP:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        // Clean up
        const scriptEl = document.getElementById(callbackName);
        if (scriptEl) scriptEl.remove();
        delete window[callbackName];
      }
    };

    // Inject dynamic script tag
    const script = document.createElement('script');
    script.id = callbackName;
    script.src = `https://peradma.blogspot.com/feeds/posts/default?alt=json-in-script&callback=${callbackName}`;
    script.onerror = () => {
      setError('Gagal memuat berita');
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      const scriptEl = document.getElementById(callbackName);
      if (scriptEl) scriptEl.remove();
      if (window[callbackName]) {
        window[callbackName] = () => {
          try {
            delete window[callbackName];
          } catch {}
        };
      }
    };
  }, []);

  return { news, loading, error };
}
