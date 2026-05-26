import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

type SkillPayload = {
  skills: Array<{ id: string; markdown: string }>;
};

function readJsonBody(req: import('http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

export function expertSkillsApiPlugin(): Plugin {
  return {
    name: 'expert-skills-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/skills/sync') || req.method !== 'POST') {
          next();
          return;
        }

        try {
          const payload = (await readJsonBody(req)) as SkillPayload;
          if (!payload?.skills?.length) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, message: 'Missing skills payload' }));
            return;
          }

          const skillsRoot = path.resolve(process.cwd(), '.cursor/skills');
          fs.mkdirSync(skillsRoot, { recursive: true });

          const written: string[] = [];
          for (const skill of payload.skills) {
            const skillName = skill.id.replace(/_/g, '-');
            const skillDir = path.join(skillsRoot, skillName);
            fs.mkdirSync(skillDir, { recursive: true });
            fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skill.markdown, 'utf8');
            written.push(`.cursor/skills/${skillName}/SKILL.md`);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              message: `Synced ${written.length} skills`,
              written,
            })
          );
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: false,
              message: error instanceof Error ? error.message : 'Failed to sync skills',
            })
          );
        }
      });
    },
  };
}
