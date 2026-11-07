import fs from 'node:fs';
import http from 'node:http';

const log = fs.existsSync('/tmp/boot.log') ? fs.readFileSync('/tmp/boot.log', 'utf8') : 'no boot log';
const port = Number(process.env.PORT) || 4321;

http
  .createServer((req, res) => {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(log.slice(-8000));
  })
  .listen(port, '0.0.0.0');
