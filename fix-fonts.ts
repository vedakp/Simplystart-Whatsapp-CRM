import fs from 'fs';
import path from 'path';

const replaceInDir = (dir: string) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      replaceInDir(filePath);
    } else if (filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      content = content.replace(/font-serif text-3xl/g, 'font-bold tracking-tight text-2xl');
      content = content.replace(/font-serif text-2xl/g, 'font-bold tracking-tight text-xl');
      content = content.replace(/font-serif text-xl/g, 'font-bold tracking-tight text-lg');
      content = content.replace(/font-serif text-lg/g, 'font-bold tracking-tight text-base');
      content = content.replace(/text-4xl font-serif/g, 'text-3xl font-bold tracking-tight');
      content = content.replace(/font-serif/g, 'font-bold tracking-tight');
      fs.writeFileSync(filePath, content, 'utf-8');
    }
  }
};

replaceInDir(path.join(process.cwd(), 'src', 'pages'));
replaceInDir(path.join(process.cwd(), 'src', 'components'));
console.log("Fonts fixed");
