import net from 'node:net';

const port = parseInt(process.argv[2] || '5173', 10);
const host = '127.0.0.1';

const client = net.createConnection({ port, host }, () => {
  client.destroy();
  process.exit(0); // Port is open
});

client.setTimeout(1000);
client.on('timeout', () => {
  client.destroy();
  process.exit(1);
});

client.on('error', () => {
  process.exit(1); // Port is closed
});
