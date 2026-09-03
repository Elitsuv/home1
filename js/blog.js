document.addEventListener('DOMContentLoaded', async () => {
  const writingList = document.getElementById('writing-list');
  const blogContent = document.getElementById('blog-content');
  const blogTitle = document.getElementById('blog-title');
  const blogDate = document.getElementById('blog-date');

  const blogTags = document.getElementById('blog-tags');

  function getTagStyles(tag) {
    const t = tag.toLowerCase().trim();
    if (t.includes('thought') || t.includes('idea') || t.includes('mindset') || t.includes('essay') || t.includes('orange')) {
      return {
        bg: 'rgba(249, 115, 22, 0.1)',
        border: 'rgba(249, 115, 22, 0.3)',
        text: '#ea580c'
      };
    }
    if (t.includes('research') || t.includes('ai') || t.includes('ml') || t.includes('algorithm')) {
      return {
        bg: 'rgba(99, 102, 241, 0.1)',
        border: 'rgba(99, 102, 241, 0.3)',
        text: '#4f46e5'
      };
    }
    if (t.includes('engineer') || t.includes('dev') || t.includes('code')) {
      return {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.3)',
        text: '#2563eb'
      };
    }
    if (t.includes('open source') || t.includes('oss')) {
      return {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.3)',
        text: '#059669'
      };
    }
    if (t.includes('feature') || t.includes('new') || t.includes('design')) {
      return {
        bg: 'rgba(168, 85, 247, 0.1)',
        border: 'rgba(168, 85, 247, 0.3)',
        text: '#9333ea'
      };
    }
    return {
      bg: 'rgba(100, 116, 139, 0.1)',
      border: 'rgba(100, 116, 139, 0.25)',
      text: '#475569'
    };
  }

  function renderTags(tags, isHeader = false) {
    if (!tags) return '';
    const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagList.length === 0) return '';
    return `
      <div class="flex flex-wrap gap-1.5 ${isHeader ? '' : 'mt-2'}">
        ${tagList.map(tag => {
          const style = getTagStyles(tag);
          return `
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-tight"
                  style="background-color: ${style.bg}; border: 1px solid ${style.border}; color: ${style.text};">
              ${tag}
            </span>
          `;
        }).join('')}
      </div>
    `;
  }

  let blogs = [];

  try {
    const response = await fetch('blogs/manifest.json');
    if (response.ok) {
      blogs = await response.json();
    }
  } catch (e) {
    console.error('Could not load blogs/manifest.json', e);
  }

  if (writingList) {
    if (blogs.length === 0) {
      writingList.innerHTML = '<p class="text-muted text-sm">No writing found.</p>';
    } else {
      let html = '';
      blogs.forEach((blog, index) => {
        const delay = index * 50;
        const bannerImg = blog.banner
          ? `<img src="${blog.banner}" alt="Banner" class="w-12 h-12 object-cover rounded mr-4 shrink-0">`
          : `<div class="w-12 h-12 bg-neutral-100 rounded mr-4 shrink-0"></div>`;
        const tagsHtml = renderTags(blog.tags);
        html += `
          <a href="blog.html?id=${blog.id}" class="group flex items-start animate-on-scroll hover:bg-neutral-50 p-2 -mx-2 rounded transition-colors" style="animation-delay: ${delay}ms">
            ${bannerImg}
            <div class="flex-grow">
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-4 mb-1">
                <h3 class="text-foreground font-medium text-sm group-hover:underline underline-offset-4 decoration-1">${blog.title}</h3>
                <div class="flex items-center gap-1.5 text-muted text-xs whitespace-nowrap">
                  <span>${blog.date}</span>
                  <span class="blog-list-views hidden items-center gap-1" data-id="${blog.id}">
                    <span>•</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span class="view-num"></span>
                  </span>
                </div>
              </div>
              <p class="text-muted text-sm line-clamp-2">${blog.description}</p>
              ${tagsHtml}
            </div>
          </a>
        `;
      });
      writingList.innerHTML = html;

      // Load view counts for list items (without incrementing)
      const listViews = writingList.querySelectorAll('.blog-list-views');
      listViews.forEach(async (el) => {
        const blogId = el.getAttribute('data-id');
        if (!blogId) return;
        try {
          const r = await fetch(`https://countapi.mileshilliard.com/api/v1/get/elitsuv_home1_${blogId}`);
          if (r.ok) {
            const d = await r.json();
            if (d && typeof d.value !== 'undefined') {
              const numSpan = el.querySelector('.view-num');
              if (numSpan) numSpan.textContent = Number(d.value).toLocaleString();
              el.classList.remove('hidden');
              el.classList.add('inline-flex');
            }
          }
        } catch (e) {}
      });

      const elementsToAnimate = writingList.querySelectorAll('.animate-on-scroll');
      if (window.IntersectionObserver) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        elementsToAnimate.forEach(el => observer.observe(el));
      } else {
        elementsToAnimate.forEach(el => el.classList.add('is-visible'));
      }
    }
  }

  if (blogContent) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      blogContent.innerHTML = '<p class="text-muted">No post specified.</p>';
      return;
    }

    // Increment and fetch view count (+1 on reload across all devices)
    const blogViewsWrapper = document.getElementById('blog-views-wrapper');
    const blogViews = document.getElementById('blog-views');
    try {
      fetch(`https://countapi.mileshilliard.com/api/v1/hit/elitsuv_home1_${id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && typeof data.value !== 'undefined') {
            if (blogViews) blogViews.textContent = Number(data.value).toLocaleString();
            if (blogViewsWrapper) {
              blogViewsWrapper.classList.remove('hidden');
              blogViewsWrapper.classList.add('inline-flex');
            }
          }
        })
        .catch(err => console.warn('Could not load views:', err));
    } catch (e) {}

    try {
      const response = await fetch(`blogs/${id}.md`);
      if (!response.ok) throw new Error('Post not found');
      const text = await response.text();

      const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
      const match = text.match(frontmatterRegex);

      let content = text;

      if (match) {
        const frontmatterString = match[1];
        content = match[2];

        const data = {};
        frontmatterString.split('\n').forEach(line => {
          const colonIndex = line.indexOf(':');
          if (colonIndex !== -1) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            data[key] = value;
          }
        });

        if (data.title) {
          if (blogTitle) blogTitle.textContent = data.title;
          document.title = `${data.title} — Suvro`;
        }
        if (blogDate && data.date) blogDate.textContent = data.date;
        if (blogTags && data.tags) blogTags.innerHTML = renderTags(data.tags, true);
      }

      if (window.marked && window.hljs) {
        marked.setOptions({
          highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
          }
        });
      }

      if (window.marked) {
        blogContent.innerHTML = marked.parse(content);
      } else {
        blogContent.innerHTML = `<pre class="whitespace-pre-wrap">${content}</pre>`;
      }

    } catch (e) {
      console.error(e);
      blogContent.innerHTML = '<p class="text-muted">Post not found.</p>';
    }
  }
});
