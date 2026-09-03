# Personal Portfolio & Research Blog

A minimalist, high-performance personal developer portfolio and research writing platform built with HTML, TailwindCSS, Vanilla CSS, and Markdown.

🌐 **Live:** [suvro.vercel.app](https://suvro.vercel.app)

---

## 📁 Project Structure

```text
.
├── assets/             # Static images, avatars, banners, and benchmark figures
├── blogs/              # Markdown blog posts and generated manifest
│   ├── cyla-v2.md
│   ├── how-to-see-small-details.md
│   └── manifest.json   # Auto-generated index of all blog posts
├── css/
│   └── styles.css      # Core styling, animations, and typography
├── js/
│   ├── blog.js         # Markdown parsing, view counters, and tag rendering
│   ├── config.js       # Site configuration and social links
│   └── main.js         # Homepage interactions, audio feedback, and avatar logic
├── scripts/
│   └── build-blogs.js  # Build script to generate blogs/manifest.json
├── index.html          # Main portfolio homepage
├── blog.html           # Dedicated blog post reader page
├── robots.txt          # SEO crawler configuration
├── sitemap.xml         # SEO search engine sitemap
└── vercel.json         # Vercel deployment routing configuration
```

---

## 🛠️ Features

- **Markdown-Driven Blog:** Write articles in standard Markdown with YAML frontmatter.
- **Auto-Indexing Pipeline:** Automatically compiles article metadata into `manifest.json`.
- **Live View Counter:** Privacy-friendly, serverless live article hit counter.
- **Audio & Micro-Interactions:** Custom Web Audio API feedback and interactive avatar toggles.
- **Responsive Typography:** Refined reading experience with custom selection highlights and code styling.

---

## ✍️ Adding a New Blog Post

1. Create a new `.md` file inside the `blogs/` directory:
   ```markdown
   ---
   title: Your Article Title
   date: September 3, 2026
   description: A short 1-sentence summary of the post.
   tags: Research
   banner: assets/your-banner.png
   ---

   Your markdown content here...
   ```
2. Run the build script to update the manifest:
   ```bash
   npm run build:blogs
   ```
3. Commit and push!

---

## 📄 License

[MIT](LICENSE)
