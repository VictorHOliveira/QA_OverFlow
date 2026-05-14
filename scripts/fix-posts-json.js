const fs = require('fs');
const path = require('path');

// Read the original data from blog.json which has the full posts
const blogData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'blog.json'), 'utf8'));

// Map blog posts to the format with content
const existingPosts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', '_data', 'posts.json'), 'utf8'));

// Fix: the existing file had issues, let's rebuild from scratch with all 7 original posts
// We need the original posts.json. Since the edit broke it, let me check if there's a git copy
try {
  const originalContent = require('child_process').execSync('git show HEAD:src/_data/posts.json', {encoding: 'utf8'});
  fs.writeFileSync(path.join(__dirname, '..', 'src', '_data', 'posts.json'), originalContent);
  console.log('Restored original posts.json from git HEAD');
} catch(e) {
  console.log('Could not restore from git, using existing data');
}
console.log('Done. Now run the add-tutorial script.');
