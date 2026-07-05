document.addEventListener('DOMContentLoaded', async () => {
  const writingList = document.getElementById('writing-list');
  const blogContent = document.getElementById('blog-content');
  const blogTitle = document.getElementById('blog-title');
  const blogDate = document.getElementById('blog-date');

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
        html += `
          <a href="blog.html?id=${blog.id}" class="group flex items-start animate-on-scroll hover:bg-neutral-50 p-2 -mx-2 rounded transition-colors" style="animation-delay: ${delay}ms">
            ${bannerImg}
            <div class="flex-grow">
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-4 mb-1">
                <h3 class="text-foreground font-medium text-sm group-hover:underline underline-offset-4 decoration-1">${blog.title}</h3>
                <span class="text-muted text-xs whitespace-nowrap">${blog.date}</span>
              </div>
              <p class="text-muted text-sm line-clamp-2">${blog.description}</p>
            </div>
          </a>
        `;
      });
      writingList.innerHTML = html;

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

        if (blogTitle && data.title) blogTitle.textContent = data.title;
        if (blogDate && data.date) blogDate.textContent = data.date;
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
