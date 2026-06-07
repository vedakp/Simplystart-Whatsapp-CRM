import * as fs from 'fs';
import * as path from 'path';

const serverFile = path.join(process.cwd(), 'server.ts');
let content = fs.readFileSync(serverFile, 'utf8');

// Replace settings init
content = content.replace(
  'let settings: any = {',
  'import { connectDB, models, isDBConnected } from "./database";\nimport fsPromises from "fs/promises";\nlet settings: any = {\ndbHost: "", dbPort: "3306", dbUser: "", dbPassword: "", dbName: "simplystart",'
);

// Settings POST
content = content.replace(
  'app.post("/api/settings", (req, res) => {\n    settings = { ...settings, ...req.body };\n    res.json(settings);\n  });',
  \`app.post("/api/settings", async (req, res) => {
    settings = { ...settings, ...req.body };
    try { await fsPromises.writeFile('local-settings.json', JSON.stringify(settings)); } catch(e) {}
    let dbStatus = "Not connected";
    if (settings.dbHost && settings.dbUser) {
        const result = await connectDB({
             host: settings.dbHost, port: settings.dbPort, user: settings.dbUser,
             password: settings.dbPassword, database: settings.dbName
        });
        dbStatus = result.message;
    }
    res.json({ settings, dbStatus });
  });\`
);

// Add the bootHook right after settings initialization
const bootHook = \`
async function loadDbConfig() {
   try {
      const data = await fsPromises.readFile('local-settings.json', 'utf8');
      settings = JSON.parse(data);
      if (settings.dbHost) {
          await connectDB({
             host: settings.dbHost, port: settings.dbPort, user: settings.dbUser,
             password: settings.dbPassword, database: settings.dbName
          });
      }
   } catch(e) {}
}
loadDbConfig();
\`;

content = content.replace('const orders = [', bootHook + '\\nlet orders: any[] = [');

fs.writeFileSync(serverFile, content);
console.log("Patch applied.");
