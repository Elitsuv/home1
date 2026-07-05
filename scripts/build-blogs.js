const fs = require('fs');
const path = require('path');

const blogsDir = path.join(__dirname, '../blogs');
const outputFile = path.join(__dirname, '../blogs/manifest.json');

function parseFrontmatter(fileContent) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content: fileContent };
  }

  const frontmatterString = match[1];
  const content = match[2];
  const data = {};

  frontmatterString.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      data[key] = value;
    }
  });

  return { data, content };
}

function buildBlogIndex() {
  if (!fs.existsSync(blogsDir)) {
    console.error(`Directory not found: ${blogsDir}`);
    fs.mkdirSync(blogsDir, { recursive: true });
    return;
  }

  const files = fs.readdirSync(blogsDir).filter(file => file.endsWith('.md'));
  const blogs = [];

  for (const file of files) {
    const filePath = path.join(blogsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = parseFrontmatter(content);
    
    // Add id based on filename
    const id = file.replace('.md', '');
    
    blogs.push({
      id,
      title: data.title || id,
      date: data.date || '',
      description: data.description || '',
      banner: data.banner || '',
      tags: data.tags || ''
    });
  }

  // Sort by date (descending)
  blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(outputFile, JSON.stringify(blogs, null, 2));
  console.log(`Generated blogs.json with ${blogs.length} entries.`);
}

buildBlogIndex();
